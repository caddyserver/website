---
title: Request matchers (Caddyfile)
---

# Request Matchers

Matchers are used to filter requests.

There are many dimensions across which requests can be matched! This page describes the various ways you can match (i.e. filter or select) requests.

**If you don't know what a matcher is or how to use it, first [visit the "Concepts" page to learn more](/docs/caddyfile/concepts#matchers)**.


## Syntax

The matchers documented below should be used within the definition of [named matchers](/docs/caddyfile/concepts#named-matcher), in other words, within:

```
@name {
	# here
}
```

A matcher definition constitutes a _matcher set_. Matchers in a set are AND'ed together; i.e. all must match. For example, if you have both a `header` and `path` matcher in the set, both must match.

For most matchers that accept multiple values, those values are OR'ed; i.e. one must match in order for the matcher to match.

## Standard matchers

Full matcher documentation can be found [in each respective matcher module's docs](/docs/json/apps/http/servers/routes/match/).

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


### file

```
file {
	root      <paths>
	try_files <files...>
	try_policy first_exist|smallest_size|largest_size|most_recent_modified
}
```

By files.

- `root` defines the directory in which to look for files. Default is the current working directory, or the `root` [variable](https://caddyserver.com/docs/json/apps/http/servers/errors/routes/handle/vars/) (`{http.vars.root}`) if set.
- `try_files` checks files in its list that match the try_policy.
- `try_policy` specifies how to choose a file. Default is `first_exist`.
	- `first_exist` checks for file existence. The first file that exists is selected.
	- `smallest_size` chooses the file with the smallest size.
	- `largest_size` chooses the file with the largest size.
	- `most_recent_modified` chooses the file that was most recently modified.


### header

```
header <field> <value>
```

By request header fields.

- `<field>` is the name of the HTTP header field to check.
- `<value>` is the value the field must have to match.
	- If prefixed with `*`, it performs a fast suffix match.
	- If suffixed with `*`, it performs a fast prefix match.
	- If enclosed by `*`, it performs a fast substring match.
	- Otherwise, it is a fast exact match.


### header_regexp

```
header_regexp [<name>] <field> <regexp>
```

Like `header`, but supports regular expressions. Capture groups can be accessed via placeholder like `{http.regexp.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression.


### host

```
host <hosts...>
```

Matches request by the `Host` header field of the request. It is not common to use this in the Caddyfile, since most site blocks already indicate hosts in the address of the site. This matcher is mostly used in site blocks that don't define specific hostnames.


### method

```
method <verbs...>
```

By the method (verb) of the HTTP request. Verbs should be uppercase, like `POST`.


### not

```
not {
	<any other matchers...>
}
```

Encloses other matchers and negates their result.


### path

```
path <paths...>
```

By request path, meaning the path component of the request's URI. Path matches are exact, but wildcards `*` may be used:

- At the end, for a prefix match (`/prefix/*`)
- At the beginning, for a suffix match (`*.suffix`)
- On both sides, for a substring match (`*/contains/*`)
- In the middle, for a globular match (`/accounts/*/info`)


### path_regexp

```
path_regexp [<name>] <regexp>
```

Like `path`, but supports regular expressions. Capture groups can be accessed via placeholder like `{http.regexp.name.capture_group}` where `name` is the name of the regular expression (optional, but recommended) and `capture_group` is either the name or number of the capture group in the expression.


### protocol

```
protocol http|https|grpc
```

By request protocol.


### query

```
query <key>=<val>...
```

By query string parameters. Should be a sequence of `key=value` pairs.


### remote_ip

```
remote_ip <ranges...>
```

By remote (client) IP address. Accepts exact IPs or CIDR ranges.
