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

    this.nodeAdapter = function(op) {
      Surface.onNodeContentUpdate(that, op);
    };
    this.document.propertyChanges().bind(this.viewAdapter, {path: ["content", "nodes"]});
    this.document.propertyChanges().bind(this.nodeAdapter, {path: ["*", "content"]});


    // Start building the initial stuff
    this.build();

    this.$el.mouseup(function(e) {
      that.getSelection(e);
    });
  };


  Surface.Prototype = function() {

    this.getSelection = function(e, type) {
      var el = $(e.currentTarget);

      var indexOf = Array.prototype.indexOf;
      var sel = window.getSelection();
      if (sel.type === "None") return null;

      var range = sel.getRangeAt(0);
      var startContainer = range.startContainer;
      var endContainer = range.endContainer;

      var $startContainer = $(startContainer).parent().parent();
      var $endContainer = $(endContainer).parent().parent();

      var view = this.document.get('content').nodes;

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
      console.log('SELECTION', res);
      console.log('selected text', this.document.selection.getText());

      return res;
    };


    // Setup
    // =============================
    // 

    this.build = function() {
      this.nodes = {};

      var content = this.document.get('content');
      _.each(content.nodes, function(n) {
        var node = this.document.get(n);
        this.nodes[n] = new Substance.Text({node: node});
      }, this);
    };

    // Rendering
    // =============================
    // 

    this.render = function(id) {
      this.$el.empty();
      _.each(this.document.get('content').nodes, function(n) {
        $(this.nodes[n].render().el).appendTo(this.$el);
      }, this);
      return this;
    };

    this.dispose = function() {
      console.log('disposing surface');
      this.disposeHandlers();
      _.each(this.nodes, function(n) {
        n.dispose();
      }, this);

      // unbind document property change listeners
      this.document.propertyChanges().unbind(this.viewAdapter);
      this.document.propertyChanges().unbind(this.nodeAdapter);

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

  var TextNodeAdapter = function(node) {
    this.node = node;
  };

  TextNodeAdapter.__prototype__ = function() {
    this.insert = function(pos, str) {
      // TODO: delegate to the surface
      this.node.render();
    };

    this.delete = function(pos, length) {
      // TODO: delegate to the surface
      this.node.render();
    };

    this.get = function() {
      return this;
    };
  };

  TextNodeAdapter.__prototype__.prototype = Operator.TextOperation.StringAdapter.prototype;
  TextNodeAdapter.prototype = new TextNodeAdapter.__prototype__();


  // This listener function is used to handle "set" and "update" operations
  Surface.onNodeContentUpdate = function(surface, op) {
    if (op.type === "set") {
      // TODO: delegate to surface
      surface.nodes[op.path[0]].render();
    } else if (op.type === "update") {
      // Note: op.diff should be a text operation
      var adapter = new TextNodeAdapter(surface.nodes[op.path[0]]);
      op.diff.apply(adapter);
    }
  };


  Surface.ViewAdapter = ViewAdapter;

  Surface.Prototype.prototype = Substance.View.prototype;
  Surface.prototype = new Surface.Prototype();

  Substance.Surface = Surface;

})(this);
