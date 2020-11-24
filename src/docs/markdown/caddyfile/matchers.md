---
title: Request matchers (Caddyfile)
---

# Request Matchers

**Request matchers** can be used to filter (or classify) requests by specific criteria.

### Menu

- [Syntax](#syntax)
	- [Examples](#examples)
	- [Wildcard matchers](#wildcard-matchers)
	- [Path matchers](#path-matchers)
	- [Named matchers](#named-matchers)
- [Standard matchers](#standard-matchers)
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

And this is the same:

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

Otherwise, this matcher is not often used. It is convenient to omit it when possible; just a matter of preference.


### Path matchers

Because matching by path is so common, a single path matcher can be inlined, like so:

```caddy-d
redir /old.html /new.html
```

Path matcher tokens must start with a forward slash `/`.

**[Path matching](/docs/caddyfile/matchers#path) is an exact match by default;** you must append a `*` for a fast prefix match. Note that `/foo*` will match `/foo` and `/foo/` as well as `/foobar`; you might actually want `/foo/*` instead.


### Named matchers

All matchers that are not path or wildcard matchers must be named matchers. This is a matcher that is defined outside of any particular directive, and can be reused.

Defining a matcher with a unique name gives you more flexibility, allowing you to combine [any available matchers](#standard-matchers) into a set:

```caddy-d
@name {
	...
}
```

or, if there is only one matcher in the set:

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

Like directives, named matcher definitions must go inside the site blocks that use them.

A named matcher definition constitutes a _matcher set_. Matchers in a set are AND'ed together; i.e. all must match. For example, if you have both a `header` and `path` matcher in the set, both must match.

Multiple matchers of the same type (e.g. multiple `path` matchers in the same set) may be combined using boolean algebra (AND/OR), as described in their respective sections below.





## Standard matchers

Full matcher documentation can be found [in each respective matcher module's docs](/docs/json/apps/http/servers/routes/match/).



### expression

⚠️ _This module is still experimental and, as such, may experience breaking changes._

```caddy-d
expression <cel...>
```

By any [CEL (Common Expression Language)](https://github.com/google/cel-spec) expression that returns `true` or `false`.

As a special case, Caddy [placeholders](/docs/conventions#placeholders) (or [Caddyfile shorthands](/docs/caddyfile/concepts#placeholders)) may be used in these CEL expressions, as they are preprocessed and converted to regular CEL function calls before being interpreted by the CEL environment.

#### Examples:

Match requests whose methods start with `P`, e.g. `PUT` or `POST`.

```caddy-d
expression {method}.startsWith("P")
```

Match requests where handler returned error status code `404`, would be used in conjunction with the [`handle_errors` directive](/docs/caddyfile/directives/handle_errors).

```caddy-d
expression {http.error.status_code} == 404
```


---
### file

```caddy-d
file {
	root       <paths>
	try_files  <files...>
	try_policy first_exist|smallest_size|largest_size|most_recent_modified
	split_path <delims...>
}
```

By files.

- `root` defines the directory in which to look for files. Default is the current working directory, or the `root` [variable](/docs/modules/http.handlers.vars) (`{http.vars.root}`) if set (can be set via the [`root` directive](/docs/caddyfile/directives/root)).
- `try_files` checks files in its list that match the try_policy.
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

An empty `file` matcher (one with no files listed after it) will see if the requested file&mdash;verbatim from the URI, relative to the [site root](/docs/caddyfile/directives/root)&mdash;exists.

Since rewriting based on the existence of a file on disk is so common, there is also a [`try_files` directive](/docs/caddyfile/directives/try_files) which is a shortcut of the `file` matcher and a [`rewrite` handler](/docs/caddyfile/directives/rewrite).

Upon matching, two new placeholders will be made available:

- `{http.matchers.file.relative}` The root-relative path of the file. This is often useful when rewriting requests.
- `{http.matchers.file.absolute}` The absolute path of the matched file.

#### Examples:

Match requests where the path is a file that exists.

```caddy-d
file
```

Match requests where the path followed by `.html` is a file that exists, or if not, where the path is a file that exists.

```caddy-d
file {
	try_files {path}.html {path} 
}
```


---
### header

```caddy-d
header <field> <value>
```

By request header fields.

- `<field>` is the name of the HTTP header field to check.
- `<value>` is the value the field must have to match.
	- If prefixed with `*`, it performs a fast suffix match.
	- If suffixed with `*`, it performs a fast prefix match.
	- If enclosed by `*`, it performs a fast substring match.
	- Otherwise, it is a fast exact match.

Different header fields within the same set are AND-ed. Multiple values per field are OR-ed.

#### Example:

Match requests with the `Connection` header containing `Upgrade`.

```caddy-d
header Connection *Upgrade*
```

Match requests with the `Foo` header containing `bar` OR `baz`.
```caddy-d
@foo {
	header Foo bar
	header Foo baz
}
```


---
### header_regexp

```caddy-d
header_regexp [<name>] <field> <regexp>
```

Like `header`, but supports regular expressions. Capture groups can be accessed via placeholder like `{http.regexp.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

Only one regular expression is supported per header field. Multiple different fields will be AND-ed.

#### Example:

Match requests where the Cookie header contains `login_` followed by a hex string, with a capture group that can be accessed with `{http.regexp.login.1}`.

```caddy-d
header_regexp login Cookie login_([a-f0-9]+)
```


---
### host

```caddy-d
host <hosts...>
```

Matches request by the `Host` header field of the request. It is not common to use this in the Caddyfile, since most site blocks already indicate hosts in the address of the site. This matcher is mostly used in site blocks that don't define specific hostnames.

Multiple `host` matchers will be OR'ed together.

#### Example:

```caddy-d
host sub.example.com
```


---
### method

```caddy-d
method <verbs...>
```

By the method (verb) of the HTTP request. Verbs should be uppercase, like `POST`. Can match one or many methods.

Multiple `method` matchers will be OR'ed together.

#### Examples:

Match requests with the `GET` method.

```caddy-d
method GET
```

Match requests with the `PUT` or `DELETE` methods.

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
```

By request path, meaning the path component of the request's URI. Path matches are exact, but wildcards `*` may be used:

- At the end, for a prefix match (`/prefix/*`)
- At the beginning, for a suffix match (`*.suffix`)
- On both sides, for a substring match (`*/contains/*`)
- In the middle, for a globular match (`/accounts/*/info`)

Multiple `path` matchers will be OR'ed together.


---
### path_regexp

```caddy-d
path_regexp [<name>] <regexp>
```

Like `path`, but supports regular expressions. Capture groups can be accessed via placeholder like `{http.regexp.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression. Capture group `0` is the full regexp match, `1` is the first capture group, `2` is the second capture group, and so on.

There can only be one `path_regexp` matcher per named matcher.

#### Example:

Match requests where the path ends a 6 character hex string followed by `.css` or `.js` as the file extension, with capture groups that can be accessed with `{http.regexp.static.1}` and `{http.regexp.static.2}` for each part enclosed in `( )`, respectively.

```caddy-d
path_regexp static \.([a-f0-9]{6})\.(css|js)$
```


---
### protocol

```caddy-d
protocol http|https|grpc
```

By request protocol.

There can only be one `protocol` matcher per named matcher.


---
### query

```caddy-d
query <key>=<val>...
```

By query string parameters. Should be a sequence of `key=value` pairs. Keys are matched exactly, case-sensitively. Values can contain placeholders. Values are matched exactly, but also support `*` to match any value.

There can be multiple `query` matchers per named matcher, and pairs with the same keys will be OR'ed together.

#### Example:

Match requests with a `sort` query parameter with the value `asc`

```caddy-d
query sort=asc
```


---
### remote_ip

```caddy-d
remote_ip <ranges...>
```

By remote (client) IP address. If `X-Forwarded-For` is passed in request headers, this will be used for remote IP address. Accepts exact IPs or CIDR ranges.

Multiple `remote_ip` matchers will be OR'ed together.

#### Example:

Match requests from private IPv4 addresses.

```caddy-d
remote_ip 192.168.0.0/16 172.16.0.0/12 10.0.0.0/8
```
