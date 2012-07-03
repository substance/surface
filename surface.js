// v0.0.0alpha - 11:07 03/07/12

;(function (global) {

function __toS (o) { return Object.prototype.toString.call(o) }
function isDate (o) { return __toS(o) === '[object Date]' }
function isRegExp (o) { return __toS(o) === '[object RegExp]' }
function isError (o) { return __toS(o) === '[object Error]' }
function isBoolean (o) { return __toS(o) === '[object Boolean]' }
function isNumber (o) { return __toS(o) === '[object Number]' }
function isString (o) { return __toS(o) === '[object String]' }
function isFunction (o) { return __toS(o) === '[object Function]' }

function extend (target) {
  var index, source, i = 0

  while (++i < arguments.length) {
    source = arguments[i]
    for (index in source)
      if (!(isFunction(source) && index === 'prototype'))
        target[index] = source[index];
  }
  return target
}
function clone (ob) {
  return Array.isArray(ob) ? ob.slice() : extend({}, ob)
}

var charToEscape = {
  '&': '&amp;'
, '<': '&lt;'
, '>': '&gt;'
}
function htmlEscape(html) {
  return html.replace(/[<&>]/g, function (char) {
    return charToEscape[char] || char;
  })
}


// Shortcuts
$doc = global.document
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


function kbdInputInit ($parent) {
  var $el = $doc.createElement('div')
  $el.className = "ss-kbd-input"

  $parent.appendChild($el)

  return $el
}
var MOUSE_BUTTONS = {
  0: "Left"
, 1: "Middle"
, 2: "Right"
}
function Caret ($parent) {
  var $el = this.$el = $doc.createElement('div')

  $el.className = "ss-caret"
  $parent.appendChild($el)

}
Caret.prototype.setHeight = function (size) {
  this.$el.style.height = size + "px" || "1em"
}
Caret.prototype.offset = function (x, y) {
  this.$el.style.top = y + "px"
  this.$el.style.left = x + "px"
}
Caret.prototype.hide = function () {
  this.$el.style.visibility = "hidden"
}
Caret.prototype.show = function () {
  this.$el.style.visibility = "visible"
}
// ----------------------------------------------------------------------------
//  DOM rendering & measurement instruments - not implemented
// ----------------------------------------------------------------------------
  function Pixel () {
    var $el = this.$el = global.document.createElement('div')
    
    $el.style.position = 'absolute'
  }
  Pixel.prototype.getWidth = function (str) {
    this.$el.innerHTML = "<div><span>x</span></div>";
    this.$el.firstChild.firstChild.firstChild.nodeValue = str;

    return this.$el.firstChild.firstChild.offsetWidth;
  }
// ----------------------------------------------------------------------------
//  Dataset - a B-tree implementation - not implemented
// ----------------------------------------------------------------------------
  function Dataset () {
    this._data = []
  }
  Dataset.prototype.add = {

  }

  function Node (data) {
    this.data = data
    this.parent = arguments[1]
    this.size = false
  }


// ----------------------------------------------------------------------------
//  Line - not implemented
// ----------------------------------------------------------------------------
  function Line (text, style) {
    this.text = text || ""
    this.height = 1
    this.style = style || []
  }
  Line.prototype.update = function (from, to, text) {
    this.text = this.text.slice(0, from) + text + this.text.slice(to);
    
  }
  Line.prototype.append = function (text) {
    
  }
// ----------------------------------------------------------------------------
//  History - not implemented
// ----------------------------------------------------------------------------
  function History () {
    
  }
  History.prototype.undo = function () {
    
  }
  History.prototype.redo = function () {
    
  }
  History.prototype.clear = function () {
    
  }
// TODO: think how to hold state on visual movement and data manipulation


// TODO: think how to handle operations
// One operation = stack of commands?


// TODO: write a list of commands that need to be implemented

// Caret movement:
// goCharLeft
// goCharRight
// goLineUp
// goLineDown
// goLineStart
// goLineEnd
// goDocStart
// goDocEnd
// goWordLeft
// goWordRight

// Data manipulation commands:
// delChar
// delWordLeft
// delWordRight
// delLine

// Selection:
// selectWord
// selectAll
// selectRange



function Surface ($parent) {
  var $el = this.$el = $doc.createElement('div')
  $el.className = "surface"
  $el.innerHTML = "<div class=ss-content></div>"

  this.$content = $el.firstChild

  // add some key events for testing
  this.on('keydown', onKeyDown)
  this.on('keyup', onKeyUp)

  // add caret
  this.caret = new Caret($el)
  // add text input
  this.$input = kbdInputInit($el)

  // render el
  $parent.appendChild($el)
}

Surface.prototype.on = function (event, fn) {
  this._addEventType(this.$el, event, fn)
}
Surface.prototype._addEventType = function (el, type, fn, once) {
  el.addEventListener(type, fn, false)

  // TODO: implement 'once'
}

global.Surface = Surface
} (this));
