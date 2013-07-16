(function(root) { "use strict";

  var _ = root._;
  var errors = root.Substance.errors;
  var assert = root.Substance.assert;
  var SurfaceTest = root.Substance.Surface.AbstractTest;
  var registerTest = root.Substance.Test.registerTest;


  // Some example paragraphs
  // --------
  // 

  var P1 = "The quick brown fox jumps over the lazy dog.";
  var P2 = "Pack my box with five dozen liquor jugs";
  var P3 = "Fix problem quickly with galvanized jets";
  var P4 = "Heavy boxes perform quick waltzes and jigs";

  var BasicEditing = function() {
    SurfaceTest.call(this);

    // deactivate the default fixture
    // for testing basic behavior
    this.fixture = function() {};
    
    // this.setDelay(25);

    this.actions = [
      "Insert some text", function() {
        console.log('inserting some text');
        this.insertContent(P1);
      },

      "Insert some more text", function() {
        this.insertContent(P2);
        this.insertContent(P3);
      },

      // Selection API
      // --------

      "Set single cursor", function() {
        this.editor.selection.set({
          start: [1,2],
          end: [1,2]
        });
      },

      "Edge case: Select last char of text node", function() {
        this.editor.selection.set({
          start: [1,39],
          end: [1,39]
        });
      },

      "Insert period after last char", function() {
        this.editor.write(".");
        
        var nodeId = this.editor.get('content').nodes[1];
        var node = this.editor.get(nodeId);
        assert.isEqual(P2+".", node.content);
      },

      "Make a selection", function() {
        this.editor.selection.set({
          start: [0, 5],
          end: [1, 10],
        });
      },

      "Delete selection", function() {
        this.editor.delete();
      },

      "Delete previous character for collapsed (single cursor) selection", function() {
        this.editor.selection.set({
          start: [0, 4],
          end: [0, 4]
        });

        this.editor.delete();
      },

      "Select last three chars of a textnode", function() {
        this.editor.selection.set({
          start: [0, 1],
          end: [0, 4]
        });
        assert.isEqual(3, $('.content-node span.selected').length);
      },

      "Select last char in text node", function() {
        this.editor.selection.set({
          start: [0, 3],
          end: [0, 4]
        });
        assert.isEqual(1, $('.content-node span.selected').length);
      },

      "Position cursor after last char and hit backspace", function() {
        this.editor.selection.set({
          start: [0, 4],
          end: [0, 4]
        });

        // Make sure there's no selection, but a
        // TODO: move check to a shared verifySelection
        // that compares the selection in the modle with 
        // the DOM equivalent
        assert.isEqual(0, $('.content-node span.selected').length);
        assert.isEqual(1, $('.content-node span .cursor').length);

        this.editor.delete();

        assert.isEqual(1, $('.content-node span .cursor').length);
        // After delection there must be three remaining chars in the first paragraph
        assert.isEqual(3, $('.content-node:first .content')[0].children.length);
      },


      // "Move cursor to previous char", function() {
      //   this.document.select({
      //     start: [1, 30],
      //     end: [1, 30]
      //   });
      //   this.document.previous();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([1,29], sel.start);
      //   assert.isDeepEqual([1,29], sel.end);
      // },

      // "Move cursor to next char", function() {
      //   this.document.next();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([1,30], sel.start);
      //   assert.isDeepEqual([1,30], sel.end);
      // },

      // "Move cursor to next paragraph", function() {
      //   this.document.next();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([2,0], sel.start);
      //   assert.isDeepEqual([2,0], sel.end);
      // },

      // "Move cursor back to prev paragraph", function() {
      //   this.document.previous();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([1,30], sel.start);
      //   assert.isDeepEqual([1,30], sel.end);
      // },

      // "Collapse cursor after multi-char selection", function() {
      //   this.document.select({
      //     start: [1, 18],
      //     end: [1, 24]
      //   });
      //   this.document.next();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([1,24], sel.start);
      //   assert.isDeepEqual([1,24], sel.end);
      // },

      // "Collapse cursor before multi-char selection", function() {
      //   this.document.select({
      //     start: [1, 18],
      //     end: [1, 24]
      //   });
      //   this.document.previous();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([1,18], sel.start);
      //   assert.isDeepEqual([1,18], sel.end);
      // },

      // "Merge with previous text node", function() {
      //   this.document.select({
      //     start: [1, 0],
      //     end: [1, 0]
      //   });

      //   this.document.delete();
      //   var sel = this.document.selection;
      //   assert.isDeepEqual([0,3], sel.start);
      //   assert.isDeepEqual([0,3], sel.end);
      // },

      // // Think pressing enter
      // "Split text node at current cursor position (inverse of merge)", function() {
      //   this.document.insertNode('text');
      // },

      // "Merge back (revert the text split)", function() {
      //   this.document.delete();
      // },

      // // Think pressing enter in the middle of a sentence
      // "Split text node at current cursor position (in-between)", function() {
      //   this.document.select({
      //     start: [1, 2],
      //     end: [1, 2]
      //   });        
      //   this.document.insertNode('text');
      // },

      // // Think pressing enter in the middle of a sentence
      // "Split text node at (cusor before first char)", function() {
      //   // Undo previous split
      //   this.document.delete();

      //   this.document.select({
      //     start: [1, 0],
      //     end: [1, 0]
      //   });
      //   this.document.insertNode('text');
      // },

      // Think pressing enter in the middle of a sentence
      // "Expand selection (to the right)", function() {
      //   // Undo previous split
      //   this.document.select({
      //     start: [2, 4],
      //     end: [2, 4]
      //   });

      //   this.document.selection.set({
      //     start: [0,2],
      //     end: [0,4],
      //     // direction: -1
      //   });

      //   this.document.selection.extend('left');
      //   this.document.selection.extend('right');
      //   this.document.selection.move('left');
      //   this.document.selection.move('right');

      //   // if direction = 1 -> expand right bound
      //   // if direction = 0 -> expand right bound, set dir=1
      //   // if direction <- 0 -> expand left bound by one

      //   this.document.selection.expandRight();
      // }
    ];
  };

  BasicEditing.prototype = SurfaceTest.prototype;

  registerTest(['Surface', 'Basic Editing'], new BasicEditing());

})(this);
