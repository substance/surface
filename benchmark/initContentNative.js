// Setup

var fName = 'initContentNative';
var fDescription = 'This method loops trough all the characters passed in upon instantiation and renders the appropiate surface content. We will be using native for loops instead of underscore.each to go trough the characters';

var content = "Substance provides a flexible architecture, involving an extensible document format and protocol, realtime synchronization, an extensible document composer as well as a reference implementation.";
var $el = $('#content');
var el = document.getElementById('content');
var ct = content.split('');

function replaceHtml(el, html) {
  // from here http://blog.stevenlevithan.com/archives/faster-than-innerhtml
  var oldEl = typeof el === "string" ? document.getElementById(el) : el;
  /*@cc_on // Pure innerHTML is slightly faster in IE
    oldEl.innerHTML = html;
    return oldEl;
  @*/
  var newEl = oldEl.cloneNode(false);
  newEl.innerHTML = html;
  oldEl.parentNode.replaceChild(newEl, oldEl);
  /* Since we just removed the old element from the DOM, return a reference
  to the new element, which can be used to restore variable references. */
  return newEl;
};


// Tests

var tests = [
        {
          'name': 'initJQDOM',
          'deps': ['jquery'],
          'description': 'Injects jquery objects into the dom using $.append() .',
          'fn': function() {
                  $el.empty();
                  _.each(ct, function(ch) {
                    if (ch === "\n") {
                      $el.append('<br/>');
                    } else {
                      $el.append($('<span>' + ch + '</span>'));
                    }
                  });
          }
        },
        {
          'name': 'initDF',
          'deps': ['jquery'],
          'description': 'Manipulates offline document fragment and then rplaces the innerHtml value.',
          'fn': function() {
                  var elFragment = document.createDocumentFragment();
                  var br = document.createElement('br');
                  var span;

                  _.each(ct, function(ch) {
                    if (ch === "\n") {
                      elFragment.appendChild(br);
                    } else {
                      span = document.createElement('span');
                      span.innerHTML = ch;
                      elFragment.appendChild(span);
                    }
                  });
                  el.innerHTML = '';
                  el.appendChild(elFragment);
          }
        },
        {
          'name': 'initStr',
          'deps': ['jquery'],
          'description': 'Replaces dom innerHtml win concatenated string.',
          'fn': function () {
                  var br = '<br/>';
                  var innerHTML = '';
                  var i = 0;
                  var len = ct.length;
                  var ch;

                  _.each(ct, function(ch) {
                    if (ch === "\n") {
                      innerHTML += br;
                    } else {
                      var span = '<span>' + ch + '</span>';
                      innerHTML += span;
                    }
                  });
                  el.innerHTML = innerHTML;
            }
        },
        {
          'name': 'initreplaceHtml',
          'deps': ['jquery', 'replaceHtml'],
          'description': 'Mixes pure DOM and string manipulation depending on the case with external replaceHtml function.',
          'fn': function () {
                  var br = '<br/>';
                  var innerHTML = '';
                  var span;

                  _.each(ct, function(ch) {
                    if (ch === "\n") {
                      innerHTML += br;
                    } else {
                      var span = '<span>' + ch + '</span>';
                      innerHTML += span;
                    }
                  });
                  el = replaceHtml(el, innerHTML);
            }
        },
        {
          'name': 'initDOM',
          'deps': ['jquery'],
          'description': 'Injects dom objects using native createElement and addChild.',
          'fn': function () {
                  el.innerHTML = '';
                  var br = document.createElement('br');
                  var span;

                  _.each(ct, function(ch) {
                    if (ch === "\n") {
                      el.appendChild(br);
                    } else {
                      span = document.createElement('span');
                      span.innerHTML = ch;
                      el.appendChild(span);
                    }
                  });
            }
        }
];