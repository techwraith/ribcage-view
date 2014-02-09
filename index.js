var Backbone = require('backbone')
    // Use the global jQuery if possible -- it might have plugins on it
  , $ = window.$ ? window.$ : require('jquery')(window)
  , extend = require('./extend')
  , Base;

Backbone.$ = $;

Base = extend(Backbone.View);

module.exports = Base;
