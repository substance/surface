"use strict";

var TextNodeEditor = require("./text_node_editor");
var Operator = require('substance-operator');
var ObjectOperation = Operator.ObjectOperation;
var TextOperation = Operator.TextOperation;
var util = require("substance-util");


var HeadingEditor = function(factory) {
  this.factory = factory;
  this.breakType = "text";
};

HeadingEditor.Prototype = function() {

  this.breakNode = function(session, component, charPos) {
    var node = component.root;
    var text = node.content;
    var nodePos = component.rootPos;

    var newNode = {
      id: util.uuid()
    };

    var insertPos;

    // Create a new heading node if the cursor is at the beginning of the current node
    // Note: this behavior is inspired by LibreOffice Writer.
    if (charPos === 0 && node.content.length > 0) {
      newNode.type = "heading";
      newNode.level = node.level;
      newNode.content = "";
      insertPos = nodePos;
    }

    // Break the heading and put the tail into a text node
    else {
      var tail = text.substring(charPos);

      newNode.type = "text";
      newNode.content = tail;

      // trim the tail
      session.document.apply(ObjectOperation.Update([node.id, "content"], TextOperation.Delete(charPos, tail), "string"));
      insertPos = nodePos+1;
    }

    // create the node
    session.document.apply(ObjectOperation.Create([newNode.id], newNode));
    // transfer annotations
    session.annotator.transferAnnotations(node, charPos, newNode);
    // and show in the view
    session.document.show(session.view, newNode.id, insertPos);

    session.selection.set([component.pos+1,0]);
  };

  this.canChangeType = function(session, node, newType) {
    return (newType === "text" || newType === "heading");
  };

  this.changeType = function(session, node, nodePos, newType, data) {
    // Nothing to change in that case
    if (node.type === newType && node.level === data.level) {
      return;
    }

    var newNode = {
      id: util.uuid(),
      type: newType
    };
    switch (newType) {
    case "list":
      throw new Error("Not yet implemented, sorry.");
    case "text":
      newNode.content = node.content;
      break;
    case "heading":
      if (node.type === newType) {
        session.document.apply(ObjectOperation.Set([node.id, "level"], node.level, data.level));
        return;
      } else {
        newNode.content = node.content;
        newNode.level = data.level;
        break;
      }
    }
    session.document.hide(session.view, node.id);
    session.document.apply(ObjectOperation.Create([newNode.id], newNode));
    session.annotator.transferAnnotations(node, 0, newNode);
    session.document.apply(ObjectOperation.Delete([node.id], node.toJSON()));
    session.document.show(session.view, newNode.id, nodePos);
  };

  this.canIndent = function(session, component, direction) {
    var node = component.root;
    return (direction === "right" && node.level < 4) || (direction === "left" && node.level > 0);
  };

  this.indent = function(session, component, direction) {
    var node = component.root;
    var newLevel = node.level;
    if (direction === "left") {
      newLevel = Math.max(1, newLevel-1);
    } else {
      newLevel += 1;
    }
    session.document.set([node.id, "level"], newLevel);
  };

};

HeadingEditor.Prototype.prototype = TextNodeEditor.prototype;
HeadingEditor.prototype = new HeadingEditor.Prototype();

module.exports = HeadingEditor;
