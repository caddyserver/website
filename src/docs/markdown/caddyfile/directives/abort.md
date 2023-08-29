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

Forcefully close a connection received for unknown domains when using a wildcard certificate:

```caddy
*.example.com {
    @foo host foo.example.com
    handle @foo {
        respond "This is foo!" 200
    }

    handle {
		# Unhandled domains fall through to here,
		# but we don't want to accept their requests
        abort
    }
}
```
