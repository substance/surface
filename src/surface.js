"use strict";

var _ = require("underscore");
var View = require("substance-application").View;
var util = require("substance-util");
var Commander = require("substance-commander");

// Substance.Surface
// ==========================================================================

var Surface = function(docCtrl, options) {

  options = _.extend({
    editable: true
  }, options);

  View.call(this);
  var that = this;

  this.options = options;
  this.docCtrl = docCtrl;
  this.document = docCtrl.getDocument();

  if (this.options.viewFactory) {
    this.viewFactory = this.options.viewFactory;
  } else {
    this.viewFactory = new this.document.constructor.ViewFactory(doc);
  }

  // Pull out the registered nodetypes on the written article
  this.nodeTypes = this.document.nodeTypes;

  this.listenTo(this.docCtrl.selection,  "selection:changed", this.renderSelection);
  this.listenTo(this.document, "property:updated", this.onUpdateView);
  this.listenTo(this.document, "graph:reset", this.reset);

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');

  // Shouldn't this be done outside?
  this.$el.addClass(this.docCtrl.view);

  // The editable surface responds to selection changes

  if (options.editable) {

    this.el.setAttribute("contenteditable", "true");
    this.el.spellcheck = false;

    this.$el.mouseup(function(e) {
      this.ignoreNextSelection = true;
      this.updateSelection(e);
    }.bind(this));

    this.$el.delegate('img', 'click', function(e) {
      var $el = $(e.currentTarget).parent().parent().parent();
      var nodeId = el.dataset.id;
      that.doc.selection.selectNode(nodeId);
      return false;
    });

    this._dirt = [];

    this._onKeyDown = function() {
      this._dirtPossible = true;
    }.bind(this);

    this._onTextInput = function(e) {
      //console.log("textinput", e);
      this._dirtPossible = false;
      while (this._dirt.length > 0) {
        var dirt = this._dirt.shift();
        dirt[0].textContent = dirt[1];
      }
      this.docCtrl.write(e.data);
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

    // TODO: many combinations which would probably be easy to handle
    // using the native event...
    this.keyboard = new Commander.Mousetrap();
    this.keyboard.bind([
        "up", "down", "left", "right",
        "shift+up", "shift+down", "shift+left", "shift+right",
        "ctrl+up", "ctrl+down", "ctrl+left", "ctrl+right",
        "ctrl+shift+up", "ctrl+shift+down", "ctrl+shift+left", "ctrl+shift+right",
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
      if ($(current).is(".content-node")) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
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
    // console.log("Surface.updateSelection()");
    var wSel = window.getSelection();

    // HACK: sometimes it happens that the selection anchor node is undefined.
    // Try to understand and fix someday.
    if (wSel.anchorNode === null) {
      return;
    }

    // Set selection to the cursor if clicked on the cursor.
    if ($(wSel.anchorNode.parentElement).is(".cursor")) {
      this.docCtrl.selection.collapse("cursor");
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
    var startNodePos = this.docCtrl.getPosition(startNodeId) ;
    var startCharPos = this.nodes[startNodeId].getCharPosition(wStartPos[0], wStartPos[1]);

    var endNodeId = endNode.getAttribute("id");
    var endNodePos = this.docCtrl.getPosition(endNodeId);
    var endCharPos = this.nodes[endNodeId].getCharPosition(wEndPos[0], wEndPos[1]);

    // the selection range in Document.Selection coordinates
    var startPos = [startNodePos, startCharPos];
    var endPos = [endNodePos, endCharPos];

    this.docCtrl.selection.set({start: startPos, end: endPos});
  };


  // Renders the current selection
  // --------
  //

  this.renderSelection = function() {

    if (this.ignoreNextSelection === true) {
      this.ignoreNextSelection = false;
      return;
    }

    if (this.docCtrl.selection.isNull()) {
      this.$cursor.hide();
      return;
    }

    // Hide native selection in favor of our custom one
    var wSel = window.getSelection();

    var range = this.docCtrl.selection.range();
    var startNode = this.docCtrl.getNodeFromPosition(range.start[0]);
    var startNodeView = this.nodes[startNode.id];
    var wStartPos = startNodeView.getDOMPosition(range.start[1]);

    var endNode = this.docCtrl.getNodeFromPosition(range.end[0]);
    var endNodeView = this.nodes[endNode.id];
    var wEndPos = endNodeView.getDOMPosition(range.end[1]);

    var wRange = document.createRange();
    wRange.setStart(wStartPos.startContainer, wStartPos.startOffset);
    wRange.setEnd(wEndPos.endContainer, wEndPos.endOffset);
    wSel.removeAllRanges();
    wSel.addRange(wRange);

  };

  // Setup
  // --------
  //

  this.build = function() {
    _.each(this.nodes, function(nodeView) {
      nodeView.dispose();
    });
    this.nodes = {};
    var frag = document.createDocumentFragment();
    var docNodes = this.docCtrl.container.getTopLevelNodes();
    _.each(docNodes, function(n) {
      var view = this.renderNodeView(n);
      this.nodes[n.id] = view;
      frag.appendChild(view.el);
    }, this);
    return frag;
  };

  this.renderNodeView = function(n) {
    var view = this.viewFactory.createView(n);
    view.render();
    return view;
  };


  // Render it
  // --------
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

    // Actual content goes here
    // --------
    //
    nodes.appendChild(this.build());

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
  };

  // TODO: we could factor this out into something like a ContainerView?

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
      node = this.docCtrl.get(nodeId);
      // TODO: this will hopefully be solved in a clean way
      // when we have done the 'renderer' refactorings
      if (this.nodeTypes[node.type]) {
        var nodeView = this.renderer.createView(node);
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
    } else if (diff.type === "NOP") {
    } else {
      throw new Error("Illegal state.");
    }
  };

  this.findNodeView = function(nodeId) {
    return this.el.querySelector('*[data-id='+nodeId+']');
  };
};

_.extend(Surface.Prototype, util.Events.Listener);

Surface.Prototype.prototype = View.prototype;
Surface.prototype = new Surface.Prototype();

module.exports = Surface;
