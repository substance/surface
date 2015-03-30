
var Substance = require('substance');

// SurfaceObserver will serve us as a fallback to detect document changes triggered by the UI,
// e.g., when the user uses the browser's context menu.
function SurfaceObserver(surface) {
  this.surface = surface;
};

SurfaceObserver.Prototype = function() {

  this.start = function() {

  };

  this.stop = function() {

  };

};


Substance.inheritClass(SurfaceObserver, Substance.EventEmitter);

module.exports = SurfaceObserver;
