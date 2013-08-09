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
  this.listenTo(this.writer.__document, "graph:reset", this.reset);
  this.listenTo(this.writer.annotator,  "annotation:changed", this.updateAnnotation);

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');
  this.$el.addClass(this.writer.view);

  // The editable surface responds to selection changes

  if (options.editable) {

    // TODO: this interfers with the native dom selection
    // E.g. when double clicking to select a word triple clicking to select the whole line/paragraph

    this.$el.mouseup(function(e) {
      that.updateSelection(e);
    });

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = $el.attr('id');
      that.writer.selection.selectNode(nodeId);
      return false;
    });
  }

/*
  this.$el.delegate('.annotation', 'mouseover', function(e) {
    var annotationId = $(e.currentTarget).attr('data-id');
    var $spans = $(that._annotatedElements[annotationId]);
    $spans.addClass('active');
    return false;
  });

  // TODO: Maybe this can be optimized
  this.$el.delegate('.annotation', 'mouseout', function(e) {
    var annotationId = $(e.currentTarget).attr('data-id');
    var $spans = $(that._annotatedElements[annotationId]);
    $spans.removeClass('active');
    return false;
  });
*/
};

Surface.Prototype = function() {

  // Private helpers
  // ---------------

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
    /*
    var annotations = this.writer.getAnnotations();
    _.each(annotations, function(a) {
      this.updateAnnotation("update", a);
    }, this);
    */
  };

  // Updates a given annotation
  // --------
  //

  var removeAnnotation = function(elements, type) {
    /*
    var $elements = $(elements);
    $elements.removeClass(type).removeClass('annotation');
    $elements.removeAttr("data-id");
    */
  };

  var addAnnotation = function(elements, id, type) {
    /*
    var $elements = $(elements);
    $elements.attr({ "data-id": id });
    $elements.addClass(type).addClass('annotation');
    */
  };

  this.updateAnnotation = function(changeType, annotation) {
    /*
    var nodeId = annotation.path[0];
    var content = this.el.querySelector('#'+nodeId+' .content');

    // on delete and update we remove the classes
    if (changeType === "delete") {
      removeAnnotation(this._annotatedElements[annotation.id], annotation.type);
      delete this._annotatedElements[annotation.id];
    }

    else if (changeType === "create") {
      // TODO: when does this happen and is it ok?
      if (content === undefined) return;

      var elements = childRange(content, annotation.range[0], annotation.range[1]);
      this._annotatedElements[annotation.id] = elements;
      addAnnotation(elements, annotation.id, annotation.type);
    }

    else if (changeType === "update") {
      // TODO: when does this happen and is it ok?
      if (content === undefined) return;

      var newElements = childRange(content, annotation.range[0], annotation.range[1]);
      var oldElements = this._annotatedElements[annotation.id];

      var toAdd = _.difference(newElements, oldElements);
      var toRemove = _.difference(oldElements, newElements);

      this._annotatedElements[annotation.id] = newElements;
      addAnnotation(toAdd, annotation.id, annotation.type);
      removeAnnotation(toRemove, annotation.type);
    }
    */
  };

  var _findNodeElement = function(node) {
    var current = node;

    while(current !== undefined) {
      if ($(current).is("div.content-node")) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  };


  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function() {
    var wSel = window.getSelection();

    var wRange = wSel.getRangeAt(0);
    var wStartPos = [wSel.anchorNode, wSel.anchorOffset];
    var wEndPos;
    if (wRange.startContainer === wSel.anchorNode && wRange.startOffset === wSel.anchorOffset) {
      wEndPos = [wRange.endContainer, wRange.endOffset];
    } else {
      wEndPos = [wRange.startContainer, wRange.startOffset];
    }

    var startNode = _findNodeElement(wStartPos[0]);
    var endNode = _findNodeElement(wEndPos[0]);

    if (!startNode) {
      console.log("TODO: FIXME.");
      return;
    }

    var startNodeId = startNode.getAttribute("id");
    var startNodePos = this.writer.getPosition(startNodeId);
    var startCharPos = this.nodes[startNodeId].getCharPosition(wStartPos[0], wStartPos[1]);

    var endNodeId = endNode.getAttribute("id");
    var endNodePos = this.writer.getPosition(endNodeId);
    var endCharPos = this.nodes[endNodeId].getCharPosition(wEndPos[0], wEndPos[1]);

    var startPos = [startNodePos, startCharPos];
    var endPos = [endNodePos, endCharPos];
    console.log("startPos", startPos, "endPos", endPos);
    this.writer.selection.set({start: startPos, end: endPos});

  };

  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {
    console.log("renderSelection");

    if (this.writer.selection.isNull()) return;

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();

    var range = this.writer.selection.range();
    var startNode = this.writer.getNodeFromPosition(range.start[0]);
    var startNodeView = this.nodes[startNode.id];
    var wStartPos = startNodeView.getDOMPosition(range.start[1]);

    var endNode = this.writer.getNodeFromPosition(range.end[0]);
    var endNodeView = this.nodes[endNode.id];
    var wEndPos = endNodeView.getDOMPosition(range.end[1]);

    var wRange = document.createRange();
    wRange.setStart(wStartPos[0], wStartPos[1]);
    wRange.setEnd(wEndPos[0], wEndPos[1]);
    wSel.removeAllRanges();
    wSel.addRange(wRange);

    if (this.writer.selection.isReverse()) {
      this.positionCursor(wSel, wStartPos);
    } else {
      this.positionCursor(wSel, wEndPos);
    }
  };

  // Position cursor
  // --------
  //

  this.positionCursor = function(wSel, wPos) {

    var range = document.createRange();
    range.setStart(wPos[0], wPos[1]);
    var rect = range.getClientRects()[0];

    console.log("positionCursor: rect", rect);

    var surfaceOffset = this.el.getClientRects()[0];

    var cursorPos = {
      top: rect.top-surfaceOffset.top,
      left:rect.left-surfaceOffset.left,
      height: rect.height
    };
    this.$cursor.css(cursorPos);
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

    // this.renderAnnotations();

    // TODO: fixme
    this.$('input.image-files').hide();
    this.$cursor = this.$('.cursor');
    // this.$cursor.hide();

    return this;
  };

  this.reset = function() {
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });
    this._annotatedElements = {};

    this.build();
    this.render();
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
    if (this.nodes[nodeId]) {
      this.nodes[nodeId].dispose();
    }
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
    return this.surface.$('.nodes')[0];
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
