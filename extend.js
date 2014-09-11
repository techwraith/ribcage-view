'use strict';

var _ = require('lodash')
  , raf = require('raf/polyfill')
  , Ribcage
  , extendView;

Ribcage = {
  initialize: function (opts){

    opts = opts || {};

    // if we need to load data before rendering, do it
    if (typeof this.loadData === 'function') {
      this._dataLoaded = false
    }
    // otherwise, assume we have the data already
    else {
      this._dataLoaded = true
    }

    this._nukeOnRender = opts._nukeOnRender
    // delete would turn this into a "slow object" in V8
    // however, leaving setting it to null makes subclassed states
    // throw if extraProperties is set to deny
    delete opts._nukeOnRender

    // backbone 1.1+ doesn't auto-set this.options
    this.options = opts

    if(this.beforeInit) {
      this.beforeInit(opts);
    }

    this.template = this.template || opts.template;

    if (!this.template) {
      this.template = function () { return ''; };
    }

    if (this.afterInit) {
      this.afterInit(opts);
    }

    this.render();
  }

, context: function () {
    return _.extend({}, this.options, this.model);
  }

, render: function () {
    var self = this
      , model = this.model;

    if(typeof this.bindEvents === 'function') {
      this.bindEvents()
    }

    if (!this._dataLoaded && typeof this.loadData === 'function') {
      return this.loadData(function () {
        self._dataLoaded = true
        self.render()
      })
    }

    // closing destroys the el, might need to recreate it
    if (!this.el) {
      this._ensureElement()
    }

    if (this.beforeRender) {
      this.beforeRender();
    }

    // Maintainers of legacy code might want to use this
    // but certainly not YOU, young grasshopper!
    if (this._nukeOnRender) {
      this.closeSubviews();
      this.$el.empty();
    }

    if (this.beforeTemplating) {
      model = this.beforeTemplating();
    }

    if (this.context) {
      model = this.context();
    }

    this.$el.html(this.template(model));

    // As soon as the view is bound to DOM, we need to delegate events and re-render all
    // subviews to keep events intact. -cstumph
    this.delegateEvents()
    this.eachSubview( function eachSubviewInRender (view){
      view.render()
    })

    // I'm not happy deferring here, but backbone's
    // event system is based on the DOM, so my hands
    // are tied. - Daniel
    _.defer(function () {
      self.trigger('afterRender')
    });

    if (this.afterRender) {
      this.afterRender();
    }

    return this;
  }

, proxy: function (name, view){
    this.listenTo(view, name, function proxiedEventCallback(){
      var args = Array.prototype.slice.call(arguments, 0);
      args.splice(0, 0, name);
      this.trigger.apply(this, args);
    })
  }

, eachSubview: function (iterator, context){
    _.each(this.subviews, iterator, context || this);
  }

, _attachSubView: function (view){
    this.subviews = this.subviews || {};
    this.subviewByModelId = this.subviewByModelId || {};

    this.subviews[view.cid] = view;
    if (view.model) {
      if (!this.subviewByModelId[view.model.id]) this.subviewByModelId[view.model.id] = [];
      this.subviewByModelId[view.model.id].push(view);
    }

    return view;
  }

, appendSubview: function (view, el){
    el || (el = this.$el);

    this._attachSubView(view);

    if (view.options.render) view.render()
    el.append(view.el);

    _.defer(function (){
      view.trigger('afterAppend', view);
    });

    if (view.afterAppend) {
      view.afterAppend();
    }
  }

, prependSubview: function (view, el){
    el || (el = this.$el);

    this._attachSubView(view);

    if (view.options.renderOnAppend) view.render()
    el.prepend(view.el);

    _.defer(function () {
      view.trigger('afterPrepend', view);
    });

    if (view.afterPrepend) {
      view.afterPrepend();
    }
  }

, appendSubviews: function (views, el, callback){
    el || (el = this.$el);

    var fragment = document.createDocumentFragment();

    _.each(views, function(view){
      this._attachSubView(view);

      if (view.options.renderOnAppend) view.render()
      fragment.appendChild(view.el);

      _.defer(function () {
        view.trigger('afterAppend', view);
      });

      if (view.afterAppend) {
        view.afterAppend();
      }
    }, this);

    raf.call(window, function(){
      el[0].appendChild(fragment);
      if (_.isFunction(callback)) callback(views);
    });
  }

, batchAppendSubviews: function (views, el, batchCount, batchCallback, callback){
    var self = this
      , batches = _(views)
                  .groupBy( function (view, index){
                    return Math.floor(index / batchCount);
                  })
                  .toArray()
                  .valueOf();

    function appendNextBatch () {
      // with no batches left, just return early
      if(!batches.length) {
        // if we have a final callback, call that.
        return typeof callback === 'function'
          ? void callback()
          : void 0
      }

      var viewBatch = batches.shift();

      self.appendSubviews(viewBatch, el, function (){
        if (typeof batchCallback === 'function') {
          batchCallback(viewBatch);
        }

        appendNextBatch();
      });
    }

    appendNextBatch();
  }

, close: function close(options, callback) {
    options || (options = {})

    if (this.beforeClose) {
      this.beforeClose();
    }

    this.closeSubviews({keepDom: true}, _.bind(function onSubviewsClosed(){
      this.stopListening();

      // when the subviews are closed, close the parent
      // keep the DOM elements, b/c it's save to assume that all child DOM
      // is containted by the parent DOM container. This allows us to reduce
      // many DOM removal calls to just one.
      if (!options.keepDom) {
        raf.call(window, function closeRequestAnimationFrame(){
          // remove the from the DOM
          if (this.$el) this.$el.remove()
          // destroy our reference to the DOM node
          this.$el = null
          this.el = null
          if (_.isFunction(callback)) callback()
        }.bind(this))
      }
      else if (_.isFunction(callback)) callback()
    }, this));
  }

, closeSubviews: function (options, callback){
    var subviewCount = _.size(this.subviews)
      , done

    if (_.isFunction(callback)){
      // if there are no subviews to close, just call the callback
      if (!subviewCount) return void callback()
      else done = _.after(subviewCount, callback)
    }

    this.eachSubview( function (subview){
      subview.close(options, done);
    });

    // empty out our lists of subviews
    this.subviews = {}
    this.subviewByModelId = {}
  }

, detachSubview: function detachSubview(view){
    var msg

    if (this.subviews) {

      if (view && !this.subviews[view.cid]) {
        msg = 'View not found in ' + this.className + '\'s subviews: ' + view.className

        if(view.model)
          msg += '\n\n'+ view.model.toJSON()

        throw new Error(msg)
      }

      // delete would turn this into a "slow object" in V8, so just set to null
      this.subviews[view.cid] = null
    }

    view.$el.detach();
  }

, _removeSubviewByModel: function _removeSubviewByModel(model, method){
    var id = model.id
    if (this.subviewByModelId){
      if (!id || !this.subviewByModelId[id]){
        throw new Error('No views with ' + id + ' model id found in ' + this.className + ' subviews');
      }

      _.each(this.subviewByModelId[id], function(view){
        method.call(this, view);
      }, this);

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

};//end Ribcage{}

extendView = function (view){
  return view.extend(Ribcage);
};

module.exports = extendView;
