# Substance Surface

Surface provides a low-level interface for –in browser– plain text manipulation. It allows the instertion, deletion of text characters, keyboard navigation, along with range selections.
Surface exposes an API that will make it possible to build more complex text editors on top of it, offering the possibillity to manipulate user-defined annotations. For an implementation of a ritch text editor and several examples please refer to [Substance Text](https://github.com/substance/text).


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

<!---
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
--->

We might want to use Tim's [OT library](http://github.com/timjb/javascript-operational-transformation) to transform the state internally.

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

## Development notes

Throughout the project DOM elements should be prefixed with `$` to easily differentiate JS variables from DOM elements.

## The API will constantly change - not stable

### Caret

*Victor*  
__Q__: should we use a separate object? In the current implementation we aren't

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


### Dom interactions?
A module that will deal with:

+ DOM interaction (view) - mouse clicks, select & drag and drop
+ DOM rendering, text highliting


## Notes on implementation

#### Defining the basics:

+ a __text node__ represents a string of _n_ characters
+ a __\n__ represents a line-break
+ a __line__ is a _visual_ constraint which is defined by the width of the container block (this makes a very important distinction between a code editor and a text editor)

Let's take a string of text:

"Is not the best kind of originality that which comes after a sound apprenticeship?__\n__The best kind of originality is that which comes after a sound apprenticeship, that which shall prove to be the blending of a firm conception of useful precedent and the progressive tendencies of an able mind."

HTML example:
```html
<article>
	<p>Is not the best kind of originality that which comes after a sound apprenticeship?
	<br>The best kind of originality is that which comes after a sound apprenticeship, that which shall prove to be the blending of a firm conception of useful precedent and the progressive tendencies of an able mind.</p>
</article>
```

Surface implementation example (editor width ~85 chars):
```html
<div class="surface" tabindex="1">
	<div class="line">
		<span>I</span>
		<span>s</span>
		<span>&nbsp;</span>
		<span>n</span>
		<span>o</span>
		<span>t</span>
		<span>&nbsp;</span>
		<span>t</span>
		<span>h</span>
		<span>e</span>
		<span>&nbsp;</span>
		<span>b</span>
		<span>e</span>
		<span>s</span>
		<span>t</span>
		<span>&nbsp;</span>
		<span>k</span>
		<span>i</span>
		<span>n</span>
		<span>d</span>
		<span>&nbsp;</span>
		<span>o</span>
		<span>f</span>
		<span>.</span>
		<span>.</span>
		<span class="caret">.</span>
	</div>
</div>
```

## Annotations

An __annotation__ is some meta-data associated with a _range of characters_. This is particularly useful to describe text formatting and marked text for notes or spelling errors.

```js
{ start: 94
, end: 124
, tag: 'em'
, class: 'surface-em' // style would be defined using CSS
, type: 'style'
}
```
Annotations types:

+ __style__ - bold, italics, etc
+ __mark__ - highlight a range of text (i.e. comment, error); it would have no tag option, a 'mark' tag would be used by default
+ __link__ - hyperlink
+  __comment__ - An associated text/Annotation

*Eugene*  
__Q__ : Would it be efficient to parse all the text on every annotation insertion? (esprima.js parses the jQuery source in less than 50ms)

*Eugene*  
__Q__: How to properly address annotations? Let's say the bold was first added, than a new range was selected and italics was added:  

*Victor*  
__A__: Style annotations will be exclusive, so when one annotation has been added, one cannot overlap with it – That is only affecting styling of the document.


## Data model

When it comes to text editing, lines are __not__ important, this form of selection (range) `{ from: { line, char }, to: { line, char } }` is bad, because if we save a range and the editor is resized, the saved range may not match the new lines.

Using ranges of characters instead of line/char position is even better when working with OT.

*Eugene*  
__Q__: What is an efficient data model to work with ranges or characters in a long text document (50000+ chars)?
My first idea was be to use a B-tree structre.

*Victor*  
__A__: After implementing a Btree structure it has become clear that it's not necessary to store the data in a tree, but rather a list. It might not even be necessary to keep the list items linked in oder to navigate the node model.

```js
// NOTE: This is how the data looks at the moment
// It might change several times along the course of the implementation
var char = {
  "id": "char-1",
  "parent": "line-0",
   "type": "ch",
   "offset": 1,
   "value": "I",
   "width": 6
}

var line = {
  "id": "line-0",
  "type": "line",
  "current": true,
  "left": null,
  "right": null,
   "chars"[char, char, char ...]
}

var node ={[line, line, line]};
```

If we can't find a better idea I'll implement this one.

### Dealing with extensions

*Eugene*  
__Q__: Is there anything else except annotations that someone could add?

# Contributors

-  [Victor Saiz](http://github.com/vectorsize)
-  [Eugen Tudorancea](http://github.com/navaru)
-  [Michael Aufreiter](http://github.com/michael)


