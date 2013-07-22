"use_strict";

var _ = require('underscore');
var View = require('substance-application').View;
var Operator = require('substance-operator');

// Substance.Surface
// ==========================================================================

var Surface = function(writer) {
  View.call(this);

  var that = this;

  // Incoming events
  this.writer = writer;

  // Bind handlers to establish co-transformations on html elements
  // according to model properties
  this.viewAdapter = new Surface.ViewAdapter(this, this.el);
  this.nodeAdapter = this.onNodeContentUpdate.bind(this);

  this.writer.selection.on('selection:changed', this.renderSelection, this);
  this.writer.onViewChange(this.viewAdapter);
  this.writer.onTextNodeChange(this.nodeAdapter);
  this.writer.on('annotation:changed', this.renderAnnotation, this);

  this.cursor = $('<div class="cursor"></div>')[0];

  // Start building the initial stuff
  this.build();

  this.$el.addClass('surface');

  this.$el.mouseup(function(e) {
    that.updateSelection(e);
  });
};

// Registered Content types
Surface.nodeTypes = {};

// Must be called by node types for registratoin
// ---------------

Surface.registerContentType = function(key, clazz) {
  if (Surface.nodeTypes[key]) throw new Error('"'+key+'" node has already been registered');
  Surface.nodeTypes[key] = clazz;
};

Surface.Prototype = function() {

  // Private helpers
  // ---------------

  function childRange(el, start, end) {
    return Array.prototype.slice.call(el.childNodes, start, end);
  }


  // Renders all registered annotations
  // ---------------
  // 
  // TODO: find a way to render a delta, instead of everything

  this.renderAnnotations = function() {
    var writer = this.writer;
    var annotations = this.writer.getAnnotations();
    _.each(annotations, function(a) {
      this.renderAnnotation(a);
    }, this);
  };

  this.renderAnnotation = function(a) {
    var node = this.writer.get(a.node);
    var content = this.$('#'+node.id+' .content')[0];
    var chars = childRange(content, a.range[0], a.range[1]);
    $(chars).addClass(a.type);
  }

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

    var startNode = this.$('.content-node')[sel.start[0]];

    // Special case (position cursor after )
    var startChars = $(startNode).find('.content')[0].children;

    var startChar;
    if (sel.start[1] >= startChars.length) {
      startChar = _.last(startChars);
    } else {
      startChar = startChars[sel.start[1]];
    }


    // TODO: fix or remove. this block does nothing
    // if (!sel.isCollapsed()) {
    //   // FIXME: this crashes when selecting whole paragraph via triple-click
    //   var endNode = this.$('.content-node')[sel.end[0]];
    //   var endOffset = 0;
    //   var chars = $(endNode).find('.content')[0].children;

    //   // Edge case last char is selected
    //   // Use startChar as endChar but with offset 1
    //   // <span>a</span>
    //   // <span>a</span>
    //   // <span>a</span> <--

    //   if (sel.end[1] >= chars.length) {
    //     endChar = _.last(chars);
    //     endOffset = 1;
    //   } else {
    //     endChar = chars[sel.end[1]];
    //   }
    // }

    this.positionCursor();

    this.renderSelectionRange();

  };

  this.renderSelectionRange = function() {
    var sel = this.writer.selection;

    // Do nothing if selection is collapsed
    this.$('span.selected').removeClass('selected');
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
            top: 0
          };
        }
      } else {
        ch = chars[sel.end[1]];
        pos = $(ch).position();
      }

      if (ch) {
        $(ch).append(this.cursor);
      } else {
        $(node).append(this.cursor);
      }

      $(this.cursor).css({
        top: pos.top,
        left: pos.left,
        height: '20px'
      });
    }
  };


  // Setup
  // =============================
  //

  this.build = function() {
    this.nodes = {};

    //TODO: rethink. Is this dependency to document intentional
    var nodes = this.writer.getNodes();
    _.each(nodes, function(node) {
      this.nodes[node.id] = new Surface.nodeTypes["text"](node);
    }, this);
  };

  // Rendering
  // =============================
  //

  this.render = function() {
    this.$el.empty();
    _.each(this.writer.getNodes(), function(n) {
      $(this.nodes[n.id].render().el).appendTo(this.$el);
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

    // unbind document property change listeners
    this.writer.selection.unbind("selection:changed", this.renderSelection);
    this.writer.unbind(this.viewAdapter);
    this.writer.unbind(this.nodeAdapter);
    this.writer.unbind(this.renderAnnotation);
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


// Content View Adapter
// --------
// Adapter that maps model operations to changes on the according html element
//

var ViewAdapter = function(surface, el) {
  this.surface = surface;
  this.container = el;
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

  // Creates a new node view
  // --------
  //

  this.createNodeView = function(node) {
    var Node = Surface.nodeTypes[node.type];
    if (!Node) throw new Error('Node type "'+node.type+'" not supported');
    return new Node(node);
  };

  this.insert = function(pos, val) {
    var writer = this.surface.writer;
    var nodes = this.surface.nodes;
    var id = val;

    var nodeView = this.createNodeView(writer.get(id));
    var el = nodeView.render().el;
    nodes[id] = nodeView;

    insertOrAppend(this.container, pos, el);
  };

  this.delete = function(pos, nodeId) {
    var nodes = this.surface.nodes;
    var childs = this.container.childNodes;

    this.container.removeChild(childs[pos]);
    var view = nodes[nodeId];
    view.dispose();
    delete nodes[nodeId];
  };

  this.move = function(val, oldPos, newPos) {
    var childs = this.container.childNodes;

    var el = childs[oldPos];
    this.container.removeChild(el);
    insertOrAppend(this.container, newPos, el);
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
