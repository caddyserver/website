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
	minimum_length <length>
	prefer <formats...>

	# response matcher single line syntax
	match [header <field> [<value>]] | [status <code...>]
	# or response matcher block
	match {
		status <code...>
		header <field> [<value>]
	}
}
```

- **&lt;formats...&gt;** is the list of encoding formats to enable.
- **gzip** enables Gzip compression, optionally at the specified level.
- **zstd** enables Zstandard compression.
- **minimum_length** the minimum number of bytes a response should have to be encoded. (Default is 512)
- **prefer** is the ordered list of enabled encoding formats to determine, which encoding to choose if the client has no strong preference (via q-factors in the `Accept-Encoding` header).  
  If **prefer** is not specified the first supported encoding from the `Accept-Encoding` header is used.
- **match** is a [Response matcher](#responsematcher). Only matching Responses are encoded. The default looks like this:

  ```caddy-d
  match {
      header Content-Type text/*
      header Content-Type application/json*
      header Content-Type application/javascript*
      header Content-Type application/xhtml+xml*
      header Content-Type application/atom+xml*
      header Content-Type application/rss+xml*
      header Content-Type image/svg+xml*
  }
  ```

## Response matcher

**Response matchers** can be used to filter (or classify) responses by specific criteria.

### status

```caddy-d
status <code...>
```

By HTTP status code.

- **&lt;code...&gt;** is a list of HTTP status codes. Special cases are `2xx`, `3xx`, ... which match against all status codes in the range of 200-299, 300-399, ... respectively

### header

See Request matcher [header](/docs/caddyfile/matchers#header).

## Examples

Enable Gzip compression:

```caddy-d
encode gzip
```

Enable Zstandard and Gzip compression:

```caddy-d
encode zstd gzip
```

Enable Zstandard and Gzip compression and prefer Zstandard over Gzip:

```caddy-d
encode zstd gzip {
	prefer zstd gzip
}
```

Without the **prefer** setting, a `--compressed` HTTP request via [curl](https://curl.se/) (meaning `Accept-Encoding: deflate, gzip, br, zstd` in curl >=7.72.0) would be served with Gzip encoding, because it is the first accepted encoding that both client and server support. With the **prefer** setting Zstandard encoding is served, because the client has no preference but the server (caddy) has.
