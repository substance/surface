"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var Operator = require("substance-operator");
var util = require("substance-util");
var html = util.html;

// Substance.Surface
// ==========================================================================

var Surface = function(writer, options) {
  
  options = _.extend({
    editable: true,
    view: "content"
  }, options);

  View.call(this);

  var that = this;

  this.options = options;

  // Incoming events
  this.writer = writer;

  // Pull out the registered nodetypes on the written article
  this.nodeTypes = writer.__document.nodeTypes;

  // Bind handlers to establish co-transformations on html elements
  // according to model properties
  this._viewAdapter = new Surface.ViewAdapter(this);

  // storing DOM selections for incremental updates
  this._annotatedElements = {};

  this.listenTo(this.writer.selection,  "selection:changed", this.renderSelection);
  this.listenTo(this.writer.__document, "node:created", this.onCreateNode);
  this.listenTo(this.writer.__document, "node:deleted", this.onDeleteNode);
  this.listenTo(this.writer.__document, "property:updated", this.onUpdateView);
  this.listenTo(this.writer.__document, "property:set", this.onSetNodeContent);
  this.listenTo(this.writer.__document, "property:updated", this.onUpdateNodeContent);
  this.listenTo(this.writer.annotator,  "annotation:changed", this.updateAnnotation);

  this.cursor = $('<div class="cursor"></div>')[0];

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');
  this.$el.addClass(options.view);

  // The editable surface responds to selection changes

  if (options.editable) {

    // TODO: this interfers with the native dom selection
    // E.g. when double clicking to select a word triple clicking to select the whole line/paragraph

    this.$el.mouseup(function(e) {
      // _.delay(function() {
        that.updateSelection(e);  
      // }, 500);
    });

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = $el.attr('id');
      that.writer.selection.selectNode(nodeId);
      return false;
    });
  }

  this.$el.delegate('.annotation', 'mouseover', function(e) {
    var annotationId = $(e.currentTarget).attr('data-id');
    var $spans = $(that._annotatedElements[annotationId]);

    $spans.addClass('active');
    return false;
  });

  // TODO: Maybe this can be optimized
  this.$el.delegate('.annotation', 'mouseout', function(e) {
    that.$('.annotation.active').removeClass('active');
  });
};

Surface.Prototype = function() {

  // Private helpers
  // ---------------

  function childRange(el, start, end) {
    return Array.prototype.slice.call(el.children, start, end);
  }

  this.insertNode = function(type, options) {
    this.writer.insertNode(type, options);
    return false;
  };

  // Really?
  // ---------------
  //  

  this.insertImage = function(type, data) {
    this.writer.insertImage(data);
    return false;
  };

  // Get Cursor position, relative to .surface .nodes
  // ---------------
  //

  this.getCursorPos = function() {
    var relativePos = this.$('.cursor').position();
    
    var cursor = this.writer.selection.cursor;
    var node = cursor.node;
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

      if (content === undefined) {
        console.error("Ohooh. content element not found!");
      } else {
        this._annotatedElements[annotation.id] = childRange(content, annotation.range[0], annotation.range[1]);
        var $spans = $(this._annotatedElements[annotation.id]);
        $spans.attr({
          "data-id": annotation.id
        });
        $spans.addClass(annotation.type).addClass('annotation');
      }
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

    if (this.writer.selection.isNull()) return;

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();
    if (wSel.type !== "None") wSel.collapseToStart();

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

    var ranges = sel.getRanges();
    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var content = $('#'+range.node.id+' .content')[0];
      var chars = childRange(content, range.start, range.end);
      $(chars).addClass('selected');
    }
  };

  // Position cursor and selection
  // --------
  //

  this.positionCursor = function() {
    var cursor = this.writer.selection.cursor;
    if (!cursor.isValid()) return;

    // Remove cursor
    $(this.cursor).remove();

    var node = this.$('.content-node')[cursor.nodePos];
    var content = $(node).find('.content')[0];
    var chars = content.children;

    var ch;
    var pos;

    if (cursor.charPos >= chars.length) {
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
      ch = chars[cursor.charPos];
      pos = $(ch).position();
    }

    $(node).append(this.cursor);

    // TODO: dynamically
    $(this.cursor).css({
      top: pos.top,
      left: pos.left
    });

  };


  // Setup
  // =============================
  //

  this.build = function() {
    this.nodes = {};
    _.each(this.writer.getNodes(), function(node) {
      var NodeView = this.nodeTypes[node.type].View;
      this.nodes[node.id] = new NodeView(node);
    }, this);
  };

  // Rendering
  // =============================
  //

  this.render = function() {
    this.$el.html(html.tpl('surface'));

    var nodes = this.writer.getNodes();
    console.log("Surface.render()", "this.writer.getNodes()", nodes);

    _.each(nodes, function(n) {
      $(this.nodes[n.id].render().el).appendTo(this.$('.nodes'));
    }, this);

    this.renderAnnotations();

    // TODO: fixme
    this.$('input.image-files').hide();

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

  this.onCreateNode = function(node) {
    if (this.nodeTypes[node.type] === undefined) {
      // a node type which is not rendered in the surface... ignoring it.
      return;
    }
    var NodeView = this.nodeTypes[node.type].View;
    if (!NodeView) throw new Error('Node type "'+node.type+'" not supported');
    this.nodes[node.id] = new NodeView(node);
  };

  this.onDeleteNode = function(nodeId) {
    if (this.nodes[nodeId]) this.nodes[nodeId].dispose();
    delete this.nodes[nodeId];
  };

  // This listener function is used to handle "set" and "update" operations
  this.onSetNodeContent = function(path) {
    if (path.length !== 2 || path[1] !== "content") return;
    this.nodes[path[0]].render();
  };

  this.onUpdateNodeContent = function(path, diff) {
    if (path.length !== 2 || path[1] !== "content") return;
    var adapter = new Surface.TextNodeAdapter(this.nodes[path[0]], this);
    diff.apply(adapter);
  };

  this.onUpdateView = function(path, diff) {
    if (path.length !== 2 || path[0] !== "content" || path[1] !== "nodes") return;
    diff.apply(this._viewAdapter);
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

  this.container = function() {
    this._container = this._container || this.surface.$('.nodes')[0];
    return this._container;
  };

  // Creates a new node view
  // --------
  //

  this.insert = function(pos, nodeId) {
    var nodes = this.surface.nodes;
    var el = nodes[nodeId].render().el;
    insertOrAppend(this.container(), pos, el);
  };

  this.delete = function(pos) {
    var childs = this.container().childNodes;
    this.container().removeChild(childs[pos]);
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
