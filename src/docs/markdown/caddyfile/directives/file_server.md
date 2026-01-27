---
title: file_server (Caddyfile directive)
---

<script>
ready(function() {
	// Fix inline browse arg
	for (let item of $$_('pre.chroma .s')) {
		if (item.innerText.includes('browse')) {
			const span = document.createElement('span');
			span.className = 'k';
			item.parentNode.insertBefore(span, item);
			span.appendChild(item);
			span.innerHTML = '<a href="#browse" style="color: inherit;" title="browse">browse</a>';
			break;
		}
	}

	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# file_server

A static file server that supports real and virtual file systems. It forms file paths by appending the request's URI path to the [site's root path](root).

By default, it enforces canonical URIs; meaning HTTP redirects will be issued for requests to directories that do not end with a trailing slash (to add it), or requests to files that have a trailing slash (to remove it). However, redirects are not issued if an internal rewrite modifies the last element of the path (the filename).

Most often, the `file_server` directive is paired with the [`root`](root) directive to set the file root for the whole site. This directive also has a `root` subdirective (see below) to set the root only for this handler (not recommended). Note that a site root does not carry sandbox guarantees: the file server does prevent directory traversal from path components, but symbolic links within the root can still allow accesses outside of the root.

When errors occur (e.g. file not found `404`, permission denied `403`), the error routes will be invoked. Use the [`handle_errors`](handle_errors) directive to define error routes, and display custom error pages.

When using `browse`, the default output is produced by the the HTML template. Clients may request the directory listing as either JSON or plaintext, by using the `Accept: application/json` or `Accept: text/plain` headers respectively. The JSON output can be useful for scripting, and the plaintext output can be useful for human terminal usage.


## Syntax

```caddy-d
file_server [<matcher>] [browse] {
	fs            <backend...>
	root          <path>
	hide          <files...>
	index         <filenames...>
	browse        [<template_file>] {
		reveal_symlinks
		sort <sort_field> [<direction>]
	}
	precompressed [<formats...>]
	status        <status>
	disable_canonical_uris
	pass_thru
}
```

- **fs** <span id="fs"/> specifies an alternate (perhaps virtual) file system to use. Any Caddy module in the `caddy.fs` namespace can be used here. Any root path/prefix will still apply to alternate file system modules. By default, the local disk is used.

	[`xcaddy`](/docs/build#xcaddy) v0.4.0 introduces the [`--embed` flag](https://github.com/caddyserver/xcaddy#custom-builds) to embed a filesystem tree into the custom Caddy build, and registers an `fs` module named `embedded` which allows your static site to be distributed as a Caddy executable.

- **root** <span id="root"/> sets the path to the site root. It's similar to the [`root`](root) directive except it applies to this file server instance only and overrides any other site root that may have been defined. Default: `{http.vars.root}` or the current working directory. Note: This subdirective only changes the root for this handler. For other directives (like [`try_files`](try_files) or [`templates`](templates)) to know the same site root, use the [`root`](root) directive instead.

- **hide** <span id="hide"/> is a list of files or folders to hide; if requested, the file server will pretend they do not exist. Accepts placeholders and glob patterns. Note that these are _file system_ paths, NOT request paths. In other words, relative paths use the current working directory as a base, NOT the site root; and all paths are transformed to their absolute form before comparisons (if possible). Specifying a file name or pattern without a path separator will hide all files with a matching name regardless of its location; otherwise, a path prefix match will be attempted, and then a globular match. Since this is a Caddyfile config, the active configuration file(s) will be added by default.

- **index** <span id="index"/> is a list of filenames to look for as index files. Default: `index.html index.txt`

- **browse** <span id="browse"/> enables file listings for requests to directories that do not have an index file.

  - **<template_file>** <span id="template_file"/> is an optional custom template file to use for directory listings. Defaults to the template that can be extracted using the command `caddy file-server export-template`, which will print the default template to stdout. The embedded template can also be found [here in the source code ![external link](/old/resources/images/external-link.svg)](https://github.com/caddyserver/caddy/blob/master/modules/caddyhttp/fileserver/browse.html). Browse templates can use actions from [the standard templates module](/docs/modules/http.handlers.templates#docs) as well.

  - **reveal_symlinks** <span id="reveal_symlinks"/> enables revealing the targets of symbolic links in directory listings. By default, the symlink targets are hidden, and only the link file itself is shown.

  - **sort** <span id="sort"/> changes the default sort for directory listings. The first parameter is the field/column to sort by: `name`, `namedirfirst`, `size`, or `time`. The second argument is an optional direction: `asc` or `desc`. For example, `sort name desc` will sort by name in descending order.

- **precompressed** <span id="precompressed"/> is the list of encoding formats to search for precompressed sidecar files. Arguments are an ordered list of encoding formats to search for precompressed [sidecar files](https://en.wikipedia.org/wiki/Sidecar_file). Supported formats are `gzip` (`.gz`), `zstd` (`.zst`) and `br` (`.br`). If formats are omitted, they default to `br zstd gzip` (in that order).

  All file lookups will look for the existence of the uncompressed file first. Once found Caddy will look for sidecar files with the file extension of each enabled format. If a precompressed sidecar file is found, Caddy will respond with the precompressed file, with the `Content-Encoding` response header set appropriately. Otherwise, Caddy will respond with the uncompressed file as normal. If the [`encode` directive](encode) is enabled, then it may compress the response on-the-fly if not precompressed.

- **status** <span id="status"/> is an optional status code override to be used when writing the response. Particularly useful when responding to a request with a [custom error page](handle_errors). Can be a 3-digit status code, For example: `404`. Placeholders are supported. By default, the written status code will typically be `200`, or `206` for partial content.

- **disable_canonical_uris** <span id="disable_canonical_uris"/> disables the default behaviour of redirecting (to add a trailing slash if the request path is a directory, or remove the trailing slash if the request path is a file). Note that by default, canonicalization will not happen if the last element of the request's path (the filename) underwent an internal rewrite, to avoid clobbering an explicit rewrite with implicit behaviour.

- **pass_thru** <span id="pass_thru"/> enables pass-thru mode, which continues to the next HTTP handler in the route if the requested file is not found, instead of triggering a `404` error (invoking [`handle_errors`](handle_errors) routes). Practically, this is only useful inside of a [`route`](route) block with other handler directives following `file_server`, because this directive is effectively [ordered last](/docs/caddyfile/directives#directive-order).


## Examples

A static file server out of the current directory:

```caddy-d
file_server
```

With file listings enabled:

```caddy-d
file_server browse
```

Only serve static files within the `/static` folder:

```caddy-d
file_server /static/*
```

The `file_server` directive is usually paired with the [`root` directive](root) to set the root path from which to serve files:

```caddy
example.com {
	root * /srv
	file_server
}
```

<aside class="tip">

If you're running Caddy as a systemd service, reading files from `/home` will not work, because the `caddy` user does not have "executable" permission on the `/home` directory (necessary for traversal). It's recommended that you place your files in `/srv` or `/var/www/html` instead.

</aside>


Hide all `.git` folders and their contents:

```caddy-d
file_server {
	hide .git
}
```

If supported by the client (`Accept-Encoding` header) checks the existence of precompressed files along side the requested file. So if `/path/to/file` is requested, it checks for `/path/to/file.br`, `/path/to/file.zst` and `/path/to/file.gz` in that order and serves the first available file with corresponding `Content-Encoding`:

```caddy-d
file_server {
	precompressed
}
```
