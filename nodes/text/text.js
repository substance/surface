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

      this.renderContent();
      return this;
    };

    this.dispose = function() {
      console.log('disposing text view');
      this.disposeHandlers();
    },

    this.renderContent = function() {
      // <% _.each(content.split(''), function(ch) { %>
      //   <span><%= ch %></span>
      // <% }); %>
      var chars = this.node.content.split('');

      var $content = this.$('.content').empty();

      // $content.append($('<div>MUH</div>'))
      _.each(chars, function(ch) {
        var pureCh = ch;

        if (ch === " ") ch = " ";
        // console.log(this.$('.content'));
        $content.append($('<span>'+ch+'</span>'));
      }, this);
    }
  };

  Text.Prototype.prototype = Substance.View.prototype;
  Text.prototype = new Text.Prototype();

  Substance.Text = Text;

})(this);
