(function(w){

  // Surface
  // =======

  // Todo: Stick to the specified API
  // Todo?: If previous char is a \n and current too we render a p to the next new lin
  // Todo?: Selections
  //    - on click we mark the beg of selection
  //    - in release we know what we selected
  //      - so we add a selection to the data structure as selected?
  //      - the same method can add a specified class to the selection for the api
  //      - we can also delete the whole selected text

  this.Surface = function(options){
    
    // Vars
    var $el = $('.surface')
    ,   _caret = 0
    ,   keyEvents = new KeyEvents()
    ,   cFont = $el.css('font-family').split(', ')[0]
    ,   fSize = $el.css('font-size')
    ,   tagLine = 'Eventually Consistent™'
    ,   $plh = $(tpl('empty-placeholder', {'text':tagLine}))
    ,   contWidth = $el.width()
    ,   node = new TextNode(cFont, fSize)
    ,   newLineChar = '\\n'
    ,   caret = new Caret()
    ,   modifiers = {};


    // Helpers
    // -------

    function tpl(tpl, ctx) {
      var ctx = ctx || {};
      source = $("script[name="+tpl+"]").html();
      return _.template(source, ctx);
    }

    function isdef(passed){
      return typeof passed !== 'undefined';
    }

    // Formats json stringas html
    function jsonDebug(_json){
      return JSON.stringify(_json, null, 4).replace(/\n/g, '<br>').replace(/[ \f\n\r\t\v]/g, '&nbsp;');
    }

    // Prints out the datastructure
    function debug(){
      $('#debug').show().html(jsonDebug(_lines));
    }
  
    // Caret ticker
    w.setInterval(function(){
      var $marked = $el.find('#caret').toggleClass('caret');
    }, 500);

    function phEmpty(){
        $plh.removeClass('empty');
        $plh.html('&nbsp');
    }

    function phTagline(){
        $plh.addClass('empty');
        $plh.html(tagLine);
    }


    // Events
    // ------
    // Note: Based on Mochikit Key_Events
  
    // Targets special modifiers and special chars
    // Note: We're storing a handled flag to work around a Safari bug: 
    // http://bugs.webkit.org/show_bug.cgi?id=3387
    $el.live('keydown', function(e){
      if (!keyEvents.handled) {

        var k ={};
        k.code = e.keyCode;
        k.string = (keyEvents.specialKeys[k.code] || 'KEY_UNKNOWN');

        // var fn = keyEvents.specialKeyMap[k.string];
        // console.log(fn);
        // if (fn) {
        //   fn();
        // }

        switch(k.code){

          // Return|Enter
          case 13:
             // insert the new character
            node.addChar('newLineChar', caret.getPos());
            // update caret
            caret.goRight();

            // store used modifier to disable elsewhere
            modifiers[k.code] = true;
            break;

          // LEFT
          case 37:
            caret.goLeft();
            // store used modifier to disable elsewhere
            modifiers[k.code] = true;
            break;

          // RIGHT
          case 39:
            caret.goRight();
            // store used modifier to disable elsewhere
            modifiers[k.code] = true;
            break;

          // DELETE
          case 8:
            e.preventDefault();
            node.del(caret.getPos());
            caret.goLeft(true);
            // store used modifier to disable elsewhere
            modifiers[k.code] = true;
            break;

          // SUPR
          case 46:
            node.del(caret.getPos()+1);
            // store used modifier to disable elsewhere
            modifiers[k.code] = true;
            break;
        }
      }
      keyEvents.handled = true;
      render();
    });

    // Targets special chars and resets keyEvents.handled hack back to false
    $el.live('keyup', function(e){
      keyEvents.handled = false; //needs to be set back to false
      // var k ={}; k.code = e.keyCode; k.string = (keyEvents.specialKeys[k.code] || 'KEY_UNKNOWN');
    });

    // Targets all printable characters
    // Note:
    //  IE: does not fire keypress events for special keys
    //  FF: sets charCode to 0, and sets the correct keyCode
    //  Safari: sets keyCode and charCode to something stupid
    $el.live('keypress', function(e){
      var k ={}
      ,  _cLine;

      k.code = 0;
      k.string = '';

      if (typeof(e.charCode) != 'undefined' &&
          e.charCode !== 0 &&
          !keyEvents.specialMacKeys[e.charCode]) {
          k.code = e.charCode;
          k.string = String.fromCharCode(k.code);
      } else if (e.keyCode &&
          typeof(e.charCode) == 'undefined') { // IE
          k.code = e.keyCode;
          k.string = String.fromCharCode(k.code);
      }

      // make sure it's not a modifier
      if(!modifiers[k.code]){

        // insert the new character
        node.addChar(k.string, caret.getPos());
        // update caret
        caret.goRight();
        render();
      }

    });

    // Deals with deactivation
    $el.blur(function(){
      var chars = node.getChars();
      if(chars.length === 0){
        phTagline();
        init();
      }      
    });

    // Activates the surface making it editable
    $el.click(function(){
      // Wen activating the tab
      // and focussing we can then type in and receive key events
      $(this).attr({'tabindex':'1'});
      $(this).focus();
      render();
    });


    // Render
    // ------

    // Renders the data structure into the surface
    function render(){

      var val
      ,   $span
      ,   $line = $(tpl('line'))
      ,   chars = node.getChars();

      if(chars.length === 0){
        phEmpty();
        $line.append($plh);
      }else{
        _.each(chars, function(_char, i){

          val = _char.value;
          // Process chars here for html representation of the data
          if(val === ' ') val = '&nbsp;';

          $span = $(tpl('char', {'_char':val}));

          if(val === 'newLineChar'){
            $span.text('&nbsp;');
            $span.addClass('br');
          }

          // Set the caret marker
          if(i === caret.getPos()-1){
            $span.attr({id:'caret'});
          }

          // _char.dom = $span; probably won't need that
          $span.data(_char);

          $span.click(function(){
            caret.goTo(i + 1);
            render();
          });

          $line.append($span);
        });
      }
      
      $el.html($line);
    }


    // Init
    // ----
    // Todo: Adjust the constructor to the defined api

    // Appends the placeholder
    function init(){
      $el.html($plh);
    }


    // Public API
    // ----

    return{

      init:init
      
    };

  };
})(window);