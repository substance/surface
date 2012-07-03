# This is an experimental branch

Surface's main dependency is CodeMirror2, and because is so tightly coupled we ended up rewriting what we needed. Most of the code will be implemented in the next 1-2 weeks, currently I'm still gathering data and ideas.

## Development notes

Throughout the project DOM elements should be prefixed with `$` to easily differentiate JS variables from DOM elements.

**grunt.js** is setup to watch for changes in `lib/*.js` and automatically concatenate and lint files to `surface.js`.

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

Still reading the W3 draft … and thinking how to easily implement the modifiers (Shift, Ctrl, etc) binding order; so when binding `Ctrl-Shift-A: 'selectAll'`, a `Shift-Ctrl-A` will do the same thing. 


### Commands

**TODO**

+ how to manage commands wisely? when extending surface how to add commands?
+ how to hold state on visual movement (caret, select) and data manipulation?
+ how to handle operations -- a operation == a stack of commands?
+ should a command be able to extend another? usecases?

```js
// command object
{
  name: 'goCharLeft'
, exec: function () {
    // le code
  }
, ...
}
```

#### Write a list of commands that need to be implemented:

##### Caret movement:
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

##### Data manipulation commands:
+ `insChar` - insert string/char at position (line, column)
+ `delChar` - delete from to (range)
+ `delWordLeft`
+ `delWordRight`
+ `delLine`
+ `delAll`

##### Selection:
+ `selectRange`
+ `selectAll`


### Pixel - maybe should be named simply `dom`?
A module that will deal with:

+ character/string measurements
+ DOM interaction (view) - mouse clicks, select & drag and drop
+ DOM rendering, text highliting
