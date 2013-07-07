(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;

  // Substance.Surface
  // ==========================================================================

  var Surface = function(options) {
    // Incoming
    this.document = options.document;

    // For outgoing events
    this.session = options.session;

    Substance.View.call(this);

    // Start building the initial stuff
    this.build();
  };


  Surface.Prototype = function() {

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
    };
  };

  Surface.Prototype.prototype = Substance.View.prototype;
  Surface.prototype = new Surface.Prototype();

  Substance.Surface = Surface;

})(this);
