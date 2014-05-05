var ItemView = require('./ItemView')
  , Ribcage = require('../../index')
  , Backbone = require('backbone')
  , _ = require('lodash')
  , CollectionViewExt = Ribcage.extend({
      tagName: 'UL'
    , afterInit: function (options) {
        options = options || {};

        if(typeof options.size != 'number')
          throw new Error('`size` is a required Number option');

        this.size = options.size;
      }
    , afterRender: function () {
        var modelOptions;

        if (!this.size) return;

        _.each(_.range(this.size), function(i) {
          modelOptions = {
            name: 'View ' + i
          }

          if (this.options.includeModels){
            modelOptions.model = new Backbone.Model({id: i});
          }

          this.appendSubview(new ItemView(modelOptions), this.$el);
        }, this)
      }
    });

// This helps when debugging memory leaks by naming the constructor
module.exports = function CreateCollectionView () {
  var args = arguments;
  function CollectionView() { return CollectionViewExt.apply(this, args); }
  CollectionView.prototype = CollectionViewExt.prototype;
  return new CollectionView();
};
