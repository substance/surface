## HTML semantics and content organization

According to the current specs, this is the way we should write an article on a web page:

```html
<article>
  <header>
    <h1>The title of the article</h1>
  </header>
  <section>
    <h1>The title of the section</h1>
    <p>Some text in the paragraph</p>
    <p>Another paragraph with meaningful text</p>
  </section>
  <section>
    <h1>Starting the next section with its own title</h1>
    <p>This section has a paragraph below</p>
    <p>Also has a paragraph above this one</p>
    <h2>Along the lines comes a subtitle of this section</h2>
    <p>Let's put a paragraph here so it won't feel lonely</p>
  </section>
</article>
```