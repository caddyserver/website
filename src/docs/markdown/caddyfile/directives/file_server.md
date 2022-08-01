---
title: file_server (Caddyfile directive)
---

# file_server

A static file server that supports real and virtual file systems. It forms file paths by appending the request's URI path to the [site's root path](/docs/caddyfile/directives/root).

By default, it enforces canonical URIs; meaning HTTP redirects will be issued for requests to directories that do not end with a trailing slash (to add it) or requests to files that have a trailing slash (to remove it). Redirects are not issued, however, if an internal rewrite modifies the last element of the path (the filename).

Most often, the `file_server` directive is paired with the [`root`](/docs/caddyfile/directives/root) directive to set file root for the whole site. A site root does not carry sandbox guarantees: the file server does prevent directory traversal, but symbolic links within the root can still allow accesses outside of the root.

## Syntax

```caddy-d
file_server [<matcher>] [browse] {
	fs            <backend...>
	root          <path>
	hide          <files...>
	index         <filenames...>
	browse        [<template_file>]
	precompressed <formats...>
	status        <status>
	disable_canonical_uris
	pass_thru
}
```

- **browse** enables file listings for requests to directories that do not have an index file.
- **fs** specifies an alternate (perhaps virtual) file system to use. Any Caddy module in the `caddy.fs` namespace can be used here as long as it supports [`Stat()` calls](https://pkg.go.dev/io/fs#StatFS). Any root path/prefix will still apply to alternate file system modules. By default, the local disk is used.
- **root** sets the path to the site root. It's similar to the [`root`](/docs/caddyfile/directives/root) directive except it applies to this file server instance only and overrides any other site root that may have been defined. Default: `{http.vars.root}` or the current working directory. Note: This subdirective only changes the root for this directive. For other directives (like [`try_files`](/docs/caddyfile/directives/try_files) or [`templates`](/docs/caddyfile/directives/templates)) to know the same site root, use the [`root`](/docs/caddyfile/directives/root) directive, not this subdirective.
- **hide** is a list of files or folders to hide; if requested, the file server will pretend they do not exist. Accepts placeholders and glob patterns. Note that these are _file system_ paths, NOT request paths. In other words, relative paths use the current working directory as a base, NOT the site root; and all paths are transformed to their absolute form before comparisons (if possible). Specifying a file name or pattern without a path separator will hide all files with a matching name regardless of its location; otherwise, a path prefix match will be attempted, and then a globular match. Since this is a Caddyfile config, the active configuration file(s) will be added by default.
- **index** is a list of filenames to look for as index files. Default: `index.html index.txt`
- **<template_file>** is an optional custom template file to use for directory listings. Defaults to the template that can be found [here in the source code ![external link](/resources/images/external-link.svg)](https://github.com/caddyserver/caddy/blob/master/modules/caddyhttp/fileserver/browse.html). Browse templates can use actions from [the standard templates module](/docs/modules/http.handlers.templates#docs) as well.
- **precompressed** is the list of encoding formats to search for precompressed sidecar files. Arguments are an ordered list of encoding formats to search for precompressed [sidecar files](https://en.wikipedia.org/wiki/Sidecar_file). Supported formats are `gzip` (`.gz`), `zstd` (`.zst`) and `br` (`.br`).

  All file lookups will look for the existence of the uncompressed file first. Once found Caddy will look for sidecar files with the file extension of each enabled format. If a precompressed sidecar file is found, Caddy will respond with the precompressed file, with the `Content-Encoding` response header set appropriately. Otherwise, Caddy will respond with the uncompressed file as normal. If the [`encode` directive](/docs/caddyfile/directives/encode) is enabled, then it may compress the response on-the-fly if not precompressed.
- **status** is an optional status code override to be used when writing the response. Particularly useful when responding to a request with a custom error page. Can be a 3-digit status code, For example: `404`. Placeholders are supported. By default, the written status code will typically be `200`, or `206` for partial content.
- **disable_canonical_uris** disables the default behaviour of redirecting to add a trailing slash if the request path is a directory, or remove the trailing slash if the request path is a file. Note that by default, canonicalization will not happen if the last element of the request's path (the filename) underwent an internal rewrite, to avoid clobbering an explicit rewrite with implicit behaviour.
- **pass_thru** enables pass-thru mode, which continues to the next HTTP handler in the route if the requested file is not found, instead of returning a `404`. Practically, this is likely only be useful inside of a [`route`](/docs/caddyfile/directives/route) block, because the `file_server` directive is effectively [ordered last](/docs/caddyfile/directives#directive-order) otherwise.

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
