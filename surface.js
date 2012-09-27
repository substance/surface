//     (c) 2012 Victor Saiz, Michael Aufreiter
//     Surface is freely distributable under the MIT license.
//     For all details and documentation:
//     http://github.com/surface/surface

(function (w) {

  // Backbone.Events
  // -----------------

  // Regular expression used to split event strings
  var eventSplitter = /\s+/;
  // Create a local reference to slice/splice.
  var slice = Array.prototype.slice;
  var splice = Array.prototype.splice;

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback functions
  // to an event; trigger`-ing an event fires all callbacks in succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
    _.Events = w.Backbone ? Backbone.Events : {

    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    on: function (events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) return this;
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      while (event = events.shift()) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
      }

      return this;
    },

    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) return;
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      while (event = events.shift()) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) continue;
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        while ((node = node.next) !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) return this;
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      while (event = events.shift()) {
        if (node = calls[event]) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        if (node = all) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
      }

      return this;
    }

  };

  // Substance
  // ---------
  if (!w.Substance || !Substance) { w.Substance = Substance = {}; }



  // Surface
  // ---------

  Substance.Surface = function(options) {

    var $el = $(options.el)
    ,   selectionIsValid = false
    ,   annotations = options.annotations
    ,   prevText = options.content
    ,   events = _.extend({}, _.Events);


    function renderAnnotations() {
      // Cleanup
      $el.find('span, br').removeClass();

      // Render annotations
      _.each(annotations, function(a) {
        elements(a.pos).addClass(a.type);
      });
    }


    // Initialize Surface
    // ---------------

    function init() {
      _.each(options.content.split(''), function(ch) {
        if (ch === "\n") {
          $el.append('<br/>');
        } else {
          $el.append($('<span>'+ch+'</span>'));
        }
      });

      renderAnnotations();
    }


    function elements(range) {
      return $el.find('span, br').slice(range[0], range[0] + range[1]);
    }

    // Set selection
    // ---------------

    function select(start, end) {
      var sel = window.getSelection();
      var startNode = $el.find('span, br')[start];
      var endNode = end ? $el.find('span, br')[end] : startNode;

      var range = document.createRange();
      range.setStartBefore(startNode);
      if(endNode) {
        range.setEndBefore(endNode);
      }else {
        range.setEndAfter($el.find(':last')[0]);
      }
      
      sel.removeAllRanges();
      sel.addRange(range);
    }

    // Get current selection
    // ---------------

    function selection() {
        var range = window.getSelection().getRangeAt(0),
            node = $el[0];

      var length = range.cloneContents().childNodes.length;
      var index = $el.find('span, br').index(range.startContainer.parentElement);

      // There's an edge case at the very beginning
      if (range.startOffset !== 0) index += 1;
      if (range.startOffset > 1) index = range.startOffset;

      return [index, length];
    }

    // Transformers
    // ---------------

    function insertTransformer(index, offset) {
      // TODO: optimize
      _.each(annotations, function(a) {
        var start = a.pos[0],
            end   = start + a.pos[1];

        if (start <= index && end >= index) {
          // Case1: Offset affected
          a.pos[1] += offset;
          console.log(a.type + ' affected directly');
        } else if (start > index) {
          // Case2: Startpos needs to be pushed
          console.log(a.type + ' start is being pushed');
          a.pos[0] += offset;
        }
      });
      renderAnnotations();
    }


    function deleteTransformer(index, offset) {
      // TODO: optimize
      _.each(annotations, function(a) {
        var start = a.pos[0],
            end   = start + a.pos[1];

        if (start <= index && end >= index) {
          // Case1: Offset affected
          a.pos[1] += offset;
          console.log(a.type + ' affected directly');
        } else if (start > index) {
          // Case2: Startpos needs to be pushed
          console.log(a.type + ' start is being pushed back');
          a.pos[0] -= offset;
        }
        console.log('updating annotations according to delete command');
      });
      renderAnnotations();
    }


    // State
    // ---------------

    function content() {
      var res = "";
      _.each($el.find("span, br"), function(el) {
        res += el.tagName === "BR" ? "\n" : $(el).text();
      });
      return res;
    }

    // Operations
    // ---------------

    function deleteRange(range) {
      if (range[0]<0) return;
      elements(range).remove();
      select(range[0]);
      deleteTransformer(range[0], range[1]);
    }

    // function wrapText(str) {
    //   str.split('').wrapAll('<span/>');
    // }

    // Stateful
    function insertCharacter(char, index) {
      var successor = $el.find('span, br')[index];
      if (successor) $('<span>'+char+'</span>').insertBefore(successor);
      insertTransformer(index, 1);
      select(index+1);
    }

    // Used for pasting content
    function insertText(text, index) {
      var chars = _.map(text.split(''), function(ch, offset) {
        return '<span>'+ch+'</span>';
      });

      var successor = $el.find('span, br')[index];
      $(chars.join('')).insertBefore(successor);

      insertTransformer(index, text.length);
    }


    // Events
    // ------

    init();

    // Interceptors
    // -----------------
    // 
    // Overriding clusy default behavior of contenteditable

    function handleKey(e) {
      var ch = String.fromCharCode(e.keyCode);
      if (ch === " ") ch = "&nbsp;";

      // Is there an active selection?
      var range = selection();

      if (range[1]) {
        deleteRange(range);
      }

      insertCharacter(ch, range[0]);

      // trigger('content:updated', '');

      return false;
    }

    function handleEnter(e) {
      console.log('TODO: handle enter key');
      return false;
    }

    function handlePaste(e) {
      var sel = selection();
      deleteRange(sel);

      function getPastedContent (callback) {
        // TODO: michael, explain why these css properties are needed -- timjb
        var tmpEl = $('<div id="proper_tmp_el" contenteditable="true" />')
          .css({
            position: 'fixed', top: '20px', left: '20px',
            opacity: '0', 'z-index': '10000',
            width: '1px', height: '1px'
          })
          .appendTo(document.body)
          .focus();
        setTimeout(function () {
          tmpEl.remove();
          callback(tmpEl);
        }, 10);
      }

      getPastedContent(function (node) {
        var txt = $(node).text();
        insertText(txt, sel[0]);
        select(sel[0]+txt.length);
      });
    }


    function handleBackspace() {
      var sel = selection();
      sel[1]>0 ? deleteRange(sel) : deleteRange([sel[0]-1, 1]);
      return false;
    }

    // Bind Events
    // ------

    // Paste
    $el[0].onpaste = handlePaste;

    // Inserting new characters
    $el.keypress(handleKey);

    // Deal with enter key
    key('enter', handleEnter);

    // Backspace key
    key('backspace', handleBackspace);


    // Exposed API
    // -----------------
    
    return {
      select: select,
      selection: selection,
      content: content,
      deleteRange: deleteRange
    };
  };

  _.extend(Substance.Surface, _.Events);

})(window);