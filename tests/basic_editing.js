"use strict";

// Import
// ========

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
var P3 = "Fix problem quickly with galvanized jets";
var P4 = "Heavy boxes perform quick waltzes and jigs";

var BasicEditing = function() {
  SurfaceTest.call(this);

  // Deactivate the default fixture for testing basic behavior
  this.fixture = function() {};

  this.actions = [
    "Insert some text", function() {
      this.insertContent(P1);
    },

    "Insert some more text", function() {
      this.insertContent(P2);
      this.insertContent(P3);
      this.insertContent(P4);
    },

    // Selection API
    // --------

    "Set single cursor", function() {
      this.writer.selection.set({
        start: [1,2],
        end: [1,2]
      });
    },

    "Edge case: Select last char of text node", function() {
      this.writer.selection.set({
        start: [1,39],
        end: [1,39]
      });
    },

    "Insert period after last char", function() {
      this.writer.write(".");

      var nodeId = this.writer.get('content').nodes[1];
      var node = this.writer.get(nodeId);
      assert.isEqual(P2+".", node.content);
    },

    "Make a selection", function() {
      this.writer.selection.set({
        start: [0, 5],
        end: [1, 10],
      });
    },

    "Delete selection", function() {
      this.writer.delete();
    },

    "Delete previous character for collapsed (single cursor) selection", function() {
      this.writer.selection.set({
        start: [0, 4],
        end: [0, 4]
      });

      this.writer.delete();
    },

    "Select last three chars of a textnode", function() {
      this.writer.selection.set({
        start: [0, 31],
        end: [0, 34]
      });
      assert.isEqual(3, $('.content-node span.selected').length);
    },

    "Select last char in text node", function() {
      this.writer.selection.set({
        start: [0, 33],
        end: [0, 34]
      });
      assert.isEqual(1, $('.content-node span.selected').length);
    },

    "Position cursor after last char and hit backspace", function() {
      this.writer.selection.set({
        start: [0, 34],
        end: [0, 34]
      });

      // Make sure there's no selection, but a
      // TODO: move check to a shared verifySelection
      // that compares the selection in the model with
      // the DOM equivalent
      assert.isEqual(0, $('.content-node span.selected').length);
      assert.isEqual(1, $('.content-node .cursor').length);

      this.writer.delete();

      assert.isEqual(1, $('.content-node .cursor').length);
      // After delection there must be three remaining chars in the first paragraph
      assert.isEqual(33, $('.content-node:first .content')[0].children.length);
    },


    "Move cursor to previous char", function() {
      this.writer.selection.set({
        start: [1, 30],
        end: [1, 30]
      });

      this.writer.selection.move('left');
      var sel = this.writer.selection;
      assert.isDeepEqual([1,29], sel.start);
      assert.isDeepEqual([1,29], sel.end);
    },

    "Move cursor to next char", function() {
      this.writer.selection.move('right');

      var sel = this.writer.selection;
      assert.isDeepEqual([1,30], sel.start);
      assert.isDeepEqual([1,30], sel.end);
    },

    "Move cursor to next paragraph", function() {
      this.writer.selection.set({
        start: [1, 40],
        end: [1, 40]
      });

      this.writer.selection.move('right');
      var sel = this.writer.selection;
      assert.isDeepEqual([2,0], sel.start);
      assert.isDeepEqual([2,0], sel.end);
    },

    "Move cursor back to prev paragraph", function() {
      this.writer.selection.move('left');
      var sel = this.writer.selection;
      assert.isDeepEqual([1,40], sel.start);
      assert.isDeepEqual([1,40], sel.end);
    },

    "Collapse cursor after multi-char selection", function() {
      this.writer.selection.set({
        start: [1, 18],
        end: [1, 22]
      });
      this.writer.selection.move('right');

      var sel = this.writer.selection;
      assert.isDeepEqual([1,22], sel.start);
      assert.isDeepEqual([1,22], sel.end);
    },

    "Collapse cursor before multi-char selection", function() {
      var sel = this.writer.selection;
      sel.set({
        start: [1, 18],
        end: [1, 24]
      });
      sel.move('left');
      assert.isDeepEqual([1,18], sel.start);
      assert.isDeepEqual([1,18], sel.end);
    },

    "Merge with previous text node", function() {
      var sel = this.writer.selection;
      sel.set([1, 0]);

      this.writer.delete();

      assert.isDeepEqual([0,33], sel.start);
      assert.isDeepEqual([0,33], sel.end);
    },

    // Think pressing enter
    "Split text node at current cursor position (inverse of prev merge)", function() {
      this.writer.insertNode('text');
    },

    "Merge back (revert the text split)", function() {
      this.writer.delete();
    },

    // Think pressing enter in the middle of a sentence
    "Split text node at current cursor position (in-between)", function() {
      this.writer.selection.set({
        start: [1, 5],
        end: [1, 5]
      });
      this.writer.insertNode('text');
    },

    "Split text node at (cusor before first char)", function() {
      // Undo previous split
      this.writer.delete();
      this.writer.selection.set({
        start: [1, 0],
        end: [1, 0]
      });
      this.writer.insertNode('text');
    },

    "Expand selection (to the right)", function() {
      var sel = this.writer.selection;

      // Undo previous split
      sel.set([2, 4]);

      sel.expand('right', 'char');
      sel.expand('right', 'char');
      assert.isEqual(sel.direction, 'right');
      sel.expand('left', 'char');
      assert.isEqual(sel.direction, 'right');
      sel.expand('left', 'char');
      assert.isEqual(sel.direction, null);
      sel.expand('left', 'char');
      assert.isEqual(sel.direction, 'left');
      sel.expand('left', 'char');
    },

    "Move to next word", function() {
      var sel = this.writer.selection;

      // Undo previous split
      sel.set([2, 4]);

      sel.move('right', 'word');
      sel.move('left', 'word');
      sel.move('left', 'word');
      sel.move('left', 'word');
    },

    "Copy selected content", function() {
      this.writer.selection.set({
        start: [2, 3],
        end: [3, 20]
      });

      this.writer.cut();
      var view = this.writer.clipboard.getContent().get('content').nodes;
      assert.isEqual(1, view.length);
    },

    "Paste clipboard content at current selection", function() {
      this.writer.selection.set({
        start: [0, 8],
        end: [0, 8]
      });

      console.log(this.writer.clipboard.getContent());
      this.writer.paste();
      // var view = this.writer.clipboard.getContent().get('content').nodes;
      // assert.isEqual(1, view.length);
    },

    // "Copy selected content", function() {
    //   console.log("TEXT", this.writer.selection.getText());
    //   this.writer.cut();

    //   var view = this.writer.clipboard.getContent().get('content').nodes;
    //   assert.isEqual(1, view.length);
    // }
  ];
};

BasicEditing.prototype = SurfaceTest.prototype;

registerTest(['Surface', 'Basic Editing'], new BasicEditing());
