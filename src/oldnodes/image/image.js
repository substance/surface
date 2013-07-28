"use strict";

var _ = require('underscore');
var util = require('substance-util');
var html = util.html;
var View = require('substance-application').View;
var Surface = require('../../surface');

// Substance.Image
// ==========================================================================

var Image = function(node) {
  View.call(this);
  this.node = node;

  this.$el.addClass('content-node image');
  this.$el.attr('id', this.node.id);
};

Image.Prototype = function() {

  // Rendering
  // =============================
  //

  this.render = function() {
    this.$el.html(html.tpl('image', this.node));
    // this.renderContent();
    return this;
  };

  this.dispose = function() {
    console.log('disposing image view');
    this.stopListening();
  };

  this.renderContent = function() {
    // this.$('.content').empty();
    // this.insert(0, this.node.content);
  };

  this.delete = function(pos, length) {
    var content = this.$('.content')[0];
    var spans = content.childNodes;
    for (var i = length - 1; i >= 0; i--) {
      content.removeChild(spans[pos+i]);
    }
  };
};

Image.Prototype.prototype = View.prototype;
Image.prototype = new Image.Prototype();

// Register
Surface.registerContentType("image", Image);

module.exports = Image;
