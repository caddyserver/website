---
title: try_files (Caddyfile directive)
---

# try_files

Rewrites the request URI path to the first of the listed files which exists in the site root. If no files match, no rewrite is performed.


## Syntax

```caddy-d
try_files <files...> {
	policy first_exist|first_exist_fallback|smallest_size|largest_size|most_recently_modified
}
```

- **<files...>** is the list of files to try. The URI path will be rewritten to the first one that exists.

  To match directories, append a trailing forward slash `/` to the path. All file paths are relative to the site [root](root), and [glob patterns](https://pkg.go.dev/path/filepath#Match) will be expanded.

  Each argument may also contain a query string, in which case the query string will also be changed if it matches that particular file.

  If the `try_policy` is `first_exist` (the default), then the last item in the list may be a number prefixed by `=` (e.g. `=404`), which as a fallback, will emit an error with that code; the error can be caught and handled with [`handle_errors`](handle_errors).

- **policy** is the policy for choosing the file among the list of files. 

  Default: `first_exist`



## Expanded form

The `try_files` directive is basically a shortcut for:

```caddy-d
@try_files file <files...>
rewrite @try_files {file_match.relative}
```

Note that this directive does not accept a matcher token. If you need more complex matching logic, then use the expanded form above as a basis.

See the [`file` matcher](/docs/caddyfile/matchers#file) for more details.



## Examples

If the request does not match any static files, rewrite to your PHP index/router entrypoint:

```caddy-d
try_files {path} /index.php
```

Same, but adding the original path to the query string (required by some legacy PHP apps):

```caddy-d
try_files {path} /index.php?{query}&p={path}
```

Same, but also match directories:

```caddy-d
try_files {path} {path}/ /index.php?{query}&p={path}
```

Attempt to rewrite to a file or directory if it exists, otherwise emit a 404 error (which can be caught and handled with [`handle_errors`](handle_errors)):

```caddy-d
try_files {path} {path}/ =404
```

Choose the most recently deployed version of a static file (e.g. serve `index.be331df.html` when `index.html` is requested):

```caddy-d
try_files {file.base}.*.{file.ext} {
	policy most_recently_modified
}
```
