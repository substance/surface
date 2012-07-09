function kbdInputInit ($parent) {
  var $el = $doc.createElement('div')
  $el.className = "ss-kbd-input"
  $el.contentEditable = true

  $parent.appendChild($el)

  return $el
}