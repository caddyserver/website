---
title: uri (Caddyfile directive)
---

# uri

Manipulates a request's URI. It can strip path prefix/suffix or replace substrings on the whole URI.

This directive is distinct from [`rewrite`](rewrite) in that `uri` _partially_ changes the URI, rather than setting it to something completely different as `rewrite` does. While `rewrite` is treated specially as an internal redirect, `uri` is just another handler.


## Syntax

```caddy-d
uri [<matcher>] strip_prefix|strip_suffix|replace \
	<target> \
	[<replacement> [<limit>]]
```

- The first (non-matcher) argument specifies the operation:
	- **strip_prefix** strips a prefix from the path, if it has the prefix.
	- **strip_suffix** strips a suffix from the path, if it has the suffix.
	- **replace** performs a substring replacement across the whole URI.
- **&lt;target&gt;** is the prefix, suffix, or search string/regular expression. If a prefix, the leading forward slash may be omitted, since paths always start with a forward slash.
- **&lt;replacement&gt;** is the replacement string (only valid with `replace`).
- **&lt;limit&gt;** is an optional limit to the maximum number of replacements (only valid with `replace`).


## Examples

Strip `/api` from the beginning of all request paths:

```caddy-d
uri strip_prefix /api
```

Strip `.php` from the end of all request paths:

```caddy-d
uri strip_suffix .php
```

Replace "/docs/" with "/v1/docs/" in any request URI:

```caddy-d
uri replace /docs/ /v1/docs/
```
