"use strict";

// Import
// ========

var _    = require('underscore');
var Test = require('substance-test');
var assert = Test.assert;
var registerTest = Test.registerTest;
var SurfaceTest = require('./surface_test');


// Test
// ========

// Some example paragraphs
// --------
//

var P1 = "The quick brown fox jumps over the lazy dog.";
var P2 = "Pack my box with five dozen liquor jugs";

var I1 = "http://i.telegraph.co.uk/multimedia/archive/02429/eleanor_scriven_2429776k.jpg";


var ImageEditing = function() {
  SurfaceTest.call(this);

  // Deactivate the default fixture for testing basic behavior
  this.fixture = function() {};

  this.actions = [
    "Insert some text", function() {
      this.insertContent(P1);
    },

    "Insert some more text", function() {
      this.insertImage(I1);
      this.insertContent(P2);
      // this.insertContent(P4);
    },

    "Set selection", function() {
      var sel = this.writer.selection;
      this.writer.selection.set({
        start: [2, 0],
        end: [2, 0]
      });

      sel.expand('left', 'char');

      // Expect start pos to be 1st pos of the image
      assert.isArrayEqual([1,1], sel.start);
      assert.isArrayEqual([2,0], sel.end);
      
      sel.expand('left', 'char');
      // Expect star pos to be 0 pos of the image
      assert.isArrayEqual([1,0], sel.start);
      assert.isArrayEqual([2,0], sel.end);

      sel.expand('left', 'char');
      // Expect start pos to be last pos of the image predecessor (in our case a text element)
      assert.isArrayEqual([0,44], sel.start);
      assert.isArrayEqual([2,0], sel.end);

      sel.expand('left', 'char');
      // Expect start pos to be next-to-last pos of the image predecessor (in our case a text element)
      assert.isArrayEqual([0,43], sel.start);
      assert.isArrayEqual([2,0], sel.end);
    },

  ];
};

ImageEditing.prototype = SurfaceTest.prototype;

registerTest(['Surface', 'Image Editing'], new ImageEditing());
