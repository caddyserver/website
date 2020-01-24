---
title: uri_replace (Caddyfile directive)
---

# uri_replace

Performs a substring or regular expression replacement in the request URI.


## Syntax

```
uri_replace [<matcher>] <find> <replace> [<limit>]
```

- **&lt;find&gt;** is the substring or regular expression to search for.
- **&lt;replace&gt;** is the replacement value.
- **&lt;limit&gt;** is an optional limit to the number of replacements.


## Examples

Replace "/docs/" with "/v1/docs/" in any request URI:

```
uri_replace * /docs/ /v1/docs/
```
