# Substance Surface

Surface is intended to be an extensible low-level interface for rich text editing. It doesn't introduce any UI components, but an API for managing user-defined text annotations. For an implementation of a ritch text editor and several examples please refer to [Substance Text](https://github.com/substance/text)


## API (in-progress)

### Initialization (not sure on that)


```js
var proper = new Proper({
  el: '#content'
});
```

### Operations

The document is transformed using commands. Commands are either issues progammatically or triggered by the user (e.g. by entering text)

An operation to updtate text incrementally would look like so:

```js
var op = {
  command: "text:update",
  operation: ["ret(10)", "ins('ab')", "ret(4)", "del(2)"]
}
```

Applying it looks like so:

```js
proper.execute(op);
```

Transforming text in such a way is called [Operational Transformation](http://javascript-operational-transformation.readthedocs.org/en/latest/ot-for-javascript.html#getting-started).

Hooking into operations: (as they may be triggered by the user)

```js
proper.on('operation', function(operation) {
  // do something
});
```


### Annotations

**Adding an annotation**

```js
// Add annotation (uses the current selection)
proper.execute({
  "command": "annotation:insert",
  "id": "/comment/x", // optional
  "type": "comment",
  "data": {
    "author": "John Doe",
    "content": "You might want to spell that right. Right? :)"
  }
});
```

**Listing annotations**


```js
// Accesss annotations
proper.annotations(); 
// => {
  "/comment/x": {...},
  "/em/foo": {...},
  ...
}
```


### Selections

A selection object looks like so:

```js
{
  "start": 5,
  "end": 10
}
```

Get the current selection like so:

```js
proper.selection();
```

Modify the selection programmatically:

```js
proper.execute({
  "command": "selection:update",
  "start": 40,
  "end: 67
});
```

Hooking into selection events is easy too. `el` is a container html element sitting below the selection. You can populate it with some contextual UI stuff.

```js
proper.on('selection', function(selection, el) {
  $(el).html('<a href="#" class="em">Emphasize</a>');
});
```

```js
// Your very own event handler triggering the addition of a new em annotation
// which immediately gets visible in the rendered version
proper.$('a.em').click(function() {
  proper.annotate({
    type: "em" // you can style it using the .annotation.em class selector
  });
});
```

## Changelog

**0.1.0**

Initial Version.


## Contributors

- Victor Saiz ([vectorsize](http://github.com/vectorsize)) working on 0.5.0
- Tim Baumann ([timjb](http://github.com/timjb)) implementation of 0.3.0
- Michael Aufreiter ([michael](http://github.com/michael)) initial version