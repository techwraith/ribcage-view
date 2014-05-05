var _ = require('lodash')
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

    this.closeSubviews();
    this.$el.empty();

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
    var self = this;
    view.on(name, function () {
      var args = Array.prototype.slice.call(arguments, 0);
      args.splice(0, 0, name);
      self.trigger.apply(self, args);
    });
  }

, eachSubview: function(iterator) {
    _.each(this.subviews, iterator);
  }

, _attachSubview: function(view){
    this.subviews = this.subviews || {};
    this.subviewByModelId = this.subviewByModelId || {};

    this.subviews[view.cid] = view;
    if (view.model) {
      if (!this.subviewByModelId[view.model.id]) this.subviewByModelId[view.model.id] = [];
      this.subviewByModelId[view.model.id].push(view);
    }

    // let the subview store a reference to its parent
    view.parent || (view.parent = this)

    return view;
  }

, appendSubview: function(view, el) {
    el || (el = this.$el);

    this._attachSubview(view);

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

    this._attachSubview(view);

    el.prepend(view.el);

    _.defer(function () {
      view.trigger('afterPrepend', view);
    });

    if (view.afterPrepend) {
      view.afterPrepend();
    }

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
        msg = "View not found in "+this.className+"'s subviews: " + view.className

        if(view.model)
          msg += '\n\n'+ view.model.toJSON()

        throw new Error(msg)
      }

      delete this.subviews[view.cid];
    }

    view.$el.detach();

  }

, detachSubviewByModelId: function(id){
    if (this.subviewByModelId){
      if (!id || !this.subviewByModelId[id]){
        throw new Error('No views with ' + id + ' model id found in ' + this.className + ' subviews');
      }

      _.each(this.subviewsByModelId[id], function(view){
        this.detachSubview(view);
      });

      delete this.subviewByModelId[id];
    }
  }
};

extendView = function (view) {
  return view.extend(Ribcage);
};

module.exports = extendView;
