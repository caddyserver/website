---
title: header (Caddyfile directive)
---

# header

Manipulates HTTP header fields on the response. It can set, add, and delete header values, or perform replacements using regular expressions.

By default, header operations are performed immediately unless any of the headers are being deleted, in which case the header operations are automatically deferred until the time they are being written to the client.


## Syntax

```caddy-d
header [<matcher>] [[+|-|?]<field> [<value>|<find>] [<replace>]] {
	<field> <find> <replace>
	[+]<field> <value>
	-<field>
	?<field> <default_value>
	[defer]
}
```

- **&lt;field&gt;** is the name of the header field. By default, will overwrite any existing field of the same name. Prefix with `+` to add the field instead of replace, or prefix with `-` to remove the field.
- **&lt;value&gt;** is the header field value, if adding or setting a field.
- **&lt;default_value&gt;** is the header field value that will be set only if the header does not already exist.
- **&lt;find&gt;** is the substring or regular expression to search for.
- **&lt;replace&gt;** is the replacement value; required if performing a search-and-replace.
- **defer** will force the header operations to be deferred until the response is written out to the client. This is automatically enabled if any of the header fields are being deleted.

For multiple header manipulations, you can open a block and specify one manipulation per line in the same way.


## Examples

Set a custom header field on all requests:

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

Set security headers on all pages: (**WARNING:** only use if you understand the implications!)

```caddy-d
header {
	# enable HSTS
	Strict-Transport-Security max-age=31536000;

	# disable clients from sniffing the media type
	X-Content-Type-Options nosniff

	# clickjacking protection
	X-Frame-Options DENY

	# keep referrer data off of HTTP connections
	Referrer-Policy no-referrer-when-downgrade
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
