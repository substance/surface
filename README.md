# This is an experimental branch

Surface's main dependency is CodeMirror2, and because is so tightly coupled we ended up rewriting what we needed. Most of the code will be implemented in the next 1-2 weeks, currently I'm still gathering data and ideas.

## Separation of concerns -- to be implemented --

Each of the following are independent agents that will deal with complex behavior and low-frequency dynamics (are loosely coupled):

### Caret

A module that will deal with caret positioning

+ `Caret([name], [color])`
+ `caret.offset(left, top)` - set position
+ `caret.visibility([bool])` - toggle show/hide
+ `caret.height([size])` - used to set height if different fonts are used on the same line

```
// if a name is passed it will display it above the caret
var caret = new Caret()
caret.offset(62, 393)

// remote user, multiple instances
clara.caret = new Caret('Clara')
clara.caret.offset(34, 59)
```

### Dataset
CodeMirror2 implemented a B-tree data structure that holds Line objects. Line objects hold text, style and state.

Currently this is an issue; how to approach it hasn't been decided yet.

```
// version A
line = {
  bgClassName: false
  className: false
  gutterMarker: false // { text: '\u00a0', style: 'cm-marker' }
  handlers: false     // array of callbacks
  hidden: false       // state for code fold
  marked: false       // state for TextMarker
  parent: LeafChunk
  stateAfter: true    // state for the microsyntax modes
  styles: [ ... ]     // tokens and text 
  text: " if (n == 0) {  /* buffer is empty */ "
}

// version B - separation of model and view
line = {
  marked: false
  tokenMarks: []
  text: " if (n == 0) {  /* buffer is empty */ "
  style: style // pointer to style object
}
style = {
  class: css-class
  css: some-inline-css
  bold: true  // special prop are added based on plugins (commands)
  italic: false
  underline: false
  fontSize: false   // inherits default
  fontFamily: false // inherits default
} // style object is computed to render HTML
```

### Pixel 
A module that will deal with:

+ character/string measurements
+ DOM interaction (view) - mouse clicks, select & drag and drop
+ DOM rendering, text highliting

### Operator 
A task system, that will take simple commands (operations) and execute complex behavior, holds history and computes undo/redo commands

I would like to follow some of the contentEditable API, but it hasn't been decided yet.

```
commands = [{
  type: insert
  string: 'cat'
  stringType: paragraph
  from: [line, char]
}, {
  type: delete
  from: [line, char]
  to: [line, char]
}, {
  type: mark
  from: [line, char]
  to: [line, char]
}]
```

### Input
Handles key events and key-maps; deals with hidden textarea