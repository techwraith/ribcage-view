ribcage-view
===========

A simple base Backbone view class that adds subviews, rendering, and initialization.

<!-- MarkdownTOC depth=4 -->

- [Install](#install)
- [Usage](#usage)
  - [Simple example](#simple-example)
  - [Full example](#full-example)
- [Methods](#methods)
  - [Override with caution](#override-with-caution)
    - [`initialize()`](#initialize)
    - [`render()`](#render)
    - [`close(](# options,  callback)
    - [`closeSubviews(](# options,  callback)
    - [`eachSubview( iterator](#,  context)
  - [Override at will](#override-at-will)
    - [`context()`](#context)
  - [Helpers](#helpers)
    - [`proxy( name,  view)`](#proxy-name--view)
    - [`appendSubview( view](#,  el)
    - [`prependSubview( view](#,  el)
    - [`appendSubviews( views](#,  el,  callback)
    - [`batchAppendSubviews( views,  el,  batchCount](#,  batchCallback,  callback)
    - [`detachSubview( view)`](#detachsubview-view)
    - [`closeSubviewsByModel( model)`](#closesubviewsbymodel-model)
    - [`detachSubviewByModel( model)`](#detachsubviewbymodel-model)
- [Gotchas](#gotchas)
- [Contributing](#contributing)
  - [Developing](#developing)
  - [Testing](#testing)

<!-- /MarkdownTOC -->

## Install

Installing via npm is easy:

```
npm install ribcage-view
```

Ribcage requires you to use browserify (or some other way to get require on the front-end).

## Usage

### Simple example
```js
var View = require('ribcage-view')

/*
 * A view that doesn't do anything but render a template
 *
 * - a template is just a function that takes an object
 *   and returns a string to be rendered.
 *
 */
var templateView = new View({
  template: function(id){
    return '<div>' + id '</div>'
  }
})
```

### Full example
```js
// Extending a ribcage-view
var Base = require('ribcage-view')
  , _ = require('lodash')
  // it's not required, but using a state model is _highly_ recommended.
  , State = require('ampersand-state').extend({
    extraProperties: 'reject'
  })

var MyView = Base.extend({

  template: require('./template.html.hbs')

, className: 'myView'

, State: State.extend({
    props: {
      text: 'string'
    }
  })

, events: {
    'input input': 'onInputInput'
  }

// DOM Events
 , onInputInput: function onInputInput(e){
    this.state.text = e.target.value
   }

// Backbone Events
, bindEvents: function bindEvents(){
    // always stopListening so we don't reattach multiple listeners
    if (this.state) this.stopListening(this.state)

    // listen to state, model, etc… events
    this.listenTo(this.state, 'change:text', this.onStateChangeText)
  }

, onStateChangeText: function onStateChangeText(state, value){
    console.log(value)
  }

// Create Subviews
, createSubviewX: function createSubviewX(){
    return new SubviewX({})
  }

// Lifecycle Methods
, beforeInit: function beforeInit(options){
    this.state = new this.State(_.omit(options, ['model', 'collection']))
  }

// instantiate subviews
, afterInit: function afterInit() {
    this.subviewX = this.createSubviewX()
  }

, afterRender: function afterRender() {
    this.appendSubview(this.subviewX)
  }

, context: function context() {
    return this.state.toJSON()
  }

})

module.exports = MyView
```

## Methods

### Override with caution
These are methods that are reserved by Ribcage View. Overriding will break expected behavior.

#### `initialize()`
Sets up the view and calls the `render` method.

#### `render()`
Attaches the template to the DOM with all DOM and backbone events attached. Returns the view.

#### `close([<Object> options, [<Function> callback]])`
Closes out a view completely by removing it and all subviews from the DOM, destroying all listeners, and the view's DOM node.

`options` currently only accepts one key: `keepDom` which is a boolean. When set to `true`, it will preserve the view's DOM node. This is really only useful if removing many subviews at once that all share a parent node. Instead of removing each node, we can just remove the parent when we're done closing all the subviews.

The close happens in a `requestAnimationFrame` and the `callback` will be called when the close is complete.

```js
// kill the subview. This removes it from the DOM, kills all event listeners, closes all subviews, and is the memory-leak free way to kill a view.
// `keepDom` is false by default. If you want to close, but leave this in the DOM (probably a bad idea), you can set to `true`
// The `keepDom` option exists for closing many views that share a parent element. You can then remove just the parent element.
this.myView.close({keepDom: false}, function myViewClosed(){
  console.log('myView has been closed')
})
```

#### `closeSubviews([<Object> options, [<Function> callback]])`
Closes all subviews. Takes the same options as `close()`.

#### `eachSubview(<Function> iterator[, <Object> context])`
Iterate over each subview, performing the `iterator` function. `context` defaults to the view you're calling from.

```js
// go through all the subviews
this.eachSubview(function eachSubview(subview) {
  // `this` is the parent view
  this.doSomething(subview.property)
})
```

### Override at will
These methods provide defaults, but you should feel free to replace them with your own.

#### `context()`
Return an object for the template to use for its data. Defaults to the `options`.

### Helpers
These are methods that assist with common tasks.

#### `proxy(<String> name, <Backbone.View> view)`
Listen to an event from another view (probably a subview), and trigger the same event. This is useful if you want to pass an event up the chain of subviews.

#### `appendSubview(<Backbone.View> view[, <jQuery el> el])`
Appends the `view` to the view's DOM. Optionally, you can pass a specific DOM node to append to.

#### `prependSubview(<Backbone.View> view[, <jQuery el> el])`
Just like `appendSubview`, only it prepends.

#### `appendSubviews(<Array of Backbone.View> views[, <jQuery el> el[, <Function> callback]])`
Append an array of `views`. You can optionally pass in the `el` to append into.

This is an async function that is has better performance than calling `appendSubview` many times because it creates a `documentFragment` before appending to the DOM, and uses `requestAnimationFrame`.

The third argument is an optional callback that is called when the views are in the DOM.

```js
// append many subviews at once
// e.g. if you want to append a sub view for all models in a collection
var collectionSubviews = this.collection.map(function(model){
  return new MyView({model: model})
})
// only the first argument is required
this.appendSubviews(collectionSubviews, this.$('.collection'), function(views){
  // views are rendered after a requestAnimationFrame
  console.log(assert.deepEqual(views, collectionSubviews))
})
```

#### `batchAppendSubviews(<Array of Backbone.View> views[, <jQuery el> el], <Int> batchCount[, <Function> batchCallback, [<Function> callback]])`
This is like `appendSubviews`, but it requires the third argument be a `Number`. It allows you to append a set amount of views per `animationFrame` which might be necessary for performance reasons.

`batchAppendSubview` takes two callbacks. The first is called on every batch append, the second is called when all views have been appended.

```js
// if your subviews take time to render and slow down the DOM
// will render 2 subviews at a time.
this.batchAppendSubviews(collectionSubviews
  , this.$('#place')
  , 2
  , function onPortionAppended(){
    console.log('2 more subviews appended')
  }
  , function onBatchAppended(){
    console.log('all subviews appended')
  }
)
```

#### `detachSubview(<Backbone.View> view)`
Remove a view from the DOM, but keep it's node around in memory. This is useful if you want to move it to a different node.

#### `closeSubviewsByModel(<Backbone.Model> model)`
Finds all subviews that have the `model` set as their `model` and closes them.

```js
this.listenTo(this.collection, 'remove', this.closeSubviewsByModel)
```

#### `detachSubviewByModel(<Backbone.Model> model)`
Like `closeSubviewsByModel`, but only detaches.

## Gotchas

1. Remember to call `View.prototype.initialize.apply(this, arguments)` if you are override initialize. This fixes the `loadData is not defined` error. Alternatively, override `afterInit` and `beforeInit` instead.
2. Subviews are closed when their parent is rendered, and will lose their events unless you call `.delegateEvents()` on them in the parent's `afterRender`. See #5.

## Contributing

### Developing

Run this command to run tests at [`http://localhost:9999`](http://localhost:9999).

```sh
grunt dev
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
