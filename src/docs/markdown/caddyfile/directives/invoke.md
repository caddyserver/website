---
title: invoke (Caddyfile directive)
---

# invoke

<i>⚠️ Experimental</i>

Invokes a [named route](/docs/caddyfile/concepts#named-routes).

This is useful when paired with HTTP handler directives that have their own in-memory state, or if they are expensive to provision on load. If you have hundreds of sites or more, invoking a named route can help reduce memory usage.

<aside class="tip">
	
Unlike [`import`](/docs/caddyfile/directives/import), `invoke` does not support arguments, but you may use [`vars`](/docs/caddyfile/directives/vars) to define variables that can be used within the named route.

</aside>

## Syntax

```caddy-d
invoke [<matcher>] <route-name>
```

- **&lt;route-name&gt;** is the name of the previously defined route that should be invoked. If the route is not found, then an error will be triggered.


## Examples

Defines a [named route](/docs/caddyfile/concepts#named-routes) with a [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) which can be reused in multiple sites, with the same in-memory load balancing state reused for every site.

```caddy
&(app-proxy) {
	reverse_proxy app-01:8080 app-02:8080 app-03:8080 {
		lb_policy least_conn
		health_uri /healthz
		health_interval 5s
	}
}

# Apex domain allows accessing the app via an /app subpath
# and the main site otherwise.
example.com {
	handle_path /app* {
		invoke app-proxy
	}

	handle {
		root * /srv
		file_server
	}
}

# The app is also accessible via a subdomain.
app.example.com {
	invoke app-proxy
}
```
