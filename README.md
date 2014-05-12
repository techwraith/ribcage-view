ribcage-view
===========

A simple base Backbone view class that adds subviews, rendering, and initialization.

### Examples

```js
var View = require('ribcage-view');

/*
 * A view that doesn't do anything but render a template
 *
 * - a template is just a function that takes an object
 *   and returns a string to be rendered.
 *
 * - all options that are passed into the view will also
 *   be passed into the template
 *
 */
var templateView = new View({
  template: templateFunction
, thing: 'will be passed to the template'
});

// Extending a ribcage-view
var MyView = View.extend({

  beforeInit: function (opts) {
    // gets called before initialization
  }

, afterInit: funciton (opts) {
    // gets called after initialization
  }

, template: function (context) {
    // return a string to be rendered
  }

, context: function () {
    // define a context for the template
  }

, bindEvents: function () {
    // gets called before loadData is called in render
    // useful for listening to model
  }

, beforeRender: function () {
    // gets called before it's rendered
  }

, afterRender: function () {
    // gets called after it's rendered
  }

});

// Working with subviews
var ViewWithSubviews = View.extend({

  afterRender: function () {
    // append a view to this view's $el
    this.myView = new MyView();
    this.appendSubview(myView);

    // note: there is also .prependSubview

    // append a view to a specific place in this $el
    this.appendSubview(new MyView(), this.$('#put-it-here'));

    // go through all the subviews
    this.eachSubview(function (subview) {
      subview.doSomething();
    });

    // detatch a subview
    this.detatchSubview(this.myView);

    // detach all subviews with a specific model
    this.subModel = new Backbone.Model()
    this.myModelView = new MyView({
      model: this.subModel
    })
    this.detachSubviewByModel(this.subModel)
    // or…
    this.listenTo(this.subModel, 'destroy', this.detachSubviewByModel)

    // append many subviews at once
    // e.g. if you want to append a sub view for all models in a collection
    var collectionSubviews = this.collection.each(function(view){
      new MyView()
    })
    // only the first argument is required
    this.appendSubviews(collectionSubviews, this.$('.collection'), function(views){
      // views are rendered after a requestAnimationFrame
      console.log(assert.deepEqual(views, collectionSubviews))
    })

    // or, if your subviews take time to render and slow down the DOM
    // will render 2 subviews at a time.
    this.batchAppendSubviews(collectionSubviews, 2)

    // close all subviews
    this.closeSubviews();

  }

});

// Extending a custom view
var Backbone = require('my-backbone')
  , RibcagedView = require('ribcage-view/extend')(Backbone.View);

// Do things with RibcagedView

```

## Gotchas

 1. Remember to call `__super__.initialize.apply(this, arguments)` if you are override initialize. This fixes the `loadData is not defined` error. Alternatively, override `afterInit` and `beforeInit` instead.
 2. Subviews are closed when their parent is rendered, and will lose their events unless you call `.delegateEvents()` on them in the parent's `afterRender`. See #5.

### Install

Installing via npm is easy:

```
npm install ribcage-view
```

Ribcage requires you to use browserify (or some other way to get require on the front-end).

## Contributing

### Developing

Run this command to run tests at `http://localhost:9999`.

```sh
# grunt dev
```

### Testing

Tests can be run on Saucelabs.

```sh
# Run once to set up login info
$ export SAUCE_USERNAME=YOUR-SAUCE-USERNAME
$ export SAUCE_ACCESS_KEY=YOUR-SAUCE-API-KEY

# Run to test on sauce
$ grunt test
```
