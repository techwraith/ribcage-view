var ButtonView = require('./ButtonView')
  , Ribcage = require('../../index')
  , ButtonHolderViewExt = Ribcage.extend({
      afterInit: function buttonHolderAfterInit (opts) {
        this.buttonCount = 0;

        this.buttonAction = opts.buttonAction;

        this.button = this.createButtonView();
      }
    , createButtonView: function createButtonView () {
        var self = this;

        ++this.buttonCount;

        return new ButtonView({
          label: 'Leaky Button #' + this.buttonCount
        , action: self.buttonAction
        });
      }
    , afterRender: function () {
        this.appendSubview(this.button);
      }
    , replaceButton: function () {
        this.button = this.createButtonView();
        this.render();
      }
    });

// This helps when debugging memory leaks by naming the constructor
module.exports = function CreateButtonHolderView () {
  var args = arguments;
  function ButtonHolderView () { return ButtonHolderViewExt.apply(this, args); }
  ButtonHolderView.prototype = ButtonHolderViewExt.prototype;
  return new ButtonHolderView();
};
