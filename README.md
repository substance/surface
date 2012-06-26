This document is best viewed in [Prose](http://prose.io/#substance/surface/master/README.md).

# Substance Surface

Surface is intended to be an extensible low-level interface for rich text editing. It doesn't introduce any UI components, but an API for managing user-defined text annotations. For an implementation of a ritch text editor and several examples please refer to [Substance Text](https://github.com/substance/text).


## API (work-in-progress)

### Create a new surface

```js
var surface = new Surface({
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

Applying operations to the surface looks like so:

```js
surface.apply(op);
```

Transforming text in such a way is called [Operational Transformation](http://javascript-operational-transformation.readthedocs.org/en/latest/ot-for-javascript.html#getting-started).

Hooking into operations: (as they may be triggered by the user)

```js
surface.on('operation', function(operation) {
  // do something
});
```


### Annotations

**Adding an annotation**

It uses the current selection, or throws an error if there

```js
surface.apply({
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
surface.annotations(); 
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
surface.selection();
```

Modify the selection programmatically:

```js
surface.apply({
  "command": "selection:update",
  "start": 40,
  "end": 67
});
```

Hooking into selection events is easy too. `el` is a container html element sitting below the selection. You can populate it with some contextual UI stuff.

```js
surface.on('selection', function(selection, el) {
  $(el).html('<a href="#" class="em">Emphasize</a>');
});
```


## Usage

Here's an example of how an application can use the API based on an application-specific event. In this example clicking on a em icon, triggers the addition of a new em annotation based on the current selection. 

```js
$('a.em').click(function() {
  surface.apply({
	"command": "annotation:insert",
    "type": "em"
  });
});
```

You can style those user defined annotations by using this class convention. 

```js
.surface-annotation.em {
  color: blue;
}
```

You should be aware there's no magic involved. You have full control about styling here. Surface just sets the right class, based on the annotation type.

### Listening for state changes

Sometimes you may want to listen for state changes within the Surface instance, and update the UI accordingly. E.g. when the user changes the selection, and it overlaps with an `em` annotation you want to add a `.active` class to your button `a.em`.


```js
surface.on('selection:change', function(sel) {
  // Returns all annotations matching that selection
  var annotations = surface.annotations(sel);
  
  // Update the UI
  $('a.toggle-annotation').removeClass('active')
  annotations.each(function(annotation) {
    $('a.toggle-annotation.'+annotation.type).addClass('active');
  });
});
```


# Brainstorming Area

We're at a very early state. We're going to maintain a list of thoughts about funcationality right here in the README. Just add/remove sections and put your name in front of your text, so we can do sort of an open discussion here. Everything that is more or less confirmed or implemented goes up to the API docs.


## Operational Transformations

Michael: How could a future OT interface look like?

- Michael: I'd propose just introduced additional commands that do delta-updates to the document
- Michael: We might want to use Tim's [OT library](http://github.com/timjb/javascript-operational-transformation) to transform the state internally.


## Matching annotations

- Victor: On user type or select, detects if we are within the range of an existing annotation (could visually mark the annotation range to signal there's an existing annotation where we stand).


## Updating annotations

- Victor: When you are editing content, and you type within an existing annotation we need to update the annotation ranges, also when you delete characters. For that we need to somehow track the first word and the last word of an annotation (using CM links?). How would we address then if the last or first word is deleted?
- Victor: Should we delte annotations when clicking again in the toolbox (ie. em tool) but that is not ideal for other types of annotations or should we have a delete annotation that works consistently on each scenario? 


## Highlight all annotations?

- Victor: It could be interesting to be able to show all the existing annotation ranges in the surface.


## Keyboard shortcuts

- Victor: We should probably manage keyboard shortcuts from the Surface and use CM keymaps.


# Contributors

-  [Victor Saiz](http://github.com/vectorsize)
-  [Michael Aufreiter](http://github.com/michael)