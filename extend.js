var _ = require('lodash')
  , Ribcage
  , extendView;

Ribcage = {
  initialize: function (opts) {

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

    if(opts.throttle != null)
      this.throttle = opts.throttle;

    this._transitioning = false;
    this._dirty = true;

    if (!this.template) {
      this.template = function () { return ''; };
    }

    if (this.afterInit) {
      this.afterInit(opts);
    }

    this.render();
  }

  // Should this view queue renders when a transition is running?
, throttle: false

  // Helpers to bind/unbind transition listeners
, _bindThrottles: function () {
    this._unbindThrottles();
    this.on('transition:start', this._transitionStart);
    this.on('transition:end', this._transitionEnd);
  }
, _unbindThrottles: function () {
    this.off('transition:start', this._transitionStart);
    this.off('transition:end', this._transitionEnd);
  }

  // Stops further render events
, _transitionStart: function () {
    this._transitioning = true;
  }

  // Enables rendering and performs one immediately if dirty
, _transitionEnd: function () {
    this._transitioning = false;
    if(this._dirty) {
      this.render();
    }
  }

, context: function () {
    return _.extend({}, this.options, this.model);
  }

, close: function() {
    this.trigger('beforeClose')


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

    if (!this._dataLoaded) {
      return this.loadData(function () {
        self._dataLoaded = true
        self.render()
      })
    }

    if(this._transitioning) {
      this._dirty = true;
      return false;
    }

    this._dirty = false;

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

    if(this.throttle) {
      this._bindThrottles();
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
      delete this.subviews[view.cid];
    }

    view.$el.detach();

  }
};

extendView = function (view) {
  return view.extend(Ribcage);
};

module.exports = extendView;
