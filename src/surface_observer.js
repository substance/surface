
var Substance = require('substance');

function SurfaceObserver(surface) {
  this.surface = surface;
};

Substance.inheritClass(SurfaceObserver, Substance.EventEmitter);

module.exports = SurfaceObserver;
