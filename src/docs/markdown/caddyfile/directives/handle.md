---
title: handle (Caddyfile directive)
---

# handle

Evaluates a group of directives mutually exclusively from other `handle` blocks at the same level of nesting.

In other words, when multiple `handle` directives appear in sequence, only the first _matching_ `handle` block will be evaluated. A handle with no matcher acts like a _fallback_ route.

The `handle` directives are sorted according to the [directive sorting algorithm](/docs/caddyfile/directives#sorting-algorithm) by their matchers. The [`handle_path`](handle_path) directive is a special case which sorts at the same priority as a `handle` with a path matcher.

Handle blocks can be nested if needed. Only HTTP handler directives can be used inside handle blocks.

## Syntax

```caddy-d
handle [<matcher>] {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives or directive blocks, one per line, just like would be used outside of a handle block.



## Similar directives

There are other directives that can wrap HTTP handler directives, but each has its use depending on the behavior you want to convey:

- [`handle_path`](handle_path) does the same as `handle`, but it strips a prefix from the request before running its handlers.

- [`handle_errors`](handle_errors) is like `handle`, but is only invoked when Caddy encounters an error during request handling.

- [`route`](route) wraps other directives like `handle` does, but with two distinctions:
  1. route blocks are not mutually exclusive to each other,
  2. directives within a route are not [re-ordered](/docs/caddyfile/directives#directive-order), giving you more control if needed.



## Examples

Handle requests in `/foo/` with the static file server, and other requests with the reverse proxy:

```caddy
example.com {
	handle /foo/* {
		file_server
	}

	handle {
		reverse_proxy 127.0.0.1:8080
	}
}
```

You can mix `handle` and [`handle_path`](handle_path) in the same site, and they will still be mutually exclusive from each other:

```caddy
example.com {
	handle_path /foo/* {
		# The path has the "/foo" prefix stripped
	}

	handle /bar/* {
		# The path still retains "/bar"
	}
}
```

You can nest `handle` blocks to create more complex routing logic:

```caddy
example.com {
	handle /foo* {
		handle /foo/bar* {
			# This block only matches paths under /foo/bar
		}

		handle {
			# This block matches everything else under /foo/
		}
	}

	handle {
		# This block matches everything else (acts as a fallback)
	}
}
```
