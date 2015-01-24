"use strict";

var util = require("substance-util");
var Surface = require("./surface");
var Keyboard = require("substance-commander").ChromeKeyboard;
var MutationObserver = window.MutationObserver;

var MutationObserver;

if (!window.MutationObserver) {
  if (window.WebKitMutationObserver) {
    MutationObserver = window.WebKitMutationObserver;
  }
} else {
  MutationObserver = window.MutationObserver;
}

// The EditableSurface is an editable Surface
// --------
// Don't look too close at this code. It is ugly. Yes. It is.

var __id__ = 0;

var EditableSurface = function(docCtrl, renderer, options) {
  Surface.call(this, docCtrl, renderer);

  this.__id__ = __id__++;

  options = options || {};
  var keymap = options.keymap;
  if (!keymap) {
    console.error("WARNING: no keymap specified.");
  }
  this.keyboard = new Keyboard(keymap);
  this.editorCtrl = docCtrl;
  this.el.spellcheck = false;

  // to be able to handle deadkeys correctly we need a DOMMutationObserver
  // that allows us to revert DOM pollution done by contenteditable.
  // It is not possible to implement deadkey ourselves. When we stop propagation of keypress
  // for deadkeys we do not receive text input or even a keyup
  // (which would contain the actual keycode of the deadkey)
  this._domChanges = [];
  this._hasDeadKey = false;

  this._initEditor(options);
  this.activate();
};

