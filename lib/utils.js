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