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