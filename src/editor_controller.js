"use strict";

var _ = require("underscore");
var util = require("substance-util");
var SurfaceController = require("./surface_controller");

var errors = util.errors;
var EditingError = errors.define("EditingError");


// A Controller that makes Nodes and a Document.Container editable
// ========
//
// This editor is tailored to a very simple use-case: documents that consist only
// of Text, Headings, and Lists. These nodes are presented in a flow and
// editing is similar as it is known from GDocs or Microsoft Word,
// and not structurally as in earlier Substance versions
// or known from other Web-based editors (e.g. medium.com).
// By providing a custom factory for Node editors it is possible
// to control what and how the content is editable.

var EditorController = function(documentSession, editorFactory) {
  this.session = documentSession;
  this.editorFactory = editorFactory;
  this.editors = {};
};

EditorController.Prototype = function() {

  _.extend(this, util.Events);

  this.isEditor = function() {
    return true;
  };

  this.dispose = function() {
    this.session.dispose();
  };

  // Insert text at the current position
  // --------
  // The selection must not be null otherwise an EditingError is thrown.

  this.write = function(text) {
    var selection = this.session.selection;
    if (selection.isNull()) {
      throw new EditingError("Can not write, the current position is not valid.");
    }
    // var timer = util.startTimer();

    var session = this.startTransaction();
    // console.log("EditorController.write(): Time for creating transaction", timer.stop());

    if (this._write(session, text)) {
      session.save();
      // console.log("EditorController.write(): Time applying change", timer.stop());
      selection.set(session.selection);
      this._afterEdit();
      // console.log("EditorController.write(): Time for aftermath", timer.stop());
    }

    // console.log("EditorController.write(): total time", timer.total());
  };

  // Delete current selection
  // --------
  //

  this.delete = function(direction) {
    var session = this.startTransaction();
    var sel = session.selection;

    // Note: ignoring an invalid selection
    if (sel.isNull()) return;

    if (sel.isCollapsed()) {
      sel.expand(direction, "char");
    }

    if (_deleteSelection(this, session)) {
      session.save();
      this.session.selection.set(sel);
      this._afterEdit();
    }
  };

  // Insert a break at the current position
  // --------
  // executed when pressing RETURN within a node.

  this.breakNode = function() {
    var selection = this.session.selection;
    if (selection.isNull()) {
      console.error("Can not break, as no position has been selected.");
      return;
    }
    var session = this.startTransaction();

    if (_breakNode(this, session)) {
      session.save();
      selection.set(session.selection);
      this._afterEdit();
    }
  };

  // Behaviors triggered by using `tab` and `shift+tab`.
  // --------
  //
  // Headings and List items can change the level. Text nodes insert a certain amount of spaces.
  //
  // Arguments:
  //  - `direction`: `right` or `left` (default: `right`)
  //

  this.indent = function(direction) {
    var selection = this.session.selection;
    if (selection.isNull()) {
      console.error("Nothing is selected.");
      return;
    }

    if (selection.hasMultipleNodes()) {
      console.error("Indenting Multi-Node selection is not supported yet.");
      return;
    }

    var session = this.startTransaction();
    var sel = session.selection;

    var cursor = sel.getCursor();
    var pos = cursor.pos;

    var node = session.container.getRootNodeFromPos(pos);
    var component = session.container.getComponent(pos);
    var editor = _getEditor(this, node);

    if (!editor.canIndent(session, component, direction)) {
      console.log("Can not indent at the given position.");
      return;
    }

    editor.indent(session, component, direction);
    session.save();
    this._afterEdit();
  };

  // Copy the current selection
  // --------
  //
  // Returns the cutted content as a new document

  this.copy = function() {
    var selection = this.session.selection;

    if (selection.isNull()) {
      return null;
    }

    var nodeSelections = selection.getNodeSelections();
    var content = this.session.document.newInstance();
    var editor;

    for (var i = 0; i < nodeSelections.length; i++) {
      var nodeSelection = nodeSelections[i];
      editor = _getEditor(this, nodeSelection.node);
      // do not copy empty nodes
      if (nodeSelection.ranges.length > 0 && nodeSelection.ranges[0].getLength() > 0) {
        editor.copy(nodeSelection, content);
      }
    }

    return content;
  };

  // Cut current selection from document
  // --------
  //

  this.cut = function() {
    console.log("I am sorry. Currently disabled.");
  };

  // Paste content from clipboard at current position
  // --------
  //

  this.paste = function(content, plainText) {
    if (this.session.selection.isNull()) {
      console.error("Can not paste, as no position has been selected.");
      return;
    }

    var session = this.startTransaction();
    var doc = session.document;
    var container = session.container;
    var selection = session.selection;

    // it is rather tricky to specify when to break and join after paste
    // TODO: specify several usecases and design the implementation

    // For now a rather stupid version (no joining)

    // TODO: what to do with nodes that implement a soft-break instead of a break?
    // E.g., CodeBlock, ListItem?
    if (!selection.isCollapsed()) {
      if (!_deleteSelection(this, session)) {
        console.log("Could not delete the selected content");
        return false;
      }
    }

    // if we can't break at the current position we fall back to plain text
    var beforePos = session.selection.cursor.pos;
    var beforeCharPos = session.selection.cursor.charPos;
    if (!_breakNode(this, session)) {
      if (!this._write(session, plainText)) {
        console.error("Can not paste at the given position.");
        return;
      } else {
        selection.set([beforePos, beforeCharPos + plainText.length]);
        session.save();
        this.selection.set(selection);
        return;
      }
    }

    // pruning empty nodes created by the _breakNode above
    // TODO: IMO it is not possible to implement this in a generalized way
    // Instead the node editors should be involved in that.
    var afterPos = selection.cursor.pos;
    var after = container.getComponent(afterPos);
    // Attention: for inserting we need the node position (in contrast to component position)
    var insertPos = after.rootPos;
    if (after.length === 0) {
      doc.hide(container.name, after.root.id);
      doc.delete(after.root.id);
    }
    var before = container.getComponent(beforePos);
    if (before.length === 0) {
      doc.hide(container.name, before.root.id);
      doc.delete(before.root.id);
      insertPos--;
    }

    // transfer nodes from content document
    // TODO: transfer annotations
    var nodeIds = content.get("content").nodes;
    var annoIndex = content.getIndex('annotations');
    for (var i = 0; i < nodeIds.length; i++) {
      var nodeId = nodeIds[i];
      var node = content.get(nodeId).toJSON();
      // create a new id if the node exists already
      if (doc.get(nodeId)) {
        node.id = util.uuid(node.type);
      }
      doc.create(node);
      doc.show(container.name, node.id, insertPos++);

      // EXPERIMENTAL also transfer annotations
      // what about nodes that are referenced by annotations?
      // TODO: we need to solve this properly in substance-next
      var annos = annoIndex.get(nodeId);
      for (var id in annos) {
        var anno = annos[id];
        if (node.id !== nodeId) {
          anno.path[0] = node.id;
        }
        if (doc.get(anno.id)) {
          anno.id = util.uuid(anno.type);
        }
        doc.create(anno.toJSON());
      }
    }
    var last = container.getComponent(insertPos-1);
    selection.set([last.pos, last.length]);

    session.save();
    this.session.selection.set(selection);
  };

  this.undo = function() {
    if (!this.session.document.chronicle) return;
    var op = this.session.document.chronicle.rewind();

    if (op && op.data) {
      var data = op.data.before;
      if (data.container === this.session.container.name) {
        this.session.selection.set(data.sel);
      }
    }
  };

  this.redo = function() {
    if (!this.session.document.chronicle) return;
    var op = this.session.document.chronicle.forward();

    if (op && op.data) {
      var data = op.data.after;
      if (data.container === this.session.container.name) {
        this.session.selection.set(data.sel);
      }
    }
  };

  // Create an annotation of given type for the current selection
  // --------
  //
  this.annotate = function(type, data) {
    var selection = this.session.selection;
    if (selection.isNull()) {
      throw new Error("Nothing selected.");
    }
    if (selection.hasMultipleNodes()) {
      throw new Error("Can only annotate within a single node/component.");
    }
    if (selection.isCollapsed()) {
      // nothing to do
      return;
    }
    var session = this.startTransaction();
    this._annotate(session, type, data);
    session.save();
    this.session.selection.set(session.selection);
    this._afterEdit();
  };

  this.toggleAnnotation = function(type, data) {
    var annos = this.session.annotator.getAnnotations(this.session.selection);
    var anno = null;
    for(var id in annos) {
      if (annos.hasOwnProperty(id)) {
        if (annos[id].type === type) {
          anno = annos[id];
          break;
        }
      }
    }
    if (!anno) {
      this.annotate(type, data);
    } else {
      this.deleteAnnotation(anno.id);
    }
  };

  // This deactivates an annotation
  // ----
  //
  this.deleteAnnotation = function(nodeId) {
    var doc = this.session.document;
    var annotation = doc.get(nodeId);
    var component = this.session.container.lookup(annotation.path);

    doc.delete(nodeId);
    // To allow easy toggling back we will set the selection
    // to the annotated range afterwards.
    this.session.selection.set({
      start: [component.pos, annotation.range[0]],
      end:   [component.pos, annotation.range[1]]
    });

    this._afterEdit();
  };

  // TODO: there is a canInsertNode+insertNode API provided by the ViewEditor which should be used here.
  this.canInsertNode = function() {
    var selection = this.session.selection;
    var container = this.session.container;

    if (selection.isNull()) {
      return false;
    }

    var cursorPos = selection.range().start;
    var pos = cursorPos[0];
    var charPos = cursorPos[1];

    var component = container.getComponent(pos);
    var node = component.root;
    var editor = _getEditor(this, node);

    return editor.canBreak(this.session, component, charPos);
  };

  // TODO: there is a canInsertNode+insertNode API provided by the ViewEditor which should be used here.
  this.insertNode = function(type, data) {
    var selection = this.session.selection;
    if (selection.isNull()) {
      throw new Error("Selection is null!");
    }

    var session = this.startTransaction();

    var newNode = {
      id: type + "_" +util.uuid(),
      type: type
    };
    if (data) {
      _.extend(newNode, data);
    }

    if (_insertNode(this, session, newNode)) {
      session.save();
      this.session.selection.set(session.selection);
      this._afterEdit();
    }
  };

  this.changeType = function(newType, data) {
    // console.log("EditorController.changeType()", newType, data);
    var selection = this.session.selection;
    if (selection.isNull()) {
      console.error("Nothing selected.");
      return;
    }
    if (selection.hasMultipleNodes()) {
      console.error("Can not switch type of multiple nodes.");
      return;
    }

    var session = this.startTransaction();

    if (this._changeType(session, newType, data)) {
      session.save();
      this.session.selection.set(session.selection);

      this._afterEdit();
    }
  };

  this._changeType = function(session, newType, data) {

    var pos = session.selection.start[0];
    var component = session.container.getComponent(pos);
    var node = component.root;
    var editor = _getEditor(this, node);

    if (!editor.canChangeType(session, node, newType)) {
      return false;
    }

    editor.changeType(session, node, component, newType, data);
    this.ensureLastNode(session);

    return true;
  };

  this.select = function(mode) {
    var selection = this.session.selection;
    if (selection.isNull()) {
      console.error("Nothing selected.");
      return;
    }

    var container = this.session.container;
    var pos = selection.cursor.pos;
    var component = container.getComponent(pos);

    if (mode === "all") {
      var components = container.getNodeComponents(component.root.id);
      var first = components[0];
      var last = components[components.length-1];
      selection.set({start: [first.pos, 0], end: [last.pos, last.length]});
    } else {
      console.error("Unsupported selection mode:", mode);
    }
  };

  this.focus = function() {
    this.session.selection.set(this.session.selection);
  };

  this.startTransaction = function() {
    return this.session.startSimulation();
  };

  var _insertNode = function(self, session, newNode) {
      var sel = session.selection;

      // if the selection is expanded then delete first
      // Note: this.__deleteSelection collapses the session cursor.
      if (!sel.isCollapsed()) {
        if (!_deleteSelection(self, session)) {
          console.log("Could not delete the selected content");
          return false;
        }
      }

      // HACK: trying to solve an issue with insertNode,
      // which delegates to _breakNode.
      // However, these two cases are not the same when the cursor is at the end of
      // Note: need to update the charPos as the deletion may have changed the cursor
      var cursor = sel.getCursor();
      var pos = cursor.pos;
      var charPos = cursor.charPos;
      var component = session.container.getComponent(pos);

      var cursorPos, nodePos;

      // Note: we have a special treatment here for the case that the cursor is at the end
      // of a component.
      // Then no node-break is necessary and the new node can be inserted right
      // after the current
      if (charPos < component.length) {
        var couldBreak = _breakNode(self, session);
        if (!couldBreak) {
          return false;
        }
        cursorPos = sel.range().start;
        nodePos = session.container.getNodePos(cursorPos[0]);
      } else {
        cursorPos = sel.range().start;
        nodePos = session.container.getNodePos(cursorPos[0]) + 1;
      }

      session.document.create(newNode);
      session.document.show(session.view, newNode.id, nodePos);

      self.ensureLastNode(session);

      // set the cursor after the inserted node
      sel.set(session.container.after(newNode.id));

      return true;
  };

  this._insertNode = function(session, newNode) {
    return _insertNode(this, session, newNode);
  };

  // HACK: this should be created dynamically...
  var _allowedActions = [
    {
      action: "createNode",
      type: "heading",
      data: {
        level: 1
      }
    },
    {
      action: "createNode",
      type: "figure",
      data: {
      }
    },
    {
      action: "createNode",
      type: "code_block",
      data: {
      }
    }
  ];

  util.freeze(_allowedActions);

  this.getAllowedActions = function() {
    // TODO: When cursor is within a figure caption, do not allow
    // figure insertion etc.
    if (this.canInsertNode()) {
      return _allowedActions;
    } else {
      return [];
    }
  };

  this.ensureLastNode = function(session) {
    var viewEditor = _getEditor(this, {type: "view", id: session.container.name});
    if (viewEditor.ensureLastNode) viewEditor.ensureLastNode(session);
  };


  // Private/Internal functions
  // ........

  this._annotate = function(session, type, data) {
    var selRange = session.selection.range();
    var pos = selRange.start[0];
    var range = [selRange.start[1], selRange.end[1]];

    var node = session.container.getRootNodeFromPos(pos);
    var component = session.container.getComponent(pos);
    var editor = _getEditor(this, node);

    if (!editor.canAnnotate(session, component, type, range)) {
      console.log("Can not annotate component", component);
      return;
    }
    editor.annotate(session, component, type, range, data);

    session.selection.set(selRange);
  };

  this._afterEdit = function() {
    var doc = this.session.document;
    // setting a 'master' reference to the current state
    if (doc.chronicle) {
      doc.chronicle.mark("master");
    }
    this.trigger("document:edited");
  };

  var _getEditor = function(self, node) {
    if (!self.editors[node.id]) {
      self.editors[node.id] = self.editorFactory.createEditor(node);
    }
    return self.editors[node.id];
  };

  this._write = function(session, text) {
    var sel = session.selection;
    var self = this;

    // if the selection is expanded then delete first
    // Note: this.__deleteSelection collapses the session cursor.
    if (!sel.isCollapsed()) {
      if (!_deleteSelection(self, session)) {
        console.log("Could not delete the selected content");
        return false;
      }
    }

    var cursor = sel.getCursor();
    var pos = cursor.pos;
    var charPos = cursor.charPos;

    var node = session.container.getRootNodeFromPos(pos);
    var component = session.container.getComponent(pos);
    var editor = _getEditor(self, node);

    if (!editor.canInsertContent(session, component, charPos)) {
      console.log("Can not insert at the given position.");
      return false;
    }

    // Ask for an operation and abort if no operation is given.
    editor.insertContent(session, component, charPos, text);

    // update the cursor
    sel.set([pos, charPos + text.length]);

    return true;
  };

  var _breakNode = function(self, session) {
    var sel = session.selection;
    var cursorPos = sel.range().start;
    var pos = cursorPos[0];
    var charPos = cursorPos[1];

    var component = session.container.getComponent(pos);
    var node = session.container.getRootNodeFromPos(pos);

    // Get the editor and ask for permission to break the node at the given position
    var editor = _getEditor(self, node);
    if (!editor.canBreak(session, component, charPos)) {
      return false;
    }

    // if the selection is expanded then delete first
    // Note: this.__deleteSelection collapses the session cursor.
    if (!sel.isCollapsed()) {
      if (!_deleteSelection(self, session)) {
        console.log("Could not delete the selected content");
        return false;
      }
    }

    // Note: need to update the charPos as the deletion may have changed the cursor
    charPos = sel.getCursor().charPos;

    // Let the editor apply operations to break the node
    editor.breakNode(session, component, charPos);

    return true;
  };

  var _deleteSelection = function(self, session) {
    var sel = session.selection;

    // after deleting the cursor shall be
    // at the left bound of the selection
    var newPos = sel.range().start;
    var success;

    if (sel.hasMultipleNodes()) {
      success = _deleteMulti(self, session);
    } else {
      var pos = sel.start[0];
      var component = session.container.getComponent(pos);
      success = _deleteSingle(self, session, component);
    }

    if (!success) {
      return false;
    }

    self.ensureLastNode(session);

    // Edge case: if the tail of the document is selected and all nodes
    // are selected fully, the old position does not exist afterwards
    // and the updated last position must be selected
    if (session.container.getLength() <= newPos[0]) {
      sel.set(session.container.getLastCoor());
    } else {
      sel.set(newPos);
    }

    return true;
  };

  var _deleteSingle = function(self, session, component) {
    var sel = session.selection;
    var node = session.container.getRootNodeFromPos(component.pos);

    var startChar = sel.startChar();
    var endChar = sel.endChar();
    var editor = _getEditor(self, node);

    // Check if the editor allows to delete
    if (!editor.canDeleteContent(session, component, startChar, endChar)) {
      console.log("Can not delete content", node.type, startChar, endChar);
      return false;
    }

    editor.deleteContent(session, component, startChar, endChar);
    return true;
  };

  // Note: with the new `component` concept we have to address this in a different way.
  // I.e., a node might be represented by multiple components and not all of them are selected.
  // If a node is fully selected then we can try to delete it from the view,
  // otherwise the node must support partial deletion.
  // TODO: try to stream-line this implementation.
  var _deleteMulti = function(self, session) {
    var container = session.container;

    var i, r, node, nodeSelection;
    // collect information about deletions during the check
    var cmds = [];
    var viewEditor = _getEditor(self, {type: "view", id: container.name});

    var nodeSelections = session.selection.getNodeSelections();
    var first = nodeSelections[0];
    var last = nodeSelections[nodeSelections.length-1];

    // Preparation: check that all deletions can be applied and
    // prepare commands for an easy deletion
    for (i = 0; i < nodeSelections.length; i++) {
      nodeSelection = nodeSelections[i];
      node = nodeSelection.node;
      var canDelete;
      var editor;


      // if it is a full selection schedule a command to delete the node
      var isFull = nodeSelection.isFull();

      // HACK: if the last is an empty node it will show always as fully selected
      // In that case it should remain only if the first one is fully selected.
      if (isFull && nodeSelection === last && first.isFull() &&
          nodeSelection.ranges.length === 1 &&
          nodeSelection.ranges[0].component.length === 0) {
        isFull = false;
      }

      if (isFull) {
        editor = viewEditor;
        canDelete = editor.canDeleteNode(session, node);
        cmds.push({type: "node", editor: editor, node: node});

        if (!canDelete) {
          // TODO: we need add a mechanism to provide a feedback about that, e.g., so that the UI can display some
          // kind of messsage
          console.log("Can't delete node:", node);
          return false;
        }
      }
      // otherwise schedule a command for trimming the node for each of the
      // node's component.
      else {
        editor = _getEditor(self, node);

        for (var j=0; j<nodeSelection.ranges.length; j++) {
          r = nodeSelection.ranges[j];
          canDelete = editor.canDeleteContent(session, r.component, r.start, r.end);
          cmds.push({type: "content", editor: editor, range: r});

          if (!canDelete) {
            console.log("Can't delete component:", r.component);
            return false;
          }
        }
      }
    }

    // If the first and the last selected node have been partially selected
    // then we will try to join these nodes
    var doJoin = (first && first.isPartial() &&
                  last && last.isPartial());

    // Perform the deletions

    // ATTENTION: we have to perform the deletions in inverse order so that the node positions remain valid
    for (i = cmds.length - 1; i >= 0; i--) {
      var cmd = cmds[i];

      if (cmd.type === "content") {
        r = cmd.range;
        cmd.editor.deleteContent(session, r.component, r.start, r.end);
      } else {
        node = cmd.node;
        cmd.editor.deleteNode(session, node);
        // TODO: in theory it might be possible that nodes are referenced somewhere else
        // however, we do not yet consider such situations and delete the node instantly
        session.document.delete(node.id);
      }
    }

    // ATTENTION: after this point the range objects are invalid as some components may have been deleted

    // Perform a join
    if (doJoin) {
      _join(self, session, first.node, last.node);
    }

    return true;
  };

  var _join = function(self, session, first, second) {

    var nodeEditor = _getEditor(self, first);
    var viewEditor = _getEditor(self, {type: "view", id: session.container.name});

    if (!nodeEditor.canJoin(session, first, second)) {
      return false;
    }

    if (!viewEditor.canDeleteNode(session, second)) {
      return false;
    }

    nodeEditor.join(session, first, second);
    viewEditor.deleteNode(session, second);
    session.document.delete(second.id);

    return true;
  };

};

EditorController.Prototype.prototype = SurfaceController.prototype;
EditorController.prototype = new EditorController.Prototype();


Object.defineProperties(EditorController.prototype, {
  "selection": {
    get: function() {
      return this.session.selection;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "annotator": {
    get: function() {
      return this.session.annotator;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "container": {
    get: function() {
      return this.session.container;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "document": {
    get: function() {
      return this.session.document;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "view": {
    get: function() {
      // TODO: 'view' is not very accurate as it is actually the name of a view node
      // Beyond that 'view' as a node type is also confusing considering the Views.
      // console.log("TODO: rename this property.");
      return this.session.container.name;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  }
});

EditorController.EditingError = EditingError;
module.exports = EditorController;
