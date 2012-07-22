## Notes on implementation

#### Defining the basics:

+ a __text document__ represents a string of _n_ characters
+ a __\n__ represents a line-brake and splits a string into __paragraphs__
+ a __line__ is a _visual_ constraint which is defined by the width of the container block (this makes a very important distinction between a code editor and a text editor)

Let's take a string of text:

"Is not the best kind of originality that which comes after a sound apprenticeship?__\n__The best kind of originality is that which comes after a sound apprenticeship, that which shall prove to be the blending of a firm conception of useful precedent and the progressive tendencies of an able mind."

HTML example:
```html
<article>
	<p>Is not the best kind of originality that which comes after a sound apprenticeship?</p>
	<p>The best kind of originality is that which comes after a sound apprenticeship, that which shall prove to be the blending of a firm conception of useful precedent and the progressive tendencies of an able mind.</p>
</article>
```

Surface implementation example (editor width ~85 chars):
```html
<div class="surface">
	<div class="paragraph">
		<div class="line">Is not the best kind of originality that which comes after a sound apprenticeship?</div>
    </div>
    <div class="paragraph">
        <div class="line">The best kind of originality is that which comes after a sound apprenticeship, that</div>
        <div class="line">which shall prove to be the blending of a firm conception of useful precedent and the</div>
        <div class="line">progressive tendencies of an able mind.</div>
    </div>
</div>
```

## Annotations

An __annotation__ is some meta-data associated with a _range of characters_. This is particularly useful to describe text formatting and marked text for notes or spelling errors.

```js
{ start: 94
, end: 124
, tag: 'b'
, class: 'surface-bold' // style would be defined using CSS
, type: 'style'
}
```
Annotations types:

+ __style__ - bold, italics, etc
+ __mark__ - highlight a range of text (i.e. comment, error); it would have no tag option, a 'mark' tag would be used by default
+ __link__ - hyperlink

__Q__: Would it be efficient to parse all the text on every annotation insertion? (esprima.js parses the jQuery source in less than 50ms)

__Q__: How to properly address this annotations? Let's say the bold was first added, than a new range was selected and italics was added:

[b] This is bold [i] while this is both, bold and italic [/b] and this is just italic [/i]


One way to deal with annotations (styles):
```html
<div class="paragraph">
	<div class="line">Is not <span class="surface-bold surface-italic">the best kind</span> of originality that which comes after a sound apprenticeship?</div>
</div>

<!-- exported -->
<p>Is not <b><i>the best kind</i></b> of originality that which comes after a sound apprenticeship?</p>
```


## Data model

When it comes to text editing, lines are __not__ important, this form of selection (range) `{ from: { line, char }, to: { line, char } }` is bad, because if we save a range and the editor is resized, the saved range may not match the new lines.

Using ranges of characters instead of line/char position is even better when working with OT.

__Q__: What is an efficient data model to work with ranges or characters in a long text document (50000+ chars)?

My first idea was be to use a B-tree, like:

```js
var paragraph = {
  text: "..."
, length: 50
}

var Doc = {
  node: {
    leaf: {
      data: [paragraph, paragraph, paragraph, paragraph, paragraph]
    , length: 315
    }
  , leaf: {
      data: [paragraph, paragraph, paragraph, paragraph, paragraph]
    , length: 482
    }
  , leaf: {
      data: [paragraph, paragraph, paragraph, paragraph, paragraph]
    , length: 214
    }
  , length: 1011
  }
}
```

If we can't find a better idea I'll implement this one.

### Dealing with extensions

__Q__: Is there anything else except annotations that someone could add?







