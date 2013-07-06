(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;

  // Composer Constructor
  // ==========================================================================

  var Text = function(options) {
    Substance.View.call(this, options);
  };

  // Does the same as
  // new View.prototype;
  Text.prototype = Object.create(Substance.View.prototype);
  Text.prototype.constructor = Text;


  // Rendering
  // ==========================================================================
  // 

  Text.prototype.render = function(id) {
    this.$el.html(_.tpl('text', this.model));
    return this;
  };

  Substance.Text = Text;

})(this);
