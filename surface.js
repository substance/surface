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
    ,   cFont = 'OpenSansRegular' //fixed font for now as grabbing it from the css proviqued bugs
    ,   fSize = $el.css('font-size')
    ,   tagLine = 'Eventually Consistent™'
    ,   $plh = $(tpl('empty-placeholder', {'text':tagLine}))
    ,   contWidth = $el.width()
    ,   node = new TextNode(cFont, fSize)
    ,   caret = new Caret(node)
    ,   newLineChar = '\\n';

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
      $el.find('#caret').toggleClass('caret');
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
        k.alt = e.altKey;
        k.ctrl = e.ctrlKey;
        k.meta = e.metaKey || false; // IE and Opera punt here
        k.shift = e.shiftKey;
        k.any = k.alt || k.ctrl || k.shift || k.meta;

        switch(k.string){

          case 'KEY_ENTER':
             // insert the new character
            node.addChar('newLineChar', caret.getPos());
            // update caret
            caret.goRight();
            e.preventDefault();
            break;

          case 'KEY_ARROW_LEFT':
            if(k.alt){
              caret.goWordLeft();
            }else{
              caret.goLeft();
            }
            e.preventDefault();
            break;

          case 'KEY_ARROW_RIGHT':
            if(k.alt){
              caret.goWordRight();
            }else{
              caret.goRight();
            }
            e.preventDefault();
            break;

          case 'KEY_PAGE_UP':
          case 'KEY_HOME':
            caret.goDocStart();
            e.preventDefault();
            break;

          case 'KEY_PAGE_DOWN':
          case 'KEY_END':
            caret.goDocEnd();
            e.preventDefault();
            break;

          case 'KEY_BACKSPACE':
            node.del(caret.getPos());
            caret.goLeft(true);
            e.preventDefault();
            break;

          case 'KEY_DELETE':
            node.del(caret.getPos()+1);
            e.preventDefault();
            break;

        }
      }
      keyEvents.handled = true;
      render();
    });

    // Targets special chars and resets keyEvents.handled hack back to false
    $el.live('keyup', function(e){
      // var k ={}; k.code = e.keyCode; k.string = (keyEvents.specialKeys[k.code] || 'KEY_UNKNOWN');
      keyEvents.handled = false; //needs to be set back to false
    });

    // Targets all printable characters
    // Note:
    //  IE: does not fire keypress events for special keys
    //  FF: sets charCode to 0, and sets the correct keyCode
    //  Safari: sets keyCode and charCode to something stupid
    $el.live('keypress', function(e){
      var k ={};

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

        if(k.code !== 0){ //This shouldnt happen!
          // insert the new character
          node.addChar(k.string, caret.getPos());
          // update caret
          caret.goRight(e);
          render();
       }


    });


    // Deals with deactivation
    $el.live('blur', function(){
      var chars = node.getChars();
      if(chars.length === 0){
        phTagline();
        init();
      }      
    });

    // Activates the surface making it editable
    $el.live('click', function(){
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
          }else if(caret.getPos() === 0){
            $(chars[0].dom).attr({id:'caret'}).addClass('first');
          }

          _char.dom = $span;// is this necessary?
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