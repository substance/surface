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