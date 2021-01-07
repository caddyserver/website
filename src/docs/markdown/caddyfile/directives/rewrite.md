---
title: rewrite (Caddyfile directive)
---

# rewrite

Rewrites the request internally. A rewrite changes some or all of the request URI.

The `rewrite` directive implies the intent to accept the request, but with modifications. It is mutually exclusive to other `rewrite` directives in the same block, so it is safe to define rewrites that would otherwise cascade into each other; only the first matching rewrite will be executed.

Because `rewrite` essentially performs an internal redirect, the Caddyfile adapter will not fold any subsequent, adjacent handlers into the same route if their matchers happen to be exactly the same. This allows the matchers of the next handlers to be deferred until after the rewrite. In other words, a matcher that matches a request before the `rewrite` might not match the same request after the `rewrite`. If you want your `rewrite` to share a route with other handlers, use the [`route`](route) or [`handle`](handle) directives.


## Syntax

```caddy-d
rewrite [<matcher>] <to>
```

- **&lt;to&gt;** is the URI to set on the request. Only designated parts will be replaced. The URI path is any substring that comes before `?`. If `?` is omitted, then the whole token is considered to be the path.


## Examples

Rewrite all requests to `foo.html`, leaving any query string unchanged:

```caddy-d
rewrite * /foo.html
```

Replace the query string on API requests with `a=b`, leaving the path unchanged:

```caddy-d
rewrite /api/* ?a=b
```

Preserve the existing query string and add a key-value pair:

```caddy-d
rewrite /api/* ?{query}&a=b
```

Change both the path and query string, preserving the original query string while adding the original path as the `p` parameter:

```caddy-d
rewrite * /index.php?{query}&p={path}
```


## Similar directives

There are other directives that perform rewrites, but imply a different intent or do the rewrite without a complete replacement of the URI:

- [`uri`](uri) manipulates a URI (strip prefix, suffix, or substring replacement).
- [`try_files`](try_files) rewrites the request based on the existence of files.
