---
title: bind (Caddyfile directive)
---

# bind

bind overrides the interface to which the server's socket should bind. Normally, the listener binds to the empty (wildcard) interface. However, you may force the listener to bind to another hostname or IP instead. (This directive accepts only a host, not a port.)

Note that binding sites inconsistently may result in unintended consequences. For example, if two sites on the same port resolve to 127.0.0.1 and only one of those sites is configured with `bind 127.0.0.1`, then only one site will be accessible since the other will bind to the port without a specific host; the OS will choose the more specific matching socket. (Virtual hosts are not shared across different listeners.)

bind also accepts an optional network name: `<network>/<host>`.


## Syntax

```caddy-d
bind <hosts...>
```

- **&lt;hosts...&gt;** is the list of host interfaces to bind which to bind the listener.


## Examples

To make a socket accessible only on the current machine, bind to the loopback interface (localhost):

```caddy-d
bind 127.0.0.1
```

To include IPv6:

```caddy-d
bind 127.0.0.1 ::1
```

To bind to a Unix domain socket at `/run/caddy`:

```caddy-d
bind unix//run/caddy
```
