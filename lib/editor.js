function Surface ($parent) {
  var $el = this.$el = $doc.createElement('div')
  $el.className = "surface"
  $el.innerHTML = "<div><div class=ss-content></div></div>"

  // a <div> wrapper is added so we don't care
  // if we add padding to the editor or not
  this.$wrap= $el.firstChild

  // this holds the rendered content
  this.$content = this.$wrap.firstChild

  // add caret
  this.caret = new Caret(this.$wrap)
  // add text input
  this.$input = kbdInputInit(this.$wrap)


  // add some key events for testing
  this.on('keydown', onKeyDown)
  this.on('keyup', onKeyUp)


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