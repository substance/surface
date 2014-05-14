"use strict";

var util = require("substance-util");
var Operator = require('substance-operator');
var ObjectOperation = Operator.ObjectOperation;
var ArrayOperation = Operator.ArrayOperation;

// A simple editor for containers
// --------

var SimpleContainerEditor = function(factory, nodeId) {
  this.factory = factory;
  this.nodeId = nodeId;
};

SimpleContainerEditor.Prototype = function() {

  this.canDeleteNode = function(session, node) {
    var nodePos = this._nodePos(session, node.id);
    return (nodePos >= 1 && nodePos < this._length(session));
  };

  this.deleteNode = function(session, node) {
    var nodePos = this._nodePos(session, node.id);
    var diffOp = ArrayOperation.Delete(nodePos, node.id);
    session.document.apply(ObjectOperation.Update([this.nodeId, "nodes"], diffOp));
    // We have to ensure that the document contains at least one text node
    // otherwise editing would not be possible anymore
    if (this._length(session) === 1) {
      var textNode = {
        type: "text",
        id: "text_"+util.uuid(),
        content: ""
      };
      session.document.create(textNode);
      session.document.show(this.nodeId, textNode.id);
    }
  };

  this._length = function(session) {
    return session.document.nodes[this.nodeId].nodes.length;
  };

  this._nodeId = function(session, pos) {
    return session.document.nodes[this.nodeId].nodes[pos];
  };

  this._nodePos = function(session, nodeId) {
    return session.document.nodes[this.nodeId].nodes.indexOf(nodeId);
  };

};

SimpleContainerEditor.prototype = new SimpleContainerEditor.Prototype();

module.exports = SimpleContainerEditor;
