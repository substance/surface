"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var Operator = require("substance-operator");
var util = require("substance-util");
var html = util.html;

// Substance.Surface
// ==========================================================================

var Surface = function(writer) {
  View.call(this);

  var that = this;

  // Incoming events
  this.writer = writer;


  // Bind handlers to establish co-transformations on html elements
  // according to model properties
  this.viewAdapter = new Surface.ViewAdapter(this);

  // storing DOM selections for incremental updates
  this._annotatedElements = {};

  this.listenTo(this.writer, "selection:changed", this.renderSelection);
  this.listenTo(this.writer, "view:changed", this.viewAdapter);
  this.listenTo(this.writer, "textnode:changed", this.onNodeContentUpdate);
  this.listenTo(this.writer, "annotation:changed", this.updateAnnotation);

  this.cursor = $('<div class="cursor"></div>')[0];

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');

  this.$el.mouseup(function(e) {
    that.updateSelection(e);
  });

  this.$el.delegate('img', 'click', function(e) {
    var $el = $(e.currentTarget).parent().parent().parent();
    var nodeId = $el.attr('id');
    that.writer.selection.selectNode(nodeId);
    return false;
  });
};

// Registered node types
// ---------------


var nodes = require("substance-article/nodes");

Surface.nodeTypes = {
  "node": nodes.Node,
  "paragraph": nodes.Paragraph,
  "heading": nodes.Heading,
  "image": nodes.Image,
  "codeblock": nodes.Codeblock
};


