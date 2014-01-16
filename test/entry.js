/* globals mocha, describe, it, after */

var assert = require('assert')
  , View = require('../index')
  , fixture = document.getElementById('fixture')
  , CollectionView = require('./fixtures/CollectionView')
  , ButtonHolderView = require('./fixtures/ButtonHolderView')
  , instances = {}; // A temporary holder that we can `delete` to clear leaks

mocha.setup({
  ui: 'bdd',
  globals: []
}).timeout(10000);

describe('A Simple View', function () {
  it('should not throw when initialized with no options', function () {
    instances.viewInstance = new View();
  });

  it('should append an empty div', function () {
    fixture.appendChild(instances.viewInstance.el);
    assert.equal(fixture.childNodes.length, 1);
    assert.equal(fixture.childNodes[0].tagName, 'DIV');
    assert.equal(fixture.childNodes[0].innerHTML, '');
  });

  it('should detach when closed', function () {
    instances.viewInstance.close();
    assert.equal(fixture.childNodes.length, 0);
    assert.equal(fixture.innerHTML, '');
  });

  delete instances.viewInstance;
});

describe('Extended Views', function () {
  describe('CollectionView Without Subviews', function () {
    it('should inherit tagName', function () {
      instances.collectionInstance = new CollectionView({
        size: 0
      });

      fixture.appendChild(instances.collectionInstance.el);
      assert.equal(fixture.childNodes.length, 1);
      assert.equal(fixture.childNodes[0].tagName, 'UL');
    });

    it('should have no children', function () {
      assert.equal(fixture.childNodes[0].childNodes.length, 0);
    });

    it('should detach when closed', function () {
      instances.collectionInstance.close();
      assert.equal(fixture.childNodes.length, 0);
      assert.equal(fixture.innerHTML, '');
    });

    delete instances.collectionInstance;
  });

  describe('CollectionView With Sub ItemViews', function () {
    it('should inherit tagName', function () {
      instances.collectionInstance = new CollectionView({
        size: 100
      });

      fixture.appendChild(instances.collectionInstance.el);
      assert.equal(fixture.childNodes.length, 1);
      assert.equal(fixture.childNodes[0].tagName, 'UL');
    });

    it('should have 100 children', function () {
      assert.equal(fixture.childNodes[0].childNodes.length, 100);
    });

    it('should detach when closed', function () {
      instances.collectionInstance.close();
      assert.equal(fixture.childNodes.length, 0);
      assert.equal(fixture.innerHTML, '');
    });

    delete instances.collectionInstance;
  });
});

describe('Memory Leaks', function () {
  describe('CollectionView', function () {
    var cycles = 10
      , collectionsPerCycle = 10
      , itemsPerCollection = 10
      , t = {}; // A temporary holder that we can `delete` to clear leaks

    it('no CollectionView or ItemView objects should exist in heap', function () {
      for(var i=0, ii=cycles; i<ii; ++i) {
        instances.collectionInstances = [];

        for(var j=0, jj=collectionsPerCycle; j<jj; ++j) {
          t.t = new CollectionView({size: itemsPerCollection});
          instances.collectionInstances.push(t.t);
          fixture.appendChild(t.t.el);
        }

        for(var k=0, kk=collectionsPerCycle; k<kk; ++k) {
          instances.collectionInstances.pop().close();
        }

        delete instances.collectionInstances;
        delete t.t;
      }
    });
  });

  describe('Button Closures', function () {
    it('1 ButtonHolderView and 1 ButtonView should exist in heap', function () {
      var buttonHolderReference
        , buttonAction = function ButtonViewActionClosure () {
            buttonHolderReference.replaceButton();
          };

      buttonHolderReference = new ButtonHolderView({
        buttonAction: buttonAction
      });

      fixture.appendChild(buttonHolderReference.el);

      for(var i=0, ii=10; i<ii; ++i)
        buttonHolderReference.replaceButton();
    });
  });
});

// Need this to be leakproof
after(function () {
  for(var k in instances)
    delete instances[k];
});

onload = function(){
  mocha.run();
};
