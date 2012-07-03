function kbdInputInit ($parent) {
  var $el = $doc.createElement('div')
  $el.className = "ss-kbd-input"

  $parent.appendChild($el)

  return $el
}