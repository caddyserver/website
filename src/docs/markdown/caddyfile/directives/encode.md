---
title: encode (Caddyfile directive)
---

<script>
window.$(function() {
	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();

	// Response matchers
	window.$('pre.chroma .k:contains("status")')
		.html('<a href="/docs/caddyfile/response-matchers#status" style="color: inherit;" title="Response matcher">status</a>')
	window.$('pre.chroma .k:contains("header")')
		.html('<a href="/docs/caddyfile/response-matchers#header" style="color: inherit;" title="Response matcher">header</a>')
});
</script>

# encode

Encodes responses using the configured encoding(s). A typical use for encoding is compression.

## Syntax

```caddy-d
encode [<matcher>] [<formats...>] {
	# encoding formats
	gzip [<level>]
	zstd [<level>]
	
	minimum_length <length>

	match <inline_response_matcher>
}
```

- **&lt;formats...&gt;** is the list of encoding formats to enable. If multiple encodings are enabled, the encoding is chosen based the request's Accept-Encoding header; if the client has no strong preference (q-factor), then the first supported encoding is used. If omitted, `zstd` (preferred) and `gzip` are enabled by default.

- **gzip** <span id="gzip"/> enables Gzip compression, optionally at a specified level.

- **zstd** <span id="zstd"/> enables Zstandard compression, optionally at a specified level (possible values = default, fastest, better, best). The default compression level is roughly equivalent to the default Zstandard mode (level 3). 

- **minimum_length** <span id="minimum_length"/> the minimum number of bytes a response should have to be encoded (default: 512).

- **match** <span id="match"/> is a [response matcher](/docs/caddyfile/response-matchers). Only matching responses are encoded. The default looks like this:

  ```caddy-d
  match {
  	header Content-Type application/atom+xml*
  	header Content-Type application/eot*
  	header Content-Type application/font*
  	header Content-Type application/geo+json*
  	header Content-Type application/graphql+json*
  	header Content-Type application/javascript*
  	header Content-Type application/json*
  	header Content-Type application/ld+json*
  	header Content-Type application/manifest+json*
  	header Content-Type application/opentype*
  	header Content-Type application/otf*
  	header Content-Type application/rss+xml*
  	header Content-Type application/truetype*
  	header Content-Type application/ttf*
  	header Content-Type application/vnd.api+json*
  	header Content-Type application/vnd.ms-fontobject*
  	header Content-Type application/wasm*
  	header Content-Type application/x-httpd-cgi*
  	header Content-Type application/x-javascript*
  	header Content-Type application/x-opentype*
  	header Content-Type application/x-otf*
  	header Content-Type application/x-perl*
  	header Content-Type application/x-protobuf*
  	header Content-Type application/x-ttf*
  	header Content-Type application/xhtml+xml*
  	header Content-Type application/xml*
  	header Content-Type font/*
  	header Content-Type image/svg+xml*
  	header Content-Type image/vnd.microsoft.icon*
  	header Content-Type image/x-icon*
  	header Content-Type multipart/bag*
  	header Content-Type multipart/mixed*
  	header Content-Type text/*
  }
  ```


## Examples

Enable Gzip compression:

```caddy-d
encode gzip
```

Enable Zstandard and Gzip compression (with Zstandard implicitly preferred, since it is first):

```caddy-d
encode zstd gzip
```

As this is the default value, the previous configuration is strictly equivalent to:

```caddy-d
encode
```

And in a full site, compressing static files served by [`file_server`](file_server):

```caddy
example.com {
	root * /srv
	encode
	file_server
}
```
