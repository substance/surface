describe("Surface API", function() {

  function selectSurface () {
    return document.getElementsByClassName('content')[0];
  }

  var surface,
      elem;

  beforeEach(function() {
    elem = selectSurface();
    // initialize a new surface
    surface = new Substance.Surface({
        el: elem,
        content: "Scooby Doo!"
      });
  });


  // START TESTING API
  
  describe(".insertCharacter", function() {

    // testing surface content
    it("should update the Surface content when inserting a character", function() {
      surface.insertCharacter('!', 6);
      expect(surface.content).toBe('Scooby! Doo!');
    });

    // testing DOM state
    it("should update the DOM when inserting a character", function() {
      surface.insertCharacter('!', 6);
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span>S</span><span>c</span><span>o</span><span>o</span><span>b</span><span>y</span><span>!</span><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>!</span>');
    });

  });

  describe(".addNewline", function() {

    // testing surface content
    it("should insert a new line in the current position", function() {
      elem = selectSurface();
      elem.focus();
      surface.select(6);
      surface.addNewline();
      expect(surface.content).toBe('Scooby\n Doo!');
    });

    // // testing DOM state
    it("should update the DOM when inserting a character", function() {
      elem = selectSurface();
      elem.focus();
      surface.select(6);
      surface.addNewline();
      expect(elem.innerHTML).toBe('<span>S</span><span>c</span><span>o</span><span>o</span><span>b</span><span>y</span><br><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>!</span>');
    });

  });

  describe(".insertText", function() {

    // testing surface content
    it("should update the Surface content when inserting a string", function() {
      surface.insertText('Dooby ', 7);
      expect(surface.content).toBe('Scooby Dooby Doo!');
    });

    // testing DOM state
    it("should update the DOM when when inserting a string", function() {
      surface.insertText('Dooby ', 7);
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span>S</span><span>c</span><span>o</span><span>o</span><span>b</span><span>y</span><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>b</span><span>y</span><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>!</span>');
    });

  });

  describe(".insertAnnotation", function() {

    // testing surface content
    it("should create annotation at given position", function() {
      var ann1 = { id: "annotation-1", type: "str", pos: [0,6] };
      var ann2 = { id: "annotation-2", type: "em", pos: [7,3] };
      surface.insertAnnotation(ann1);
      surface.insertAnnotation(ann2);
      expect(surface.annotations).toEqual({ "annotation-1":ann1, "annotation-2":ann2 });
    });

    // testing DOM state
    it("should update the DOM when creating annotation at given position", function() {
      var ann = { id: "annotation-1", type: "str", pos: [0,6] };
      surface.insertAnnotation(ann);
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span class="str">S</span><span class="str">c</span><span class="str">o</span><span class="str">o</span><span class="str">b</span><span class="str">y</span><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>!</span>');
    });

  });

  describe(".updateAnnotation", function() {

    // testing surface content
    it("should update a given annotation", function() {
      var ann = { id: "annotation-1", type: "str", pos: [0,6] };
      surface.insertAnnotation(ann);
      ann.type = 'em';
      surface.updateAnnotation(ann);
      expect(surface.annotations).toEqual({ "annotation-1":ann});
    });

    // testing DOM state
    it("should update the DOM when updating annotations", function() {
      var ann = { id: "annotation-1", type: "str", pos: [0,6] };
      surface.insertAnnotation(ann);
      ann.type = 'em';
      surface.updateAnnotation(ann);
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span class="em">S</span><span class="em">c</span><span class="em">o</span><span class="em">o</span><span class="em">b</span><span class="em">y</span><span>&nbsp;</span><span>D</span><span>o</span><span>o</span><span>!</span>');
    });

  });

  describe(".getAnnotations", function() {

    // testing surface content
    it("should return matching annotations for a specified position/range", function() {
      var ann1 = { id: "annotation-1", type: "str", pos: [0,6] };
      var ann2 = { id: "annotation-2", type: "em", pos: [7,3] };
      surface.insertAnnotation(ann1);
      surface.insertAnnotation(ann2);

      expect(surface.getAnnotations([0, 11], ['em'])).toEqual([ ann2 ]);
      expect(surface.getAnnotations([0, 11], ['str'])).toEqual([ ann1 ]);
      expect(surface.getAnnotations([0, 11], ['str', 'em'])).toEqual([ ann1 , ann2]);
    });

  });

  describe(".deleteAnnotation", function() {

    // testing surface content
    it("should delete specified annotation", function() {
      var ann1 = { id: "annotation-1", type: "str", pos: [0,6] };
      var ann2 = { id: "annotation-2", type: "em", pos: [7,3] };
      surface.insertAnnotation(ann1);
      surface.insertAnnotation(ann2);
      surface.deleteAnnotation("annotation-1");
      expect(surface.getAnnotations()).toEqual( {"annotation-2": ann2} );
    });


    // testing DOM state
    it("should update the DOM when deleting annotations", function() {

      var ann1 = { id: "annotation-1", type: "str", pos: [0,6] };
      var ann2 = { id: "annotation-2", type: "em", pos: [7,3] };
      surface.insertAnnotation(ann1);
      surface.insertAnnotation(ann2);
      surface.deleteAnnotation("annotation-1");

      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span>S</span><span>c</span><span>o</span><span>o</span><span>b</span><span>y</span><span>&nbsp;</span><span class="em">D</span><span class="em">o</span><span class="em">o</span><span>!</span>');
    });

  });

  describe(".deleteRange", function() {

    // testing surface content
    it("should delete specified range of characters", function() {
      surface.deleteRange([6,4]);
      expect(surface.content).toBe('Scooby!');
    });

    // testing DOM state
    it("should update the DOM when deleting specified range of characters", function() {
      surface.deleteRange([6,4]);
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span>S</span><span>c</span><span>o</span><span>o</span><span>b</span><span>y</span><span>!</span>');
    });

  });

  describe(".highlight", function() {

    // testing DOM state
    it("should mark the passed annotation", function() {

      var ann1 = { id: "annotation-1", type: "str", pos: [0,6] };
      var ann2 = { id: "annotation-2", type: "em", pos: [7,3] };
      surface.insertAnnotation(ann1);
      surface.insertAnnotation(ann2);

      surface.highlight("annotation-2");
      elem = selectSurface();
      expect(elem.innerHTML).toBe('<span class="str">S</span><span class="str">c</span><span class="str">o</span><span class="str">o</span><span class="str">b</span><span class="str">y</span><span>&nbsp;</span><span class="em highlight">D</span><span class="em highlight">o</span><span class="em highlight">o</span><span>!</span>');
    });

  });


  describe(".select", function() {

    // testing DOM state
    it("programatically select a range of characters", function() {
      elem = selectSurface();
      elem.focus();
      surface.select(7, 3);
      var sel = window.getSelection();
      expect(sel.anchorNode.data).toBe('D');
      expect(sel.extentNode.data).toBe('o');
    });

  });


  describe(".selection", function() {

    // testing DOM state
    it("Should retrieve the selection as a [offset, length] array", function() {
      elem = selectSurface();
      elem.focus();
      surface.select(7, 3);
      expect(surface.selection()).toEqual([7, 3]);
    });

  });


});