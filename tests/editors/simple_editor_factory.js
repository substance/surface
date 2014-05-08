"use strict";

var TextNodeEditor = require("./text_node_editor");
var HeadingEditor = require("./heading_editor");
var NotEditable = require("./not_editable");
var SimpleViewEditor = require("./simple_view_editor");

var SimpleEditorFactory = function() {

  this.createEditor = function(node) {
    switch(node.type) {
    case "text":
      return new TextNodeEditor(this);
    case "heading":
      return new HeadingEditor(this);
    case "view":
      if (node.id === "content") {
        return new SimpleViewEditor(this);
      } else {
        return new NotEditable(this);
      }
      break;
    default:
      return new NotEditable(this);
    }
  };

};

module.exports = SimpleEditorFactory;
