---
title: encode (Caddyfile directive)
---

# encode

Encodes responses using the configured encoding(s). A typical use for encoding is compression.

## Syntax

```caddy-d
encode [<matcher>] <formats...> {
	gzip [<level>]
	zstd
}
```

- **&lt;formats...&gt;** is the list of encoding formats to enable.
- **gzip** enables Gzip compression, optionally at the specified level.
- **zstd** enables Zstandard compression.


## Examples

Enable Gzip compression:

```caddy-d
encode gzip
```

Enable Zstandard and Gzip compression:

```caddy-d
encode zstd gzip
```

