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

Works the same as the [`handle` directive](handle), but implicitly uses [`uri strip_prefix`](uri) to strip the matched path prefix.

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

👆 is effectively the same as this 👇, but the `handle_path` form 👆 is slightly more succinct

```caddy-d
handle /prefix/* {
	uri strip_prefix /prefix
	...
}
```

A full Caddyfile example, where `handle_path` and `handle` are mutually exclusive; but, be aware of the [subfolder problem <img src="/old/resources/images/external-link.svg" class="external-link">](https://caddy.community/t/the-subfolder-problem-or-why-cant-i-reverse-proxy-my-app-into-a-subfolder/8575)

```caddy
example.com {
	# Serve your API, stripping the /api prefix
	handle_path /api/* {
		reverse_proxy localhost:9000
	}

	# Serve your static site
	handle {
		root * /srv
		file_server
	}
}
```
