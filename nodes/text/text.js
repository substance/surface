(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;

  // Substance.Text
  // ==========================================================================

  var Text = function(options) {
    Substance.View.call(this);
    this.node = options.node;
  };

  Text.Prototype = function() {

    // Rendering
    // =============================
    // 

    this.render = function(id) {
      this.$el.html(_.tpl('text', this.node));
      return this;
    };

    this.dispose = function() {
      console.log('disposing text view');
      this.disposeHandlers();
    }
  };

  Text.Prototype.prototype = Substance.View.prototype;
  Text.prototype = new Text.Prototype();

  Substance.Text = Text;

})(this);
