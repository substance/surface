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
    
    var $surface = $('.surface')
    ,   _caret = 0
    ,   _lines = []
    ,   keyEvents = new KeyEvents()
    ,   cFont = $surface.css('font-family').split(', ')[0]
    ,   fSize = $surface.css('font-size')
    ,   $plh = $($('[name="empty-placeholder"]').html())
    ,   contWidth = $surface.width()
    ,   lineWidth = 0;


    // Data
    // ----

    // Todo: reconsider the data structure and try a grid-like structure where each char has an x and y
    // Todo: implement function selectRange
    // Todo: implement function selectAll
    // Todo: implement function delWordLeft () {}
    // Todo: implement function delWordRight () {}
    // Todo: implement function delLine () {}
    // Todo: implement function delAll () {}
    // Todo: check boundaries left and right when moving around
    // Todo: search for all the blanks and newlines with underscore will return an array for quick browsing
    // Todo: wrap methods like this: surface.apply({method: "add-annotation", "data": {"start": 10, ...}});

    // Creates a new line object and
    // returns the created line
    function addLine(){
      var right = null
      , id = _.uniqueId('line-')
      , left = null
      , lastLine = getLine();

      if(typeof lastLine !== 'undefined'){
        lastLine.current = false;
        lastLine.right = id;
        left = lastLine.id;
      }

      var line = {
            "id" : id,
            "type" :  'line',
            "current" :  true,
            "left" :  left,
            "right" :  null,
            "chars" :  [],
            "white" :  [],
            "break" :  []
          };
      _lines.push(line);
      return line;
    }

    // Inserts a character in the caret position
    // Todo: implement function insChar
    // Becomes:
    // insert('w|c') -> inserts word|char at current caret position/line
    function addChar(_char){

      var _line = getLine()
      ,   id = _.uniqueId('char-')
      ,   cLine = getLine()
      ,   offset = getCaretPos() +1
      ,   parent = _line.id
      ,   width = fontSizes[cFont][fSize][_char];

      var ch = {
        "id" : id,
        "parent" :  parent,
        "type" : 'ch',
        "offset" :  offset,
        "value" :  _char,
        "width" : width
      };

      // distance to the end of the array
      var right = (cLine.chars.length+1) - offset;
      // begining of array to distance only
      var pre = _.initial(cLine.chars, right);
      // end of the array from distance
      var post = _.rest(cLine.chars);

      cLine.chars = _.union(pre, [ch], post);

      rebuildIndex();
      lineWidth += width;

      // Wrap time!
      if(lineWidth >= (contWidth / 2)){
        // _line = addLine();
      }
      setCaret(+1);
    }

    // Deletes a specified object from the structure
    // Todo: implement function delChar - delete from to (range)
    // Becomes:
    // function del ('w|c')  -> deletes word|char at current caret position/line
    function del(o){
      if(typeof o !== 'undefined'){
        switch(o.type){
          case 'ch':
            var cLine = getLine();
            cLine.chars = _.without(cLine.chars, o);
            rebuildIndex();
            break;
        }
      }     
    }

    // This currently goes trough the structure
    // and updates the offsets
    function rebuildIndex(){
       _.each(_lines, function(_line){
          _.each(_line.chars, function(_char, k){
            _char.offset = k + 1;
          });  
      });  
    }

    // returns a line object
    // if no position is specified
    // returns the current line
    function getLine(pos){
      var pos = pos || false;
      if(!pos){
        return _.find(_lines, function(ln){
          return ln.current === true;
        });
      }
    }

    // returns a char object
    // from the specified position
    function getChar(pos){
      var pos = pos || getCaretPos();
      var cLine = getLine();
      return cLine.chars[pos];
    }


    // Caret
    // -----

    // Todo: implement function goLineUp
    // Todo: implement function goLineDown
    // Todo: implement function goLineStart
    // Todo: implement function goLineEnd
    // Todo: implement function goDocStart
    // Todo: implement function goDocEnd
    // Todo: implement function goWordLeft
    // Todo: implement function goWordRight

    // Moves the caret one character to its left
    function goCharLeft(){
      setCaret(-1);
    }

    // Moves the caret one character to its right
    function goCharRight(){
      setCaret(+1);
    }

    // Sets the caret's position to a specified offset
    function setCaret(pos){
      var pos = pos || 0;
      var setTo = getCaretPos() + pos;
      if(setTo > 0) {
        _caret = setTo;
      }else{
        _caret = 0;
      }
    }

    // this should be done by setCaret which 
    // is now missused by others as an increment/decrement
    function putCaret(pos){
      _caret = pos;
    }

    // Returns current caret position
    function getCaretPos(){
      return _caret;
    }


    // Events
    // ------
    // Note: Based on Mochikit Key_Events
  
    // Targets special modifiers and special chars
    // Note: We're storing a handled flag to work around a Safari bug: 
    // http://bugs.webkit.org/show_bug.cgi?id=3387
    $surface.live('keydown', function(e){
      if (!keyEvents.handled) {

        var k ={};
        k.code = e.keyCode;
        k.string = (keyEvents.specialKeys[k.code] || 'KEY_UNKNOWN');

        var fn = keyEvents.specialKeyMap[k.string];
        if (fn) {
          fn();
        }
        switch(k.code){

          // Return|Enter
          case 13:
            e.preventDefault();
            break;


          // LEFT
          case 37:
            goCharLeft();
            break;

          // RIGHT
          case 39:
            goCharRight();
            break;

          // DELETE
          case 8:
            e.preventDefault();
            goCharLeft();
            del(getChar());
            break;

          // SUPR
          case 46:
            del(getChar());
            break;
        }
      }
      keyEvents.handled = true;
      render();
    });

    // Targets special chars and resets keyEvents.handled hack back to false
    $surface.live('keyup', function(e){
      keyEvents.handled = false; //needs to be set back to false
      // var k ={}; k.code = e.keyCode; k.string = (keyEvents.specialKeys[k.code] || 'KEY_UNKNOWN');
    });

    // Targets all printable characters
    // Note:
    //  IE: does not fire keypress events for special keys
    //  FF: sets charCode to 0, and sets the correct keyCode
    //  Safari: sets keyCode and charCode to something stupid
    $surface.live('keypress', function(e){
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


      if(_lines.length === 0){
        _cLine = addLine();
      }else{
        _cLine = getLine();
      }

      addChar(k.string);
      render();
    });


    // Render
    // ------

    // Renders the data structure into the surface
    function render(){
      var val
      ,   $span
      ,   $line = $('<div class="line"></div>');

      $surface.html('');

      if(_lines.length === 0){
        $plh.removeClass('empty');
        init();
      }else{
        
        _.each(_lines, function(_line){
          if(_line.chars.length === 0){
            $plh.removeClass('empty');
            init();
          }else{
            
            $line.data(_line);

            _.each(_line.chars, function(_char){
              (_char.value === " ")? val = "&nbsp;": val = _char.value;

              $span = $('<span>' + val + '</span>');
              $span.data(_char);
              $span.click(function(){
                putCaret($(this).data().offset);
                render();
              });
              $line.append($span);
            });
            $surface.append($line);
          }

        });

      }
      // console.log(_lines);
      printCaret();
    }


    // Helpers
    // -------

    // Formats json stringas html
    function jsonDebug(_json){
      return JSON.stringify(_json, null, 4).replace(/\n/g, '<br>').replace(/[ \f\n\r\t\v]/g, '&nbsp;');
    }

    // Prints out the datastructure
    function debug(){
      $('#debug').show().html(jsonDebug(_lines));
    }

    // Makes the caret visible inside surface
    function printCaret(){
      $('.surface span').removeClass('caret');
      $('.surface span[offset="off-' + getCaretPos() + '"]').addClass('caret');
    }

    // Deactivates the surface
    $surface.blur(function(){
      // If content is empty we put back the empty placholder
      if(_lines.length === 0 || ((typeof _lines[0] !== 'undefined') && _lines[0].chars.length === 0)){
        $plh.addClass('empty');
        init();
      }
    });

    // Activates the surface making it editable
    $surface.click(function(){
      // Wen activating the tab
      // and focussing we can then type in and receive key events
      $(this).attr({'tabindex':'1'});
      $(this).focus();
      render();
    });


    // Init
    // ----
    // Todo: Adjust the constructor to the defined api

    // Appends the placeholder
    function init(){
      $plh.data({'offset':0});
      $surface.html($plh);
    }

    // Caret ticker
    w.setInterval(function(){
      $surface.find('span').each(function(i, _span){
        if($(_span).data('offset') === getCaretPos()){
          $(_span).toggleClass('caret');
        }
      });
    }, 500);


    // Public API
    // ----

    return{

      init:init
      
    };

  };
})(window);