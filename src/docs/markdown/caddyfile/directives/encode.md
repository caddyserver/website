---
title: encode (Caddyfile directive)
---

<script>
$(function() {
	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# encode

Encodes responses using the configured encoding(s). A typical use for encoding is compression.

## Syntax

```caddy-d
encode [<matcher>] <formats...> {
	# encoding formats
	gzip [<level>]
	zstd
	
	minimum_length <length>

	# response matcher single line syntax
	match [header <field> [<value>]] | [status <code...>]
	# or response matcher block for multiple conditions
	match {
		status <code...>
		header <field> [<value>]
	}
}
```

- **&lt;formats...&gt;** is the list of encoding formats to enable. If multiple encodings are enabled, the encoding is chosen based the request's Accept-Encoding header; if the client has no strong preference (q-factor), then the first supported encoding is used.
- **gzip** <span id="gzip"/> enables Gzip compression, optionally at the specified level.
- **zstd** <span id="zstd"/> enables Zstandard compression.
- **minimum_length** <span id="minimum_length"/> the minimum number of bytes a response should have to be encoded (default: 512).
- **match** <span id="match"/> is a [response matcher](#response-matcher). Only matching responses are encoded. The default looks like this:

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

See the [header](/docs/caddyfile/matchers#header) request matcher for the supported syntax.

## Examples

Enable Gzip compression:

```caddy-d
encode gzip
```

Enable Zstandard and Gzip compression (with Zstandard implicitly preferred, since it is first):

```caddy-d
encode zstd gzip
```
