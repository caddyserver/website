---
title: rewrite (Caddyfile directive)
---

# rewrite

Rewrites the request internally. A rewrite changes some or all of the request URI.

The `rewrite` directive implies the intent to accept the request, but with modifications. It is mutually exclusive to other `rewrite` directives in the same block, so it is safe to define rewrites that would otherwise cascade into each other; only the first matching rewrite will be executed.


## Syntax

```
rewrite [<matcher>] <to>
```

- **<to>** is the URI to set on the request. Only designated parts will be replaced. The URI path is any substring that comes before `?`. If `?` is omitted, then the whole token is considered to be the path.


## Examples

Rewrite all requests to `foo.html`, leaving any query string unchanged:

```
rewrite * /foo.html
```

Replace the query string on API requests with `a=b`, leaving the path unchanged:

```
rewrite /api/* ?a=b
```

Preserve the existing query string and add a key-value pair:

```
rewrite /api/* ?{query}&a=b
```

Change both the path and query string, preserving the original query string while adding the original path as the `p` parameter:

```
rewrite * /index.php?{query}&p={path}
```


## Similar directives

There are other directives that perform rewrites, but imply a different intent or do the rewrite without a complete replacement of the URI:

- [`strip_prefix`](/docs/caddyfile/directives/strip_prefix) strips a prefix from the request path.
- [`strip_suffix`](/docs/caddyfile/directives/strip_suffix) strips a suffix from the request path.
- [`uri_replace`](/docs/caddyfile/directives/uri_replace) performs a substring replacement on the request path.
- [`try_files`](/docs/caddyfile/directives/try_files) rewrites the request based on the existence of files.