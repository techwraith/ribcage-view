var _ = require('lodash')
  , raf = require('raf/polyfill')
  , Ribcage
  , extendView;

Ribcage = {
  initialize: function (opts) {

    opts = opts || {};

    // if we need to load data before rendering, do it
    if (typeof this.loadData == 'function') {
      this._dataLoaded = false
    }
    // otherwise, assume we have the data already
    else {
      this._dataLoaded = true
    }

    this._nukeOnRender = opts._nukeOnRender
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

    if (!opts.renderOnAppend) {
      this.render();
    }

  }

, context: function () {
    return _.extend({}, this.options, this.model);
  }

, close: function() {

    if (this.beforeClose) {
      this.beforeClose();
    }

    this.closeSubviews();
    this.off();
    this.remove();

  }

, render: function () {
    var self = this
      , model = this.model;

    if(typeof this.bindEvents == 'function') {
      this.bindEvents()
    }

    if (!this._dataLoaded && typeof this.loadData == 'function') {
      return this.loadData(function () {
        self._dataLoaded = true
        self.render()
      })
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

, proxy: function (name, view) {
    this.listenTo(view, name, function proxiedEventCallback(){
      var args = Array.prototype.slice.call(arguments, 0);
      args.splice(0, 0, name);
      this.trigger.apply(this, args);
    })
  }

, eachSubview: function(iterator) {
    _.each(this.subviews, iterator);
  }

, _attachSubView: function(view){
    this.subviews = this.subviews || {};
    this.subviewByModelId = this.subviewByModelId || {};

    this.subviews[view.cid] = view;
    if (view.model) {
      if (!this.subviewByModelId[view.model.id]) this.subviewByModelId[view.model.id] = [];
      this.subviewByModelId[view.model.id].push(view);
    }

    return view;
  }

, appendSubview: function(view, el) {
    el || (el = this.$el);

    this._attachSubView(view);

    if (view.options.render) view.render()
    el.append(view.el);

    _.defer(function () {
      view.trigger('afterAppend', view);
    });

    if (view.afterAppend) {
      view.afterAppend();
    }

  }

, prependSubview: function(view, el) {
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

, appendSubviews: function(views, el, callback){
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

, batchAppendSubviews: function(views, el, batchCount, callback){
  _.chain(views)
    .groupBy(function(view, index){
      return Math.floor(index / batchCount);
    })
    .toArray()
    .each(function(viewBatch){
      this.appendSubviews(viewBatch, el, function(){
        if (_.isFunction(callback)) callback(viewBatch);
      });
    }, this)
  ;
}

, closeSubviews: function() {

    this.eachSubview(function(subview) {
      subview.close();
    });

    this.subviews = {};

  }

, detachSubview: function(view) {
    var msg

    if (this.subviews) {

      if (view && !this.subviews[view.cid]) {
        msg = 'View not found in ' + this.className + '\'s subviews: ' + view.className

        if(view.model)
          msg += '\n\n'+ view.model.toJSON()

        throw new Error(msg)
      }

      delete this.subviews[view.cid];
    }

    view.$el.detach();

  }

, detachSubviewByModel: function(model){
    var id = model.id
    if (this.subviewByModelId){
      if (!id || !this.subviewByModelId[id]){
        throw new Error('No views with ' + id + ' model id found in ' + this.className + ' subviews');
      }

      _.each(this.subviewByModelId[id], function(view){
        this.detachSubview(view);
      }, this);

      delete this.subviewByModelId[id];
    }
  }
};

extendView = function (view) {
  return view.extend(Ribcage);
};

module.exports = extendView;
