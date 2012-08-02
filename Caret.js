// Caret
// -----
// Maniplates the ofsset position within our text tring

// Todo: implement function goLineUp
// Todo: implement function goLineDown
// Todo: implement function goLineStart
// Todo: implement function goLineEnd
// Todo: implement function goDocStart
// Todo: implement function goDocEnd
// Todo: implement function goWordLeft
// Todo: implement function goWordRight

var Caret = function (limit) {

  var _pos = 0;
  var limit = limit || null;

  // Moves the caret one character to its left
  function _goLeft(edit){
    var edit = edit || false;
    _goTo(_getPos()-1, edit);
  }

  // Moves the caret one character to its right
  function _goRight(edit){
    var edit = edit || false;
    _goTo(_getPos()+1, edit);
  }

  // Sets the caret's position to a specified offset
  function _goTo(pos, edit){
    if(pos <= 0) pos = 0;
    // veryfication limits here
    _pos = pos;
  }

  // Returns current caret position
  function _getPos(){
    return _pos;
  }

  return {
    goLeft    : _goLeft,
    goRight   : _goRight,
    goTo      : _goTo,
    getPos    : _getPos
  };
}