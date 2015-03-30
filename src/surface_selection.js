
var Substance = require('substance');
var SubstanceDocument =  require('substance-document');

function SurfaceSelection(rootElement) {
  this.rootElement = rootElement;
}

SurfaceSelection.Prototype = function() {

  // mode: "after" - if the found position is at the right boundary of an element
  //  then the adjacent position is returned instead
  //  Example:
  //    <span>the brown fox <span>jumps</span> over the lazy dog</span>
  //    findPosition(el, 14, "after") would give [ el.childNodes[2], 0 ] instead of
  //    [el.childNodes[1].childNodes[0], 5]
  // Note: the result is always [textNode, offset]
  var findPosition = function(element, offset, mode) {
    var text = element.textContent;

    // not in this element
    if (text.length < offset) {
      return {
        node: null,
        offset: offset - text.length
      };
    // at the right boundary
    } else if (text.length === offset) {
      var lastChild = element.lastChild || element;
      return {
        node: lastChild,
        offset: offset,
        boundary: true
      };
    // within the node or a child node
    } else {
      if (element.nodeType === window.document.Element.TEXT_NODE) {
        return {
          node: element,
          offset: offset
        };
      } else {
        for (var child = element.firstChild; child; child = child.nextSibling) {
          var pos = findPosition(child, offset);
          if (pos.node) {
            // if "after", try to pick the next position
            if (pos.boundary && mode === "after" && child.nextSibling) {
              return findPosition(child, child.nextSibling, 0);
            } else {
              return pos;
            }
          // not found in this child; then pos.offset contains the translated offset
          } else {
            offset = pos.offset;
          }
        }
        throw new Error("Illegal state: we should not have reached here!");
      }
    }
  };

  var getPathFromElement = function(el) {
    var path = [];
    var elements = [];
    var current = el;
    while(current) {
      // if available extract a path fragment
      if (current.getAttribute) {
        // Stop when we find an element which has been made read-only
        if (current.getAttribute("contenteditable") === "false") {
          return null;
        }
        // if there is a path attibute we collect it
        var propName = current.getAttribute("data-property");
        if (propName) {
          path.unshift(propName);
          elements.unshift(current);
        }
        var nodeId = current.getAttribute("data-node-id");
        if (nodeId) {
          path.unshift(nodeId);
          elements.unshift(current);
          // STOP here
          return { path: path, elements: elements };
        }
      }
      current = current.parentElement;
    }
    return null;
  };

  var modelCoordinateFromDomPosition = function(domNode, offset) {
    var found = getPathFromElement(domNode);
    if (!found) return null;
    var last = found.elements[found.elements.length - 1];
    var path = found.path;
    var charPos = 0;
    // TODO: in future we might support other component types than string
    var range = window.document.createRange();
    range.setStart(last, 0);
    range.setEnd(domNode, offset);
    charPos = range.toString().length;
    return new SubstanceDocument.Coordinate(path, charPos);
  };

  var getElementForPath = function(rootElement, path) {
    var componentElement = rootElement.querySelector('[data-path="'+path.join('.')+'"');
    if (!componentElement) {
      console.error('Could not find DOM element for path', path);
      return null;
    }
    return componentElement;
  };

  var modelCoordinateToDomPosition = function(rootElement, coordinate) {
    var el = getElementForPath(coordinate.path);
    if (!el) {
      return null;
    }
    return findPosition(el, coordinate.offset, coordinate.after?'after':'');
  };

  this.get = function() {
    var sel = window.getSelection();
    var isReverse = (!sel.isCollapsed &&
      sel.focusNode.compareDocumentPosition(sel.anchorNode) === window.document.DOCUMENT_POSITION_PRECEDING);
    var rangeCount = sel.rangeCount;
    var ranges = [];
    if (rangeCount === 0) {
      return Document.NullSelection;
    } else {
      for (var i = 0; i < rangeCount; i++) {
        var range = sel.getRangeAt(i);
        var start = modelCoordinateFromDomPosition(range.startNode, range.startOffset);
        var end = start;
        if (range.collapsed) {
          end = start;
        } else {
          end = modelCoordinateFromDomPosition(range.endNode, range.endOffset);
        }
        if (start && end) {
          ranges.push(new SubstanceDocument.Range(start, end));
        }
      }
      if (ranges.length > 1) {
        return new Document.MultiSelection(ranges, isReverse);
      } else if (ranges.length > 0) {
        return new Document.Selection(ranges[0], isReverse);
      } else {
        return Document.NullSelection;
      }
    }
  };

  this.set = function(modelSelection) {
    var ranges = modelSelection.getRanges();
    var domRanges = [];
    ranges.forEach(function(range) {
      var startPosition = modelCoordinateToDomPosition(this.rootElement, range.start);
      var endPosition;
      if (range.isCollapsed()) {
        endPosition = startPosition;
      } else {
        endPosition = modelCoordinateToDomPosition(this.rootElement, range.end);
      }
      domRanges.push({ start: startPosition, end: endPosition });
    });
    var sel = window.getSelection();
    sel.removeAllRanges();
    domRanges.forEach(function(domRange) {
      var range = window.document.createRange();
      range.setStart(domRange.start.node, domRange.start.offset);
      range.setEnd(domRange.end.node, domRange.end.offset);
      sel.addRange(range);
    });
  };

};

Substance.initClass(SurfaceSelection);

module.exports = SurfaceSelection;
