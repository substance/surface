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