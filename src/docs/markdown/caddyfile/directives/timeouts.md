---
title: timeouts (Caddyfile directive)
---

# timeouts

Sets idle read and write timeouts, minimum transfer rates, and a maximum write chunk size for matching requests, separately from the server-wide [`timeouts` global option](/docs/caddyfile/options#timeouts).

Like the server-wide `read_body_idle` and `write_idle` timeouts, these are reset after every successful read or write, so they only abort connections that stall; slow clients that keep making progress are not affected.

⚠️ This is an experimental feature. Subject to change or removal.


## Syntax

```caddy-d
timeouts [<matcher>] {
	read_timeout    <duration> [<min_rate>]
	write_timeout   <duration> [<min_rate>]
	max_write_chunk <size>
}
```

- **read_timeout** is a [duration value](/docs/conventions#durations) that sets how long a read from the request body may stall before the connection is aborted. The deadline is reset after every successful read. If omitted, the server-wide `read_body_idle` timeout applies.

  The optional **&lt;min_rate&gt;** is a number of bytes per second that the client must sustain, averaged from the start of reading the request body. With it, the client is allowed the `read_timeout` duration plus the time it would take to send the bytes received so far at `min_rate`, which also stops clients that send just enough data to never stall.

- **write_timeout** is a [duration value](/docs/conventions#durations) that sets how long a write to the client may stall before the connection is aborted. The deadline is reset before every write. If omitted, the server-wide `write_idle` timeout applies.

  The optional **&lt;min_rate&gt;** works like the one for `read_timeout`, but for writes to the client. Because the rate is averaged from the start of the response, pauses between writes count against it, so avoid it for long-lived streaming responses such as server-sent events.

- **max_write_chunk** is the maximum number of bytes that a single underlying write to the client may cover, so that `write_timeout` applies between chunks of a large response rather than to one large write as a whole. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go). Only has an effect when `write_timeout` is set. Default: `64KiB`.

<aside class="tip">

While a request is handled by a matching route, this directive's `read_timeout` and `write_timeout` take precedence over the server-wide `read_body_idle` and `write_idle` timeouts, and over those of any enclosing `timeouts` directive (the innermost one wins). A timeout this directive doesn't set keeps the server-wide setting. The server-wide `read_body` and `write` timeouts in the [`timeouts` global option](/docs/caddyfile/options#timeouts) still cap the whole request body and response. Before v2.11.8, the server-wide idle timeouts took precedence and had to be disabled for this directive to have an effect.

</aside>


## Examples

Abort uploads to `/upload` if they stall for more than 10 seconds, or if the client sends less than 1 KiB per second on average:

```caddy
example.com {
	timeouts /upload* {
		read_timeout 10s 1024
	}
	reverse_proxy localhost:8080
}
```

Abort downloads from `/files` if a write to the client stalls for more than 30 seconds, checking between chunks of at most 16 KiB:

```caddy
example.com {
	timeouts /files/* {
		write_timeout   30s
		max_write_chunk 16KiB
	}
	root * /srv
	file_server
}
```
