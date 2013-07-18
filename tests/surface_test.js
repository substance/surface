(function(root) {

var _,
    Surface,
    Document,
    Writer;

if (typeof exports !== 'undefined') {
  throw new Error("Surface does not support Node.");
} else {
  _ = root._;
  Surface = root.Substance.Surface;
  Document = root.Substance.Document;
  Writer = root.Substance.Document.Writer;
}

var ID_IDX = 1;

var SurfaceTest = function() {

  this.uuid = function(prefix) {
    prefix = prefix || "node_";
    return prefix+(ID_IDX++);
  };

  this.next_uuid = function() {
    return ID_IDX;
  };

  this.op = function(idx) {
    this.comp[OP(idx)](VAL(idx));
  };

  this.setup = function() {
    ID_IDX = 1;

    this.__document = new Document({id: "surface_test"});
    this.writer = new Writer(this.__document);

    this.surface = new Surface(this.writer);

    $('.test-center .test-output').show();
    $('.test-center .test-output').html(this.surface.el);

    this.fixture();
  };

  this.insertContent = function(content) {
    var id = this.uuid("text_");
    this.__document.apply(["create", {
      "id": id,
      "type": "text",
      "content": content
    }]);
    this.__document.apply(["position", "content", {
      "nodes": [id],
      "target": -1
    }]);
  };

  // Verify state
  // -----------
  // 
  // Checks if the produced output of the Surface reflects
  // The given document state
  // 

  this.verify = function() {
    console.log('verifying..');
  };

  this.verifySelection = function() {
    console.log('verifying selection..');
  };

  // Load fixture
  // --------

  this.fixture = function() {
    // TODO: Load some initial seed
  };
};

// Export
// ====

root.Substance.Surface.AbstractTest = SurfaceTest;

})(this);
