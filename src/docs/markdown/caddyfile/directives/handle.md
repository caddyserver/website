---
title: handle (Caddyfile directive)
---

# handle

Evaluates a group of directives mutually exclusively from other `handle` blocks at the same level of nesting.

The `handle` directive is kind of similar to the `location` directive from nginx config: the first matching `handle` block will be evaluated. Handle blocks can be nested if needed. Only HTTP handler directives can be used inside handle blocks.

## Syntax

```caddy-d
handle [<matcher>] {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives or directive blocks, one per line, just like would be used outside of a handle block.


## Utility

If you prefer crafting HTTP handler logic in a more inheritence-based way like nginx location blocks, you may prefer the use of `handle` blocks rather than defining mutually-exclusive matchers for your directives. If inheritence is a desired characteristic of your HTTP handler configurations, then the `handle` directive may suit you well.

## Similar directives

There are other directives that can wrap HTTP handler directives, but each has its use depending on the behavior you want to convey:

- [`handle_path`](handle_path) does the same as `handle`, but it strips a prefix from the request before running its handlers.
- [`handle_errors`](handle_errors) is like `handle`, but is only invoked when Caddy encounters an error during request handling.
- [`route`](route) wraps other directives like `handle` does, but with two distinctions: 1) route blocks are not mutually exclusive to each other, and 2) directives within a route are not [re-ordered](/docs/caddyfile/directives#directive-order), giving you more control if needed.

## Examples

Handle requests in `/foo/` by the static file server, and send all other requests to the reverse proxy:

```caddy-d
handle /foo/* {
	file_server
}
handle {
	reverse_proxy 127.0.0.1:8080
}
```

You can mix `handle` and [`handle_path`](handle_path) directives in the same site, and they will still be mutually exclusive from each other:

```caddy-d
handle_path /foo/* {
	# The path has the "/foo" prefix stripped
}

handle /bar/* {
	# The path still retains "/bar"
}
```