Surface.Prototype = function() {

  // Private helpers
  // ---------------

  function childRange(el, start, end) {
    // debugger;
    return Array.prototype.slice.call(el.children, start, end);
  }

  this.insertNode = function(type, options) {
    this.writer.insertNode(type, options);
    this.hideNodeInserter();
    return false;
  };

  this.toggleNodeInserter = function() {
    var $nodeToggles = this.$('.node-toggles');

    // get top and left pos of the cursor
    var cursorScreenPos = this.getCursorPos();

    $nodeToggles.css({
      top: cursorScreenPos.top,
      left: cursorScreenPos.left+64
    });

    $nodeToggles.fadeIn();
  };

  this.hideNodeInserter = function() {
    this.$('.node-toggles').hide();
  };

  // Get Cursor position, relative to .surface .nodes
  // ---------------
  //

  this.getCursorPos = function() {
    var relativePos = this.$('.cursor').position();
    
    var nodePos = this.writer.selection.getCursor()[0];
    var node = this.writer.__document.getNodeFromPosition('content', nodePos);
    var nodeScreenPos = this.$('#'+node.id).position();

    return {
      left: relativePos.left,
      top: relativePos.top + nodeScreenPos.top
    };
  };

  // Renders all registered annotations
  // ---------------
  //
  // TODO: find a way to render a delta, instead of everything

  this.renderAnnotations = function() {
    var annotations = this.writer.getAnnotations();
    _.each(annotations, function(a) {
      this.updateAnnotation("update", a);
    }, this);
  };

  // Updates a given annotation
  // --------
  //

  this.updateAnnotation = function(changeType, annotation) {
    //debugger;

    // on delete and update we remove the classes
    if (changeType === "delete" || changeType === "update") {
      $(this._annotatedElements[annotation.id]).removeClass(annotation.type).removeClass('annotation');
      delete this._annotatedElements[annotation.id];
    }

    if (changeType === "create" || changeType === "update") {
      var node = this.writer.get(annotation.path[0]);
      var content = this.$('#'+node.id+' .content')[0];
      this._annotatedElements[annotation.id] = childRange(content, annotation.range[0], annotation.range[1]);
      $(this._annotatedElements[annotation.id]).addClass(annotation.type).addClass('annotation');
    }
  };


  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function() {
    var indexOf = Array.prototype.indexOf;
    var sel = window.getSelection();

    if (sel.type === "None") return null;

    var range = sel.getRangeAt(0);
    var result = {};

    var content, nodeId, nodeIndex;

    // CHECK START CONTAINER/OFFSET STUFF
    // ----------------

    // div.content-node.text#text_25
    //   div.content
    //     span|br
    //       TEXT_NODE  <-- trigger
    //
    // desired data
    // start: [nodeindex, characterOffset]

    // debugger;

    if (range.startContainer.nodeType === Node.TEXT_NODE) {

      // Extract content-node
      //

      content = $(range.startContainer).parent().parent()[0];
      nodeId = $(content).parent().attr('id');

      nodeIndex = this.writer.getPosition(nodeId);

      // starting character of selection (span or br node)
      var startChar = range.startContainer.parentElement;

      var charOffset = indexOf.call(content.childNodes, startChar);
      charOffset += range.startOffset; // if you clicked on the right-hand area of the span

      result["start"] = [nodeIndex, charOffset];
    } else if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
      // TODO: this should go into the image node!
      content = $(range.startContainer).parent();
      nodeId = $(content).parent().attr('id');
      nodeIndex = this.writer.getPosition(nodeId);
      result["start"] = [nodeIndex, 0];
    } else {

      // empty container
      //
      // div.content-node.text#text_25
      //   div.content     <--- trigger

      content = range.startContainer;
      nodeId = $(content).parent().attr('id');
      nodeIndex = this.writer.getPosition(nodeId);

      result["start"] = [nodeIndex, 0];
    }


    // CHECK END CONTAINER/OFFSET STUFF
    // ----------------

    if (range.isCollapsed) {
      result["end"] = result["start"];

    } else if (range.endContainer.nodeType === Node.TEXT_NODE) {
      // Extract content-node
      //
      content = $(range.endContainer).parent().parent()[0];
      nodeId = $(content).parent().attr('id');
      nodeIndex = this.writer.getPosition(nodeId);

      // starting character of selection (span or br node)
      var ch = range.endContainer.parentElement;

      var chOffset = indexOf.call(content.childNodes, ch);
      chOffset += range.endOffset; // if you clicked on the right-hand area of the span
      
      result["end"] = [nodeIndex, chOffset];
    } else if (range.endContainer.nodeType === Node.ELEMENT_NODE) {
      // TODO: this should go into the image node implementation!
      content = $(range.endContainer).parent();
      nodeId = $(content).parent().attr('id');
      nodeIndex = this.writer.getPosition(nodeId);
      result["end"] = [nodeIndex, 1];
    } else {

      // empty container
      //
      // div.content-node.text#text_25
      //   div.content     <--- trigger

      content = range.endContainer;
      nodeId = $(content).parent().attr('id');
      nodeIndex = this.writer.getPosition(nodeId);

      result["end"] = [nodeIndex, 0];
    }

    this.writer.selection.set(result);
    return result;
  };

  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {
    var sel = this.writer.selection;
    if (!sel || sel.isNull()) return;
    this.hideNodeInserter();

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();
    if (wSel.type !== "None") wSel.collapseToStart();

    var startNode = this.$('.content-node')[sel.start[0]];

    // Special case (position cursor after )
    var startChars = $(startNode).find('.content')[0].children;

    var startChar;
    if (sel.start[1] >= startChars.length) {
      startChar = _.last(startChars);
    } else {
      startChar = startChars[sel.start[1]];
    }

    this.positionCursor();
    this.renderSelectionRange();
  };

  this.renderSelectionRange = function() {
    var sel = this.writer.selection;
    if (sel.isNull()) {
      console.log('selection is null! WHY?!');
      return;
    }

    // Do nothing if selection is collapsed
    this.$('.selected').removeClass('selected');
    if (sel.isCollapsed()) return;

    function selectChars(chars) {
      $(chars).addClass('selected');
    }

    var nodes = sel.getNodes();
    if (nodes.length > 1) {
      _.each(nodes, function(node, index) {
        var content = $('#'+node.id+' .content')[0];
        var chars;
        if (index === 0) {
          chars = childRange(content, sel.start[1]);
          selectChars(chars);
        } else if (index===nodes.length-1) {
          chars = childRange(content, 0, sel.end[1]);
          selectChars(chars);
        } else {
          chars = childRange(content, 0);
          selectChars(chars);
        }
      });
    } else { // range within one node
      var node = nodes[0];
      var content = $('#'+node.id+' .content')[0];
      var chars = childRange(content, sel.start[1], sel.end[1]);
      selectChars(chars);
    }
  };

  // Position cursor and selection
  // --------
  //

  this.positionCursor = function() {
    var sel = this.writer.selection;
    // Remove cursor
    $(this.cursor).remove();

    if (sel.isCollapsed()) {
      var node = this.$('.content-node')[sel.end[0]];
      var chars = $(node).find('.content')[0].children;
      var ch;
      var pos;

      if (sel.start[1] >= chars.length) {
        // Special case: Cursor is after last element
        // -> draw cursor after the last element
        ch = _.last(chars);

        if (ch) {
          pos = $(ch).position();
          pos.left += $(ch).width();
        } else {
          pos = {
            left: 0,
            top: 22
          };
        }
      } else {
        ch = chars[sel.end[1]];
        pos = $(ch).position();
      }

      $(node).append(this.cursor);

      // TODO: dynamically
      $(this.cursor).css({
        top: pos.top,
        left: pos.left
        // height: '20px' -> getHeightBasedOnContext() -> 100% for image, line-height for text and heading and so on.
      });

    }
  };


  // Setup
  // =============================
  //

  this.build = function() {
    this.nodes = {};
    _.each(this.writer.getNodes(), function(node) {
      var NodeView = Surface.nodeTypes[node.type].View;
      this.nodes[node.id] = new NodeView(node);
    }, this);
  };

  // Rendering
  // =============================
  //

  this.render = function() {
    this.$el.html(html.tpl('surface'));

    _.each(this.writer.getNodes(), function(n) {
      $(this.nodes[n.id].render().el).appendTo(this.$('.nodes'));
    }, this);

    this.renderAnnotations();

    return this;
  };

  // Cleanup view before removing it
  // --------
  //

  this.dispose = function() {
    this.stopListening();
    _.each(this.nodes, function(n) {
      n.dispose();
    }, this);

    this.stopListening();
  };

  // This listener function is used to handle "set" and "update" operations
  this.onNodeContentUpdate = function(op) {
    if (op.type === "set") {
      // TODO: delegate to surface
      this.nodes[op.path[0]].render();
    } else if (op.type === "update") {
      // Note: op.diff should be a text operation
      var adapter = new Surface.TextNodeAdapter(this.nodes[op.path[0]], this);
      op.diff.apply(adapter);
    }
  };
};

