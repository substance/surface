'use strict';

var Substance = require('substance');

// SurfaceObserver watches the DOM for changes that could not be detected by this class
// For instance, it is possible to use the native context menu to cut or paste
// Thus, it serves as a last resort to get the model back in sync with the UI (or reset the UI)
var SurfaceObserver = require('./surface_observer');
var SurfaceSelection = require('./surface_selection');

var Surface = function uiSurface( container, model ) {

  this.container = container;
  this.model = model;

  this.surfaceObserver = new SurfaceObserver(this);
  this.surfaceSelection = new SurfaceSelection(container.element);

  // TODO: VE make jquery injectable
  this.$ = $;
  this.$window = this.$( window );
  this.$document = this.$( window.document );

  this.dragging = false;
  this.focused = false;

  // This is set on entering changeModel, then unset when leaving.
  // It is used to test whether a reflected change event is emitted.
  this.hasSelectionChangeEvents = 'onselectionchange' in window.document;

  this._onMouseUp = Substance.bind( this.onMouseUp, this );
  this._onMouseDown = Substance.bind( this.onMouseDown, this );
  this._onMouseMove = Substance.bind( this.onMouseMove, this );
  this._onSelectionChange = Substance.bind( this.onSelectionChange, this );
  this._onWindowResize = Substance.bind( this.onWindowResize, this );
  this._onFocusChange = Substance.bind( Substance.debounce( this.onFocusChange ), this );
  this._onKeyDown = Substance.bind( this.onKeyDown, this );
  this._onKeyPress = Substance.bind( this.onKeyPress, this );
  this._afterKeyPress = Substance.bind( Substance.delay(this.afterKeyPress), this );
  this._onCut = Substance.bind( this.onCut, this );
  this._onCopy = Substance.bind( this.onCopy, this );

};

