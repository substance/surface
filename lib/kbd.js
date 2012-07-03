var KEY_NAMES = {
// Function Keys
  3: "Enter"
, 8: "Backspace"
, 9: "Tab"
, 13: "Enter"
, 19: "Pause"
, 27: "Esc"
, 32: "Space"
, 33: "PageUp"
, 34: "PageDown"
, 35: "End"
, 36: "Home"
, 37: "Left"
, 38: "Up"
, 39: "Right"
, 40: "Down"
, 44: "Print"
, 45: "Insert"
, 46: "Delete"

, 96: "NumPad0"
, 97: "NumPad1"
, 98: "NumPad2"
, 99: "NumPad3"
, 100: "NumPad4"
, 101: "NumPad5"
, 102: "NumPad6"
, 103: "NumPad7"
, 104: "NumPad8"
, 105: "NumPad9"
, 106: "*"
, 107: "="
, 109: "-"
, 110: "."
, 111: "/"

, 112: "F1", 113: "F2", 114: "F3", 115: "F4"
, 116: "F5", 117: "F6", 118: "F7", 119: "F8"
, 120: "F9", 121: "F10", 122: "F11", 123: "F12"


// Printable Keys
, 48: "0", 49: "1", 50: "2", 51: "3", 52: "4"
, 53: "5", 54: "6", 55: "7", 56: "8", 57: "9"

, 65: "a", 66: "b", 67: "c", 68: "d", 69: "e"
, 70: "f", 71: "g", 72: "h", 73: "i", 74: "j"
, 75: "k", 76: "l", 77: "m", 78: "n", 79: "o"
, 80: "p", 81: "q", 82: "r", 83: "s", 84: "t"
, 85: "u", 86: "v", 87: "w", 88: "x", 89: "y"
, 90: "z"

, 186: ";", 59: ";"
, 187: "=", 61: "="
, 188: ","
, 189: "-"
, 190: "."
, 191: "/"
, 192: "`"
, 219: "["
, 220: "\\"
, 221: "]"
, 222: "'"

};

// DOM Level 3 Modifier keys
var MODIFIER_KEYS = {
  16: "Shift"
, 17: "Ctrl"
, 18: "Alt"
, 20: "CapsLock"
, 91: "Meta" // left Cmd (OSX)
, 92: "Meta"
, 93: "Meta" // right Cmd (OSX)
, 144: "NumLock"
, 145: "ScrollLock"
// AltGraph simulates Alt-Ctrl
}

// OS-specific media keys, like volume controls, etc.
// to be used as an interval, ex:
// if (MEDIA_KEYS[0] < charCode && charCode > MEDIA_KEYS[1]) char = "media"
var MEDIA_KEYS = [166, 183]

// Handle modifiers
var KEY_MOD = {
    Shift: false
  , Ctrl: false
  , Alt: false
  , Meta: false
  }
, KEY_MOD_CODE = {
    Shift: 0x01
  , Ctrl: 0x02
  , Alt: 0x04
  , Meta: 0x08
  }
, keyCombo = 0

function isModifier (event) {
  var key = MODIFIER_KEYS[event.keyCode]

  if (key) {
    keyCombo += (keyMod[key] = !keyMod[key]) ? keyModCode[key] : -keyModCode[key]
    return true
  }
}


function handleKeyEvent (event) {
  var keyName = KEY_NAMES[event.keyCode]

  if (keyCombo)
    console.log(keyCombo +" - "+ keyName)
}

// Handle DOM events: 'keydown', 'keyup'
// 'keydown' events are fired continuously while key is hold down,
// except for modifiers, which fire only one event while key' down.
// CapsLock fires 'keydown' when activated, 'keyup' when deactivated
function onKeyDown (event) {
  if (isModifier(event)) return

  handleKeyEvent(event)
}
function onKeyUp (event) {
  isModifier(event)
}
// DOM Level 3 specs deprecates 'keypress' in favour of 'input'
// no implemented
function onKeyPress () { }


// Default keymap
var keymaps = {
  base: {}
}
// Bind keys to commands
function bindKeyMap (keys, map) {
  if (map) {
    extend(keymaps[map] || (keymaps[map] = {}), keys)
  }
  else extend(keymaps.base, keys)
}

