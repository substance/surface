Surface is an extensible low-level interface for semantic rich text editing. It doesn't introduce any UI components, but an API for managing user-defined text annotations. It can be used as a foundation for text editors that support annotations.

Substance Surface has been build out of the need for a reliable browser-based text manipulation. It's designed to stricly separate content (plain-text) from annotations (data that refers to text ranges). Instead of relying on native browser interfaces (which as today are sadly clumsy and cumbersome) we're taking full control of state (text and annotations), HTML rendering and interactions.

# Simple demo

In the demo above you can type, edit, copy, paste, delete and annotate some text. For annotations you can try some of the following key commands:

* `⌘+b` for `strong`/`bold`
* `⌘+m` for a simple `marker`
* `⌘+i` for `emphasizing`/`italic`

<iframe width="100%" height="400" frameborder="0" scrolling="no" src="http://interior.substance.io/surface/"></iframe>

# Documentation

## Simple instantiation

Once the script is loaded, you can create a substance instance by simply calling its constructor and passing an object with an existing div as `el`.

  var surface = new Substance.Surface({el: document.getElementById('content')});

Surface will take over the passed in element. Had the passed in div have already some content, Surface will strip the text and start filled with that text.

## Passing content *(optional)*

Alternatively you can pass some content upon instantiation inside a `content` key.

  var surface = new Substance.Surface({
        ...
        content: "Surface is an extensible low-level interface for semantic rich text editing",
        ...
      });

## Passing annotations *(optional)*

You can also pass an object with existing annotations. Such object should contain a list of annotations, each of which should be objects with an `id`, a `type` and a `pos` array holding a start position and offset (e.g. `[4, 5]` where the selection starts at character 4 and includes 5 characters).

Here you can see how such object whould look like:

  var surface = new Substance.Surface({
    ...
    annotations: {
      "annotation-1" : { id: "annotation-1", type: "str", pos: [0,9] },
      "annotation-2" : { id: "annotation-2", type: "em", pos: [57,10] },
      "annotation-3" : { id: "annotation-3", type: "comment", pos: [30,12] }
    }
    ...
  });

## Passing annotation types *(optional)*

Since annotations can either be inclusive or exclusive, alternatively a `types` object can be passed in to specify these types.

* Incluisive types consider the previous character and the next one ( right after) to be part of the annotation and hence will include the characters inserted in these positions as part of the annotation. 

* Exclusive types won't consider the same characters as part of the annotation and wont include characters insterted at those positions in the annotation.

To handel both types pass in objetcs with the key `inclusive` set as either `true` or `false`.
 
  var surface = new Substance.Surface({
          ...
          types: {
            "em": { "inclusive": true },
            "str": { "inclusive": true },
            "idea": { "inclusive": false },
            "question": { "inclusive": false },
            "error": { "inclusive": false }
          }
          ...
  });

# API

A surface instance can be manipulated externally through a series of methods exposed via its API.


## Manipulating text
### surface.content
> Returns the actual content

The content variable always holds the current content represented as a string.

### surface.insertText(text, index)
> Inserts text at a given index

You can insert text programatically by calling `insertText` and passing in a `text` string as well as an `index` specifying the position where text will be inserted in the string.

### surface.insertCharacter(ch, index)
> Inserts character at a given index

You can also insert a single character by calling `insertCharacter` and passing in a `ch` character as well as an `index` specifying the position where text will be inserted in the string.


## Manipulating selections
### surface.selection()
> Gets the current selection

Will return an array holding the start position and length of the selected text (e.g. `[4, 5]` where the selection starts at character 4 and includes 5 characters).

### surface.select(start [, length])
> Sets a selection

Instead of selecting text by mouse or keyboard navigation, you can do it programatically by calling `select` and passing in `start` and the `length` for the selected characters.


## Manipulating annotations
### surface.getAnnotations(selection[, types])
> Gets all the annotations within a seleced text

With `getAnnotations` you can look for all the annotations contained within a selected text, that will return all types of annotations inside the selection. Optionally you can get the filtered results by annotation `types`, where `types` would be an array of types (e.g. `["idea"]`, or `["idea", "em"]`).

The resulting annotations object looks like this:

  {
          "annotation-1" : { id: "annotation-1", type: "idea", pos: [0,9] },
          "annotation-1" : { id: "annotation-2", type: "em", pos: [57,10] }
  }

### surface.insertAnnotation({annotation})
> Inserts an annotation

Registering a new annotation is easy, you only have to pass in an annotation object containing an `id`, a `type` and a `pos` array holding a start position and offset (e.g. `[4, 5]` where the selection starts at character 4 and includes 5 characters).

  surface.insertAnnotation({
          id: "annotation-25",
          type: "idea",
          pos: [3, 5]
      });

### surface.deleteAnnotation(id)
> Deletes a specified annotation

Deletes an annotation by providing its id.

### surface.highlight(id)
> Highlights a specified annotation

Annotations can be active or inactive in Surface. When you select or type inside an annotation, the annotation will become active and inactive when you are outside it. You can do this by calling `highlight` along with the annotation’s id. Surface then adds a `.highlight` class to the corresponding characters. It's up to your stylesheet how a highlighted annotation differs from a regular one.

# Events

One surface instance will trigger several events that you can hook your application to. Events are registered in the following form:

`surface.on('eventname', callbackFunction)`

These are the available events:

### selection:changed
Gets triggered when the selection changes, and passes the selection to a callback function.

    surface.on('selection:changed', function(sel) {
      console.log('selected range:', sel);
    });
    
### content:changed
Gets triggered when the content is updated, and passes the actual content, along with the old content previous to that change to a callback function.

    surface.on('content:changed', function(content, prevContent) {
      console.log('updated text from', prevContent, 'to: ', content);
    });

### annotations:changed
Gets triggered when annotations are updated

    surface.on('annotations:changed', function() {
      console.log(surface.getAnnotations());
    });

# Development Notes

Surface is intentionally dumb. It doesn't do anything smart like detecting annotation overlaps and provides no UI components. That's by design since we realized it's very much application-specific how annotations are created and styled. So we left that over to the application developers.

# Extra functionality examples

For the Substance Composer we added some code to detect overlaps. While a character can be marked as strong and marked as `idea`, you can't combine strong and emphasized or idea and error. We also provided a context menu that shows up contextually, based on your current text selection.

![](http://f.cl.ly/items/2H180p3h433Z0q1H470f/composer-surface.png)

Here's how the code that we are using for the Substance Composer [looks like](https://gist.github.com/4565603).

# Contributors

-  [Victor Saiz](http://github.com/vectorsize)
-  [Michael Aufreiter](http://github.com/michael)