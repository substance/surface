// init surface
var fName = 'renderAnnotations';
var tDescription = 'Testing speed for the renderAnnotations method.';
var content = "Substance provides a flexible architecture, involving an extensible document format and protocol, realtime synchronization, an extensible document composer as well as a reference implementation.";

window.surface = new Substance.Surface({
  el: $('.content')[0],
  content: content,
  annotations: {
    "annotation-1" : { id: "annotation-1", type: "str", pos: [0,9] },
    "annotation-2" : { id: "annotation-2", type: "em", pos: [57,10] },
    "annotation-3" : { id: "annotation-3", type: "comment", pos: [30,12] }
    // { id: "annotation-3", type: "comment", pos: [17,3] }
  },
  types: {
     "em": {
        "inclusive": false
     },
     "comment": {
        "inclusive": false
     }
  }
});

// Update comments panel according to marker context
surface.on('selection:changed', function(sel) {
  var marker = surface.getAnnotations(sel, ["comment"])[0];
  if (marker) {
    surface.highlight(marker.id);
  } else {
    surface.highlight(null);
  }
});

var tests = [
        {
          'name': 'renderAnnotationsImpr',
          'deps': [],
          'description': 'Manipulates offline document fragment and then replaces the innerHtml value. And we use the replacing technique',
          'fn': surface.renderAnnotationsImpr
        },
        {
          'name': 'renderAnnotations',
          'deps': ['underscore'],
          'description': 'Manipulates offline document fragment and then replaces the innerHtml value. And we use the replacing technique',
          'fn': surface.renderAnnotations
        }
];