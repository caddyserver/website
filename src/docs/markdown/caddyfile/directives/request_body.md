---
title: request_body (Caddyfile directive)
---

# request_body

Manipulates request body.


## Syntax

```caddy-d
request_body {
  max_size <value>
}
```

- **&lt;value&gt;** is the maximum size in bytes allowed for the request body. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go).


## Examples

Limit request body s to 10 mega bytes:

```caddy-d
request_body {
  max_size 10MB
}
```
