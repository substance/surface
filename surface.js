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
    ,   cFont = 'OpenSansRegular' //fixed font name for now since grabbing it from the css provoqued bugs
    ,   fSize = $el.css('font-size')
    ,   tagLine = 'Eventually Consistent™'
    ,   $plh = $(tpl('empty-placeholder', {'text':tagLine}))
    ,   contWidth
    ,   node = new TextNode(cFont, fSize)
    ,   caret = new Caret(node)
    ,   newLineChar = '\\n';


    contWidth = $el.innerWidth() - (parseInt($el.css('padding-left')) + parseInt($el.css('padding-right')));

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
  
    function $getCurrent(){
      return $el.find('span.char:eq(' + (caret.getPos()-1) + ')');
    }

    function $getNext(){
      return $el.find('span.char:eq(' + (caret.getPos()) + ')');
    }

    // Caret ticker
    w.setInterval(function(){
      var $curr = $getCurrent();
      $curr.toggleClass('caret');
    }, 500);

    function phEmpty(){
        $plh.removeClass('empty');
        $plh.html('&nbsp');
    }

    function phTagline(){
        $plh.addClass('empty');
        $plh.html(tagLine);
    }

    function refresh(){
      $el.find('span').removeClass('caret');
    }

    function activate(){
      // Wen activating the tab
      // and focussing we can then type in and receive key events
      $el.attr({'tabindex':'1'});
      $el.focus();

      if(node.getChars().length === 0){
        phEmpty();
      } 
    }

    //Note: IE does not fire keypress events for special keys
    //Note: FF sets charCode to 0, and sets the correct keyCode
    //Note: Safari sets keyCode and charCode to something stupid
    function eToKey(e){
      var k ={};
      k.code = 0;
      k.string = '';

      if (typeof(e.charCode) != 'undefined' && e.charCode !== 0) {
          k.code = e.charCode;
          k.string = String.fromCharCode(k.code);
      } else if (e.keyCode &&
          typeof(e.charCode) == 'undefined') { // IE
          k.code = e.keyCode;
          k.string = String.fromCharCode(k.code);
      }
      return k;
    }


    // Events
    // ------

    // Special keys
    Mousetrap.bind('backspace', function(e) {
      e.preventDefault();      
      var $curr = $getCurrent();
      $curr.remove();
      node.del(caret.getPos());
      caret.goLeft(true);
    });

    Mousetrap.bind('del', function(e) {
      e.preventDefault();      
      var $next = $getNext();
      $next.remove();
      node.del(caret.getPos());
    });

    Mousetrap.bind('left', function(e) {
      e.preventDefault();
      caret.goLeft();
    });

    Mousetrap.bind('alt+left', function(e) {
      e.preventDefault();
      caret.goWordLeft();
    });

    Mousetrap.bind('right', function(e) {
      e.preventDefault();
      caret.goRight();
    });

    Mousetrap.bind('alt+right', function(e) {
      e.preventDefault();
      caret.goWordRight();
    });

    Mousetrap.bind(['home', 'pageup'], function(e) {
      e.preventDefault();
      caret.goDocStart();
    });

    Mousetrap.bind(['end', 'pagedown'], function(e) {
      e.preventDefault();
      caret.goDocEnd();
    });

    Mousetrap.bind('return', function(e) {
      e.preventDefault();
      node.addChar(newLineChar, caret.getPos());
      caret.goRight();
    });

    // printable characters
    $el.keypress( function(e){
      var k = eToKey(e);
      if(k.code !== 0){ // FF: sets charCode to 0
        node.addChar(k.string, caret.getPos());
        caret.goRight();
      }
    });

    caret.on('caret:moved', function(e){
      refresh();
    });

    node.on('char:added', function(oCh){
      var val = oCh.value;
       // override characters here
      if(oCh.value === ' ') val = '&nbsp;';
 
      var $span = $(tpl('char', {'id':oCh.id, 'ch':val}));
      if(oCh.value === newLineChar ) $span.addClass('br');
      $span.data(oCh);

      if(node.getChars().length === 0){
        $el.html('');
        $el.append($span);
      }else{
        $span.insertAfter($getCurrent());
      }
    });

    $el.find('span').live('click', function(e){
      e.preventDefault();
      // we need to retrieve the character back 
      // from the textnode to get the updated offset x
      var id = $(this).data().id;
      var curr = node.getChar(id) || {x:0};
      caret.goTo(curr.x+1);
    });

    // Activates the surface making it editable
    $el.live('click', function(){
      activate();
    });

    // Deals with deactivation
    $el.live('blur', function(){
      $(this).removeAttr('tabindex');

      if(node.getChars().length === 0){
        phTagline();
      }      
    });


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