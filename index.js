var Backbone = require('backbone')
  , $ = require('jquery')
  , extend = require('./extend')
  , Base;

Backbone.$ = $;

Base = extend(Backbone.View);

module.exports = Base;
