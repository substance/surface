# Substance Surface

Surface is being developed under the context of the [Substance](http://substance.io) project. It's aim is to be a replacement for the traditional web textarea. It will provide basic text manipulation like textareas, and on top of that will expose a reliable API to provide functionaly to manipulate the rendering of the Surface or retrieve information about it's state. (Once we have that we will be able to implement an Annotator and ```risch editors``` such as [Text](http://interior.substance.io/modules/text.html) on top of it)

## API (work-in-progress)  

### Create a new surface  

```js
var options = {
	"lang":"en" // set the language for the spellchecking
	"checkSpelling": true
};

var surface = new Surface({
  el: '#content', options
});
```  

### Operations  

In a near future, the Surface will be transformed using commands. Commands are either issues progammatically or triggered by the user (e.g. by entering text). Commands are either issues progammatically or triggered by the user (e.g. by entering text)

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

### Commands

```js 
setContent ```  
```js 
getContent ```  
```js 
setRange```  
```js 
getRange ```  
```js 
setStyle```  
```js 
getStyle```  
```js 
...```  

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

...

# Contributors

-  [Victor Saiz](http://github.com/vectorsize)
-  [Eugen Tudorancea](http://github.com/navaru)
-  [Michael Aufreiter](http://github.com/michael)



