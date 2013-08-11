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

    this.$el.mousedown(function(e) {
      that.$cursor.css({"z-index": -1});
    });

    this.$el.mouseup(function(e) {
      that.updateSelection(e);
      that.$cursor.css({"z-index": 1});
    });

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = $el.attr('id');
      that.writer.selection.selectNode(nodeId);
      return false;
    });
  }

};

// Private helpers
// ---------------
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

Surface.Prototype = function() {

  // Renders all registered annotations
  // ---------------
  //
  // TODO: find a way to render a delta, instead of everything

  this.renderAnnotations = function() {
    //debugger;

    var annotations = this.writer.getAnnotations();
    var groups = {};

    // group the annotations by node id
    _.each(annotations, function(a){
      var nodeId = a.path[0];
      groups[nodeId] = groups[nodeId] || [];
      groups[nodeId].push(a);
    });

    _.each(groups, function(group, nodeId) {
      var nodeView = this.nodes[nodeId];
      if (nodeView === undefined) {
        console.log("There are annotations for node: ", nodeId);
        return;
      }
      if (nodeView.renderAnnotations === undefined) {
        console.log("NodeView does not support annotations: ", nodeView);
        return;
      }
      nodeView.renderAnnotations(group);
    }, this);
  };

  // Updates a given annotation
  // --------
  //

  this.updateAnnotation = function(changeType, annotation) {
    console.log("Updating annotation: ", annotation);

    // TODO: make this incrementally....
    // currently everthing must be rerendered
    var nodeId = annotation.path[0];
    var nodeView = this.nodes[nodeId];

    if (nodeView === undefined) {
      console.log("No node view for annotated node: ", nodeId);
      return;
    }

    var annotations = this.writer.getAnnotations({node: nodeId});

    if (nodeView.renderAnnotations === undefined) {
      console.log("NodeView does not support annotations: ", nodeView);
      return;
    }

    nodeView.renderAnnotations(annotations);
  };

  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function(e) {
    var wSel = window.getSelection();

    // HACK: sometimes it happens that the selection anchor node is undefined.
    // Try to understand and fix someday.
    if (wSel.anchorNode === null) {
      return;
    }

    // Set selection to the cursor if clicked on the cursor.
    if ($(wSel.anchorNode.parentElement).is(".cursor")) {
      this.writer.selection.collapse("cursor");
      return;
    }

    var wRange = wSel.getRangeAt(0);
    var wStartPos;
    var wEndPos;

    // Preparing information for EOL-HACK (see below).
    // The hack only needs to be applied of the mouse event is in a different 'line'
    // than the DOM Range provided by the browser
    Surface.Hacks.prepareEndOfLineHack.call(this, e, wRange);

    // Note: there are three different cases:
    // 1. selection started at startContainer (regular)
    // 2. selection started at endContainer (reverse)
    // 3. selection done via double click (anchor in different to range boundaries)
    // In cases 1. + 3. the range is used as given, in case 2. reversed.

    wStartPos = [wRange.startContainer, wRange.startOffset];
    wEndPos = [wRange.endContainer, wRange.endOffset];

    if (wRange.endContainer === wSel.anchorNode && wRange.endOffset === wSel.anchorOffset) {
      var tmp = wStartPos;
      wStartPos = wEndPos;
      wEndPos = tmp;
    }

    var startNode = _findNodeElement(wStartPos[0]);
    var endNode = _findNodeElement(wEndPos[0]);


    var startNodeId = startNode.getAttribute("id");
    var startNodePos = this.writer.getPosition(startNodeId);
    var startCharPos = this.nodes[startNodeId].getCharPosition(wStartPos[0], wStartPos[1]);

    var endNodeId = endNode.getAttribute("id");
    var endNodePos = this.writer.getPosition(endNodeId);
    var endCharPos = this.nodes[endNodeId].getCharPosition(wEndPos[0], wEndPos[1]);

    // the selection range in Document.Selection coordinates
    var startPos = [startNodePos, startCharPos];
    var endPos = [endNodePos, endCharPos];

    this.writer.selection.set({start: startPos, end: endPos});
  };


  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {

    if (this.writer.selection.isNull()) {
      this.$cursor.hide();
      return;
    }

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
    wRange.setStart(wStartPos.startContainer, wStartPos.startOffset);
    wRange.setEnd(wEndPos.endContainer, wEndPos.endOffset);
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

  this.positionCursor = function(wSel, range) {

    var rect = range.getClientRects()[0];

    var cursorPos = {};
    // HACK: it still happens that the provided range does not have a client rectangle (?!)
    // In this case we try to take another useful rectangle.
    if (rect === undefined) {
      Surface.Hacks.undefinedRectHack.call(this, wSel, range, cursorPos);
    } else {
      cursorPos = {
        top: rect.top,
        left: rect.left,
        height: rect.height
      };
    }

    // HACK: having whitespaces pre-wrapped, the cursor shows add the end of line
    // and not at the begin of line
    // This has a lot to do how the DOM Ranges work, or... do not work.
    // E.g., creating a Range spanning over the character in a new line will
    // not produce a rectangle, but returns that at the end of the previous line (?!)
    // We address this glitch here:
    if (this._needEndOfLineHack) {
      Surface.Hacks.endOfLineHack.call(this, range, cursorPos);
    }

    // make the position relative to the surface
    var surfaceOffset = this.el.getClientRects()[0];
    cursorPos.top -= surfaceOffset.top;
    cursorPos.left -= surfaceOffset.left;

    // removing the cursor to re-trigger begin of CSS animation (~blinking).
    this.$cursor.remove();
    this.$cursor.css(cursorPos).show();
    this.$el.append(this.$cursor);
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
    this.$cursor = this.$('.cursor');
    this.$cursor.hide();

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

Surface.Hacks = new function() {

  // HACK: sometimes the range does not have a client
  // But, this is just a safe fallback.
  // You should try to fix it: In NodeView.getDOMPosition() try to return
  // a range that has a proper client rects
  this.undefinedRectHack = function(wSel, range, cursorPos) {
    console.log("#FIXME: Surface.positionCursor HACK. rect===undefined.");
    var rect = wSel.anchorNode.getClientRects()[0];
    cursorPos.top = rect.top;
    cursorPos.left = rect.left;
    cursorPos.height = rect.height;
    if (range.startOffset !== 0) {
      cursorPos.left = rect.right;
    }
  };

  // the end-of-line hack gets activated when a mouse down event's y-position
  // does not correspond to the DOM's selection range.
  // This is actually a somewhat glitchy browser behavior.
  this.prepareEndOfLineHack = function(event, range) {
    var rect = range.getClientRects()[0];
    if (rect) {
      var surfaceOffset = this.el.getClientRects()[0];
      if (event.pageY > (rect.top+rect.height)) {
        this._needEndOfLineHack = true;
      }
    }
  };

  // render the cursor in the next line if we are at the end of line
  this.endOfLineHack = function(range, cursorPos) {
    // TODO: detect end of node...
    try {
      this._needEndOfLineHack = false;
      var rect = range.getClientRects()[0];
      var range2 = document.createRange();
      range2.setStart(range.startContainer, range.startOffset+1);
      var rect2 = range2.getClientRects()[0];
      if (rect2 && rect2.top !== rect.top) {
        var nodeEl = _findNodeElement(range.startContainer);
        var nodeId = nodeEl.getAttribute("id");
        var first = this.nodes[nodeId].getDOMPosition(0);
        var firstRect = first.getClientRects()[0];
        cursorPos.top = rect2.top;
        cursorPos.left = firstRect.left;
        cursorPos.height = rect2.height;
      }
    } catch (err) {
      console.error(err);
    }
  };

};

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
