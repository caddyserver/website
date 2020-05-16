---
title: request_header (Caddyfile directive)
---

# request_header

Manipulates HTTP header fields on the request. It can set, add, and delete header values, or perform replacements using regular expressions.


## Syntax

```caddy-d
request_header [<matcher>] [[+|-]<field> [<value>|<find>] [<replace>]]
```

- **&lt;field&gt;** is the name of the header field. By default, will overwrite any existing field of the same name. Prefix with `+` to add the field instead of replace, or prefix with `-` to remove the field.
- **&lt;value&gt;** is the header field value, if adding or setting a field.
- **&lt;find&gt;** is the substring or regular expression to search for.
- **&lt;replace&gt;** is the replacement value; required if performing a search-and-replace.


## Examples

Remove the Referer header from the request:

```caddy-d
request_header -Referer
```
