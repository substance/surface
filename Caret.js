// Caret
// -----
// Maniplates the ofsset position within our text tring

// Todo: implement function goLineUp
// Todo: implement function goLineDown

// Todo: implement function goLineStart
// Todo: implement function goLineEnd


var Caret = function (node) {

  var _pos = 0;

  // Moves the caret one character to its left
  function _goLeft(){
    _goTo(_getPos()-1);
  }

  // Moves the caret one character to its right
  function _goRight(e){
    _goTo(_getPos()+1);
  }

  // Sets the caret's position to a specified offset
  function _goTo(pos){
    if(pos < 0) pos = 0;
    var string = node.getChars();
    var end = string.length;
    if(pos > end)  pos = end;
    _pos = pos;
  }

  // Returns current caret position
  function _getPos(){
    return _pos;
  }

  // finds the previous blank space
  function _prevBlank(){
    var string = node.getChars();
    var pos = _getPos();
    var i = pos-1;
    var match = 0;

    for (; i >= 0; i--) {
      if(string[i].value === ' '){
        match = i;
        break;
      }
    };
    return match;
  }

  // finds the previous blank space
  function _nextBlank(){
    var string = node.getChars();
    var pos = _getPos()+1;
    var len = string.length;
    var match = len;

    for (; pos < len; pos++) {
      if(string[pos].value === ' '){
        match = pos;
        break;
      }
    };
    return match;
  }

  // moves the caret one word left
  function _goWordLeft(){
    _goTo(_prevBlank());
  }

  // moves the caret one word left
  function _goWordRight(){
    _goTo(_nextBlank());
  }

  // moves caret to the end of the string
  function goDocStart(){
    _goTo(0);
  }
  // moves caret to the end of the string
  function goDocEnd(){
    var string = node.getChars();
    _goTo(string.length);
  }

  return {
    goLeft      : _goLeft,
    goRight     : _goRight,
    goTo        : _goTo,
    getPos      : _getPos,
    goWordLeft  : _goWordLeft,
    goWordRight : _goWordRight,
    goDocEnd    : goDocEnd,
    goDocStart  : goDocStart
  };
}