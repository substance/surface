(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;

  // Substance.Surface
  // ==========================================================================

  var Surface = function(options) {
    Substance.View.call(this, options);

    // Start building the initial stuff
    this.build();

    // Action handlers
    // --------

    this.handle('delete', this.delete);
    this.handle('copy', this.copy);
    this.handle('paste', this.paste);
    this.handle('undo', this.undo);
    this.handle('redo', this.redo);
    
    
  };

  // Does the same as
  // new View.prototype;
  Surface.prototype = Object.create(Substance.View.prototype);
  Surface.prototype.constructor = Surface;


  // Handle Events
  // ==========================================================================
  // 

  Surface.prototype.delete = function(e) {
    console.log('deleting selection...', e);
    // this.model.delete();
    e.preventDefault();
  };

  Surface.prototype.copy = function(e) {
    console.log('copying selection...');
    // this.model.copy();
    e.preventDefault();
  };

  Surface.prototype.paste = function(e) {
    console.log('pasting at current selection...');
    // TODO: checkout clipboard
    var content = this.session.clipboard;
    // this.model.paste();
    e.preventDefault();
  };

  Surface.prototype.undo = function(e) {
    console.log('undoing...');
    // this.model.undo();
    e.preventDefault();
  };

  Surface.prototype.redo = function(e) {
    console.log('redoing...');
    // this.model.redo();
    e.preventDefault();
  };


  // Rendering
  // ==========================================================================
  // 


  Surface.prototype.build = function() {
    this.nodes = {};

    var content = this.model.get('content');
    _.each(content.nodes, function(n) {
      var node = this.model.get(n);
      this.nodes[n] = new Substance.Text({model: node, session: this.session});
    }, this);
  };

  Surface.prototype.render = function(id) {
    this.$el.empty();

    _.each(this.model.get('content').nodes, function(n) {
      $(this.nodes[n].render().el).appendTo(this.$el);
    }, this);

    return this;
  };

  Substance.Surface = Surface;

})(this);
