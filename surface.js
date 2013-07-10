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

    // Start building the initial stuff
    this.build();

    this.$el.addClass('surface');

    this.$el.mouseup(function(e) {
      that.getSelection(e);
    });
  };

  Surface.Prototype = function() {

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




    // function select(start, length) {
    //   if (!active) return;

    //   var sel = window.getSelection(),
    //       range = document.createRange(),
    //       children = el.childNodes,
    //       numChild = children.length-1,
    //       isLastNode = start > numChild,
    //       startNode = isLastNode ? children[numChild] : children[start],
    //       endNode = length ? children[(start + length)] : startNode;

    //   if (children.length > 0) {
    //    // there is text in the container

    //     if (length) {
    //       // when a length is specified we select the following nodes inside the surface
    //       range.setStart(startNode, 0);

    //       // offset the end of the selection by the specified length
    //       for (var i = 0; i < length-1; i++) {
    //         if(startNode.nextSibling){ //only as long as there are existing nodes!
    //           var currNode = startNode.nextSibling;
    //           startNode = currNode;
    //         }
    //       };

    //       range.setEnd(startNode, 1);
    //     } else {

    //       range.selectNode(startNode);
    //       // Only collapse when the selection is not a range but one single char/position

    //       // if its last node we set cursor after the char by collapsing end
    //       // else we set it before by collapsing to start
    //       range.collapse(!isLastNode);
    //     }

    //   } else {
    //     // No characters left in the container
    //     range.setStart(el, 0);
    //     range.setEnd(el, 0);
    //   }

    //   sel.removeAllRanges();
    //   sel.addRange(range);

    //   that.trigger('selection:changed', that.selection());
    // }

    // Renders the current selection
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

      console.log('startNode', startNode);
      console.log('startChar', startChar);
      console.log('endNode', endNode);
      console.log('endChar', endChar);

      range.setStart(startChar, 0);
      range.setEnd(endChar, 0);

      console.log('set selection');

      if (sel.isCollapsed()) {
        range.setStart(startChar, 1);
        range.setEnd(endChar, 1);
        // range.collapse(true);
      } else {
        range.setStart(startChar, 0);
        range.setEnd(endChar, 0);
      }

      domSel.removeAllRanges();
      domSel.addRange(range);

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

      console.log('RENDERING');
      var that = this;

      this.$el.empty();
      _.each(this.document.getNodes(), function(n) {
        $(this.nodes[n.id].render().el).appendTo(this.$el);
      }, this);

      // _.delay(function() {
      //   // that.setSelection({
      //   //   start: [1, 10],
      //   //   end: [3, 1]
      //   // });
      //   // that.setSelection({
      //   //   start: [1, 4],
      //   //   end: [1, 4]
      //   // });
      //   console.log('CORRECT SELECTION AFTER RENDER', that.document.selection);
      //   // that.setSelection(that.document.selection);
      // }, 200);

      return this;
    };

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
