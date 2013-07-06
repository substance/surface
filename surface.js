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

    // this.handle('delete', this.delete);
    // this.handle('undo', this.undo);
    // this.handle('redo', this.redo);
    // this.handle('copy', this.copy);
    // this.handle('paste', this.paste);
  };

  // Does the same as
  // new View.prototype;
  Surface.prototype = Object.create(Substance.View.prototype);
  Surface.prototype.constructor = Surface;

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
