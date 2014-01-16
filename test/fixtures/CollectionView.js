var ItemView = require('./ItemView')
  , Ribcage = require('../../index')
  , CollectionViewExt = Ribcage.extend({
      tagName: 'UL'
    , afterInit: function (options) {
        options = options || {};

        if(typeof options.size != 'number')
          throw new Error('`size` is a required Number option');

        this.size = options.size;
      }
    , afterRender: function () {
        for(var i=0, ii=this.size; i<ii; ++i)
          this.appendSubview(new ItemView({name: 'View ' + i}), this.$el);
      }
    });

// This helps when debugging memory leaks by naming the constructor
module.exports = function CreateCollectionView () {
  var args = arguments;
  function CollectionView() { return CollectionViewExt.apply(this, args); }
  CollectionView.prototype = CollectionViewExt.prototype;
  return new CollectionView();
};
