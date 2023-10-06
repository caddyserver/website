---
title: handle_path (Caddyfile directive)
---

<script>
window.$(function() {
	// Add a link to [<path_matcher>] as a special case for this directive.
	// The matcher text includes <> characters which are parsed as HTML,
	// so we must use text() to change the link text.
	window.$('pre.chroma .s:contains("<path_matcher>")')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
			window.$(item)
				.html('<a href="/docs/caddyfile/matchers#path-matchers" style="color: inherit;" title="Matcher token">' + text + '</a>')
				.removeClass('s')
				.addClass('nd');
		});
});
</script>

# handle_path

Works the same as the [`handle` directive](/docs/caddyfile/directives/handle), but implicitly uses [`uri strip_prefix`](/docs/caddyfile/directives/uri) to strip the matched path prefix.

Handling a request matching a certain path (while stripping that path from the request URI) is a common enough use case that it has its own directive for convenience.


## Syntax

```caddy-d
handle_path <path_matcher> {
	<directives...>
}
```

- **<directives...>** is a list of HTTP handler directives or directive blocks, one per line, just like would be used outside of a `handle_path` block.

Only a single [path matcher](/docs/caddyfile/matchers#path-matchers) is accepted, and is required; you cannot use named matchers with `handle_path`.

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
