---
title: encode (Caddyfile directive)
---

# encode

Encodes responses using the configured encoding(s). A typical use for encoding is compression.

## Syntax

```
encode [<matcher>] <formats...> {
	gzip [<level>]
	zstd
	brotli [<quality>]
}
```

- **&lt;formats...&gt;** is the list of encoding formats to enable.
- **gzip** enables Gzip compression, optionally at the specified level.
- **zstd** enables Zstandard compression.
- **brotli** enables on-the-fly Brotli compression, but be aware that Brotli compression is not designed to be fast and the current Go implementation is not efficient. Use only for testing and development. _We might remove this option in the future. Do not use in production. Not subject to compatibility promises._ To use brotli compression, pre-compress your assets and serve those instead.


## Examples

Enable Gzip compression:

```
encode gzip
```

Enable Zstandard and Gzip compression:

```
encode zstd gzip
```

