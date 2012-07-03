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