# Functionality outline (In progress)

Recap on the Surface's API and desired functionality taking in account a future OT implementation and considering what has been discussed so far. I won't go into details here, this is just an outline/written thoughts about what we want to have and we should need.

## Set annotation
This function creates an operation object, sends it to the server and returns status of the operation

## Get annotation
Returns an annotation object

## Get annotations
Returns all annotations

## Match annotation
On user type or select, detects if we are within the range of an existing annotation (could visually mark the annotation range to signal there's an existing annotation where we stand).
Then when we match the whole range it should broadcast the match to the GUI registered tools.

## Update annotations
When you are editing content, and you type within an existing annotation we need to update the annotation ranges, also when you delete characters. For that we need to somehow track the first word and the last word of an annotation (using CM links?). How would we address then if the last or first word is deleted?
	
## Register a tool/Ui
We need a way to be able to add GUI tools to interact with the surface from [Text](https://github.com/substance/text).

## Highlight all annotations?
It could be interesting to be able to show all the existing annotation ranges in the surface.

## Keyboard shortcuts
We should probably manage keyboard shortcuts from the Surface and use CM keymaps.