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

var TextNode = function(font, size){

    var _chars = [];

    // Inserts a character at the specified position
    // Todo: implement function insChar
    // Becomes:
    // insert('w|c') -> inserts word|char at current caret position/line
    function _addChar(ch, pos){
      var id = _.uniqueId('char-')
      ,   width = fontSizes[font][size][ch]
      ,   character = {
          "id" : id,
          "dom" :  null,
          "value" :  ch,
          "width" : width
        };

      _editChar(character, pos);
    }

    // updates the char array
    function _editChar(ch, pos){

      var ch = ch || null;
      var len = _chars.length;
      // distance to the end of the array
      var right = len - pos;
      
      // if we are passing null ch it means we are deleting
      // so we offset the tail by one
      if(ch === null) right = right +1;

      // begining of array to distance only
      var pre = _.initial(_chars, right);
      // end of the array from distance
      var post = _.rest(_chars, pos);

      if(ch === null){
        _chars = _.union(pre, post);
      }else{
        _chars = _.union(pre, [ch], post);
      }

    }

    // Deletes character at specified position
    // Todo: implement function delChar - delete from to (range)
    // Becomes:
    // function del ('w|c')  -> deletes word|char at current caret position/line
    function _del(pos){
      _editChar(null, pos);
    }

    // returns a char object
    // from the specified position
    function _getChar(pos){
      return _chars[pos-1];
    }

    // exposes the chars array
    function _getCars(){
      return _chars;
    }

    return {

      addChar:       _addChar,
      del:           _del,
      getChar:       _getChar,
      getChars:     _getCars

    };

};