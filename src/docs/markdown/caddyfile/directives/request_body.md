---
title: request_body (Caddyfile directive)
---

# request_body

Manipulates or sets restrictions on the bodies of incoming requests.


## Syntax

```caddy-d
request_body [<matcher>] {
  max_size <value>
}
```

- **max_size** is the maximum size in bytes allowed for the request body. It accepts all formats supported by [go-humanize](https://github.com/dustin/go-humanize/blob/master/bytes.go).


## Examples

Limit request body sizes to 10 megabytes:

```caddy-d
request_body {
  max_size 10MB
}
```
