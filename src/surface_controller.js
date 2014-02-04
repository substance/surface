"use strict";

var _ = require("underscore");
var util = require("substance-util");


// A Controller that makes Nodes and a Document.Container readable and selectable
// ========
//
// This is a just stripped down version of the EditorController
// TODO: Let EditorController derive from SurfaceController? Oliver, thoughts?

var SurfaceController = function(documentSession) {
  this.session = documentSession;
};

SurfaceController.Prototype = function() {
  _.extend(this, util.Events);

  this.isEditor = function() {
    return false;
  };
};

SurfaceController.prototype = new SurfaceController.Prototype();

Object.defineProperties(SurfaceController.prototype, {
  "selection": {
    get: function() {
      return this.session.selection;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "annotator": {
    get: function() {
      return this.session.annotator;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "container": {
    get: function() {
      return this.session.container;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "document": {
    get: function() {
      return this.session.document;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  },
  "view": {
    get: function() {
      // TODO: 'view' is not very accurate as it is actually the name of a view node
      // Beyond that 'view' as a node type is also confusing considering the Views.
      console.error("TODO: rename this property.");
      return this.session.container.name;
    },
    set: function() {
      throw new Error("Immutable.");
    }
  }
});

module.exports = SurfaceController;