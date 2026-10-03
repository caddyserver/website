---
title: bind (Caddyfile directive)
---

# bind

Overrides the network address used by the server listener.

Normally, the listener binds to the empty (wildcard) interface. However, you may force the listener to use another hostname, IP address, Unix socket or inherited file descriptor. For IP listeners this directive accepts only a host, not a port. The port is determined by the [site address](/docs/caddyfile/concepts#addresses) (defaulting to `443`).

Note that binding sites inconsistently may result in unintended consequences. For example, if two sites on the same port resolve to `127.0.0.1` and only one of those sites is configured with `bind 127.0.0.1` then only one site will be accessible since the other will bind to the port without a specific host; the OS will choose the more specific matching socket. (Virtual hosts are not shared across different listeners.)

`bind` accepts [network addresses](/docs/conventions#network-addresses) but may not include a port.


## Syntax
```caddy-d
bind <addresses...> [{
	protocols <protocols...>
}]
```
- **&lt;addresses...&gt;** is the list of network addresses without ports for the listener.
- **&lt;protocols...&gt;** optionally selects the HTTP protocols served by this listener. Accepted values are `h1`, `h2`, `h2c` and `h3`; see the [`protocols` server option](/docs/caddyfile/options#protocols).


## Examples

To make a socket accessible only on the current machine, bind to the loopback interface (localhost):

```caddy
example.com {
	bind 127.0.0.1
}
```

To include IPv6:

```caddy
example.com {
	bind 127.0.0.1 [::1]
}
```

To bind to `10.0.0.1:8080`:

```caddy
example.com:8080 {
	bind 10.0.0.1
}
```

To bind to a Unix domain socket at `/run/caddy`:

```caddy
example.com {
	bind unix//run/caddy
}
```

To change the file permission to be writable by all users ([defaults](/docs/conventions#network-addresses) to `0200`, which is only writable by the owner):

```caddy
example.com {
	bind unix//run/caddy|0222
}
```

To use named TCP and UDP sockets inherited through systemd socket activation:
```caddy
http://example.com {
	bind fd/{systemd.listen.http} {
		protocols h1
	}
	redir https://example.com{uri} permanent
}

https://example.com {
	bind fd/{systemd.listen.https} {
		protocols h1 h2
	}
	bind fdgram/{systemd.listen.https-udp} {
		protocols h3
	}
}
```

See [inherited file descriptors](/docs/conventions#inherited-file-descriptors) for descriptor naming and duplicate-name indexing.

To bind one domain to two different interfaces, with different responses:

```caddy
example.com {
	bind 10.0.0.1
	respond "One"
}

example.com {
	bind 10.0.0.2
	respond "Two"
}
```
