// Setup

var fName = 'initContent';
var tDescription = 'Testing speed for the initContent method.';

var content = "Substance provides a flexible architecture, involving an extensible document format and protocol, realtime synchronization, an extensible document composer as well as a reference implementation.";
var $el = $('#content');
var el = document.getElementById('content');
var ct = content.split('');

function clear(e){
  el.innerHtml = '';
}

// Tests

var tests = [
        {
          'name': 'initreplaceHtml',
          'deps': ['jquery', 'replaceHtml'],
          'description': 'Mixes pure DOM and string manipulation depending on the case with external replaceHtml function.',
          'onStart': clear,
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
                  
                  var oldEl = el;
                  var newEl = oldEl.cloneNode(false);
                  newEl.innerHTML = innerHTML;
                  oldEl.parentNode.replaceChild(newEl, oldEl);
                  el = newEl;
            }
        },
        {
          'name': 'initreplaceHtmlImprv',
          'deps': ['jquery'],
          'description': 'Mixes pure DOM and string manipulation depending on the case with external replaceHtml function.',
          'onStart': clear,
          'fn': function () {
                  var br = '<br/>';
                  var innerHTML = '';
                  var span;

                  var i = ct.length;
                  var inc = 0;
                  
                  while(i--) {

                    var ch = ct[inc];

                    if (ch === "\n") {
                      innerHTML += br;
                    } else {
                      var span = '<span>' + ch + '</span>';
                      innerHTML += span;
                    }
                    inc += 1;
                  };
                  
                  var newEl = el.cloneNode(false);
                  newEl.innerHTML = innerHTML;
                  el.parentNode.replaceChild(newEl, el);
                  el = newEl;
            }
        }

];