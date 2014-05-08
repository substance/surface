"use strict";

var NotEditable = function(factory) {
  this.factory = factory;
};

NotEditable.Prototype = function() {
  /* jshint unused:false */

  // Component operations

  this.canDeleteContent = function(session, component, startChar, endChar) {
    return false;
  };
  this.deleteContent = function(session, component, startChar, endChar) {
    throw new Error("Nope.");
  };
  this.canInsertContent = function(session, component, charPos) {
    return false;
  };
  this.insertContent = function(session, component, charPos, text) {
    throw new Error("Nope.");
  };
  this.canIndent = function(session, component, charPos) {
    return false;
  };
  this.indent = function(session, component, charPos) {
    throw new Error("Nope.");
  };
  this.canAnnotate = function(session, component, type, range) {
    return false;
  };
  this.annotate = function(session, component, type, range, data) {
    throw new Error("Nope.");
  };

  // Node operations

  this.canBreak = function(session, component, charPos) {
    return false;
  };
  this.breakNode = function(session, component, charPos) {
    throw new Error("Nope.");
  };

  this.canChangeType = function(session, node, newType) {
    return false;
  };
  this.changeType = function(session, node, nodePos, newType, data) {
    throw new Error("Nope.");
  };
  this.canJoin = function(session, node, other) {
    return false;
  };
  this.join = function(session, node, other) {
    throw new Error("Nope.");
  };
};

NotEditable.prototype = new NotEditable.Prototype();

module.exports = NotEditable;
