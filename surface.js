//     (c) 2012-2013 Victor Saiz, Michael Aufreiter

//     Surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

(function (w) {

  var ot = Substance.Chronicle.ot;

  // Substance
  // ---------

  if (!w.Substance || !Substance) { w.Substance = Substance = {}; }

  // Surface
  // ---------

  Substance.Surface = function(options) {

    var el = options.el,
        selectionIsValid = false,
        // annotations = options.annotations || new Substance.Surface.Annotations(),
        model = options.model,
        types = options.types || {},
        active = false,
        pasting = false,
        clipboard = [],
        that = this;

    // Directly expose content, because it's a value not a reference
    // model.setContent(options.content || el.textContent || '');
    this.prevContent = model.getContent();

    // var dirtyNodes = {};

    function renderAnnotations() {
      removeClasses(el.childNodes);

      model.each(function(a) {
        console.log(a);
        addClasses(elements([a.range.start, a.range.length]), a.type);
      });
    }

    // Initialize Surface
    // ---------------

    function init() {
      var content = model.getContent();
      console.log('CONTENT', content);
      var br = '<br/>', innerHTML = '',
          span, i, len = content.length;
      
      for (i = 0; i < len; i++) {
        var ch = content[i];
        if (ch === "\n") {
          innerHTML += br;
        } else {
          var span = '<span>' + toHtml(ch) + '</span>';
          innerHTML += span;
        }
      };

      var newEl = el.cloneNode(false);
      newEl.innerHTML = innerHTML;
      el.parentNode.replaceChild(newEl, el);
      el = newEl;
      renderAnnotations();
    }

    // checks if the specified node contains a certain class
    function hasClass(ele, cls) {
      if(ele) return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
    }

    // adds specified css class to a specified node
    function addClass(ele, cls) {
      if (!hasClass(ele,cls)) ele.className += " "+cls;
      ele.className = cleanClasses(ele.className);
    }

    // removes a single class from a node
    function removeClass(ele, cls) {
      if (hasClass(ele,cls)) {
        var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
        ele.className = cleanClasses(ele.className.replace(reg,' '));
      }
    }
    
    // remove classes from list of nodes
    function removeClasses(elems, className) {
      var elem, i, l = elems.length;

      for ( i = 0; i < l; i++ ) {
        elem = elems[i];
        if ( elem.nodeType === 1 && elem.className ) { // speeds up quite much!
          if (className) {
            removeClass(elem,className);
          } else {
            elem.className = null;
          }
        }
      };
    }

    // cleans double spaces in classList
    function cleanClasses(classList) {
      classList = classList.replace(/\s{2,}/g, ' ').trim();
      //remove single white space; hoping no css class names of 1 char exists
      if(classList.length === 1) classList = null;
      return classList;
    }

    // add classes to a list of nodes
    function addClasses(elems, className) {
      var ln = elems.length, i;

      for (i = 0; i < ln; i++) {
        var elem = elems[i];
        if (elem.nodeType === 1) addClass(elem, className);
      };
    }

    // Highlight a particular annotation
    function highlight(id) {
      // Find and remove all higlighted chars
      var elems = el.getElementsByTagName('span');
      removeClasses(elems, 'highlight');

      // Mark the matching chars as highlited
      var a = model.getAnnotation(id);
      if (a) addClasses(elements([a.range.start, a.range.length]), 'highlight');
    }

    // Determines if a certain annotation is inclusive or not
    function isInclusive(a) {
      return (types[a.type]) ? types[a.type].inclusive : true;
    }

    // transforms invisible characters to html
    function toHtml(ch) {
      if (/\r\n|\r|\n/.test(ch)) ch = '<br>';
      if (/\s|\t/.test(ch)) ch = '&nbsp;';
      return ch;
    }

    // Set selection
    // ---------------

    function select(start, length) {
      if (!active) return;

      var sel = window.getSelection(),
          range = document.createRange(),
          children = el.childNodes,
          numChild = children.length-1,
          isLastNode = start > numChild,
          startNode = isLastNode ? children[numChild] : children[start],
          endNode = length ? children[(start + length)] : startNode;

      if (children.length > 0) {
       // there is text in the container
          
        if (length) {
          // when a length is specified we select the following nodes inside the surface
          range.setStart(startNode, 0);

          // offset the end of the selection by the specified length
          for (var i = 0; i < length-1; i++) {
            if(startNode.nextSibling){ //only as long as there are existing nodes!
              var currNode = startNode.nextSibling;
              startNode = currNode;
            }
          };

          range.setEnd(startNode, 1);
        } else {

          range.selectNode(startNode);
          // Only collapse when the selection is not a range but one single char/position
        
          // if its last node we set cursor after the char by collapsing end
          // else we set it before by collapsing to start
          range.collapse(!isLastNode); 
        }

      } else {
        // No characters left in the container
        range.setStart(el, 0);
        range.setEnd(el, 0);
      }

      sel.removeAllRanges();
      sel.addRange(range);

      that.trigger('selection:changed', that.selection());
    }

    function insertAnnotation(a) {
      model.setAnnotation(a);

      // dirtyNodes[a.id] = "insert";
      renderAnnotations();
      that.trigger('annotations:changed');
    }

    function updateAnnotation(delta) {
      var id = delta.id,
          annotation = model.getAnnotation(id);

      // Update properties
      model.setAnnotation(_.extend(annotation, options));

      renderAnnotations();
      that.trigger('annotations:changed');
    }

    // Get current selection
    // ---------------

    function selection() {
      var sel = window.getSelection();
      if (sel.type === "None") return null;

      var range = sel.getRangeAt(0),
          length = range.cloneContents().childNodes.length,
          startContainer = range.startContainer,
          parent = startContainer.parentElement,
          indexOf = Array.prototype.indexOf,
          index = startContainer.nodeType === 3 ? indexOf.call(el.childNodes, parent) : 0;
      
      // There's an edge case at the very beginning
      if (range.startOffset !== 0) index += 1;
      if (range.startOffset > 1) index = range.startOffset;

      return [index, length];
    }

    // Matching annotations [xxxx.]
    // ---------------

    function getAnnotations(sel, aTypes) {
      var sStart = sel[0],
          sEnd   = sel[0] + sel[1];

      var res = [];
      model.each(function(a) {
        if (!sel) return res.push(a);

        var aStart = a.range.start, aEnd = aStart + a.range.length;
        
        if(types[a.type] && types[a.type].inclusive === false) {
          // its a non inclusive annotation
          // so intersects doesnt include the prev and last chars
          var intersects = (aStart + 1) <= sEnd && (aEnd - 1) >= sStart;
        } else {
          var intersects = aStart <= sEnd && aEnd >= sStart;
        }

        // Intersects and satisfies type filter
        if (intersects && (aTypes ? _.include(aTypes, a.type) : true)) {
          res.push(a);
        }
      });
      return res;
    }
    // Deletes passed in annotation
    // ---------------------------

    function deleteAnnotation(ann) {
      model.deleteAnnotation(ann); //[ann];
      that.trigger('annotations:changed');
      renderAnnotations();
    }

    // Transformers
    // ---------------

    function insertTransformer(index, text) {
      var op = ot.TextOperation.Insert(index, text);

      model.each(function(a) {
        model.transformAnnotation(a, op, isInclusive(a));
      });
    }

    function deleteTransformer(index, text) {
      var op = ot.TextOperation.Delete(index, text);

      model.each(function(a) {
        model.transformAnnotation(a, op, isInclusive(a));
      });
    }

    // State
    // ---------------

    function elements(sel) {
      return Array.prototype.slice.call(el.childNodes, sel[0], sel[0] + sel[1]);
    }

    // Operations
    // ---------------

    function deleteRange(sel) {
      if (sel[0] < 0) return;
      var els = elements(sel);
      for (var i = els.length - 1; i >= 0; i--) {
        el.removeChild(els[i]);
      };

      select(sel[0]);

      var deletedContent = model.getContent().slice(sel[0], sel[0]+sel[1]);

      deleteTransformer(sel[0], deletedContent);
      that.trigger('changed');
      that.trigger('selection:changed', that.selection());
      contentDeleteRange(sel);
    }

    function contentDeleteRange(sel) {
      if (sel[0] < 0) return;
      model.setContent(model.getContent().substring(0, sel[0]) + model.getContent().substring(sel[0] + sel[1]));
    }

    // inserts or appends node to an element whether there is a successor or not
    function insertAppend(successor, el, ch) {
      if (successor) {
        el.insertBefore(ch, successor);
      } else {
        el.appendChild(ch);
      }
    }

    // Stateful
    function insertCharacter(ch, index) {
      var pureCh = ch, // we store the char for the content string;
          // matched = getAnnotations([index,0]),
          classes = '',
          successor = el.childNodes[index],
          prev = el.childNodes[index-1],
          newEl = 'span',
          newCh;
      
      if (ch === " ") ch = "&nbsp;";
      if (ch === "\n") {
        newEl = 'br';
        ch = '';
        if (!successor) classes += ' br';
      }

      // we perform the transformation before to see if the inclusive/noninclusive
      // affects in order to apply the class or not
      insertTransformer(index, pureCh);

      // _.each(matched, function(a) {
      //   // if (a.isAffected) classes += ' ' + a.type;
      //   classes += ' ' + a.type;
      // });

      removeClass(prev, 'br');

      newCh = document.createElement(newEl);
      // if(classes.length > 1) addClass(newCh, classes); // we still add class for the last br to display properly
      newCh.innerHTML = ch; // we still set innerHTML even if its a linebreak so its possible to select put the cursor after it 

      insertAppend(successor, el, newCh);
    
      updateContent(pureCh, index);
      select(index+1);

      // Mach schlauer
      renderAnnotations();

      that.trigger('changed');
    }

    // Used for pasting content
    function insertText(text, index) {

      var successor = el.childNodes[index],
          els = text.split(''),
          span = document.createElement("span"),
          frag;
      for ( var e = 0; e < els.length; e++ ) {
        frag = span.cloneNode(false);
        els[e] = toHtml(els[e]);
        frag.innerHTML = els[e] === '\n' ? '<br>' : els[e];
        insertAppend(successor, el, frag);
      }

      updateContent(text, index);
      insertTransformer(index, text);

      // Mach schlauer
      renderAnnotations();
      that.trigger('changed');
    }

    function updateContent(text, idx) {
      model.setContent([model.getContent().slice(0, idx), text, model.getContent().slice(idx)].join(''));
    }

    // Events
    // ------

    init();

    // Interceptors
    // -----------------
    // 
    // Overriding clumsy default behavior of contenteditable


    function handleKey(e) {
      // TODO: e.data guard check - image upload for some reason triggers textInput event -> investigate
      if (e.data && e.data !== '\n'){
        var ch = e.data,
            sel = selection(),// Is there an active selection?
            index = sel[0] < 0 ? 0 : sel[0],
            startContainer = window.getSelection().getRangeAt(0).startContainer;// look for ghost accents here
        
        if (startContainer.length > 1) {
          startContainer.textContent = startContainer.textContent[0]; // chop the ghost accent
          delete sel[1]; //to avoid overriding inserting into next char
        }

        if (sel[1]) deleteRange(sel);
        insertCharacter(ch, index);
      }
      e.preventDefault();
      e.stopPropagation(); // needed?
    }

    function cancelSpace(e){
      if(e.keyCode === 32){
        // prevent default spacebar behavior
        e.preventDefault();
        // create our custom textEvent to trigger surface handelkey
        // REF: object.initTextEvent (eventName, bubbles, cancelable, view, data, inputMethod, locale);
        var evt = document.createEvent("TextEvent")
        evt.initTextEvent ("textInput", false, true, w, ' ');
        el.dispatchEvent(evt);
      }
    }

    // bypasses the default cut behaviour and passes it to
    // be pasted as plain text
    function handleCut(e) {
      var se = window.getSelection(),
          range = se.getRangeAt(0),
          elements = range.cloneContents().childNodes,
          len = elements.length,
          sel = selection();

      for (var i = 0; i < len; i++) {
        clipboard += elements[i].textContent;
      };
      sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0], 1]);
      e.preventDefault();
    }

    function handlePaste(e) {
      var sel = selection();
      if(sel[1] > 0) deleteRange(sel);

      pasting = true;

      function getPastedContent (callback) {
        var tmpEl = document.createElement("textarea");
        tmpEl.className = 'clipboard';
        document.body.appendChild(tmpEl);
        if(clipboard.length > 1) {
          tmpEl.value = clipboard;
          clipboard = '';
        }
        tmpEl.focus();
        setTimeout(function () {
          document.body.removeChild(tmpEl);
          callback(tmpEl);
        }, 10);
      }

      getPastedContent(function (node) {
        var txt = node.value.trim();
        insertText(txt, sel[0]);
        select(sel[0]+txt.length);
        pasting = false;
      });
    }

    function handleBackspace(e) {
      if (active) {
        var sel = selection();
        sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0]-1, 1]);
        
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleDel(e) {
      if (active) {
        var sel = selection();
        sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0], 1]);
        
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleNewline(e) {
      if (!active) return;

      insertCharacter('\n', selection()[0]);
      if (e) {
        e.preventDefault();
        e.stopPropagation();        
      }
    }

    // function annotationUpdates() {
    //   var ops = [];
    //   var deletedAnnotations = [];

    //   _.each(dirtyNodes, function(method, key) {
    //     if (method === "delete") return deletedAnnotations.push(key);
    //     var a = annotations[key] // annotationById(key);

    //     if (method === "insert") {
    //       var options = {id: a.id, type: a.type, data: {pos: a.pos}};
    //       if (a.url) options["url"] = a.url;

    //       ops.push(["insert", options]);
    //     } else if (method === "update") {
    //       var options = {id: a.id, data: {pos: a.pos}};
    //       if (a.url) options["url"] = a.url;
    //       ops.push(["update", options]);
    //     }
    //   });


    //   if (deletedAnnotations.length > 0) {
    //     ops.push(["delete", {"nodes": deletedAnnotations}]);
    //   }
    //   return ops;
    // }

    function activateSurface(e) {
      if (pasting) return;
      active = true;
      addClass(this, 'active');
      renderAnnotations();
      that.trigger('surface:active', model.getContent(), that.prevContent);
    }

    function deactivateSurface(e) {
      if (pasting) return;
      removeClass(this, 'active');
      highlight(null);

      commit(); // Commit changes
    }

    function selectionChanged() {
      if (!active) return;
      _.delay(function() {
        that.trigger('selection:changed', selection());
      }, 5);
    }

    // Programmatically commit changes
    function commit() {

      // var ops = annotationUpdates();
      var ops = [];

      if (that.prevContent !== model.getContent() || ops.length > 0) {
        dirtyNodes = {};

        that.trigger('content:changed', model.getContent(), that.prevContent, ops);
        that.prevContent = model.getContent();
      }
      active = false;
    }
    

    // Bind Events
    // ------

    // Backspace key
    key('backspace', handleBackspace);
    key('del', handleDel);

    // Enter key for new lines
    key('shift+enter', handleNewline);
 
    // Cutting
    el.addEventListener('cut', handleCut);

    // Paste
    el.addEventListener('paste', handlePaste);

    // we cancel the spacebar scrolling here
    el.addEventListener('keydown', cancelSpace);

    // Inserting new characters
    el.addEventListener('textInput', handleKey);

    // Activate surface
    el.addEventListener('focus', activateSurface);

    // Deactivate surface
    el.addEventListener('blur', deactivateSurface);

    // Trigger selection changed event
    el.addEventListener('mouseup', selectionChanged);

    key('left, right, up, down', selectionChanged);
    key('shift+left, shift+right, shift+up, shift+down', selectionChanged);
    key('alt+left, alt+right, alt+up, alt+down', selectionChanged);
    key('⌘+left, ⌘+right, ⌘+up, ⌘+down', selectionChanged);
    key('alt+shift+left, alt+shift+right, alt+shift+up, alt+shift+down', selectionChanged);
    key('⌘+shift+left, ⌘+shift+right, ⌘+shift+up, ⌘+shift+down', selectionChanged);


    // Exposed API
    // -----------------

    this.select = select;
    this.selection = selection;
    this.commit = commit;
    // this.annotations = annotations;
    this.deleteRange = deleteRange;
    this.insertCharacter = insertCharacter;
    this.insertText = insertText;
    this.insertAnnotation = insertAnnotation;
    this.updateAnnotation = updateAnnotation;
    this.getAnnotations = getAnnotations;
    this.deleteAnnotation = deleteAnnotation;
    this.addNewline = handleNewline;
    this.highlight = highlight;
  };

  _.extend(Substance.Surface.prototype, Substance.util.Events);

  Substance.Surface.Model = function(content, annotations) {
    this.annotations = annotations || {};
    this.content = content || '';
  };

  Substance.Surface.Model.prototype.setAnnotation = function(annotation) {
    this.annotations[annotation.id] = annotation;
  };

  Substance.Surface.Model.prototype.getAnnotation = function(id) {
    return this.annotations[id];
  };

  Substance.Surface.Model.prototype.deleteAnnotation = function(id) {
    delete this.annotations[id];
  };

  Substance.Surface.Model.prototype.setContent = function(content) {
    this.content = content;
  };

  Substance.Surface.Model.prototype.getContent = function() {
    return this.content;
  };

  Substance.Surface.Model.prototype.transformAnnotation = function(annotation, op, expand) {
    ot.TextOperation.Range.transform(annotation.range, op, expand);
  };

  Substance.Surface.Model.prototype.each = function(fn) {
    _.each(this.annotations, fn);
  };

  Substance.Surface.Model.prototype.commit = function(fn) {
    console.log('confirms the shit');
  };

})(window);
