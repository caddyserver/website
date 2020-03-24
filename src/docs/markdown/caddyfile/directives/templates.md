---
title: templates (Caddyfile directive)
---

# templates

Executes the response body as a [template](/docs/modules/http.handlers.templates) document. Templates provide functional primitives for making simple dynamic pages. Features include HTTP subrequests, HTML file includes, Markdown rendering, JSON parsing, basic data structures, randomness, time, and more.


## Syntax

```
templates [<matcher>] {
	mime    <types...>
	between <open_delim> <close_delim>
	root    <path>
}
```

- **mime** are the MIME types the templates middleware will act on; any responses that do not have a qualifying Content-Type will not be evaluated as templates. Default: `text/html text/plain`.
- **between** are the opening and closing delimiters for template actions. Default: `{{printf "{{ }}"}}`. You can change them if they interfere with the rest of your document.
- **root** is the site root, when using functions that access the file system.


## Examples

Enable templates on all requests:

```
templates
```

