---
title: strip_suffix (Caddyfile directive)
---

# strip_suffix

Strips a given suffix from the request URI's path. If a matched request does not have the given path suffix, this directive is a no-op.


## Syntax

```
strip_suffix [<matcher>] <suffix>
```

- **&lt;suffix&gt;** is the suffix to strip from the request path.


## Examples

Strip `.html` from the end of all request paths:

```
strip_suffix .html
```
