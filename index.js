var Backbone = require('backbone')
  , $ = require('jquery-browserify')
  , extend = require('./extend')
  , Base;

Backbone.$ = $;

Base = extend(Backbone.View);

module.exports = Base;