_.extend(Surface.Prototype, util.Events.Listener);


// Content View Adapter
// --------
// Adapter that maps model operations to changes on the according html element
//

var ViewAdapter = function(surface) {
  this.surface = surface;
  // this.container = surface.$('.nodes')[0];
};

ViewAdapter.__prototype__ = function() {

  function insertOrAppend(container, pos, el) {
    var childs = container.childNodes;
    if (pos < childs.length) {
      var refNode = childs[pos];
      container.insertBefore(el, refNode);
    } else {
      container.appendChild(el);
    }
  }

  // TODO: 
  this.container = function() {
    this._container = this._container || this.surface.$('.nodes')[0];
    return this._container;
  };

  // Creates a new node view
  // --------
  //

  this.createNodeView = function(node) {
    var NodeView = Surface.nodeTypes[node.type].View;
    if (!NodeView) throw new Error('Node type "'+node.type+'" not supported');
    return new NodeView(node);
  };

  this.insert = function(pos, val) {
    var writer = this.surface.writer;
    var nodes = this.surface.nodes;
    var id = val;

    var nodeView = this.createNodeView(writer.get(id));
    var el = nodeView.render().el;
    nodes[id] = nodeView;

    insertOrAppend(this.container(), pos, el);
  };

  this.delete = function(pos, nodeId) {
    var nodes = this.surface.nodes;
    var childs = this.container().childNodes;

    this.container().removeChild(childs[pos]);
    var view = nodes[nodeId];
    view.dispose();
    delete nodes[nodeId];
  };

  this.move = function(val, oldPos, newPos) {
    var childs = this.container().childNodes;

    var el = childs[oldPos];
    this.container().removeChild(el);
    insertOrAppend(this.container(), newPos, el);
  };
};

ViewAdapter.__prototype__.prototype = Operator.ArrayOperation.ArrayAdapter.prototype;
ViewAdapter.prototype = new ViewAdapter.__prototype__();


// TextNode Content Adapter
// --------
//
// Model operations on properties that are represented as text nodes
// are transferred to changes on the according html elements.
//

var TextNodeAdapter = function(node, surface) {
  this.node = node;
  this.surface = surface;
};

TextNodeAdapter.__prototype__ = function() {
  this.insert = function(pos, str) {
    this.node.insert(pos, str);
  };

  this.delete = function(pos, length) {
    this.node.delete(pos, length);
  };

  this.get = function() {
    return this;
  };
};

TextNodeAdapter.__prototype__.prototype = Operator.TextOperation.StringAdapter.prototype;
TextNodeAdapter.prototype = new TextNodeAdapter.__prototype__();


Surface.TextNodeAdapter = TextNodeAdapter;
Surface.ViewAdapter = ViewAdapter;

Surface.Prototype.prototype = View.prototype;
Surface.prototype = new Surface.Prototype();

module.exports = Surface;
