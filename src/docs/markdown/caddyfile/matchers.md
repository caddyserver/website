---
title: Request matchers (Caddyfile)
---

<script>
$(function() {
	// We'll add links on the matchers in the code blocks
	// to their associated anchor tags.
	let headers = $('article h3').map((i, el) => el.id.replace(/-/g, "_")).toArray();
	$('pre.chroma .k')
		.filter((k, item) => headers.includes(item.innerText))
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let url = '#' + item.innerText.replace(/_/g, "-");
			$(item).html('<a href="' + url + '" style="color: inherit;" title="' + text + '">' + text + '</a>');
		});

	// Link matcher tokens based on their contents to the syntax section
	$('pre.chroma .nd')
		.map(function(k, item) {
			let text = item.innerText.replace(/</g,'&lt;').replace(/>/g,'&gt;');
			let anchor = "named-matchers"
			if (text == "*") anchor = "wildcard-matchers"
			if (text.startsWith('/')) anchor = "path-matchers"
			$(item).html('<a href="#' + anchor + '" style="color: inherit;" title="Matcher token">' + text + '</a>');
		});
});
</script>

# Request Matchers

**Request matchers** can be used to filter (or classify) requests by various criteria.

### Menu

- [Syntax](#syntax)
	- [Examples](#examples)
	- [Wildcard matchers](#wildcard-matchers)
	- [Path matchers](#path-matchers)
	- [Named matchers](#named-matchers)
- [Standard matchers](#standard-matchers)
	- [client_ip](#client-ip)
	- [expression](#expression)
	- [file](#file)
	- [header](#header)
	- [header_regexp](#header-regexp)
	- [host](#host)
	- [method](#method)
	- [not](#not)
	- [path](#path)
	- [path_regexp](#path-regexp)
	- [protocol](#protocol)
	- [query](#query)
	- [remote_ip](#remote-ip)
	- [vars](#vars)
	- [vars_regexp](#vars-regexp)


## Syntax

In the Caddyfile, a **matcher token** immediately following the directive can limit that directive's scope. The matcher token can be one of these forms:

1. **`*`** to match all requests (wildcard; default).
2. **`/path`** start with a forward slash to match a request path.
3. **`@name`** to specify a _named matcher_.

Matcher tokens are [usually optional](/docs/caddyfile/directives#matchers). If a matcher token is omitted, it is the same as a wildcard matcher (`*`).


#### Examples

This directive applies to [all](#wildcard-matchers) HTTP requests:

```caddy-d
reverse_proxy localhost:9000
```

And this is the same (`*` is unnecessary here):

```caddy-d
reverse_proxy * localhost:9000
```

But this directive applies only to requests having a [path](#path-matchers) starting with `/api/`:

```caddy-d
reverse_proxy /api/* localhost:9000
```

To match on anything other than a path, define a [named matcher](#named-matchers) and refer to it using `@name`:

```caddy-d
@postfoo {
	method POST
	path /foo/*
}
reverse_proxy @postfoo localhost:9000
```




### Wildcard matchers

The wildcard (or "catch-all") matcher `*` matches all requests, and is only needed if a matcher token is required. For example, if the first argument you want to give a directive also happens to be a path, it would look exactly like a path matcher! So you can use a wildcard matcher to disambiguate, for example:

```caddy-d
root * /home/www/mysite
```

Otherwise, this matcher is not often used. We generally recommend omitting it if syntax doesn't require it.


### Path matchers

Matching by URI path is the most common way to match requests, so the matcher can be inlined, like this:

```caddy-d
redir /old.html /new.html
```

Path matcher tokens must start with a forward slash `/`.

**[Path matching](#path) is an exact match by default, not a prefix match.** You must append a `*` for a fast prefix match. Note that `/foo*` will match `/foo` and `/foo/` as well as `/foobar`; you might actually want `/foo/*` instead.


### Named matchers

All matchers that are not path or wildcard matchers must be named matchers. This is a matcher that is defined outside of any particular directive, and can be reused.

Defining a matcher with a unique name gives you more flexibility, allowing you to combine [any available matchers](#standard-matchers) into a set:

```caddy-d
@name {
	...
}
```

or, if there is only one matcher in the set, you can put it on the same line:

```caddy-d
@name ...
```

Then you can use the matcher like so: `@name`

For example:

```caddy-d
@websockets {
	header Connection *Upgrade*
	header Upgrade    websocket
}
reverse_proxy @websockets localhost:6001
```

This proxies only the requests that have a header field named "Connection" containing the word "Upgrade", and another field named "Upgrade" with a value of "websocket".

If the matcher set consists of only one matcher, a one-liner syntax also works:

```caddy-d
@post method POST
reverse_proxy @post localhost:6001
```

As a special case, the [`expression` matcher](#expression) may be used without specifying its name as long as a single quoted argument (the CEL expression itself) follows the matcher name:

```caddy-d
@notFound `{err.status_code} == 404`
```

Like directives, named matcher definitions must go inside the site blocks that use them.

A named matcher definition constitutes a _matcher set_. Matchers in a set are AND'ed together; i.e. all must match. For example, if you have both a `header` and `path` matcher in the set, both must match.

Multiple matchers of the same type may be unioned (e.g. multiple `path` matchers in the same set) using boolean algebra (AND/OR), as described in their respective sections below.





## Standard matchers

Full matcher documentation can be found [in each respective matcher module's docs](/docs/json/apps/http/servers/routes/match/).

Requests can be matched the following ways:



### client_ip

```caddy-d
client_ip <ranges...>

expression client_ip('<ranges...>')
```

By the client IP address. Accepts exact IPs or CIDR ranges. IPv6 zones are supported.

This matcher is best used when the [`trusted_proxies`](/docs/caddyfile/options#trusted-proxies) global option is configured, otherwise it acts identically to the [`remote_ip`](#remote-ip) matcher. Only requests from trusted proxies will have their client IP parsed at the start of the request; untrusted requests will use the remote IP address of the immediate peer.

As a shortcut, `private_ranges` can be used to match all private IPv4 and IPv6 ranges. It's the same as specifying all of these ranges: `192.168.0.0/16 172.16.0.0/12 10.0.0.0/8 127.0.0.1/8 fd00::/8 ::1`

There can be multiple `client_ip` matchers per named matcher, and their ranges will be merged and OR'ed together.

#### Example:

Match requests from private IPv4 addresses:

```caddy-d
client_ip 192.168.0.0/16 172.16.0.0/12 10.0.0.0/8 127.0.0.1/8
```

This matcher is commonly paired with the [`not`](#not) matcher to invert the match. For example, to abort all connections from _public_ IPv4 and IPv6 addresses (which is the inverse of all private ranges):

```caddy-d
@denied not client_ip private_ranges
abort @denied
```



### expression

```caddy-d
expression <cel...>
```

By any [CEL (Common Expression Language)](https://github.com/google/cel-spec) expression that returns `true` or `false`.

Caddy [placeholders](/docs/conventions#placeholders) (or [Caddyfile shorthands](/docs/caddyfile/concepts#placeholders)) may be used in these CEL expressions, as they are preprocessed and converted to regular CEL function calls before being interpreted by the CEL environment.

Since v2.5.2, most other request matchers can also be used in expressions as functions, which allows for more flexibility for boolean logic than outside expressions. See the documentation for each matcher for the supported syntax within CEL expressions.

For convenience, the matcher name may be omitted if defining a named matcher that consists solely of a CEL expression. This reads quite nicely:

```caddy-d
@mutable `{method}.startsWith("P")`
```

In this case the CEL matcher is assumed.

#### Examples:

Match requests whose methods start with `P`, e.g. `PUT` or `POST`:

```caddy-d
expression {method}.startsWith("P")
```

Match requests where handler returned error status code `404`, would be used in conjunction with the [`handle_errors` directive](/docs/caddyfile/directives/handle_errors):

```caddy-d
expression {err.status_code} == 404
```

Match requests where the path matches one of two different regular expressions; this is only possible to write using an expression, because the [`path_regexp`](#path-regexp) matcher can normally only exist once per named matcher:

```caddy-d
expression path_regexp('^/user/(\w*)') || path_regexp('^/(\w*)')
```


---
### file

```caddy-d
file {
	root       <path>
	try_files  <files...>
	try_policy first_exist|smallest_size|largest_size|most_recent_modified
	split_path <delims...>
}
file <files...>

expression `file({
	'root': '<path>',
	'try_files': ['<files...>'],
	'try_policy': 'first_exist|smallest_size|largest_size|most_recent_modified',
	'split_path': ['<delims...>']
})`
expression file('<files...>')
```

By files.

- `root` defines the directory in which to look for files. Default is the current working directory, or the `root` [variable](/docs/modules/http.handlers.vars) (`{http.vars.root}`) if set (can be set via the [`root` directive](/docs/caddyfile/directives/root)).

- `try_files` checks files in its list that match the try_policy.

  To match directories, append a trailing forward slash `/` to the path. All file paths are relative to the site [root](/docs/caddyfile/directives/root), and [glob patterns](https://pkg.go.dev/path/filepath#Match) will be expanded.

  If the `try_policy` is `first_exist` (the default), then the last item in the list may be a number prefixed by `=` (e.g. `=404`), which as a fallback, will emit an error with that code; the error can be caught and handled with [`handle_errors`](/docs/caddyfile/directives/handle_errors).



- `try_policy` specifies how to choose a file. Default is `first_exist`.

	- `first_exist` checks for file existence. The first file that exists is selected.

	- `smallest_size` chooses the file with the smallest size.

	- `largest_size` chooses the file with the largest size.

	- `most_recent_modified` chooses the file that was most recently modified.

- `split_path` will cause the path to be split at the first delimiter in the list that is found in each filepath to try. For each split value, the left-hand side of the split including the delimiter itself will be the filepath that is tried. For example, `/remote.php/dav/` using a delimiter of `.php` would try the file `/remote.php`. Each delimiter must appear at the end of a URI path component in order to be used as a split delimiter. This is a niche setting and is mostly used when serving PHP sites.

Because `try_files` with a policy of `first_exist` is so common, there is a one-line shortcut for that:

```caddy-d
file <files...>
```

An empty `file` matcher (one with no files listed after it) will see if the requested file&mdash;verbatim from the URI, relative to the [site root](/docs/caddyfile/directives/root)&mdash;exists. This is effectively the same as `file {path}`.


<aside class="tip">

Since rewriting based on the existence of a file on disk is so common, there is also a [`try_files` directive](/docs/caddyfile/directives/try_files) which is a shortcut of the `file` matcher and a [`rewrite` handler](/docs/caddyfile/directives/rewrite).

</aside>


Upon matching, four new placeholders will be made available:

- `{file_match.relative}` The root-relative path of the file. This is often useful when rewriting requests.
- `{file_match.absolute}` The absolute path of the matched file, including the root.
- `{file_match.type}` The type of file, `file` or `directory`.
- `{file_match.remainder}` The portion remaining after splitting the file path (if `split_path` is configured)


#### Examples:

Match requests where the path is a file that exists:

```caddy-d
file
```

Match requests where the path followed by `.html` is a file that exists, or if not, where the path is a file that exists:

```caddy-d
file {
	try_files {path}.html {path} 
}
```

Same as above, except using the one-line shortcut, and falling back to emitting a 404 error if a file is not found:

```caddy-d
file {path}.html {path} =404
```



---
### header

```caddy-d
header <field> [<value>]

expression header({'<field>': '<value>'})
```

By request header fields.

- `<field>` is the name of the HTTP header field to check.
	- If prefixed with `!`, the field must not exist to match (omit value arg).
- `<value>` is the value the field must have to match.
	- If prefixed with `*`, it performs a fast suffix match.
	- If suffixed with `*`, it performs a fast prefix match.
	- If enclosed by `*`, it performs a fast substring match.
	- Otherwise, it is a fast exact match.

Different header fields within the same set are AND-ed. Multiple values per field are OR'ed.

Note that header fields may be repeated and have different values. Backend applications MUST consider that header field values are arrays, not singular values, and Caddy does not interpret meaning in such quandaries.

#### Example:

Match requests with the `Connection` header containing `Upgrade`:

```caddy-d
header Connection *Upgrade*
```

Match requests with the `Foo` header containing `bar` OR `baz`:
```caddy-d
@foo {
	header Foo bar
	header Foo baz
}
```

Match requests that do not have the `Foo` header field at all:
```caddy-d
@not_foo header !Foo
```



---
### header_regexp

```caddy-d
header_regexp [<name>] <field> <regexp>

expression header_regexp('<name>', '<field>', '<regexp>')
expression header_regexp('<field>', '<regexp>')
```

Like [`header`](#header), but supports regular expressions. Capture groups can be accessed via [placeholder](/docs/caddyfile/concepts#placeholders) like `{re.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

The regular expression language used is RE2, included in Go. See the [RE2 syntax reference](https://github.com/google/re2/wiki/Syntax) and the [Go regexp syntax overview](https://pkg.go.dev/regexp/syntax).

Only one regular expression is supported per header field. Multiple different fields will be AND'ed.

#### Example:

Match requests where the Cookie header contains `login_` followed by a hex string, with a capture group that can be accessed with `{re.login.1}`.

```caddy-d
header_regexp login Cookie login_([a-f0-9]+)
```



---
### host

```caddy-d
host <hosts...>

expression host('<hosts...>')
```

Matches request by the `Host` header field of the request. It is not common to use this in the Caddyfile, since most site blocks already indicate hosts in the address of the site. This matcher is mostly used in site blocks that don't define specific hostnames (like wildcard subdomains), but where hostname-specific logic is required.

Multiple `host` matchers will be OR'ed together.

#### Example:

```caddy-d
host sub.example.com
```



---
### method

```caddy-d
method <verbs...>

expression method('<verbs...>')
```

By the method (verb) of the HTTP request. Verbs should be uppercase, like `POST`. Can match one or many methods.

Multiple `method` matchers will be OR'ed together.

#### Examples:

Match requests with the `GET` method:

```caddy-d
method GET
```

Match requests with the `PUT` or `DELETE` methods:

```caddy-d
method PUT DELETE
```



---
### not

```caddy-d
not <any other matcher>
```

or, to negate multiple matchers which get AND'ed, open a block:

```caddy-d
not {
	<any other matchers...>
}
```

The results of the enclosed matchers will be negated.

#### Examples:

Match requests with paths that do NOT begin with `/css/` OR `/js/`.

```caddy-d
not path /css/* /js/*
```

Match requests WITH NEITHER:
- an `/api/` path prefix, NOR
- the `POST` request method

i.e. must have none of these to match:

```caddy-d
not path /api/*
not method POST
```

Match requests WITHOUT BOTH:
- an `/api/` path prefix, AND
- the `POST` request method

i.e. must have neither or either of these to match:

```caddy-d
not {
	path /api/*
	method POST
}
```



---
### path

```caddy-d
path <paths...>

expression path('<paths...>')
```

By request path (the path component of the request URI). Path matches are exact but case-insensitive. Wildcards `*` may be used:

- At the end only, for a prefix match (`/prefix/*`)
- At the beginning only, for a suffix match (`*.suffix`)
- On both sides only, for a substring match (`*/contains/*`)
- In the middle only, for a globular match (`/accounts/*/info`)

Slashes are significant. For example, `/foo*` will match `/foo`, `/foobar`, `/foo/`, and `/foo/bar`, but `/foo/*` will _not_ match `/foo` or `/foobar`.

Request paths are cleaned to resolve directory traversal dots before matching. Additionally, multiple slashes are merged unless the match pattern has multiple slashes. In other words, `/foo` will match `/foo` and `//foo`, but `//foo` will only match `//foo`.

Because there are multiple escaped forms of any given URI, the request path is normalized (URL-decoded, unescaped) except for those escape sequences at positions where escape sequences are also present in the match pattern. For example, `/foo/bar` matches both `/foo/bar` and `/foo%2Fbar`, but `/foo%2Fbar` will match only `/foo%2Fbar`, because the escape sequence is explicitly given in the configuration.

The special wildcard escape `%*` can also be used instead of `*` to leave its matching span escaped. For example, `/bands/*/*` will not match `/bands/AC%2FDC/T.N.T` because the path will be compared in normalized space where it looks like `/bands/AC/DC/T.N.T`, which does not match the pattern; however, `/bands/%*/*` will match `/bands/AC%2FDC/T.N.T` because the span represented by `%*` will be compared without decoding escape sequences.

Multiple paths will be OR'ed together.



---
### path_regexp

```caddy-d
path_regexp [<name>] <regexp>

expression path_regexp('<name>', '<regexp>')
expression path_regexp('<regexp>')
```

Like [`path`](#path), but supports regular expressions. Write the pattern on the URI-decoded/unescaped form of the path.

The regular expression language used is RE2, included in Go. See the [RE2 syntax reference](https://github.com/google/re2/wiki/Syntax) and the [Go regexp syntax overview](https://pkg.go.dev/regexp/syntax).

Capture groups can be accessed via [placeholder](/docs/caddyfile/concepts#placeholders) like `{re.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

There can only be one `path_regexp` pattern per named matcher.

#### Example:

Match requests where the path ends a 6 character hex string followed by `.css` or `.js` as the file extension, with capture groups that can be accessed with `{re.static.1}` and `{re.static.2}` for each part enclosed in `( )`, respectively:

```caddy-d
path_regexp static \.([a-f0-9]{6})\.(css|js)$
```



---
### protocol

```caddy-d
protocol http|https|grpc|http/<version>[+]

expression protocol('http|https|grpc')
```

By request protocol. A broad protocol name such as `http`, `https`, or `grpc` can be used; or specific or minimum HTTP versions such as `http/1.1` or `http/2+`.

There can only be one `protocol` matcher per named matcher.



---
### query

```caddy-d
query <key>=<val>...

expression query({'<key>': '<val>'})
expression query({'<key>': ['<vals...>']})
```

By query string parameters. Should be a sequence of `key=value` pairs. Keys are matched exactly (case-sensitively) but also support `*` to match any value. Values can use placeholders.

There can be multiple `query` matchers per named matcher, and pairs with the same keys will be OR'ed together.

Illegal query strings (bad syntax, unescaped semicolons, etc.) will fail to parse and thus will not match.

**NOTE:** Query string parameters are arrays, not singular values. This is because repeated keys are valid in query strings, and each one may have a different value. This matcher will match for a key if any one of its configured values is assigned in the query string. Backend applications using query strings MUST take into consideration that query string values are arrays and can have multiple values.
#### Example:

Match requests with a `sort` query parameter with the value `asc`:

```caddy-d
query sort=asc
```



---
### remote_ip

```caddy-d
remote_ip [forwarded] <ranges...>

expression remote_ip('<ranges...>')
expression remote_ip('forwarded', '<ranges...>')
```

By remote IP address (i.e. the IP address of the immediate peer). Accepts exact IPs or CIDR ranges. IPv6 zones are supported.

As a shortcut, `private_ranges` can be used to match all private IPv4 and IPv6 ranges. It's the same as specifying all of these ranges: `192.168.0.0/16 172.16.0.0/12 10.0.0.0/8 127.0.0.1/8 fd00::/8 ::1`

⚠️ The `forwarded` option is deprecated, and will be removed in a future version. Its implementation is insecure. Use the [`client_ip`](#client-ip) matcher instead, which allows for securely matching the real client IP if parsed from an HTTP header. If enabled, then the first IP in the `X-Forwarded-For` request header, if present, will be preferred as the reference IP, rather than the immediate peer's IP, which is the default.

There can be multiple `remote_ip` matchers per named matcher, and their ranges will be merged and OR'ed together.

#### Example:

Match requests from private IPv4 addresses:

```caddy-d
remote_ip 192.168.0.0/16 172.16.0.0/12 10.0.0.0/8 127.0.0.1/8
```

This matcher is commonly paired with the [`not`](#not) matcher to invert the match. For example, to abort all connections from _public_ IPv4 and IPv6 addresses (which is the inverse of all private ranges):

```caddy-d
@denied not remote_ip private_ranges
abort @denied
```



---
### vars

```caddy-d
vars <variable> <values...>
```

By the value of a variable in the request context, or the value of a placeholder. Multiple values may be specified to match any of those possible values (OR'ed).

The **&lt;variable&gt;** argument may be either a variable name or a placeholder in curly braces `{ }`. (Placeholders are not expanded in the first parameter.)

This matcher is most useful when paired with the [`map` directive](/docs/caddyfile/directives/map) which sets outputs, or with plugins which set some information in the request context.

#### Example:

Match an output of the [`map` directive](/docs/caddyfile/directives/map) named `magic_number` for the values `3` or `5`:

```caddy-d
vars {magic_number} 3 5
```



---
### vars_regexp

```caddy-d
vars_regexp [<name>] <variable> <regexp>
```

Like [`vars`](#vars), but supports regular expressions. Capture groups can be accessed via [placeholder](/docs/caddyfile/concepts#placeholders) like `{re.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

The regular expression language used is RE2, included in Go. See the [RE2 syntax reference](https://github.com/google/re2/wiki/Syntax) and the [Go regexp syntax overview](https://pkg.go.dev/regexp/syntax).

There can only be one `vars_regexp` matcher per named matcher.

#### Example:

Match an output of the [`map` directive](/docs/caddyfile/directives/map) named `magic_number` for a value starting with `4`, capturing the value in a capture group:

```caddy-d
vars_regexp magic {magic_number} ^(4.*)
```
