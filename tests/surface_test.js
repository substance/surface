"use strict";

// Import
// ========

var Surface = require("../index");
var Article = require("substance-article");
var DocumentController = require("substance-document").Controller;
var Test = require('substance-test');
var assert = Test.assert;


var ID_IDX = 1;

var SurfaceTest = function() {

  this.uuid = function(prefix) {
    prefix = prefix || "node_";
    return prefix+(ID_IDX++);
  };

  this.next_uuid = function() {
    return ID_IDX;
  };

  this.setup = function() {
    ID_IDX = 1;

    this.__document = new Article({id: "surface_test"});

    this.doc = new DocumentController(this.__document);

    this.surface = new Surface(this.doc);

    $('.test-center .test-output').show();
    $('.test-center .test-output').html(this.surface.render().el);
  };

  this.insertContent = function(content) {
    var id = this.uuid("text_");
    this.__document.create({
      "id": id,
      "type": "paragraph",
      "content": content
    });
    this.__document.show("content", [id], -1);
  };

  this.insertImage = function(url) {
    var id = this.uuid("image_");
    this.__document.create({
      "id": id,
      "type": "image",
      "content": " ",
      "url": url
    });
    this.__document.show("content", [id], -1);
  };

  // Verify state
  // -----------
  //
  // Checks if the produced output of the Surface reflects
  // The given document state
  //

  this.verify = function() {
    console.log('verifying..');
  };

  this.verifySelection = function() {
    console.log('verifying selection..');
  };

  this.verifyTextNodeContent = function(nodeId) {
    var textEl = this.surface.el.querySelector("div#"+nodeId);

    var wRange = document.createRange();
    wRange.selectNode(textEl);

    var expected = this.doc.get(nodeId).content;
    var actual = wRange.toString();

    assert.isEqual(expected, actual);
  };

};

// Export
// ====

module.exports = SurfaceTest;
