---
title: Response matchers (Caddyfile)
---

<script>
window.$(function() {
	// Response matchers
	window.$('pre.chroma .nd:contains("@")')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let url = '#' + item.innerText.replace(/_/g, "-");
			window.$(item).addClass('nd').removeClass('k')
			window.$(item).html(`<a href="#syntax" style="color: inherit;">${text}</a>`);
		});
	window.$('pre.chroma .k:contains("status")')
		.html('<a href="#status" style="color: inherit;">status</a>');
	window.$('pre.chroma .k:contains("header")')
		.html('<a href="#header" style="color: inherit;">header</a>');

	// We'll add links to all the subdirectives if a matching anchor tag is found on the page.
	addLinksToSubdirectives();
});
</script>

# Response Matchers

**Response matchers** can be used to filter (or classify) responses by specific criteria.

These typically only appear as config inside of certain other directives, to make decisions on the response as it's being written out to the client.

- [Syntax](#syntax)
- [Matchers](#matchers)
	- [status](#status)
	- [header](#header)

## Syntax

If a directive accepts response matchers, the usage is represented as either `[<response_matcher>]` or `[<inline_response_matcher>]` in the syntax documentation.

- The **<response_matcher>** token can be the name of a previously declared named response matcher. For example: `@name`.
- The **<inline_response_matcher>** token can be the response criteria itself, without requiring prior declaration. For example: `status 200`.

### Named

```caddy-d
@name {
	status <code...>
	header <field> [<value>]
}
```
If only one aspect of the response is relevant to the directive, you can put the name and the criteria on the same line:

```caddy-d
@name status <code...>
```

### Inline

```caddy-d
... {
	status <code...>
	header <field> [<value>]
}
```
```caddy-d
... status <code...>
```
```caddy-d
... header <field> [<value>]
```

## Matchers

### status

```caddy-d
status <code...>
```

By HTTP status code.

- **&lt;code...&gt;** is a list of HTTP status codes. Special cases are strings like `2xx` and `3xx`, which match against all status codes in the range of `200`-`299` and `300`-`399`, respectively.

#### Example:

```caddy-d
@success status 2xx
```



### header

```caddy-d
header <field> [<value>]
```

By response header fields.

- `<field>` is the name of the HTTP header field to check.
	- If prefixed with `!`, the field must not exist to match (omit value arg).
- `<value>` is the value the field must have to match.
	- If prefixed with `*`, it performs a fast suffix match (appears at the end).
	- If suffixed with `*`, it performs a fast prefix match (appears at the start).
	- If enclosed by `*`, it performs a fast substring match (appears anywhere).
	- Otherwise, it is a fast exact match.

Different header fields within the same set are AND-ed. Multiple values per field are OR'ed.

Note that header fields may be repeated and have different values. Backend applications MUST consider that header field values are arrays, not singular values, and Caddy does not interpret meaning in such quandaries.

#### Example:

Match responses with the `Foo` header containing the value `bar`:

```caddy-d
@upgrade header Foo *bar*
```

Match responses with the `Foo` header having the value `bar` OR `baz`:

```caddy-d
@foo {
	header Foo bar
	header Foo baz
}
```

Match responses that do not have the `Foo` header field at all:

```caddy-d
@not_foo header !Foo
```
