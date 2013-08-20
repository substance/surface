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

// TODO: Rewrite. Surface tests must be more surface oriented.

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
      this.doc.selection.set({
        start: [1,2],
        end: [1,2]
      });
    },

    "Edge case: Select last char of text node", function() {
      this.doc.selection.set({
        start: [1,39],
        end: [1,39]
      });
    },

    "Insert period after last char", function() {
      this.doc.write(".");

      var nodeId = this.doc.get('content').nodes[1];
      var node = this.doc.get(nodeId);
      assert.isEqual(P2+".", node.content);

      // TODO: check surface
    },

    "Make a selection", function() {
      this.doc.selection.set({
        start: [0, 5],
        end: [1, 10],
      });

      // TODO: check surface
    },

    "Delete selection", function() {
      this.doc.selection.set({
        start: [0, 5],
        end: [1, 10],
      });

      this.doc.delete();

      // TODO: check surface
    },

    "Delete previous character for collapsed (single cursor) selection", function() {
      this.doc.selection.set([0, 4]);

      this.doc.delete();

      // TODO: check surface
    },

    "Select last three chars of a textnode", function() {
      this.doc.selection.set({
        start: [0, 31],
        end: [0, 34]
      });

      var expected = this.doc.get("text_1").content.substring(31, 34);
      var actual = window.getSelection().toString();

      assert.isEqual(expected, actual);
    },

    "Select last char in text node", function() {
      this.doc.selection.set({
        start: [0, 33],
        end: [0, 34]
      });

      var expected = this.doc.get("text_1").content.substring(33, 34);
      var actual = window.getSelection().toString();

      assert.isEqual(expected, actual);
    },

    "Position cursor after last char and hit backspace", function() {
      this.doc.selection.set([0, 34]);

      assert.isTrue(window.getSelection().isCollapsed);
      // Note: delete() ~= backspace ... i.e., delete('left')
      this.doc.delete("left");

      this.verifyTextNodeContent("text_1");
    },

/*
    // // TODO: like this, it is not a surface test
    // "Move cursor to previous char", function() {
    //   this.doc.selection.set([1, 30]);

    //   this.doc.selection.move('left', 'char');
    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([1,29], range.start);
    //   assert.isDeepEqual([1,29], range.end);
    // },

    // // TODO: like this, it is not a surface test
    // "Move cursor to next char", function() {
    //   this.doc.selection.set([1, 29]);

    //   this.doc.selection.move('right');

    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([1,30], range.start);
    //   assert.isDeepEqual([1,30], range.end);
    // },

    // // TODO: like this, it is not a surface test
    // "Move cursor to next paragraph", function() {
    //   this.doc.selection.set([1, 40]);

    //   this.doc.selection.move('right');

    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([2,0], range.start);
    //   assert.isDeepEqual([2,0], range.end);
    // },

    // // TODO: like this, it is not a surface test
    // "Move cursor back to prev paragraph", function() {
    //   this.doc.selection.set([2, 0]);

    //   this.doc.selection.move('left');

    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([1,40], range.start);
    //   assert.isDeepEqual([1,40], range.end);
    // },

    // // TODO: like this, it is not a surface test
    // "Collapse cursor after multi-char selection", function() {
    //   this.doc.selection.set({
    //     start: [1, 18],
    //     end: [1, 22]
    //   });

    //   this.doc.selection.move('right');

    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([1,22], range.start);
    //   assert.isDeepEqual([1,22], range.end);
    // },

    // // TODO: like this, it is not a surface test
    // "Collapse cursor before multi-char selection", function() {
    //   this.doc.selection.set({
    //     start: [1, 18],
    //     end: [1, 24]
    //   });

    //   this.doc.selection.move('left');

    //   var range = this.doc.selection.range();
    //   assert.isDeepEqual([1,18], range.start);
    //   assert.isDeepEqual([1,18], range.end);
    // },

    "Merge with previous text node", function() {
      var sel = this.doc.selection;
      sel.set([1, 0]);

      this.doc.delete();

      this.verifyTextNodeContent("text_1");
    },

    // Think pressing enter
    "Split text node at current cursor position (inverse of prev merge)", function() {
      this.doc.insertNode('text');
    },

    "Merge back (revert the text split)", function() {
      this.doc.delete();
    },

    // Think pressing enter in the middle of a sentence
    "Split text node at current cursor position (in-between)", function() {
      this.doc.selection.set({
        start: [1, 5],
        end: [1, 5]
      });
      this.doc.insertNode('text');
    },

    "Split text node at (cusor before first char)", function() {
      // Undo previous split
      this.doc.delete();
      this.doc.selection.set({
        start: [1, 0],
        end: [1, 0]
      });
      this.doc.insertNode('text');
    },

    "Expand selection (to the right)", function() {
      var sel = this.doc.selection;

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
      var sel = this.doc.selection;

      // Undo previous split
      sel.set([2, 4]);

      sel.move('right', 'word');
      sel.move('left', 'word');
      sel.move('left', 'word');
      sel.move('left', 'word');
    },

    "Copy selected content", function() {
      this.doc.selection.set({
        start: [2, 3],
        end: [3, 20]
      });

      this.doc.cut();
      var view = this.doc.clipboard.getContent().get('content').nodes;
      assert.isEqual(1, view.length);
    },

    "Paste clipboard content at current selection", function() {
      this.doc.selection.set({
        start: [0, 8],
        end: [0, 8]
      });

      console.log(this.doc.clipboard.getContent());
      this.doc.paste();
      // var view = this.doc.clipboard.getContent().get('content').nodes;
      // assert.isEqual(1, view.length);
    },
*/
    // "Copy selected content", function() {
    //   console.log("TEXT", this.doc.selection.getText());
    //   this.doc.cut();

    //   var view = this.doc.clipboard.getContent().get('content').nodes;
    //   assert.isEqual(1, view.length);
    // }
  ];
};

BasicEditing.prototype = SurfaceTest.prototype;

registerTest(['Surface', 'Basic Editing'], new BasicEditing());
