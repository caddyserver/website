---
title: intercept (Caddyfile directive)
---

<script>
ready(function() {
	// Fix response matchers to render with the right color,
	// and link to response matchers section
	$$_('pre.chroma .k').forEach(item => {
		if (item.innerText.includes('@')) {
			let text = item.innerText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
			let url = '#' + item.innerText.replace(/_/g, "-");
			item.classList.add('nd');
			item.classList.remove('k');
			item.innerHTML = `<a href="#response-matcher" style="color: inherit;" title="Response matcher">${text}</a>`;
		}
	});

	// Response matchers
	const nameMatchers = Array.from($$_('pre.chroma .nd')).filter(item => item.innerText.includes('@name'));
	if (nameMatchers.length > 0) {
		const first = nameMatchers[0];
		const span = document.createElement('span');
		span.className = 'nd';
		first.parentNode.insertBefore(span, first);
		span.appendChild(first);
		span.innerHTML = '<a href="/docs/caddyfile/response-matchers" style="color: inherit;">@name</a>';
	}
	
	$$_('pre.chroma .k').forEach(item => {
		if (item.innerText === 'status') {
			item.innerHTML = '<a href="/docs/caddyfile/response-matchers#status" style="color: inherit;">status</a>';
		}
	});
	
	const headerElements = $$_('pre.chroma .k');
	for (let item of headerElements) {
		if (item.innerText.includes('header')) {
			item.innerHTML = '<a href="/docs/caddyfile/response-matchers#header" style="color: inherit;">header</a>';
			break;
		}
	}

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