Surface.Prototype = function() {

  this.atttach = function() {
    this.$window.on( 'resize', this._onWindowResize );
    // It is possible for a mousedown to clear the selection
    // without triggering a focus change event (e.g. if the
    // document has been programmatically blurred) so trigger
    // a focus change to check if we still have a selection
    this.$document.on( 'mousedown', this._onFocusChange );
    this.$document.on( 'focusin', this._onFocusChange );
    this.$document.on( 'focusout', this._onFocusChange );
    this.attachKeyboardHandlers();
    this.attachMouseHandlers();

    this.surfaceObserver.connect( this, {
      contentChange: 'onObserverContentChange',
      selectionChange: 'onObserverSelectionChange'
    } );
    this.model.connect( this, {
      select: 'onModelSelect',
      documentChange: "onDocumentChange"
    } );
  };

  this.detach = function() {
    this.$window.off( 'resize', this._onWindowResize );
    // It is possible for a mousedown to clear the selection
    // without triggering a focus change event (e.g. if the
    // document has been programmatically blurred) so trigger
    // a focus change to check if we still have a selection
    this.$document.off( 'mousedown', this._onFocusChange );
    this.$document.off( 'focusin', this._onFocusChange );
    this.$document.off( 'focusout', this._onFocusChange );

    this.detachKeyboardHandlers();
    this.detachMouseHandlers();

    this.surfaceObserver.disconnect(this);
    this.model.disconnect(this);
  };

  this.attachKeyboardHandlers = function() {
    this.$element.on('keydown', this._onKeyDown);
    this.$element.on('keypress', this._onKeyPress);
    this.$element.on('keypress', this._afterKeyPress);
  };

  this.detachKeyboardHandlers = function() {
    this.$element.off('keydown', this._onKeyDown);
    this.$element.off('keypress', this._onKeyPress);
    this.$element.off('keypress', this._afterKeyPress);
  };

  this.attachMouseHandlers = function() {
    if ( this.hasSelectionChangeEvents ) {
      this.$document.on( 'selectionchange', this._onSelectionChange );
    } else {
      this.$element.on( 'mousemove', this._onSelectionChange );
    }
    this.$element.on( 'mousemove', this._onMouseMove );
    this.$element.on( 'mousedown', this._onMouseDown );
  };

  this.detachMouseHandlers = function() {
    if ( this.hasSelectionChangeEvents ) {
      this.$document.off( 'selectionchange', this._onSelectionChange );
    } else {
      this.$element.off( 'mousemove', this._onSelectionChange );
    }
    this.$element.off( 'mousemove', this._onMouseMove );
    this.$element.off( 'mousedown', this._onMouseDown );
  };

  this.isRenderingLocked = function () {
    return this.renderLocks > 0;
  };

  this.incRenderLock = function () {
    this.renderLocks++;
  };

  this.decRenderLock = function () {
    this.renderLocks--;
  };

  this.handleLeftOrRightArrowKey = function ( /*e*/ ) {
    // TODO: let contenteditable move and then transfer the new window selection
  };

  this.handleUpOrDownArrowKey = function ( /*e*/ ) {
    // TODO: let contenteditable to the move
    // and then transfer the new window selection
  };

  this.handleEnter = function( /*e*/ ) {
    var tx = this.model.startTransaction();
    tx.break();
    tx.save();
  };

  this.handleInsertion = function() {
    // TODO: what to do?
  };

  this.handleDelete = function ( e ) {
    var direction = e.keyCode === Surface.Keys.DELETE ? 1 : -1;
    var unit = ( e.altKey === true || e.ctrlKey === true ) ? 'word' : 'character';
    var tx = this.model.startTransaction();
    var selection = tx.getSelection();
    if ( selection.isCollapsed() ) {
      // In case when the range is collapsed use the same logic that is used for cursor left and
      // right movement in order to figure out range to remove.
      var newRange = tx.createRelativeRange(direction, unit, true);
      selection.setRange(newRange);
    }
    // do nothing if it is still collapsed, i.e., can't delete e.g. because at the end of document.
    if (selection.isCollapsed()) {
      return;
    }
    tx.deleteRange(selection.straight());
    selection.collapse(-1);
    tx.save();
  };

  /* Event handlers */

  this.onFocus = function () {
    this.surfaceObserver.start();
    this.focused = true;
    this.emit( 'focus' );
  };

  this.onBlur = function () {
    this.dragging = false;
    this.model.clearSelection();
    this.focused = false;
    this.emit( 'blur' );
  };

  this.onMouseDown = function ( e ) {
    if ( e.which !== 1 ) {
      return;
    }
    // Remember the mouse is down
    this.dragging = true;
    // Bind mouseup to the whole document in case of dragging out of the surface
    this.$document.on( 'mouseup', this._onMouseUp );

    // TODO: update selection delayed
  };

  this.onMouseUp = function ( /*e*/ ) {
    this.$document.off( 'mouseup', this._onMouseUp );
    this.surfaceObserver.start();
    // TODO: update selection
    this.dragging = false;
  };

  this.onMouseMove = function () {
    // TODO: update selection (i.e. during dragging?)
  };

  /**
   * Handle document selection change events.
   *
   * @method
   * @param {jQuery.Event} e Selection change event
   */
  this.onSelectionChange = function () {
    if ( !this.dragging ) {
      // Optimisation
      return;
    }
    // TODO: update selection
  };

  /**
   * Handle document key down events.
   *
   * @method
   * @param {jQuery.Event} e Key down event
   * @fires selectionStart
   */
  this.onKeyDown = function( e ) {
    if ( e.which === 229 ) {
      // ignore fake IME events (emitted in IE and Chromium)
      return;
    }
    switch ( e.keyCode ) {
      case Surface.Keys.LEFT:
      case Surface.Keys.RIGHT:
        return this.handleLeftOrRightArrowKey( e );
      case Surface.Keys.UP:
      case Surface.Keys.DOWN:
        return this.handleUpOrDownArrowKey( e );
      case Surface.Keys.ENTER:
        e.preventDefault();
        return this.handleEnter( e );
      case Surface.Keys.BACKSPACE:
      case Surface.Keys.DELETE:
        e.preventDefault();
        return this.handleDelete( e );
      default:
        break;
    }
  };

  this.onKeyPress = function( e ) {
    // Filter out non-character keys. Doing this prevents:
    // * Unexpected content deletion when selection is not collapsed and the user presses, for
    //   example, the Home key (Firefox fires 'keypress' for it)
    // * Incorrect pawning when selection is collapsed and the user presses a key that is not handled
    //   elsewhere and doesn't produce any text, for example Escape
    // TODO: Should be covered with Selenium tests.
    if (
      // Catches most keys that don't produce output (charCode === 0, thus no character)
      e.which === 0 || e.charCode === 0 ||
      // Opera 12 doesn't always adhere to that convention
      e.keyCode === Surface.Keys.TAB || e.keyCode === Surface.Keys.ESCAPE ||
      // Ignore all keypresses with Ctrl / Cmd modifier keys
      !!( e.ctrlKey || e.metaKey )
    ) {
      return;
    }
    this.handleInsertion();
  };

  this.afterKeyPress = function () {
    this.surfaceObserver.pollOnce();
  };

  /* Event handlers driven by dm.Document events */

  this.onModelSelect = function( newRange ) {
    if ( !newRange ) {
      return;
    }
    // If there is no focused node, use native selection, but ignore the selection if
    // changeModelSelection is currently being called with the same (object-identical)
    // selection object (i.e. if the model is calling us back)
    if ( !this.isRenderingLocked() ) {
      this.showSelection( this.model.getSelection() );
    }
    // TODO: update selection
  };

  this.onDocumentChange = function(changes) {
    if (!this.isRenderingLocked()) {
      var nodeIds = changes.getNodes();
      for (var i = 0; i < nodeIds.length; i++) {
        var view = this.container.nodes[nodeIds[i]];
        if (view) {
          view.onModelUpdate();
        }
      }
    }
  };

};

Substance.inheritClass( Surface, Object );

Surface.Keys =  {
  UNDEFINED: 0,
  BACKSPACE: 8,
  DELETE: 46,
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  END: 35,
  HOME: 36,
  TAB: 9,
  PAGEUP: 33,
  PAGEDOWN: 34,
  ESCAPE: 27,
  SHIFT: 16,
  SPACE: 32
};

module.exports = Surface;
