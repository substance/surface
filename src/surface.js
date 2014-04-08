"use strict";

var _ = require("underscore");
var $ = window.$;

var View = require("substance-application").View;
var util = require("substance-util");

// Note: Surface errors have codes between 500-599
var SurfaceError = util.errors.define("SurfaceError", 500);
var SelectionError = util.errors.define("SelectionError", 501, SurfaceError);

// Substance.Surface
// ==========================================================================

var Surface = function(docCtrl, renderer) {
  View.call(this);

  // Rename docCtrl to surfaceCtrl ?
  this.docCtrl = docCtrl;
  this.renderer = renderer;
  this.document = docCtrl.session.document;

  // Pull out the registered nodetypes on the written article
  this.nodeTypes = this.document.nodeTypes;
  this.nodeViews = this.renderer.nodeViews;

  this.$el.addClass('surface');

  this.listenTo(this.document, "property:updated", this.onUpdateView);
  this.listenTo(this.document, "graph:reset", this.reset);
};


Surface.Prototype = function() {

  var _selectionOptions = { "source": "surface" };

  // Private helpers
  // ---------------

  var _extractPath = function(el) {
    var path = [];
    var current = el;

    while(current) {

      // if available extract a path fragment
      if (current.getAttribute) {
        // Stop when we find an element which has been made read-only
        if (current.getAttribute("contenteditable") === "false") {
          return null;
        }

        // if there is a path attibute we collect it
        var p = current.getAttribute("data-path");
        if (p) path.unshift(p);
      }

      // node-views
      if ($(current).is(".content-node")) {
        var id = current.getAttribute("id");
        if (!id) {
          throw new Error("Every element with class 'content-node' must have an 'id' attribute.");
        }
        path.unshift(id);

        // STOP here
        return path;
      }

      current = current.parentElement;
    }

    return null;
  };

  var _mapDOMCoordinates = function(el, offset) {
    var pos, charPos;

    var container = this.docCtrl.container;

    // extract a path by looking for ".content-node" and ".node-property"
    var elementPath = _extractPath(el);

    if (!elementPath) {
      return null;
    }

    // get the position from the container
    var component = container.lookup(elementPath);
    if (!component) return null;

    // TODO rethink when it is a good time to attach the view to the node surface
    // FIXME: here we have a problem now. The TextSurface depends on the TextView
    // which can not be retrieved easily.
    if (!component.surface.hasView()) {
      this._attachViewToNodeSurface(component);
    }
    if (!component.surface.hasView()) {
      throw new Error("NodeView.attachView() must propagate down to child views.");
    }

    pos = component.pos;
    charPos = component.surface.getCharPosition(el, offset);

    return [pos, charPos];
  };

  // Read out current DOM selection and update selection in the model
  // ---------------

  this.updateSelection = function(/*e*/) {
    try {
      var wSel = window.getSelection();

      // HACK: sometimes it happens that the selection anchor node is undefined.
      // Try to understand and fix someday.
      if (wSel.anchorNode === null) {
        // invalid selection.
        // This happens if you click something strange
        // Decided to take the user serious and invalidate the selection
        this.clearModelSelection();
        return;
      }

      // Set selection to the cursor if clicked on the cursor.
      if ($(wSel.anchorNode.parentElement).is(".cursor")) {
        this.docCtrl.selection.collapse("cursor", _selectionOptions);
        return;
      }

      var wRange = wSel.getRangeAt(0);
      var wStartPos;
      var wEndPos;

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

      // Note: we clear the selection whenever we can not map the window selelection
      // can not be mapped to model coordinates.

      var startPos = _mapDOMCoordinates.call(this, wStartPos[0], wStartPos[1]);
      if (!startPos) {
        wSel.removeAllRanges();
        this.clearModelSelection();
        return;
      }

      var endPos;
      if (wRange.collapsed) {
        endPos = startPos;
      } else {
        endPos = _mapDOMCoordinates.call(this, wEndPos[0], wEndPos[1]);
        if (!endPos) {
          wSel.removeAllRanges();
          this.clearModelSelection();
          return;
        }
      }

      // console.log("Surface.updateSelection()", startPos, endPos);
      this.docCtrl.selection.set({start: startPos, end: endPos}, _selectionOptions);

    } catch (error) {
      // On errors clear the selection and report
      util.printStackTrace(error);
      console.error(error);

      var err = new SelectionError("Could not map to model cordinates.", error);
      this.clearModelSelection();
      this.docCtrl.trigger("error", err);
    }
  };


  // Renders the current selection
  // --------
  //

  var _mapModelCoordinates = function(pos) {
    var container = this.docCtrl.container;
    var component = container.getComponent(pos[0]);
    // TODO rethink when it is a good time to attach the view to the node surface
    if (!component.surface.hasView()) {
      this._attachViewToNodeSurface(component);
    }
    var wCoor = component.surface.getDOMPosition(pos[1]);
    return wCoor;
  };

  this._attachViewToNodeSurface = function(component) {
    var nodeId = component.root.id;
    var topLevelSurface = component.surface.surfaceProvider.getNodeSurface(nodeId);
    var topLevelView = this.nodeViews[nodeId];
    topLevelSurface.attachView(topLevelView);
  };

  this.renderSelection = function(range, options) {
    try {
      if (options && (options["source"] === "surface" || options["silent"] === true)){
        return;
      }

      var sel = this.docCtrl.selection;
      var wSel = window.getSelection();
      wSel.removeAllRanges();

      if (sel.isNull()) {
        return;
      }

      var wRange = window.document.createRange();
      var wStartPos = _mapModelCoordinates.call(this, sel.start);
      wRange.setStart(wStartPos.startContainer, wStartPos.startOffset);

      // TODO: is there a better way to manipulate the current selection?
      wSel.addRange(wRange);

      // Move the caret to the end position
      // Note: this is the only way to get reversed selections.
      if (!sel.isCollapsed()) {
        var wEndPos = _mapModelCoordinates.call(this, [sel.cursor.pos, sel.cursor.charPos]);
        wSel.extend(wEndPos.endContainer, wEndPos.endOffset);
      }

      this.scrollToCursor();

    } catch (error) {
      // On errors clear the selection and report
      var err = new SelectionError("Could not map to DOM cordinates.", error);

      this.clearModelSelection();
      this.docCtrl.trigger("error", err);
    }
  };

  this.clearModelSelection = function() {
    // leave a mark that the surface will not handle the returning selection update
    this.docCtrl.selection.clear(_selectionOptions);
  }

  this.scrollToCursor = function() {
    var sel = this.docCtrl.selection;

    // Not exactly beautiful but ensures the cursor is always stays in view
    // E.g. when hitting enter on the lower document bound
    if (sel.isCollapsed()) {
      var that = this;

      // Wait for next DOM iteration
      window.setTimeout(function() {
        // Look up parent node if startContainer is a text node
        var topCorrection = $(that.el).offset().top;

        var wSel = window.getSelection();
        var range = wSel.getRangeAt(0);
        var bounds = range.getClientRects()[0];

        if (!bounds) {
          // This happens when the cursor is in an empty node
          // However, that is not a problem as we can use the container then
          bounds = $(range.startContainer).offset();
        }

        var topOffset = bounds.top - topCorrection;
        var surfaceHeight = $(that.el).height();

        var scrollTop = $(that.el).scrollTop();
        var lineHeight = 50;

        var targetScroll;
        if (topOffset>surfaceHeight) {
          targetScroll = scrollTop + topOffset - surfaceHeight + lineHeight;
          $(that.el).scrollTop(targetScroll);
          // console.log("Scrolling to", targetScroll);
        } else if (topOffset < 0) {
          targetScroll = scrollTop + topOffset - 3*lineHeight;
          $(that.el).scrollTop(targetScroll);
          // console.log("Scrolling to", targetScroll);
        } else {
          // console.log("Not scrolling ...", topOffset, surfaceHeight);
        }

      }, 0);
    }
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

    var controls = window.document.createElement('div');
    controls.className = "controls";
    var nodes = window.document.createElement('div');
    nodes.className = "nodes";

    var cursor = window.document.createElement('div');
    cursor.className = "cursor";

    this.el.appendChild(controls);
    this.el.appendChild(nodes);
    this.el.appendChild(cursor);

    // Actual content goes here
    // --------
    //
    // We get back a document fragment from the renderer

    nodes.appendChild(this.renderer.render());

    // TODO: fixme
    this.$('input.image-files').hide();
    this.$cursor = this.$('.cursor');
    this.$cursor.hide();

    // keep the nodes for later access
    this._nodesEl = nodes;

    return this;
  };

  this.reset = function() {
    _.each(this.nodeViews, function(nodeView) {
      nodeView.dispose();
    });
    this.render();
  };

  // Cleanup view before removing it
  // --------
  //

  this.dispose = function() {
    this.stopListening();
    _.each(this.nodeViews, function(n) {
      n.dispose();
    }, this);
    if (this.keyboard) this.keyboard.disconnect(this.el);
  };

  // HACK: used by outline
  // TODO: meditate on the Surface's API
  this.getContainer = function() {
    return this.docCtrl.container;
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
    if (path.length !== 2 || path[0] !== this.docCtrl.session.container.name || path[1] !== "nodes") return;

    var nodeId, node;
    var container = this._nodesEl;

    var children, el;

    if (diff.isInsert()) {
      // Create a view and insert render it into the nodes container element.
      nodeId = diff.val;
      node = this.document.get(nodeId);
      // TODO: this will hopefully be solved in a clean way
      // when we have done the 'renderer' refactorings
      if (this.nodeTypes[node.type]) {
        var nodeView = this.renderer.createView(node);
        this.nodeViews[nodeId] = nodeView;
        el = nodeView.render().el;
        insertOrAppend(container, diff.pos, el);
      }
    }
    else if (diff.isDelete()) {
      // Dispose the view and remove its element from the nodes container
      nodeId = diff.val;
      if (this.nodeViews[nodeId]) {
        this.nodeViews[nodeId].dispose();
      }
      delete this.nodeViews[nodeId];
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

};

_.extend(Surface.Prototype, util.Events.Listener);

Surface.Prototype.prototype = View.prototype;
Surface.prototype = new Surface.Prototype();

Object.defineProperties(Surface.prototype, {
  "name": {
    get: function() {
      return this.docCtrl.session.container.name;
    }
  }
});

module.exports = Surface;
