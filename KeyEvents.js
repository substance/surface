/*
  
  ==================================================
  Adapted from MOCHIKIT key events THANK YOU MOCHIKIT!!!
  ==================================================

  If you're looking for a special key, look for it in keydown or
  keyup, but never keypress. If you're looking for a Unicode
  chracter, look for it with keypress, but never keyup or
  keydown.

  Notes:

  FF key event behavior:
  key     event   charCode    keyCode
  DOWN    ku,kd   0           40
  DOWN    kp      0           40
  ESC     ku,kd   0           27
  ESC     kp      0           27
  a       ku,kd   0           65
  a       kp      97          0
  shift+a ku,kd   0           65
  shift+a kp      65          0
  1       ku,kd   0           49
  1       kp      49          0
  shift+1 ku,kd   0           0
  shift+1 kp      33          0

  IE key event behavior:
  (IE doesn't fire keypress events for special keys.)
  key     event   keyCode
  DOWN    ku,kd   40
  DOWN    kp      undefined
  ESC     ku,kd   27
  ESC     kp      27
  a       ku,kd   65
  a       kp      97
  shift+a ku,kd   65
  shift+a kp      65
  1       ku,kd   49
  1       kp      49
  shift+1 ku,kd   49
  shift+1 kp      33

  Safari key event behavior:
  (Safari sets charCode and keyCode to something crazy for
  special keys.)
  key     event   charCode    keyCode
  DOWN    ku,kd   63233       40
  DOWN    kp      63233       63233
  ESC     ku,kd   27          27
  ESC     kp      27          27
  a       ku,kd   97          65
  a       kp      97          97
  shift+a ku,kd   65          65
  shift+a kp      65          65
  1       ku,kd   49          49
  1       kp      49          49
  shift+1 ku,kd   33          49
  shift+1 kp      33          33

  */

function KeyEvents(){

  var _handled = false;

  /* Safari sets keyCode to these special values onkeypress. */
  var __specialMacKeys = {
    3: 'KEY_ENTER',
    63289: 'KEY_NUM_PAD_CLEAR',
    63276: 'KEY_PAGE_UP',
    63277: 'KEY_PAGE_DOWN',
    63275: 'KEY_END',
    63273: 'KEY_HOME',
    63234: 'KEY_ARROW_LEFT',
    63232: 'KEY_ARROW_UP',
    63235: 'KEY_ARROW_RIGHT',
    63233: 'KEY_ARROW_DOWN',
    63302: 'KEY_INSERT',
    63272: 'KEY_DELETE'
  };
  /* Standard keyboard key codes. */
  var __specialKeys = {
    8: 'KEY_BACKSPACE',
    9: 'KEY_TAB',
    12: 'KEY_NUM_PAD_CLEAR', // weird, for Safari and Mac FF only
    13: 'KEY_ENTER',
    16: 'KEY_SHIFT',
    17: 'KEY_CTRL',
    18: 'KEY_ALT',
    19: 'KEY_PAUSE',
    20: 'KEY_CAPS_LOCK',
    27: 'KEY_ESCAPE',
    32: 'KEY_SPACEBAR',
    33: 'KEY_PAGE_UP',
    34: 'KEY_PAGE_DOWN',
    35: 'KEY_END',
    36: 'KEY_HOME',
    37: 'KEY_ARROW_LEFT',
    38: 'KEY_ARROW_UP',
    39: 'KEY_ARROW_RIGHT',
    40: 'KEY_ARROW_DOWN',
    44: 'KEY_PRINT_SCREEN',
    45: 'KEY_INSERT',
    46: 'KEY_DELETE',
    59: 'KEY_SEMICOLON', // weird, for Safari and IE only
    91: 'KEY_WINDOWS_LEFT',
    92: 'KEY_WINDOWS_RIGHT',
    93: 'KEY_SELECT',
    106: 'KEY_NUM_PAD_ASTERISK',
    107: 'KEY_NUM_PAD_PLUS_SIGN',
    109: 'KEY_NUM_PAD_HYPHEN-MINUS',
    110: 'KEY_NUM_PAD_FULL_STOP',
    111: 'KEY_NUM_PAD_SOLIDUS',
    144: 'KEY_NUM_LOCK',
    145: 'KEY_SCROLL_LOCK',
    186: 'KEY_SEMICOLON',
    187: 'KEY_EQUALS_SIGN',
    188: 'KEY_COMMA',
    189: 'KEY_HYPHEN-MINUS',
    190: 'KEY_FULL_STOP',
    191: 'KEY_SOLIDUS',
    192: 'KEY_GRAVE_ACCENT',
    219: 'KEY_LEFT_SQUARE_BRACKET',
    220: 'KEY_REVERSE_SOLIDUS',
    221: 'KEY_RIGHT_SQUARE_BRACKET',
    222: 'KEY_APOSTROPHE'
    // undefined: 'KEY_UNKNOWN'
  };

  /* for KEY_F1 - KEY_F12 */
  var _specialMacKeys = __specialMacKeys;
  for (var i = 63236; i <= 63242; i++) {
    // no F0
    _specialMacKeys[i] = 'KEY_F' + (i - 63236 + 1);
  }

  /* for KEY_0 - KEY_9 */
  var _specialKeys = __specialKeys;
  for (var i = 48; i <= 57; i++) {
    _specialKeys[i] = 'KEY_' + (i - 48);
  }

  /* for KEY_A - KEY_Z */
  for (i = 65; i <= 90; i++) {
    _specialKeys[i] = 'KEY_' + String.fromCharCode(i);
  }

  /* for KEY_NUM_PAD_0 - KEY_NUM_PAD_9 */
  for (i = 96; i <= 105; i++) {
    _specialKeys[i] = 'KEY_NUM_PAD_' + (i - 96);
  }

  /* for KEY_F1 - KEY_F12 */
  for (i = 112; i <= 123; i++) {
    // no F0
    _specialKeys[i] = 'KEY_F' + (i - 112 + 1);
  }

  return{
      specialKeys:        _specialKeys,
      specialMacKeys:     _specialMacKeys,
      handled:            _handled
  }

}