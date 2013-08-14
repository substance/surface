"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var util = require("substance-util");
var Commander = require("substance-commander");

// Substance.Surface
// ==========================================================================

var Surface = function(doc, options) {

  options = _.extend({
    editable: true,
    view: "content"
  }, options);

  View.call(this);

  var that = this;

  this.options = options;

  // Incoming events
  this.doc = doc;

  // Pull out the registered nodetypes on the written article
  this.nodeTypes = doc.__document.nodeTypes;

  this.listenTo(this.doc.selection,  "selection:changed", this.renderSelection);
  this.listenTo(this.doc.__document, "property:updated", this.onUpdateView);
  this.listenTo(this.doc.__document, "graph:reset", this.reset);
  this.listenTo(this.doc.annotator,  "annotation:changed", this.updateAnnotation);

  // Experimental: using a factory which creates a view for a given node type
  // As we want to be able to reuse views
  // However, as the matter is still under discussion consider the solution here only as provisional.
  // We should create views, not only elements, as we need more, e.g., event listening stuff
  // which needs to be disposed later.

  this.viewFactory = {
    createView: function(node) {
      var NodeView = that.nodeTypes[node.type].View;

      if (!NodeView) {
        throw new Error('Node type "'+node.type+'" not supported');
      }

      // Note: passing the factory to the node views
      // to allow creation of nested views
      var nodeView = new NodeView(node, this);

      // we connect the listener here to avoid to pass the document itself into the nodeView
      nodeView.listenTo(that.doc, "operation:applied", nodeView.onGraphUpdate);

      return nodeView;
    }
  };

  // Start building the initial stuff
  this.build();

  this.el.spellcheck = false;
  this.$el.addClass('surface');
  this.$el.addClass(this.doc.view);

  // The editable surface responds to selection changes

  if (options.editable) {

    this.el.setAttribute("contenteditable", "true");

    this.$el.mouseup(function(e) {
      this.ignoreNextSelection = true;
      this.updateSelection(e);
    }.bind(this));

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = $el.attr('id');
      that.doc.selection.selectNode(nodeId);
      return false;
    });

    this._dirt = [];

    this._onKeyDown = function() {
      this._dirtPossible = true;
    }.bind(this);

    this._onTextInput = function(e) {
      console.log("textinput", e);
      this._dirtPossible = false;
      while(this._dirt.length > 0) {
        var dirt = this._dirt.shift();
        dirt[0].textContent = dirt[1];
      }
      this.doc.write(e.data);
      e.preventDefault();
    }.bind(this);

    var _manipulate = function(f, dontPrevent) {
      return function(e) {
        that._dirtPossible = false;
        setTimeout(f, 0);
        if (dontPrevent !== true) {
          e.preventDefault();
        }
      };
    };

    this.keyboard = new Commander.Mousetrap();
    this.keyboard.bind([
        "up", "down", "left", "right",
        "shift+up", "shift+down", "shift+left", "shift+right",
        "ctrl+up", "ctrl+down", "ctrl+left", "ctrl+right",
        "alt+up", "alt+down", "alt+left", "alt+right"
      ], function() {
      // call this after the movement has been done by the contenteditable
      setTimeout(function() {
        that.ignoreNextSelection = true;
        that.updateSelection();
      }, 0);
    }, "keydown");

    this.keyboard.bind(["backspace"], _manipulate(function() {
      that.doc.delete("left");
    }), "keydown");

    this.keyboard.bind(["del"], _manipulate(function() {
      that.doc.delete("right");
    }), "keydown");

    this.keyboard.bind(["enter"], _manipulate(function() {
      that.doc.modifyNode();
    }), "keydown");

    this.keyboard.bind(["shift+enter"], _manipulate(function() {
      that.doc.write("\n");
    }), "keydown");

    this.keyboard.bind(["space"], _manipulate(function() {
      that.doc.write(" ");
    }), "keydown");

    this.keyboard.bind(["tab"], _manipulate(function() {
      that.doc.write("  ");
    }), "keydown");

    this.keyboard.bind(["ctrl+z"], _manipulate(function() {
      that.doc.undo();
    }), "keydown");

    this.keyboard.bind(["ctrl+shift+z"], _manipulate(function() {
      that.doc.redo();
    }), "keydown");

    this.makeEditable(this.el);
  }
};

