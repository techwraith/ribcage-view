var Ribcage = require('../../index')
  , _       = require('lodash')



var EventSubview = Ribcage.extend({
  events: {
    'input': 'onClick'
  }
, beforeInit: function(){
    this.clickCount = 0
  }
, onClick: function (){
    this.clickCount++
    this.trigger('click', this.clickCount)
  }
, clickIt: function(){
    this.$el.click()
  }
, bindEvents: function (){
    this.listenTo(this, 'click', this.onClick())
  }
})
module.exports.EventSubview = EventSubview




var EventView = Ribcage.extend({

  afterInit: function (){
    this.eSub = new EventSubview({})
    this.clickCount = this.eSub.clickCount
  }
, refreshEvents: function refreshEvents(){
    var self = this

    _.each(this.eSubs, function (subview){
      self.listenTo( subview, 'click', function (clickCount){
        this.clickCount = clickCount
      })
    })
  }
, render: function render(){
    this.refreshEvents()
  }
, afterRender: function(){
    // if (this.eSubs)
      this.appendSubviews( this.eSub )
  }
})
module.exports.EventView = EventView
