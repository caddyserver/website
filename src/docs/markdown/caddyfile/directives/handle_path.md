---
title: handle_path (Caddyfile directive)
---

# handle_path

Same as the [`handle` directive](/docs/caddyfile/directives/handle), but implicitly strips the matched path prefix.

Handling a request matching a certain path (while stripping that path from the request URI) is a common enough use case that it has its own directive for convenience.


## Syntax

```caddy-d
handle_path <path_matcher> {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives or directive blocks, one per line, just like would be used outside of a handle_path block.

Note that only a single path matcher is accepted and required; you cannot use other kinds of matchers with handle_path.

## Examples

This configuration:

```caddy-d
handle_path /prefix/* {
	...
}
```

is effectively the same as this:

```caddy-d
handle /prefix/* {
	uri strip_prefix /prefix
	...
}
```

but the `handle_path` form is slightly more succinct.