EditableSurface.Prototype = function() {

  // Override the dispose method to bind extra disposing stuff
  // --------
  // TODO: we should really consider to make this an independet class instead of a mix-in
  // and let the surface call the dispose explicitely

  var __dispose__ = this.dispose;
  this.dispose = function() {
    __dispose__.call(this);
    this.deactivate();
  };

  this.revertDOMChanges = function() {
    // console.log("Reverting DOM changes...", this._domChanges);
    var change = this._domChanges[0];
    change.el.textContent = change.oldValue;
    this._domChanges = [];
  };

  this.onTextInput = function(e) {
    var self = this;

    //console.log("EditableSurface onTextInput", e);
    var text = e.data;

    if (!e.data && self._hasDeadKey) {
      // skip
      // console.log("skipping _hasDeadKey", e, self._domChanges);
      return;
    }

    else if (e.data) {
      if (self._hasDeadKey) {
        // console.log("(", self.__id__, ") Handling deadkey", self._domChanges);
        self._hasDeadKey = false;
        self.revertDOMChanges();
        self.renderSelection();
      }

      // console.log("(", self.__id__, ") TextInput", text);
      // NOTE: this timeout brought problems with handling
      // deadkeys together with other cancelling input (e.g., backspace, return)
      // window.setTimeout(function() {
        try {
          self.updateSelection();
          self.editorCtrl.write(text);
        } catch (err) {
          self.editorCtrl.trigger("error", err);
        }
        // make sure there are no dom changes from this manipulation
        self._domChanges = [];
      // }, 0);
    }

    self._domChanges = [];
    e.preventDefault();
    e.stopPropagation();
  };


  this._initEditor = function(options) {
    var self = this;
    var keyboard = this.keyboard;
    var editorCtrl = this.editorCtrl;

    this._onModelSelectionChanged = this.onModelSelectionChanged.bind(this);
    this._onTextInput = this.onTextInput.bind(this);

    // Use `options.setBindings(editableSurface)` to register custom keyboard bindings.
    if (options.registerBindings) {
      options.registerBindings(this, keyboard, editorCtrl);
    }

    keyboard.setDefaultHandler("keypress", function(e) {
      // console.log("EditableSurface keypress", e, keyboard.describeEvent(e));
      try {
        editorCtrl.write(String.fromCharCode(e.which));
      } catch (err) {
        editorCtrl.trigger("error", err);
        util.printStackTrace(err);
      }
      e.preventDefault();
      e.stopPropagation();
    });

    keyboard.setDefaultHandler("keyup", function(e) {
      // console.log("EditableSurface keyup", e, keyboard.describeEvent(e));
      e.preventDefault();
      e.stopPropagation();
      self._domChanges = [];
    });

    keyboard.bind("special", "keydown", function(/*e*/) {
      // Note: this gets called twice: once for the deadkey and a second time
      // for the associated character
      if (!self._hasDeadKey) {
        // console.log("...special", e);
        self._hasDeadKey = true;
        self._domChanges = [];
      }
    });

    this._mutationObserver = new MutationObserver(function(mutations) {
      if (!self._hasDeadKey) {
        return;
      }
      mutations.forEach(function(mutation) {
        var entry = {
          mutation: mutation,
          el: mutation.target,
          value: mutation.target.textContent,
          oldValue: mutation.oldValue
        };
        // console.log("Recording mutation:", entry);
        self._domChanges.push(entry);
      });
    });


    // Handle selection changes
    // -------

    this._onMouseup = this.onMouseup.bind(this);
    this._onMousedown = this.onMousedown.bind(this);

    keyboard.pass("selection");
    keyboard.bind("selection", "keydown", function() {
      // Note: this is essential for the 'collaboration' with contenteditable
      // Whenever the selection is changed due to keyboard input
      // we just register an update which will be executed after
      // the contenteditable has processed the key.
      window.setTimeout(function() {
        self.updateSelection();
      });
    });
  };

  this.onMousedown = function(e) {
    if (e.target.isContentEditable) {
      this.__selecting = true;
    }
  };

  this.onMouseup = function(e) {
    if (!this.__selecting) {
      return;
    }
    this.__selecting = false;
    var self = this;

    // NOTE: this is important to let the content-editable
    // do the window selection update first
    // strangely, it works almost without it, and is necessary only for one case
    // when setting the cursor into an existing selection (??).
    window.setTimeout(function() {
      // Note: this method implements a try-catch guard triggering an error event
      self.updateSelection(e);
    });

    e.stopPropagation();
  };

  // Updates the window selection whenever the model selection changes
  // --------
  // TODO: we should think about how this could be optimized.
  // ATM, a window selection change, e.g., when moving the cursor,
  // triggers a model selection update, which in turn triggers a window selection update.
  // The latter would not be necessary in most cases.
  this.onModelSelectionChanged = function(range, options) {
    // Note: this method implements a try-catch guard triggering an error event
    this.renderSelection(range, options);
  };

  // Initialization
  // --------

  this.activate = function() {
    var el = this.el;

    // enables selection handling
    this.editorCtrl.session.selection.on("selection:changed", this._onModelSelectionChanged);
    el.addEventListener("mousedown", this._onMousedown, false);
    window.document.addEventListener("mouseup", this._onMouseup, false);

    // text input
    el.addEventListener("textInput", this._onTextInput, false);
    el.addEventListener("input", this._onTextInput, false);

    // activates MutationObserver to handle deadkeys
    var _mutationObserverConfig = { subtree: true, characterData: true, characterDataOldValue: true };
    this._mutationObserver.observe(el, _mutationObserverConfig);

    // activates keyboard bindings
    this.keyboard.connect(el);

    el.setAttribute("contenteditable", "true");
  };

  this.deactivate = function() {
    var el = this.el;

    // disables selection handling
    this.editorCtrl.session.selection.off("selection:changed", this._onModelSelectionChanged);
    el.removeEventListener("mousedown", this._onMousedown, false);
    window.document.removeEventListener("mouseup", this._onMouseup, false);

    // text input
    el.removeEventListener("textInput", this._onTextInput, false);
    el.removeEventListener("input", this._onTextInput, false);

    // disables MutationObserver to handle deadkeys
    this._mutationObserver.disconnect();

    // disable keyboard bindings
    this.keyboard.disconnect();

    el.setAttribute("contenteditable", "true");
  };

};

EditableSurface.Prototype.prototype = Surface.prototype;
EditableSurface.prototype = new EditableSurface.Prototype();

module.exports = EditableSurface;
