# Surface implementation draft
An under development TODO list, based on characteristics inspired mostly from CodeMirror2


## Data model - how the text is handled and stored

CodeMirror2 has a B+ tree structure, all datasets are stored at the Leaf level of the tree. It uses this data structure to efficiently insert, remove and retrieve records.

The next example is a B+ tree like object that holds a 625 lines document. Each Leaf holds a maxium of 25 lines, each Branch holds a maxium of 5 Leafs/Branches.

```javascript
Branch: {
  children: [
    Branch: {
      children: [
        Leaf: {
          lines: [ 
            Line
          , ... 
          ]
        , height: 25 // the number of lines
        }
      , Leaf: { ... }
      , ...
      ]
    , height: 125 // sum of children (leaf) heights
    }
  , Branch: { ... }
  , ...
  ]
, height: 625 // sum of children (branch) heights
}
```

Each line is an instance of Line object:

```javascript
{
  bgClassName: false
  className: false
  gutterMarker: false // { text: '\u00a0', style: 'cm-marker' }
  handlers: false     // array of callbacks
  height: 1
  hidden: false       // state for code fold
  marked: false       // state for TextMarker
  parent: LeafChunk
  stateAfter: true    // state for the microsyntax modes
  styles: [ ... ]     // tokens and text 
  text: " if (n == 0) {  /* buffer is empty */ "
}
```

Line.styles array holds the tokens and text for syntax styling - even numbers hold chunks of the text string and odd numbers hold the corresponding tokens or null if doesn't apply:


```javascript
styles: [
  0: "  "
  1: null
  2: "if"
  3: "keyword"
  4: " ("
  5: null
  6: "n"
  7: "word"
  8: " "
  9: null
  10: "=="
  11: "operator"
  12: " "
  13: null
  14: "0"
  15: "number"
  16: ") {  "
  17: null
  18: "/* buffer is empty */"
  19: "comment"
]
````

### TODO

+ define some usecases to see what data model fits best
+ define what properties a Line object should have (how to handle State, Tokens/Style, raw text)


## Commands and Operations
Area specific commands

+ carret: `moveX`, `moveY`, `hide`, `show`, ...
+ line (text): `update/replace`, `prepend/indent`, `render`, ...
+ history: `undo`, `redo`, `clear`
+ select text: `selectText`, `markSelected`, allow multiple selections or markers (OT)

### TODO

+ separation of concerns: input, carret, positioning, state/events, rendering
+ define an Operator that will handle operations for OT
+ commands should fire events?

## Events

Namespaced events? PubSub?

```
surface.on('cmd::carret::moveX', function () {
  // le code
})
```

### TODO

+ how events should be handeled
+ who should fire events
+ how to define hooks for extensions


## Key bindings - keymaps

+ OS specific
+ browser specific
+ editor default

### TODO

+ define an easy way to bind keys to commands

## Microsyntaxes - a system to define text styling

An easy way to implement different parsers (lexers) that will add style to text  
CodeMirror2 parses the text line by line and holds the state and style on the Line object