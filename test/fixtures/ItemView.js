var Ribcage = require('../../index')
  , ItemViewExt = Ribcage.extend({
      tagName: 'LI'
    , afterInit: function (options) {
        options = options || {};

        if(typeof options.name != 'string')
        throw new Error('`name` is a required String option');

        this.name = options.name;
      }
    });

// This helps when debugging memory leaks by naming the constructor
module.exports = function CreateItemView () {
  var args = arguments;
  function ItemView() { return ItemViewExt.apply(this, args); }
  ItemView.prototype = ItemViewExt.prototype;
  return new ItemView();
};
