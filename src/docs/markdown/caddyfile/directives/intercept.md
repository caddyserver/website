---
title: intercept (Caddyfile directive)
---

<script>
window.$(function() {
	// Fix response matchers to render with the right color,
	// and link to response matchers section
	window.$('pre.chroma .k:contains("@")')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let url = '#' + item.innerText.replace(/_/g, "-");
			window.$(item).addClass('nd').removeClass('k')
			window.$(item).html(`<a href="#response-matcher" style="color: inherit;" title="Response matcher">${text}</a>`);
		});

	// Response matchers
	window.$('pre.chroma .nd:contains("@name")').first().slice(0, 3)
		.wrapAll('<span class="nd">').parent()
		.html('<a href="/docs/caddyfile/response-matchers" style="color: inherit;">@name</a>')
	window.$('pre.chroma .k')
		.filter((i, el) => el.innerText === 'status')
		.html('<a href="/docs/caddyfile/response-matchers#status" style="color: inherit;">status</a>')
	window.$('pre.chroma .k:contains("header")').first()
		.html('<a href="/docs/caddyfile/response-matchers#header" style="color: inherit;">header</a>')

	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# intercept

A generalized abstraction of the [response interception](reverse_proxy#intercepting-responses) feature from the [`reverse_proxy` directive](reverse_proxy). This may be used with any handler that produces responses, including those from plugins like [FrankenPHP](https://frankenphp.dev/)'s `php_server`.

This directive allows you to [match responses](/docs/caddyfile/response-matchers), and the first matching `handle_response` route or `replace_status` will be invoked. When invoked, the original response body is held back, giving the opportunity to that route to write a different response body, with a new status code or with any necessary response header manipulations. If the route does _not_ write a new response body, then original response body is written instead.


## Syntax

```caddy-d
intercept [<matcher>] {
	@name {
		status <code...>
		header <field> [<value>]
	}

	replace_status [<response_matcher>] <code>

	handle_response [<response_matcher>] {
		<directives...>
	}
}
```

- **@name** is a named [response matcher](/docs/caddyfile/response-matchers) block. As long as each response matcher has a unique name, multiple matchers can be defined. A response can be matched on the status code and presence or value of a response header.

- **replace_status** <span id="replace_status"/> simply changes the status code of response when matched by the given matcher.

- **handle_response** <span id="handle_response"/> defines the route to execute when the original response is matched by the given response matcher. If a matcher is omitted, all responses are intercepted. When multiple `handle_response` blocks are defined, the first matching block will be applied. Inside the block, all other [directives](/docs/caddyfile/directives) can be used.

Within `handle_response` routes, the following placeholders are available to pull information from the original response:

- `{resp.status_code}` The status code of the original response.

- `{resp.header.*}` The headers from the original response.


## Examples

When using [FrankenPHP](https://frankenphp.dev/)'s `php_server`, you can use `intercept` to implement `X-Accel-Redirect` support, serving static files as requested by the PHP app:

```caddy
localhost {
	root * /srv

	intercept {
		@accel header X-Accel-Redirect *
		handle_response @accel {
			root * /path/to/private/files
			rewrite {resp.header.X-Accel-Redirect}
			method GET
			file_server
		}
	}

	php_server
}
```
