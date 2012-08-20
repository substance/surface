# Substance Surface

Surface provides a low-level interface for –in browser– plain text manipulation. It allows the instertion, deletion of text characters, keyboard navigation, along with range selections.
Surface exposes an API that will make it possible to build more complex text editors on top of it, offering the possibility to manipulate user-defined annotations. For an implementation of a Rich Text Editor and several examples please refer to [Substance Text](https://github.com/substance/text).

(for a demo please try [this link](http://interior.substance.io/surface/))

## On the screen

Using a fixed width font with nice styles could give us the opportunity to spread some type writer feeling. It would also be easier to implement character-measurements etc. It will be a challenge to get word-wrap right though.

![](https://raw.github.com/substance/surface/gh-pages/assets/surface-cursor.png)

Also annotations could be visualized nicely in a block-ish fashion.

![](https://raw.github.com/substance/surface/gh-pages/assets/surface-annotation.png)


## Desired API

### Create a new surface

```js
var surface = new Surface({
  el: '#content'
  content: 'Helo Wrld',
  annotations: [
    {
      "id": "a:1",
      "type": "comment",
      "pos": [0,10],
      "properties": {"content": "This is a comment for you"}
    },
    {
      "id": "a:2",
      "type": "em",
      "pos": [20,24]
    }
  ]
});
```

### Listen for changes

We need more course grained-operations to be issued by Surface as we'll get too many operations if we track a commit for every keystroke being made. However Surface does not need to deal with operational transformation or keeping history. That's all done on a document level. All it has to do is turning a changeset into a compound text operation (`ret(4) ins('abc') ret(10)` etc.)

In order to listen for text changes:

```js
surface.on('text:change', function(delta, content) {
  // content holds the new text content, while delta holds an operation describing the change.
  // delta => [["ret", 2], ["ins", "l"], ["ret", 4], ["ins", "o"], ["ret", 3]]
});
```

And for changes regarding the annotations:

```js
surface.on('annotation:change', function(operation) {
  // Example is one of these:
  // ["insert", {"id": "annotation:x", type": "em", "pos": [10,5]}]
  // ["update", {"id": "annotation:y", type": "comment", "pos": [20,25], "properties": {"content": "Foo"}}]
  // ["delete", {"id": "annotation:x"}]
});
```

### Selections

A selection object looks like so:


Get the current selection like so:

```js
surface.selection();
// => [0, 5]
```

Modify the selection programmatically:

```js
surface.select(1, 5);
```

Hooking into selection events is easy too. `el` is a container html element sitting below the selection. You can populate it with some contextual UI stuff.

```js
surface.on('selection', function(selection, el) {
  $(el).html('<a href="#" class="em">Emphasize</a>');
});
```


## Example usage

### Interaction with Substance Text and Surface

```js
var text = new Substance.Text({el: "#content", content: "Helo world", annotations: []);
```

Let's say we have this situation.

- Content: "Helo world"

Let's assume the user does this:

1. Adds a "!" to the end
2. Adds an "l" at position 3.
3. Adds an annotation (em) to world (start: 5 end: 10)

Let's try to make Surface lazy, so it can keep its own state in sync on a keystroke level, but talk to the document level if the user is either moving the focus somewhere else (e.g. selects a different node on the Substance document) or the user interacts with the annotations (either adds a new annotation or deletes one). If we do that we can always "commit" the changes as a compound text operation, plus an annotation operation which is optional.


An `text:update` event gets fired and yields this delta:

```js
[["ret", 3], ["ins", "l"], ["ret", 7], ["ins", "!"]]
```

`Helo world` -> `Hello world!`

Second there's a separate event `annotation:update` that holds the newly added annotation.

```js
["insert", {"type": "em", pos: [5, 10]}]
```

### Listing annotations

```js
// Accesss annotations
surface.annotations(); 
// => [
  {"id": "annotation:x", ... },
  {"id": "annotation:y", ... }
]
```

### Handing application specific events

Here's an example of how an application can use the API based on an application-specific event. In this example clicking on a em icon, triggers the addition of a new em annotation based on the current selection. 

```js
$('a.em').click(function() {
  surface.apply(["insert", {"type": "em"}]);
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

<!--

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
-->


# Contributors

-  [Victor Saiz](http://github.com/vectorsize)
-  [Eugen Tudorancea](http://github.com/navaru)
-  [Michael Aufreiter](http://github.com/michael)