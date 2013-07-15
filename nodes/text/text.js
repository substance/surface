(function(root) { "use_strict";

  var _ = root._;
  var Substance = root.Substance;
  var util = Substance.util;
  var Surface = Substance.Surface;

  // Substance.Text
  // ==========================================================================

  var Text = function(node) {
    Substance.View.call(this);
    this.node = node;

    this.$el.addClass('content-node text');
    this.$el.attr('id', this.node.id);
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
      var $content = this.$('.content').empty();
      this.insert(0, this.node.content);
    },

    this.insert = function(pos, str) {
      var content = this.$('.content')[0];

      // TODO: explain why this whitespace thingie is necessary
      var chars = str.split('');
      var charEls = _.map(chars, function(ch) {
        if (ch === " ") ch = " ";
        return $('<span style="white-space: pre-wrap;">'+ch+'</span>')[0];
      });

      var spans = content.childNodes;
      if (pos >= spans.length) {
        for (var i = 0; i < charEls.length; i++) {
          content.appendChild(charEls[i]);
        }
      } else {
        var refNode = spans[pos];
        for (var i = 0; i < charEls.length; i++) {
          content.insertBefore(charEls[i], refNode);
        }
      }
    };

    this.delete = function(pos, length) {
      var content = this.$('.content')[0];
      var spans = content.childNodes;
      for (var i = length - 1; i >= 0; i--) {
        content.removeChild(spans[pos+i]);
      }
    };
  };

  Text.Prototype.prototype = Substance.View.prototype;
  Text.prototype = new Text.Prototype();

  Substance.Text = Text;

  // Register
  Surface.registerContentType("text", Text);
})(this);
