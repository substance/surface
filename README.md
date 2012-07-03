# This is an experimental branch

Surface's main dependency is CodeMirror2, and because is so tightly coupled we ended up rewriting what we needed. Most of the code will be implemented in the next 1-2 weeks, currently I'm still gathering data and ideas.

## Development notes

**grunt.js** is setup to watch for changes `surface/lib/*.js` and automatically concatenate, lint files from  to `surface.js`.

```bash
surface$ grunt watch

Running "watch" task
Waiting...
```

## The API will constantly change - not stable

### Caret
```js
var caret = new Caret(parentNode)
caret.offset(left, top) // set position
caret.show()
caret.hide() 
// used to set height if different fonts are used on the same line
caret.height([size])
```

### Keyboard Input

Still reading the W3 draft … and thinking how to easily implement the modifiers (Shift, Ctrl, etc) binding order; so when binding `Ctrl-Shift-A: 'selectAll'` , a `Shift-Ctrl-A` will do the same thing. 

### Commands

**TODO**

+ how to hold state on visual movement and data manipulation
+ how to handle operations - one operation = stack of commands?

#### Write a list of commands that need to be implemented:

#### Caret movement:
+ `goCharLeft`
+ `goCharRight`
+ `goLineUp`
+ `goLineDown`
+ `goLineStart`
+ `goLineEnd`
+ `goDocStart`
+ `goDocEnd`
+ `goWordLeft`
+ `goWordRight`

#### Data manipulation commands:
+ `delChar`
+ `delWordLeft`
+ `delWordRight`
+ `delLine`

#### Selection:
+ `selectWord`
+ `selectAll`
+ `selectRange`


### Pixel - maybe should be named simply `dom`?
A module that will deal with:

+ character/string measurements
+ DOM interaction (view) - mouse clicks, select & drag and drop
+ DOM rendering, text highliting
