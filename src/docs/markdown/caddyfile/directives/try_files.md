---
title: try_files (Caddyfile directive)
---

# try_files

Rewrites the request URI path to the first of the listed files which exists in the site root. If no files match, no rewrite is performed.


## Syntax

```caddy-d
try_files <files...>
```

- **<files...>** is the list of files to try. The URI will be rewritten to the first one that exists. To match directories, append a trailing forward slash `/` to the path. All file paths are relative to the site [root](/docs/caddyfile/directives/root). Each argument may also contain a query string, in which case the query string will also be changed if it matches that particular file.


## Expanded form

The `try_files` directive is basically a shortcut for:

```caddy-d
@try_files {
	file {
		try_files <files...>
	}
}
rewrite @try_files {http.matchers.file.relative}
```

Note that this directive does not accept a matcher token. If you need more complex matching logic, then use the expanded form above as a basis.


## Examples

If the request does not match any static files, rewrite to an index/router file:

```caddy-d
try_files {path} /index.php
```

Same, but adding the original path to the query string:

```caddy-d
try_files {path} /index.php?{query}&p={path}
```

Same, but also match directories:

```caddy-d
try_files {path} {path}/ /index.php?{query}&p={path}
```
