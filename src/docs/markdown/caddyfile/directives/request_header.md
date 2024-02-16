---
title: request_header (Caddyfile directive)
---

# request_header

Manipulates HTTP header fields on the request. It can set, add, and delete header values, or perform replacements using regular expressions.

If you intend to manipulate headers for proxying, use the [`header_up` subdirective](/docs/caddyfile/directives/reverse_proxy#header_up) of `reverse_proxy` instead, as those manipulations are proxy-aware.

To manipulate HTTP response headers, you may use the [`header`](header) directive.


## Syntax

```caddy-d
request_header [<matcher>] [[+|-]<field> [<value>|<find>] [<replace>]]
```

- **&lt;field&gt;** is the name of the header field.

  With no prefix, the field is set (overwritten).

  Prefix with `+` to add the field instead of overwriting (setting) the field if it already exists; header fields can appear more than once in a request.

  Prefix with `-` to delete the field. The field may use prefix or suffix `*` wildcards to delete all matching fields.

- **&lt;value&gt;** is the header field value, if adding or setting a field.

- **&lt;find&gt;** is the substring or regular expression to search for.

- **&lt;replace&gt;** is the replacement value; required if performing a search-and-replace.


## Examples

Remove the Referer header from the request:

```caddy-d
request_header -Referer
```

Delete all headers containing an underscore from the request:

```caddy-d
request_header -*_*
```
