---
title: file_server (Caddyfile directive)
---

# file_server

A static file server. It works by appending the request's URI path to the [site's root path](/docs/caddyfile/directives/root).


## Syntax

```caddy-d
file_server [<matcher>] [browse] {
	root   <path>
	hide   <files...>
	index  <filenames...>
	browse [<template_file>]
}
```

- **browse** enables file listings for requests to directories that do not have an index file.
- **root** sets the path to the site root for just this file server instance, overriding any other. Default: `{http.vars.root}` or the current working directory. Note: When specified as a subdirective like this, only this directive will know this root; for other directives (like [`try_files`](/docs/caddyfile/directives/try_files) or [`templates`](/docs/caddyfile/directives/templates)) to know the same site root, use the [`root`](/docs/caddyfile/directives/root) directive, not subdirective.
- **hide** is a list of files to hide; if requested, the file server will pretend they do not exist. The active configuration file will be added by default.
- **index** is a list of filenames to look for as index files. Default: `index.html index.txt`
- **<template_file>** is an optional custom template file to use for directory listings.


## Examples

A static file server out of the current directory:

```caddy-d
file_server
```

With file listings enabled:

```caddy-d
file_server browse
```

Only serve static files out of the `/static` folder:

```caddy-d
file_server /static/*
```

The `file_server` directive is usually paired with the [`root`](/docs/caddyfile/directives/root) directive to set the root path from which to serve files

```caddy-d
root * /home/user/public_html
file_server
```