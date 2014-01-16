var Ribcage = require('../../index')
  , ButtonViewExt = Ribcage.extend({
      afterInit: function buttonHolderAfterInit (options) {

        if(!options.action)
          throw new Error('Buttons must be created with an action');

        if(!options.label)
          throw new Error('Buttons must be created with a label');

        this.action = options.action;
        this.label = options.label;
      }
    , tagName: 'a'
    , attributes: {
        'href': '#'
      }
    , events: {
        'click': 'onClick'
      }
    , template: function (c) {
        return c.label;
      }
    , context: function () {
        return {label: this.label};
      }
    , onClick: function (e) {
        // Might be synthetic click in testing
        if(e) {
          e.preventDefault();
          e.stopPropagation();
        }

        this.action();
      }
    });

// This helps when debugging memory leaks by naming the constructor
module.exports = function CreateButtonView () {
  var args = arguments;
  function ButtonView () { return ButtonViewExt.apply(this, args); }
  ButtonView.prototype = ButtonViewExt.prototype;
  return new ButtonView();
};
