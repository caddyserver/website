---
title: uri (Caddyfile directive)
---

# uri

Manipulates a request's URI. It can strip path prefix/suffix or replace substrings on the whole URI.

This directive is distinct from [`rewrite`](rewrite) in that `uri` _differentiably_ changes the URI, rather than resetting it to something completely different as `rewrite` does. While `rewrite` is treated specially as an internal redirect, `uri` is just another middleware.


## Syntax

Multiple different operations are supported:

```caddy-d
uri [<matcher>] strip_prefix <target>
uri [<matcher>] strip_suffix <target>
uri [<matcher>] replace      <target> <replacement> [<limit>]
uri [<matcher>] path_regexp  <target> <replacement>
uri [<matcher>] query        [-|+]<param> [<value>]
uri [<matcher>] query {
	<param> [<value>] [<replacement>]
	...
}
```

The first (non-matcher) argument specifies the operation:

- **strip_prefix** strips the prefix from the path.

- **strip_suffix** strips the suffix from the path.

- **replace** performs a substring replacement across the whole URI.

	- **&lt;target&gt;** is the prefix, suffix, or search string/regular expression. If a prefix, the leading forward slash may be omitted, since paths always start with a forward slash.

	- **&lt;replacement&gt;** is the replacement string. Supports using capture groups with `$name` or `${name}` syntax, or with a number for the index, such as `$1`. See the [Go documentation](https://golang.org/pkg/regexp/#Regexp.Expand) for details. If the replacement value is `""`, then the matching text is removed from the value.

	- **&lt;limit&gt;** is an optional limit to the maximum number of replacements.

- **path_regexp** performs a regular expression replacement on the path portion of the URI.

	- **&lt;target&gt;** is the prefix, suffix, or search string/regular expression. If a prefix, the leading forward slash may be omitted, since paths always start with a forward slash.

	- **&lt;replacement&gt;** is the replacement string. Supports using capture groups with `$name` or `${name}` syntax, or with a number for the index, such as `$1`. See the [Go documentation](https://golang.org/pkg/regexp/#Regexp.Expand) for details. If the replacement value is `""`, then the matching text is removed from the value.

- **query** performs manipulations on the URI query, with the mode depending on the prefix to the parameter name or the count of arguments. A block can be used to specify multiple operations at once, grouped and performed in this order: rename 🡒 set 🡒 append 🡒 replace 🡒 delete.

	- With no prefix, the parameter is set with the given value in the query.
	
	  For example, `uri query foo bar` will set the value of the `foo` param to `bar`.

	- Prefix with `-` to remove the parameter from the query.
	
	  For example, `uri query -foo` will delete the `foo` parameter from the query.

	- Prefix with `+` to append a parameter to the query, with the given value. This will _not_ overwrite an existing parameter with the same name (omit the `+` to overwrite).
	
	  For example, `uri query +foo bar` will append `foo=bar` to the query.

	- A param with `>` as an infix will rename the parameter to the value after the `>`. 
	
	  For example, `uri query foo>bar` will rename the `foo` parameter to `bar`.

	- With three arguments, query value regular expression replacement is performed, where the first arg is the query param name, the second is the search value, and the third is the replacement. The first arg (param name) may be `*` to perform the replacement on all query params.
	
	  Supports using capture groups with `$name` or `${name}` syntax, or with a number for the index, such as `$1`. See the [Go documentation](https://golang.org/pkg/regexp/#Regexp.Expand) for details. If the replacement value is `""`, then the matching text is removed from the value.
	
	  For example, `uri query foo ^(ba)r $1z` would replace the value of the `foo` param, where the value began with `bar` resulting in the value becoming `baz`.

URI mutations occur on the normalized or unescaped form of the URI. However, escape sequences can be used in the prefix or suffix patterns to match only those literal escapes at those positions in the request path. For example, `uri strip_prefix /a/b` will rewrite both `/a/b/c` and `/a%2Fb/c` to `/c`; and `uri strip_prefix /a%2Fb` will rewrite `/a%2Fb/c` to `/c`, but won't match `/a/b/c`.

The URI path is cleaned of directory traversal dots before modifications. Additionally, multiple slashes (such as `//`) are merged unless the `<target>` contains multiple slashes too.

## Similar directives

Some other directives can also manipulate the request URI.

- [`rewrite`](rewrite) changes the entire path and query to a new value instead of partially changing the value.

- [`handle_path`](handle_path) does the same as [`handle`](handle), but it strips a prefix from the request before running its handlers. Can be used instead of `uri strip_prefix` to eliminate one extra line of configuration in many cases.


## Examples

Strip `/api` from the beginning of all request paths:

```caddy-d
uri strip_prefix /api
```

Strip `.php` from the end of all request paths:

```caddy-d
uri strip_suffix .php
```

Replace "/docs/" with "/v1/docs/" in any request URI:

```caddy-d
uri replace /docs/ /v1/docs/
```

Collapse all repeated slashes in the request path (but not the request query) to a single slash:

```caddy-d
uri path_regexp /{2,} /
```

Set the value of the `foo` query parameter to `bar`:

```caddy-d
uri query foo bar
```

Remove the `foo` parameter from the query:

```caddy-d
uri query -foo
```

Rename the `foo` query parameter to `bar`:

```caddy-d
uri query foo>bar
```

Append the `bar` parameter to the query:

```caddy-d
uri query +foo bar
```

Replace the value of the `foo` query parameter where the value begins with `bar` with `baz`:

```caddy-d
uri query foo ^(ba)r $1z
```

Perform multiple query operations at once:

```caddy-d
uri query {
	+foo bar
	-baz
	qux test
	renamethis>renamed
}
```
