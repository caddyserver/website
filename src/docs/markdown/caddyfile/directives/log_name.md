---
title: log_name (Caddyfile directive)
---

# log_name

Overrides the logger name to use for a request when writing access logs with the [`log` directive](log).

This directive is useful when you want to log requests to different files based on some condition, such as the request path or method.

More than one logger name can be specified, such that the request's log gets pushed to more than one matching logger.

This is often paired with the `log` directive's [`no_hostname`](log#no_hostname) option, which prevents the logger from being associated with any of the site block's hostnames, so that only requests that set `log_name` will push logs to that logger.


## Syntax

```caddy-d
log_name [<matcher>] <names...>
```


## Examples

You may want to log requests to different files, for example you might want to log health checks to a separate file from the main access logs.

Using `no_hostname` in a `log` prevents the logger from being associated with any of the site block's hostnames (i.e. `localhost` here), so that only requests that have `log_name` set to that logger's name will receive logs.

```caddy
localhost {
	log {
		output file ./caddy.access.log
	}

	log health_check_log {
		output file ./caddy.access.health.log
		no_hostname
	}

	handle /healthz* {
		log_name health_check_log
		respond "Healthy"
	}

	handle {
		respond "Hello World"
	}
}
```
