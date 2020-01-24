---
title: file_server (Caddyfile directive)
---

# file_server

A static file server. It works by appending the request's URI path to the [site's root path](/docs/caddyfile/directives/root).


## Syntax

```
file_server [<matcher>] [browse] {
	root   <path>
	hide   <files...>
	index  <files...>
	browse [<template_file>]
}
```

- **browse** enables file listings for requests to directories that do not have an index file.
- **root** sets the path to the site root for just this file server instance, overriding any other. Default: `{http.vars.root}` or the current working directory.
- **hide** is a list of files to hide; if requested, the file server will pretend they do not exist. The active configuration file will be added by default.
- **<template_file>** is an optional custom template file to use for directory listings.


## Examples

A static file server out of the current directory:

```
file_server
```

With file listings enabled:

```
file_server browse
```

Only serve static files out of the `/static` folder:

```
file_server /static/*
```
