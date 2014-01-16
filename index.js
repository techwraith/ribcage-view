var Backbone = require('backbone')
  , $ = require('jquery')(window)
  , extend = require('./extend')
  , Base;

Backbone.$ = $;

Base = extend(Backbone.View);

module.exports = Base;
