"use strict";

// Import
// ========

var Test = require('substance-test');
var assert = Test.assert;
var Document = require("substance-document");
var DocumentSession = Document.Session;
var Container = Document.Container;
var EditorController = require("../src/editor_controller");
var SimpleEditorFactory = require("./editors/simple_editor_factory");
var TestDocument = require("./test_document");

// Test
// ========
// This test should cover basic editing features implementated in the EditorController.
// It works headless i.e., no DOM checks are involved.
// No node specific specialities are checked, but the basic principles.

var BasicEditing = function() {
  Test.call(this);
};

BasicEditing.Prototype = function() {

  // Deactivate the default fixture for testing basic behavior
  this.setup = function() {
    var doc = new TestDocument({seed: require("./fixture")});
    var container = doc.get("content");
    var session = new DocumentSession(container);
    var editorFactory = new SimpleEditorFactory();
    var editor = new EditorController(session, editorFactory);

    this.editor = editor;
    this.session = session;
  };

  this.actions = [

    "Should throw an Error when writing without a selection", function() {
      this.setup();

      this.session.selection.clear();

      assert.exception(EditorController.EditingError, function() {
        this.editor.write("bla");
      }, this);
    },

    "Insert text into a plain text node", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var insertPos = 3;
      var insertedText = "bla";
      var expected = text.substring(0, insertPos) + insertedText + text.substring(insertPos);

      this.session.selection.set([1, insertPos]);
      this.editor.write(insertedText);

      assert.isEqual(expected, t1.content);
    },

    "Insert text at position 0", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var insertPos = 0;
      var insertedText = "bla";
      var expected = insertedText + text;

      this.session.selection.set([1, insertPos]);
      this.editor.write(insertedText);

      assert.isEqual(expected, t1.content);
    },

    "Insert text at last position", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var insertPos = text.length;
      var insertedText = "bla";
      var expected = text + insertedText;

      this.session.selection.set([1, insertPos]);
      this.editor.write(insertedText);

      assert.isEqual(expected, t1.content);
    },

    "Delete a single character", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var deletePos = 3;
      var expected = text.substring(0, deletePos) + text.substring(deletePos+1);

      this.session.selection.set({start: [1, deletePos], end: [1, deletePos+1]});
      this.editor.delete();

      assert.isEqual(expected, t1.content);
    },

    "Delete a single character (expand right)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var deletePos = 3;
      var expected = text.substring(0, deletePos) + text.substring(deletePos+1);

      this.session.selection.set([1, deletePos]);
      this.editor.delete('right');

      assert.isEqual(expected, t1.content);
    },

    "Delete a single character (expand left)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var text = t1.content;

      var deletePos = 3;
      var expected = text.substring(0, deletePos-1) + text.substring(deletePos);

      this.session.selection.set([1, deletePos]);
      this.editor.delete('left');

      assert.isEqual(expected, t1.content);
    },

    "Delete across node boundary (join nodes)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t2 = doc.get("t2");
      var text1 = t1.content;
      var text2 = t2.content;

      var charPos = 10;
      var expected = text1.substring(0, charPos) + text2.substring(charPos);

      this.session.selection.set({start: [1, charPos], end: [2, charPos]});
      this.editor.delete();

      assert.isEqual(expected, t1.content);
      assert.isUndefined(doc.get("t2"));
    },

    "Back-Delete at position 0 (join nodes)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t2 = doc.get("t2");
      var text1 = t1.content;
      var text2 = t2.content;

      var expected = text1 + text2;

      this.session.selection.set([2, 0]);
      this.editor.delete('left');

      assert.isEqual(expected, t1.content);
      assert.isUndefined(doc.get("t2"));
    },

    "Delete single character at last position (join nodes)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t2 = doc.get("t2");
      var text1 = t1.content;
      var text2 = t2.content;

      var expected = text1 + text2;

      this.session.selection.set([1, text1.length]);
      this.editor.delete('right');

      assert.isEqual(expected, t1.content);
      assert.isUndefined(doc.get("t2"));
    },

    "Join Heading and Text (append to heading)", function() {
      this.setup();

      var doc = this.session.document;
      var h1 = doc.get("h1");
      var t1 = doc.get("t1");
      var text1 = h1.content;
      var text2 = t1.content;

      var expected = text1 + text2;

      this.session.selection.set([0, text1.length]);
      this.editor.delete('right');

      assert.isEqual(expected, h1.content);
      assert.isUndefined(doc.get("t1"));
      assert.isEqual("heading", h1.type);
    },

    "Muli-node delete (Partial/Partial)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t2 = doc.get("t2");
      var text1 = t1.content;
      var text2 = t2.content;

      var charPos = 10;
      var expected = text1.substring(0,charPos) + text2.substring(charPos);

      this.session.selection.set({start: [1, charPos], end: [2, charPos]});
      this.editor.delete();

      assert.isEqual(expected, t1.content);
      assert.isDefined(doc.get("t1"));
      assert.isUndefined(doc.get("t2"));
    },

    // should delete the first and trim the second
    "Muli-node delete (Full/Partial)", function() {
      this.setup();

      var doc = this.session.document;
      var t2 = doc.get("t2");
      var text2 = t2.content;

      var charPos = 10;
      var expected = text2.substring(charPos);

      this.session.selection.set({start: [1, 0], end: [2, charPos]});

      this.editor.delete();

      assert.isEqual(expected, t2.content);
      assert.isUndefined(doc.get("t1"));
      assert.isDefined(doc.get("t2"));
    },

    // should delete both
    "Muli-node delete (Full/Full)", function() {
      this.setup();

      var doc = this.session.document;
      var t2 = doc.get("t2");
      var text2 = t2.content;

      this.session.selection.set({start: [1, 0], end: [2, text2.length]});

      this.editor.delete();

      assert.isUndefined(doc.get("t1"));
      assert.isUndefined(doc.get("t2"));
    },

    // should delete second
    "Muli-node delete (Partial/Full)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t2 = doc.get("t2");
      var text1 = t1.content;
      var text2 = t2.content;

      var charPos = 10;
      var expected = text1.substring(0, charPos);

      this.session.selection.set({start: [1, charPos], end: [2, text2.length]});

      this.editor.delete();

      assert.isEqual(expected, t1.content);
      assert.isDefined(doc.get("t1"));
      assert.isUndefined(doc.get("t2"));
    },

    "Muli-node delete (Partial/Full/Full/Partial)", function() {
      this.setup();

      var doc = this.session.document;
      var t1 = doc.get("t1");
      var t3 = doc.get("t3");
      var text1 = t1.content;
      var text3 = t3.content;

      var charPos = 10;
      var expected = text1.substring(0, charPos) + text3.substring(charPos);

      this.session.selection.set({start: [1, charPos], end: [4, charPos]});

      this.editor.delete();

      assert.isEqual(expected, t1.content);
      assert.isDefined(doc.get("t1"));
      assert.isUndefined(doc.get("t2"));
      assert.isUndefined(doc.get("h2"));
      assert.isUndefined(doc.get("t3"));
    },

    // This should delete the selection and insert the text.
    "Write over a selection (single node / partial)", function() {
      this.setup();

      var doc = this.session.document;

      var t1 = doc.get("t1");
      var text1 = t1.content;
      var insertedText = "bla";

      var charPos = 10;
      this.session.selection.set({start: [1, charPos], end: [1, charPos+3]});
      this.editor.write(insertedText);

      var expected = text1.substring(0, charPos) + insertedText + text1.substring(charPos+3);
      assert.isEqual(expected, t1.content);
    },

    // should delete the selection and insert the text.
    "Write over a selection (multi-nodes)", function() {

      this.setup();
      var doc = this.session.document;

      var t1 = doc.get("t1");
      var t3 = doc.get("t3");
      var text1 = t1.content;
      var text3 = t3.content;
      var insertedText = "bla";

      var charPos = 10;
      this.session.selection.set({start: [1, charPos], end: [4, charPos]});
      this.editor.write(insertedText);

      var expected = text1.substring(0, charPos) + insertedText + text3.substring(charPos);
      assert.isEqual(expected, t1.content);
      assert.isDefined(doc.get("t1"));
      assert.isUndefined(doc.get("t2"));
      assert.isUndefined(doc.get("h2"));
      assert.isUndefined(doc.get("t3"));
    },

    "Break a text node"
  ];
};
BasicEditing.Prototype.prototype = Test.prototype;
BasicEditing.prototype = new BasicEditing.Prototype();

Test.registerTest(['Substance.Surface', 'Basic Editing'], new BasicEditing());
