---
title: abort (Caddyfile directive)
---

# abort

Prevents any response to the client by immediately aborting the HTTP handler chain and closing the connection. Any concurrent, active HTTP streams on the same connection are interrupted.


## Syntax

```caddy-d
abort [<matcher>]
```

## Examples

Abort all requests for paths starting with `/foo`:

```caddy-d
abort /foo*
```
