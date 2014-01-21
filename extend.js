var _ = require('lodash')
  , Ribcage
  , extendView;

Ribcage = {
  initialize: function (opts) {

    opts = opts || {};

    var tn = this.templateName;

    // if we need to load data before rendering, do it
    if (typeof this.loadData == 'function') {
      this._dataLoaded = false
    }
    // otherwise, assume we have the data already
    else {
      this._dataLoaded = true
    }

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

    if (!this._dataLoaded) {
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

, appendSubview: function(view, el) {
    el || (el = this.$el);

    this.subviews = this.subviews || {};
    this.subviews[view.cid] = view;
    el.append(view.el);

    _.defer(function () {
      view.trigger('afterAppend');
    });

    if (view.afterAppend) {
      view.afterAppend();
    }

  }

, closeSubviews: function() {

    this.eachSubview(function(subview) {
      subview.close();
    });

    this.subviews = {};

  }

, detachSubview: function(view) {

    if (this.subviews) {

      if (view && !this.subviews[view.cid]) {
        throw new Error("View not found in "+this.className+"'s subviews: " + view.className +'\n\n'+ view.model.toJSON())
      }

      delete this.subviews[view.cid];
    }

    view.$el.detach();

  }
};

extendView = function (view) {
  return view.extend(Ribcage);
};

module.exports = extendView;
