'use strict'

var _ = require('lodash')
  , raf = require('raf')
  , Ribcage
  , extendView

Ribcage = {
  initialize: function initialize(opts){
    opts = opts || {}

    // if we need to load data before rendering, do it
    // otherwise, assume we have the data already
    this._dataLoaded = typeof this.loadData !== 'function'

    this._nukeOnRender = opts._nukeOnRender
    // delete would turn this into a "slow object" in V8
    // we can't set to null, b/c a state model can reject extra properties
    if (_.has(opts, '_nukeOnRender')) opts = _.omit(opts, '_nukeOnRender')

    // backbone 1.1+ doesn't auto-set this.options
    this.options = opts

    if (this.beforeInit) this.beforeInit(opts)

    this.template = this.template || opts.template

    if (!this.template) {
      this.template = function template(){
        return ''
      }
    }

    if (this.afterInit) this.afterInit(opts)

    this.render()
  }

, context: function context(){
    var model = this.model ? this.model.toJSON() : {}
      , state = this.state ? this.state.toJSON() : {}

    return _.extend({}, this.options, model, state)
  }

, render: function render(){
    var self = this
      , model = this.model

    if (typeof this.bindEvents === 'function') {
      this.bindEvents()
    }

    if (!this._dataLoaded && typeof this.loadData === 'function') {
      return this.loadData(function dataLoaded(){
        self._dataLoaded = true
        self.render()
      })
    }

    // closing destroys the el, might need to recreate it
    if (!this.el) {
      this._ensureElement()
    }

    if (this.beforeRender) {
      this.beforeRender()
    }

    // Maintainers of legacy code might want to use this
    // but certainly not YOU, young grasshopper!
    if (this._nukeOnRender) {
      this.closeSubviews()
      this.$el.empty()
    }

    if (this.beforeTemplating) {
      model = this.beforeTemplating()
    }

    if (this.context) {
      model = this.context()
    }

    this.$el.html(this.template(model))

    // As soon as the view is bound to DOM, we need to delegate events and re-render all
    // subviews to keep events intact. -cstumph
    this.delegateEvents()
    this.eachSubview(function eachSubviewInRender(view){
      view.render()
    })

    // I'm not happy deferring here, but backbone's
    // event system is based on the DOM, so my hands
    // are tied. - Daniel
    _.defer(function deferSoTheDOMCanCatchup(){
      self.trigger('afterRender')
    })

    if (this.afterRender) {
      this.afterRender()
    }

    return this
  }

, proxy: function proxy(name, view){
    this.listenTo(view, name, function proxiedEventCallback(){
      var args = Array.prototype.slice.call(arguments, 0)
      args.splice(0, 0, name)
      this.trigger.apply(this, args)
    })
  }

, eachSubview: function eachSubview(iterator, context){
    _.each(this.subviews, iterator, context || this)
  }

, _attachSubView: function _attachSubView(view){
    var viewId

    if (!view) throw new Error('view must be passed.')
    this.subviews = this.subviews || {}
    this.subviewByModelId = this.subviewByModelId || {}

    this.subviews[view.cid] = view

    if (view.model) {
      viewId = view.model.id || view.model.cid
      if (!this.subviewByModelId[viewId]) this.subviewByModelId[viewId] = []

      this.subviewByModelId[viewId].push(view)
    }

    return view
  }

, appendSubview: function appendSubview(view, el){
    el || (el = this.$el)

    this._attachSubView(view)

    // closing a view will remove the el, so ensure we have one before re-attaching
    if (view.options && view.options.renderOnAppend || !view.el) view.render()
    el.append(view.el)

    _.defer(function deferSoTheDOMCanCatchup(){
      view.trigger('afterAppend', view)
    })

    if (view.afterAppend) {
      view.afterAppend()
    }
  }

, prependSubview: function prependSubview(view, el){
    el || (el = this.$el)

    this._attachSubView(view)

    // closing a view will remove the el, so ensure we have one before re-attaching
    if (view.options && view.options.renderOnAppend || !view.el) view.render()
    el.prepend(view.el)

    _.defer(function deferSoTheDOMCanCatchup(){
      view.trigger('afterPrepend', view)
    })

    if (view.afterPrepend) {
      view.afterPrepend()
    }
  }

, appendSubviews: function appendSubviews(views, el, callback){
    var fragment = document.createDocumentFragment()

    el || (el = this.$el)

    _.each(views, function appendEachView(view){
      this._attachSubView(view)

      // closing a view will remove the el, so ensure we have one before re-attaching
      if (view.options && view.options.renderOnAppend || !view.el) view.render()
      fragment.appendChild(view.el)

      _.defer(function deferSoTheDOMCanCatchup(){
        view.trigger('afterAppend', view)
      })

      if (view.afterAppend) {
        view.afterAppend()
      }
    }, this)

    raf(function onFrame(){
      el[0].appendChild(fragment)
      if (_.isFunction(callback)) callback(views)
    })
  }

, batchAppendSubviews: function batchAppendSubviews(views, el, batchCount, batchCallback, callback){
    var self = this
      , batches = _(views)
                  .groupBy(function groupIntoBatches(view, index){
                    return Math.floor(index / batchCount)
                  })
                  .toArray()
                  .valueOf()
      , appendNextBatch = function appendNextBatch(){
      var batchesLeft = batches.length
        , viewBatch = batchesLeft ? batches.shift() : false

      // with no batches left, just return early
      if (!batchesLeft) {
        // if we have a final callback, call that.
        return typeof callback === 'function'
          ? void callback()
          : void 0
      }

      self.appendSubviews(viewBatch, el, function subviewsAppended(){
        if (typeof batchCallback === 'function') {
          batchCallback(viewBatch)
        }

        appendNextBatch()
      })
    }

    appendNextBatch()
  }

, close: function close(options, callback){
    options || (options = {})

    if (this.beforeClose) this.beforeClose()

    this.closeSubviews({keepDom: true}, _.bind(function onSubviewsClosed(){
      this.stopListening()

      // when the subviews are closed, close the parent
      // keep the DOM elements, b/c it's save to assume that all child DOM
      // is containted by the parent DOM container. This allows us to reduce
      // many DOM removal calls to just one.
      if (!options.keepDom) {
        raf(function onFrame(){
          // remove the from the DOM
          if (this.$el) this.$el.remove()
          // destroy our reference to the DOM node
          this.$el = null
          this.el = null
          if (_.isFunction(callback)) callback()
        }.bind(this))
      }
      else if (_.isFunction(callback)) callback()
    }, this))
  }

, closeSubviews: function closeSubviews(options, callback){
    var subviewCount = _.size(this.subviews)
      , done

    if (_.isFunction(callback)){
      // if there are no subviews to close, just call the callback
      if (!subviewCount) return void callback()
      else done = _.after(subviewCount, callback)
    }

    this.eachSubview(function closeEachSubview(subview){
      subview.close(options, done)
    })

    // empty out our lists of subviews
    this.subviews = {}
    this.subviewByModelId = {}
  }

, detachSubview: function detachSubview(view){
    var msg

    if (this.subviews) {
      if (view && !this.subviews[view.cid]) {
        msg = 'View not found in ' + this.className + '\'s subviews: ' + view.className

        if (view.model) msg += '\n\n' + view.model.toJSON()

        throw new Error(msg)
      }

      // delete makes this into a "slow object" in V8
      // but that's okay b/c any perf gains we'd get would be lost by having to
      // itterate over subviews to remove falsey values.
      delete this.subviews[view.cid]
    }

    view.$el.detach()
  }

, _removeSubviewByModel: function _removeSubviewByModel(model, method){
    var id = model.id

    if (this.subviewByModelId){
      if (!id || !this.subviewByModelId[id]){
        throw new Error('No views with ' + id + ' model id found in ' + this.className + ' subviews')
      }

      _.each(this.subviewByModelId[id], function eachSubviewById(view){
        method.call(this, view)
      }, this)

      // delete would turn this into a "slow object" in V8, so just set to null
      this.subviewByModelId[id] = null
    }
  }

, closeSubviewsByModel: function closeSubviewsByModel(model){
    this._removeSubviewByModel(model, this.close)
  }

, detachSubviewByModel: function detachSubviewByModel(model){
    this._removeSubviewByModel(model, this.detachSubview)
  }

}

extendView = function extendView(view){
  return view.extend(Ribcage)
}

module.exports = extendView
