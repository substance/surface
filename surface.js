(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;
  var Operator = Substance.Operator;

  // Substance.Surface
  // ==========================================================================

  var Surface = function(doc) {
    Substance.View.call(this);

    var that = this;

    // Incoming
    this.document = doc;

    // For outgoing events
    // this.session = options.session;

    // Bind handlers to establish co-transformations on html elements
    // according to model properties
    this.viewAdapter = new Surface.ViewAdapter(this, this.el);
    this.nodeAdapter = this.onNodeContentUpdate.bind(this);

    this.document.on('selection:changed', this.renderSelection, this);
    this.document.onViewChange(this.viewAdapter);
    this.document.onTextNodeChange(this.nodeAdapter);

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

    // Read out current DOM selection and update selection in the model
    // ---------------

    this.updateSelection = function() {

      var indexOf = Array.prototype.indexOf;
      var sel = window.getSelection();

      if (sel.type === "None") return null;

      var range = sel.getRangeAt(0);

      var result = {};

      var contentView = this.document.getNodes("ids-only");

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
        var content = $(range.startContainer).parent().parent()[0];
        var nodeId = $(content).parent().attr('id');
        
        var nodeIndex = this.document.getPosition(nodeId);
        
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

        var content = range.startContainer;
        var nodeId = $(content).parent().attr('id');
        var nodeIndex = this.document.getPosition(nodeId);
        
        result["start"] = [nodeIndex, 0];
      }


      // CHECK END CONTAINER/OFFSET STUFF
      // ----------------
      
      if (range.isCollapsed) {
        result["end"] = result["start"];

      } else if (range.endContainer.nodeType === Node.TEXT_NODE) {
                
        // Extract content-node
        // 
        var content = $(range.endContainer).parent().parent()[0];
        var nodeId = $(content).parent().attr('id');
        
        var nodeIndex = this.document.getPosition(nodeId);
        
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

        var content = range.endContainer;
        var nodeId = $(content).parent().attr('id');
        var nodeIndex = this.document.getPosition(nodeId);
        
        result["end"] = [nodeIndex, 0];
      }

      this.document.select(result);

      return result;
    };


    // Renders the current selection
    // --------
    // 

    this.renderSelection = function() {

      var sel = this.document.selection;
      console.log('updateSelection called', sel);
      // return;

      if (!sel || sel.isNull()) return;
      var domSel = window.getSelection(),
          range = window.document.createRange();

      var startNode = this.$('.content-node')[sel.start[0]];
      var startChar = $(startNode).find('.content')[0].children[sel.start[1]];

      // FIXME: this crashes when selecting whole paragraph via triple-click
      var endNode = this.$('.content-node')[sel.end[0]];
      var endChar = $(endNode).find('.content')[0].children[sel.end[1]];

      console.log('SEL', sel);
      // console.log('startNode', startNode);
      console.log('startChar', startChar);
      // console.log('endNode', endNode);
      console.log('endChar', endChar);

      range.setStart(startChar, 0);
      range.setEnd(endChar, 0);

      console.log('set selection');

      if (sel.isCollapsed()) {
        range.setStart(startChar, 1);
        range.setEnd(startChar, 1);

        // Update cursor
        // range.collapse(true);
      } else {
        range.setStart(startChar, 0);
        range.setEnd(endChar, 0);
      }

      this.positionCursor();
      this.renderSelectionRange();

      this.positionCursor();

      domSel.removeAllRanges();
      domSel.addRange(range);

    };

    this.renderSelectionRange = function() {
      var sel = this.document.selection;

      console.log('rendering selection', sel);

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
      this.document.unbind("selection:changed", this.renderSelection);
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

    // Creates a new node view
    // --------
    // 

    this.createNodeView = function(node) {
      var Node = Surface.nodeTypes[node.type];
      if (!Node) throw new Error('Node type "'+node.type+'" not supported');
      return new Node(node);
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
