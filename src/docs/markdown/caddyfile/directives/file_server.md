---
title: file_server (Caddyfile directive)
---

# file_server

A static file server. It works by appending the request's URI path to the [site's root path](/docs/caddyfile/directives/root). By default, it enforces canonical URIs; if necessary, requests to directories will be redirected to have a trailing forward slash, and requests to files will be redirected to strip the trailing slash.

Most often, the `file_server` directive is paired with the [`root`](/docs/caddyfile/directives/root) directive to set file root for the whole site.

## Syntax

```caddy-d
file_server [<matcher>] [browse] {
	root          <path>
	hide          <files...>
	index         <filenames...>
	browse        [<template_file>]
	precompressed <formats...>
	status        <status>
}
```

- **browse** enables file listings for requests to directories that do not have an index file.
- **root** sets the path to the site root for just this file server instance, overriding any other. Default: `{http.vars.root}` or the current working directory. Note: This subdirective only changes the root for this directive. For other directives (like [`try_files`](/docs/caddyfile/directives/try_files) or [`templates`](/docs/caddyfile/directives/templates)) to know the same site root, use the [`root`](/docs/caddyfile/directives/root) directive, not this subdirective.
- **hide** is a list of files or folders to hide; if requested, the file server will pretend they do not exist. Accepts placeholders and glob patterns. Note that these are _file system_ paths, NOT request paths. In other words, relative paths use the current working directory as a base, NOT the site root; and all paths are transformed to their absolute form before comparisons (if possible). Specifying a file name or pattern without a path separator will hide all files with a matching name regardless of its location; otherwise, a path prefix match will be attempted, and then a globular match. Since this is a Caddyfile config, the active configuration file(s) will be added by default.
- **index** is a list of filenames to look for as index files. Default: `index.html index.txt`
- **<template_file>** is an optional custom template file to use for directory listings. Defaults to the template that can be found [here in the source code ![external link](/resources/images/external-link.svg)](https://github.com/caddyserver/caddy/blob/master/modules/caddyhttp/fileserver/browsetpl.go).
- **precompressed** is the list of encoding formats to search for precompressed sidecar files.
- **&lt;formats...&gt;** is the ordered list of encoding formats to search for precompressed sidecar files. Supported formats are `gzip`, `zstd` and `br`.
- **status** is an optional status code override to be used when writing the response. Particularly useful when responding to a request with a custom error page. Can be a 3-digit status code, For example: `404`. Placeholders are supported. By default, the written status code will typically be `200`, or `206` for partial content.

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

The `file_server` directive is usually paired with the [`root` directive](/docs/caddyfile/directives/root) to set the root path from which to serve files:

```caddy-d
root * /home/user/public_html
file_server
```

Hide all `.git` folders and their contents:

```caddy-d
file_server {
	hide .git
}
```

If supported by the client (`Accept-Encoding` header) checks the existence of precompressed files along side the requested file. So if `/path/to/file` is requested, it checks for `/path/to/file.zst`, `/path/to/file.br` and `/path/to/file.gz` in that order and serves the first available file with corresponding Content-Encoding:

```caddy-d
file_server {
	precompressed zstd br gzip
}
```
