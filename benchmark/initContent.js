// Setup

var fName = 'initContent';
var tDescription = 'Testing speed for the initContent method.';

var content = "Substance provides a flexible architecture, involving an extensible document format and protocol, realtime synchronization, an extensible document composer as well as a reference implementation.";
var $el = $('#content');
var el = document.getElementById('content');
var ct = content.split('');
var len = ct.length;
var i = 0;

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
          'deps': ['jquery', 'underscore'],
          'description': 'Injects jquery objects into the dom using $.append() .',
          'fn': function() {
                  $el.empty();
                  for(;i<len;i++){
                    var ch = ct[i];
                    if (ch === "\n") {
                      $el.append('<br/>');
                    } else {
                      $el.append($('<span>' + ch + '</span>'));
                    }
                  };
          }
        },
        {
          'name': 'initDF',
          'deps': ['jquery', 'underscore'],
          'description': 'Manipulates offline document fragment and then rplaces the innerHtml value.',
          'fn': function() {
                  var elFragment = document.createDocumentFragment();
                  var br = document.createElement('br');
                  var span;

                  for(;i<len;i++){
                    var ch = ct[i];
                    if (ch === "\n") {
                      elFragment.appendChild(br);
                    } else {
                      span = document.createElement('span');
                      span.innerHTML = ch;
                      elFragment.appendChild(span);
                    }
                  };
                  el.innerHTML = '';
                  el.appendChild(elFragment);
          }
        },
        {
          'name': 'initStr',
          'deps': ['jquery', 'underscore'],
          'description': 'Replaces dom innerHtml win concatenated string.',
          'fn': function () {
                  var br = '<br/>';
                  var innerHTML = '';

                 for(;i<len;i++){
                    var ch = ct[i];
                    if (ch === "\n") {
                      innerHTML += br;
                    } else {
                      var span = '<span>' + ch + '</span>';
                      innerHTML += span;
                    }
                  };
                  el.innerHTML = innerHTML;
            }
        },
        {
          'name': 'initreplaceHtml',
          'deps': ['jquery', 'underscore', 'replaceHtml'],
          'description': 'Mixes pure DOM and string manipulation depending on the case with external replaceHtml function.',
          'fn': function () {
                  var br = '<br/>';
                  var innerHTML = '';
                  var span;

                  for(;i<len;i++){
                    var ch = ct[i];
                    if (ch === "\n") {
                      innerHTML += br;
                    } else {
                      var span = '<span>' + ch + '</span>';
                      innerHTML += span;
                    }
                  };
                  el = replaceHtml(el, innerHTML);
            }
        },
        {
          'name': 'initDOM',
          'deps': ['jquery', 'underscore'],
          'description': 'Injects dom objects using native createElement and addChild.',
          'fn': function () {
                  el.innerHTML = '';
                  var br = document.createElement('br');
                  var span;

                  for(;i<len;i++){
                    var ch = ct[i];
                    if (ch === "\n") {
                      el.appendChild(br);
                    } else {
                      span = document.createElement('span');
                      span.innerHTML = ch;
                      el.appendChild(span);
                    }
                  };
            }
        }
];