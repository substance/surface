"use strict";

var Operator = require('substance-operator');
var ObjectOperation = Operator.ObjectOperation;
var TextOperation = Operator.TextOperation;
var util = require("substance-util");

var TextNodeEditor = function(factory) {
  this.factory = factory;
};

TextNodeEditor.Prototype = function() {

  this.canDeleteContent = function(session, component, startChar, endChar) {
    var N = component.root.content.length;
    return startChar <= N && endChar <= N;
  };

  this.deleteContent = function(session, component, startChar, endChar) {
    var node = component.root;
    var content = node.content;
    var diffOp = TextOperation.Delete(startChar, content.substring(startChar, endChar));
    var op = ObjectOperation.Update([node.id, "content"], diffOp, "string");
    session.document.apply(op);
    session.annotator.update(op);
  };

  this.canInsertContent = function(session, component, charPos) {
    var N = component.root.content.length;
    return charPos <= N;
  };

  this.insertContent = function(session, component, charPos, text) {
    var node = component.root;
    var diffOp = TextOperation.Insert(charPos, text);
    var op = ObjectOperation.Update([node.id, "content"], diffOp, "string");
    session.document.apply(op);
    session.annotator.update(op);
  };

  this.canAnnotate = function(/*session, component, type, range*/) {
    return true;
  };
  this.annotate = function(session, component, type, range, data) {
    var node = component.root;
    var path = [node.id, "content"];
    session.document.annotate({
      type: type,
      path: path,
      range:range
    }, data);
  };

  this.canBreak = function(session, component, charPos) {
    var N = component.root.content.length;
    return charPos <= N;
  };

  this.breakNode = function(session, component, charPos) {
    var node = component.root;
    var text = node.content;
    var tail = text.substring(charPos);
    var nodePos = component.rootPos;

    var newNode = {
      id: util.uuid(),
      type: "text",
      content: tail
    };

    // Note: to be able to transfer annotations without deleting them we need do this
    // in the following order:
    // 1. Create a node with the trailing text
    // 2. Break and transfer annotations
    // 3. Truncate
    session.document.apply(ObjectOperation.Update([node.id, "content"], TextOperation.Delete(charPos, tail), "string"));
    session.document.apply(ObjectOperation.Create([newNode.id], newNode));
    session.annotator.transferAnnotations(node, charPos, newNode);
    session.document.show(session.view, newNode.id, nodePos+1);
    session.selection.set([component.pos+1,0]);
  };

  this.canChangeType = function(session, node, newType) {
    // TODO: also allow changing into list
    return newType === "heading";
  };

  this.changeType = function(session, node, nodePos, newType, data) {
    // Nothing to change in this case
    if (node.type === newType) {
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
      newNode.content = node.content;
      newNode.level = data.level;
      break;
    }

    session.document.hide(session.view, node.id);
    session.document.apply(ObjectOperation.Create([newNode.id], newNode));
    session.annotator.transferAnnotations(node, 0, newNode);
    session.document.apply(ObjectOperation.Delete([node.id], node.toJSON()));
    session.document.show(session.view, newNode.id, nodePos);
  };

  this.canJoin = function(session, node, other) {
    return (other.type === "text" || other.type === "heading");
  };

  this.join = function(session, node, other) {
    if (!other.content) {
      throw new Error("Currently only text and heading nodes can be joined.");
    }

    var text = other.content;
    var insertPos = node.content.length;

    var diffOp = TextOperation.Insert(insertPos, text);
    var op = ObjectOperation.Update([node.id, "content"], diffOp, "string");

    session.document.apply(op);
    session.annotator.transferAnnotations(other, 0, node, insertPos);
  };
};

TextNodeEditor.prototype = new TextNodeEditor.Prototype();

module.exports = TextNodeEditor;
