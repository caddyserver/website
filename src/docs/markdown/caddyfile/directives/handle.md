---
title: handle (Caddyfile directive)
---

# handle

Evaluates a group of directives mutually exclusively from other `handle` blocks at the same level of nesting.

The `handle` directive is kind of similar to the `location` directive from nginx config: the first matching `handle` block will be evaluated. Handle blocks can be nested if needed. Only HTTP handler directives can be used inside handle blocks.

<aside class="tip">
	See also the [`handle_path`](/docs/caddyfile/directives/handle_path) directive if you need to strip the matched path prefix.
</aside>

## Syntax

```caddy-d
handle [<matcher>] {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives or directive blocks, one per line, just like would be used outside of a handle block.


## Utility

If you prefer crafting HTTP handler logic in a more inheritence-based way like nginx location blocks, you may prefer the use of `handle` blocks rather than defining mutually-exclusive matchers for your directives. If inheritence is a desired characteristic of your HTTP handler configurations, then the `handle` directive may suit you well.

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