Surface.Prototype = function() {

  // Private helpers
  // ---------------
  var _findNodeElement = function(node) {
    var current = node;
    while(current !== undefined) {
      if ($(current).is("div.content-node")) {
        var id = current.getAttribute("id");
        if (this.nodes[id]) {
          return current;
        }
      }
      current = current.parentElement;
    }
    return null;
  };

  // Renders all registered annotations
  // ---------------
  //
  // TODO: find a way to render a delta, instead of everything

  this.renderAnnotations = function() {
    //debugger;

    var annotations = this.doc.getAnnotations();
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

    var annotations = this.doc.getAnnotations({node: nodeId});

    if (nodeView.renderAnnotations === undefined) {
      console.log("NodeView does not support annotations: ", nodeView);
      return;
    }

    nodeView.renderAnnotations(annotations);
  };

  this.makeEditable = function(el) {
    var that = this;

    el.addEventListener("keydown", this._onKeyDown);

    // TODO: cleanup... Firefix needs a different event...
    el.addEventListener("textInput", this._onTextInput, true);
    el.addEventListener("input", this._onTextInput, true);

    this._dirt = [];
    this._observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (that._dirtPossible) {
          that._dirt.push([mutation.target, mutation.oldValue]);
        }
      });
    });
    // configuration of the observer:
    var config = { subtree: true, characterData: true, characterDataOldValue: true };
    this._observer.observe(el, config);

    this.keyboard.connect(el);
  };

  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function(/*e*/) {
    console.log("Surface.updateSelection()");
    var wSel = window.getSelection();

    // HACK: sometimes it happens that the selection anchor node is undefined.
    // Try to understand and fix someday.
    if (wSel.anchorNode === null) {
      return;
    }

    // Set selection to the cursor if clicked on the cursor.
    if ($(wSel.anchorNode.parentElement).is(".cursor")) {
      this.doc.selection.collapse("cursor");
      return;
    }

    var wRange = wSel.getRangeAt(0);
    var wStartPos;
    var wEndPos;

    // Preparing information for EOL-HACK (see below).
    // The hack only needs to be applied of the mouse event is in a different 'line'
    // than the DOM Range provided by the browser
    //Surface.Hacks.prepareEndOfLineHack.call(this, e, wRange);

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

    var startNode = _findNodeElement.call(this, wStartPos[0]);
    var endNode = _findNodeElement.call(this, wEndPos[0]);

    var startNodeId = startNode.getAttribute("id");
    var startNodePos = this.doc.getPosition(startNodeId) ;
    var startCharPos = this.nodes[startNodeId].getCharPosition(wStartPos[0], wStartPos[1]);

    var endNodeId = endNode.getAttribute("id");
    var endNodePos = this.doc.getPosition(endNodeId);
    var endCharPos = this.nodes[endNodeId].getCharPosition(wEndPos[0], wEndPos[1]);

    // the selection range in Document.Selection coordinates
    var startPos = [startNodePos, startCharPos];
    var endPos = [endNodePos, endCharPos];

    this.doc.selection.set({start: startPos, end: endPos});
  };


  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {

    if (this.ignoreNextSelection === true) {
      this.ignoreNextSelection = false;
      return;
    }

    if (this.doc.selection.isNull()) {
      this.$cursor.hide();
      return;
    }

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();

    var range = this.doc.selection.range();
    var startNode = this.doc.getNodeFromPosition(range.start[0]);
    var startNodeView = this.nodes[startNode.id];
    var wStartPos = startNodeView.getDOMPosition(range.start[1]);

    var endNode = this.doc.getNodeFromPosition(range.end[0]);
    var endNodeView = this.nodes[endNode.id];
    var wEndPos = endNodeView.getDOMPosition(range.end[1]);

    var wRange = document.createRange();
    wRange.setStart(wStartPos.startContainer, wStartPos.startOffset);
    wRange.setEnd(wEndPos.endContainer, wEndPos.endOffset);
    wSel.removeAllRanges();
    wSel.addRange(wRange);

    // if (this.doc.selection.isReverse()) {
    //   this.positionCursor(wSel, wStartPos);
    // } else {
    //   this.positionCursor(wSel, wEndPos);
    // }
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
    _.each(this.doc.getNodes(), function(node) {
      var NodeView = this.nodeTypes[node.type].View;
      this.nodes[node.id] = new NodeView(node);
    }, this);
  };

  // Rendering
  // =============================
  //
  // input.image-files
  // .controls
  // .nodes
  //   .content-node.paragraph
  //   .content-node.heading
  //   ...
  // .cursor

  this.render = function() {

    var fileInput = document.createElement('input');
    fileInput.className = "image-files";
    fileInput.setAttribute("type", "file");

    fileInput.setAttribute("name", "files[]");


    var controls = document.createElement('div');
    controls.className = "controls";
    var nodes = document.createElement('div');
    nodes.className = "nodes";

    var cursor = document.createElement('div');
    cursor.className = "cursor";

    this.el.appendChild(fileInput);
    this.el.appendChild(controls);
    this.el.appendChild(nodes);
    this.el.appendChild(cursor);

    var docNodes = this.doc.getNodes();
    console.log("Surface.render()", "this.doc.getNodes()", nodes);

    _.each(docNodes, function(n) {
      $(this.nodes[n.id].render().el).appendTo(this.$('.nodes'));
    }, this);

    this.renderAnnotations();

    // TODO: fixme
    this.$('input.image-files').hide();
    this.$cursor = this.$('.cursor');
    this.$cursor.hide();

    // keep the nodes for later access
    this._nodesEl = nodes;

    return this;
  };

  this.reset = function() {
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });
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

  function insertOrAppend(container, pos, el) {
    var childs = container.childNodes;
    if (pos < childs.length) {
      var refNode = childs[pos];
      container.insertBefore(el, refNode);
    } else {
      container.appendChild(el);
    }
  }

  this.onUpdateView = function(path, diff) {
    if (path.length !== 2 || path[0] !== "content" || path[1] !== "nodes") return;

    var nodeId, node;
    var container = this._nodesEl;

    var children, el;

    if (diff.isInsert()) {
      // Create a view and insert render it into the nodes container element.
      nodeId = diff.val;
      node = this.doc.get(nodeId);
      // TODO: this will hopefully be solved in a clean way
      // when we have done the 'renderer' refactorings
      if (this.nodeTypes[node.type]) {
        var nodeView = this.viewFactory.createView(node);
        this.nodes[nodeId] = nodeView;
        el = nodeView.render().el;
        insertOrAppend(container, diff.pos, el);
      }
    }
    else if (diff.isDelete()) {
      // Dispose the view and remove its element from the nodes container
      nodeId = diff.val;
      if (this.nodes[nodeId]) {
        this.nodes[nodeId].dispose();
      }
      delete this.nodes[nodeId];
      children = container.children;
      container.removeChild(children[diff.pos]);
    }
    else if (diff.isMove()) {
      children = container.children;
      el = children[diff.pos];
      container.removeChild(el);
      insertOrAppend(container, diff.target, el);
    }
    else {
      throw new Error("Illegal state.");
    }
  };

};

_.extend(Surface.Prototype, util.Events.Listener);

Surface.Prototype.prototype = View.prototype;
Surface.prototype = new Surface.Prototype();

module.exports = Surface;
