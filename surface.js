(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;
  var Operator = Substance.Operator;

  // Substance.Surface
  // ==========================================================================

  var Surface = function(options) {
    Substance.View.call(this);

    var that = this;
    // Incoming
    this.document = options.document;

    // For outgoing events
    this.session = options.session;

    // Bind handlers to establish co-transformations on html elements
    // according to model properties
    this.viewAdapter = new Surface.ViewAdapter(this, this.el);
    this.nodeAdapter = this.onNodeContentUpdate.bind(this);

    this.document.on('selection:changed', this.updateSelection, this);
    this.document.onViewChange(this.viewAdapter);
    this.document.onTextNodeChange(this.nodeAdapter);


    this.cursor = $('<div class="cursor"></div>')[0];

    // Start building the initial stuff
    this.build();

    this.$el.addClass('surface');

    this.$el.mouseup(function(e) {
      that.getSelection(e);
    });
  };

  Surface.Prototype = function() {

    // Private helpers
    // ---------------

    function childRange(el, start, end) {
      return Array.prototype.slice.call(el.childNodes, start, end);
    }


    // Read out current DOM selection and mapit to the corresponding Document.Range
    // ---------------

    this.getSelection = function() {

      var indexOf = Array.prototype.indexOf;
      var sel = window.getSelection();
      if (sel.type === "None") return null;

      var range = sel.getRangeAt(0);
      var startContainer = range.startContainer;
      var endContainer = range.endContainer;

      var $startContainer = $(startContainer).parent().parent();
      var $endContainer = $(endContainer).parent().parent();

      var view = this.document.getNodes("ids-only");

      var startNode = view.indexOf($startContainer.parent().attr('id'));
      var startChar = startContainer.parentElement;
      var startOffset = startContainer.nodeType === 3 ? indexOf.call($startContainer[0].childNodes, startChar) : 0;
      var res;

      // Trivial case: the range is singular
      if (sel.isCollapsed) {
        res = {
          start: [startNode, startOffset],
          end: [startNode, startOffset],
        };
      } else {
        var endNode = view.indexOf($endContainer.parent().attr('id'));
        // console.log('ENDNODE', $endContainer.parent().attr('id'));
        var endChar = endContainer.parentElement;
        var endOffset = indexOf.call($endContainer[0].childNodes, endChar) + 1;
        // startContainer.nodeType === 3 ? indexOf.call($startContainer.childNodes, parent) : 0;

        // There's an edge case at the very beginning
        if (range.startOffset !== 0) startOffset += 1;
        if (range.startOffset > 1) startOffset = range.startOffset;

        res = {
          start: [startNode, startOffset],
          end: [endNode, endOffset],
        };
      }

      this.document.select(res);

      return res;
    };


    // Renders the current selection
    // --------
    // 

    this.updateSelection = function() {
      var sel = this.document.selection;
      if (!sel || sel.isNull()) return;
      var domSel = window.getSelection(),
          range = window.document.createRange();

      var startNode = this.$('.content-node')[sel.start[0]];
      var startChar = $(startNode).find('.content')[0].children[sel.start[1]];

      // FIXME: this crashes when selecting whole paragraph via triple-click
      var endNode = this.$('.content-node')[sel.end[0]];
      var endChar = $(endNode).find('.content')[0].children[sel.end[1]];

      // console.log('startNode', startNode);
      // console.log('startChar', startChar);
      // console.log('endNode', endNode);
      // console.log('endChar', endChar);

      range.setStart(startChar, 0);
      range.setEnd(endChar, 0);

      console.log('set selection');

      if (sel.isCollapsed()) {
        range.setStart(startChar, 1);
        range.setEnd(endChar, 1);

        // Update cursor
        // range.collapse(true);
      } else {
        range.setStart(startChar, 0);
        range.setEnd(endChar, 0);
      }

      this.positionCursor();
      this.renderSelection();

      this.positionCursor();

      domSel.removeAllRanges();
      domSel.addRange(range);

    };

    this.renderSelection = function() {
      var sel = this.document.selection;

      // Do nothing if selection is collapsed
      if (sel.isCollapsed()) return;

      function selectChars(chars) {
        $(chars).addClass('selected');
      };

      this.$('span.selected').removeClass('selected');

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
    }

    // Position cursor and selection
    // --------
    // 

    this.positionCursor = function() {
      var sel = this.document.selection;

      $(this.cursor).remove();
      if (sel.isCollapsed()) {
        var node = this.$('.content-node')[sel.end[0]];
        var ch = $(node).find('.content')[0].children[sel.end[1]];
        $(ch).append(this.cursor);
      }
    };


    // Setup
    // =============================
    //

    this.build = function() {
      this.nodes = {};

      //TODO: rethink. Is this dependency to document intentional
      var nodes = this.document.getNodes();
      _.each(nodes, function(node) {
        this.nodes[node.id] = new Substance.Text({node: node});
      }, this);
    };

    // Rendering
    // =============================
    //

    this.render = function(id) {
      this.$el.empty();
      _.each(this.document.getNodes(), function(n) {
        $(this.nodes[n.id].render().el).appendTo(this.$el);
      }, this);

      return this;
    };

    // Cleanup view before removing it
    // --------
    // 

    this.dispose = function() {
      console.log('disposing surface');
      this.disposeHandlers();
      _.each(this.nodes, function(n) {
        n.dispose();
      }, this);

      // unbind document property change listeners
      this.document.unbind("selection:changed", this.updateSelection);
      this.document.unbind(this.viewAdapter);
      this.document.unbind(this.nodeAdapter);

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

    this.createNodeView = function(node) {
      return Substance.Composer.views.Node.create({
        document: this.surface.document,
        model: node
      });
    };

    this.insert = function(pos, val) {
      var doc = this.surface.document;
      var nodes = this.surface.nodes;
      // var container = this.el;
      var id = val;

      var nodeView = this.createNodeView(doc.get(id));
      var el = nodeView.render().el;
      nodes[id] = nodeView;

      insertOrAppend(this.container, pos, el);
    };

    this.delete = function(pos, nodeId) {
      var nodes = this.documentView.nodes;
      // var container = this.container;
      var childs = this.container.childNodes;

      this.container.removeChild(childs[pos]);
      var view = nodes[nodeId];
      view.dispose();
      delete nodes[nodeId];
    };

    this.move = function(val, oldPos, newPos) {
      // var container = $(this.containerSel)[0];
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

  Surface.Prototype.prototype = Substance.View.prototype;
  Surface.prototype = new Surface.Prototype();

  Substance.Surface = Surface;

})(this);
