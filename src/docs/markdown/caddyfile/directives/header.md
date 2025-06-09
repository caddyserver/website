---
title: header (Caddyfile directive)
---

# header

Manipulates HTTP response header fields. It can set, add, and delete header values, or perform replacements using regular expressions.

By default, header operations are performed immediately unless any of the headers are being deleted (`-` prefix) or setting a default value (`?` prefix). In those cases, the header operations are automatically deferred until the time they are being written to the client.

To manipulate HTTP request headers, you may use the [`request_header`](request_header) directive.


## Syntax

```caddy-d
header [<matcher>] [[+|-|?|>]<field> [<value>|<find>] [<replace>]] {
	# Add
	+<field> <value>

	# Set
	<field> <value>

	# Set with defer
	><field> <value>

	# Delete
	-<field>

	# Replace
	<field> <find> <replace>

	# Replace with defer
	><field> <find> <replace>

	# Default
	?<field> <value>

	[defer]

	match <inline_response_matcher>
}
```

- **&lt;field&gt;** is the name of the header field.

  With no prefix, the field is set (overwritten).

  Prefix with `+` to add the field instead of overwriting (setting) the field if it already exists; header fields can appear more than once in a response.

  Prefix with `-` to delete the field. The field may use prefix or suffix `*` wildcards to delete all matching fields.

  Prefix with `?` to set a default value for the field. The field is only written if it doesn't yet exist.

  Prefix with `>` to set the field, and enable `defer`, as a shortcut.

- **&lt;value&gt;** is the header field value, when adding or setting a field.

- **&lt;find&gt;** is the substring or regular expression to search for.

- **&lt;replace&gt;** is the replacement value; required if performing a search-and-replace. Use `$1` or `$2` and so on to reference capture groups from the search pattern. If the replacement value is `""`, then the matching text is removed from the value. See the [Go documentation](https://golang.org/pkg/regexp/#Regexp.Expand) for details.

- **defer** defers the execution of header operations until the response is being sent to the client. This option is automatically enabled under the following conditions:
	- When any header fields are deleted using `-`.
	- When setting a default value with `?`.
	- When using the `>` prefix on a set or replace operation.
	- When one or more `match` conditions are present.

- **match** <span id="match"/> is an inline [response matcher](/docs/caddyfile/response-matchers). Header operations are applied only to responses that satisfy the specified conditions.

For multiple header manipulations, you can open a block and specify one manipulation per line in the same way.

When using the `?` prefix to set a default header value, it is automatically separated into its own `header` handler, if it was in a `header` block with multiple header operations. [Under the hood](/docs/modules/http.handlers.headers#response/require), using `?` configures a [response matcher](/docs/caddyfile/response-matchers) which applies to the directive's entire handler, which only applies the header operations (like `defer`), but only if the field is not yet set.


## Examples

Set a custom header field on all responses:

```caddy-d
header Custom-Header "My value"
```

Strip the "Hidden" header field:

```caddy-d
header -Hidden
```

Replace `http://` with `https://` in any Location header:

```caddy-d
header Location http:// https://
```

Set security and privacy headers on all pages: (**WARNING:** only use if you understand the implications!)

```caddy-d
header {
	# disable FLoC tracking
	Permissions-Policy interest-cohort=()

	# enable HSTS
	Strict-Transport-Security max-age=31536000;

	# disable clients from sniffing the media type
	X-Content-Type-Options nosniff

	# clickjacking protection
	X-Frame-Options DENY
}
```

Multiple header directives that are intended to be mutually-exclusive:

```caddy-d
route {
	header           Cache-Control max-age=3600
	header /static/* Cache-Control max-age=31536000
}
```

Set a default cache expiration if upstream doesn't define one:

```caddy-d
header ?Cache-Control "max-age=3600"
reverse_proxy upstream:443
```

Mark all successful responses to GET requests as cacheable for upto an hour:

```caddy-d
@GET method GET
header @GET Cache-Control "max-age=3600" {
	match status 2xx
}
reverse_proxy upstream:443
```

Prevent caching of error responses in the event of an exception in the upstream server:

```caddy-d
header {
	-Cache-Control
	-CDN-Cache-Control
	match status 500
}
reverse_proxy upstream:443
```

Mark light mode responses as separately cacheable from dark mode responses if the upstream server supports client hints:
```caddy-d
header {
	Cache-Control "max-age=3600"
	Vary "Sec-CH-Prefers-Color-Scheme"
	match {
		header Accept-CH "*Sec-CH-Prefers-Color-Scheme*"
		header Critical-CH "Sec-CH-Prefers-Color-Scheme"
	}
}
reverse_proxy upstream:443
```

Prevent overly-permissive CORS headers by replacing wildcard values with a specific domain:
```caddy-d
header >Access-Control-Allow-Origin "\*" "allowed-partner.com"
reverse_proxy upstream:443
```
**Note**: In replacement operations, the `<find>` value is interpreted as a regular expression. To match the `*` character, it must be escaped with a backslash as shown in the above example.

Alternatively, you may use a [response matcher](/docs/caddyfile/response-matchers) to match a header value verbatim:
```caddy-d
header Access-Control-Allow-Origin "allowed-partner.com" {
	match header Access-Control-Allow-Origin *
}
reverse_proxy upstream:443
```

To override the cache expiration that a proxy upstream had set for paths starting with `/no-cache`; enabling `defer` is necessary to ensure the header is set _after_ the proxy writes its headers:

```caddy-d
header /no-cache* >Cache-Control no-cache
reverse_proxy upstream:443
```

To perform a deferred update of a `Set-Cookie` header to add `SameSite=None`; a regexp capture is used to grab the existing value, and `$1` re-inserts it at the start with the additional option appended:

```caddy-d
header >Set-Cookie (.*) "$1; SameSite=None;"
```
