---
title: strip_prefix (Caddyfile directive)
---

# strip_prefix

Strips a given prefix from the request URI's path. If a matched request does not have the given path prefix, this directive is a no-op.


## Syntax

```
strip_prefix [<matcher>] <prefix>
```

- **&lt;prefix&gt;** is the prefix to strip from the request path. This value may omit the leading forward slash `/` and it will be assumed.


## Examples

Strip `api/` from the beginning of all request paths:

```
strip_prefix api/
```

An alternate way to describe the same thing, using a matcher:

```
strip_prefix /api/* /api
```