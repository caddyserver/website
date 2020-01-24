---
title: Caddyfile Directives
---

# Caddyfile Directives

The following directives come standard with Caddy, and can be used in the HTTP Caddyfile:

Directive | Description
----------|------------
**[basicauth](/docs/caddyfile/directives/basicauth)** | Enforces HTTP Basic Authentication
**[bind](/docs/caddyfile/directives/bind)** | Customize the server's socket address
**[encode](/docs/caddyfile/directives/encode)** | Encodes (usually compresses) responses
**[file_server](/docs/caddyfile/directives/file_server)** | Serve files from disk
**[handle](/docs/caddyfile/directives/handle)** | A mutually-exclusive group of directives
**[header](/docs/caddyfile/directives/header)** | Sets or removes response headers
**[php_fastcgi](/docs/caddyfile/directives/php_fastcgi)** | Serve PHP sites over FastCGI
**[redir](/docs/caddyfile/directives/redir)** | Issues an HTTP redirect to the client
**[request_header](/docs/caddyfile/directives/request_header)** | Manipulates request headers
**[respond](/docs/caddyfile/directives/respond)** | Writes a hard-coded response to the client
**[reverse_proxy](/docs/caddyfile/directives/reverse_proxy)** | A powerful and extensible reverse proxy
**[rewrite](/docs/caddyfile/directives/rewrite)** | Rewrites the request internally
**[root](/docs/caddyfile/directives/root)** | Set the path to the site root
**[route](/docs/caddyfile/directives/route)** | A group of directives treated literally as single unit
**[strip_prefix](/docs/caddyfile/directives/strip_prefix)** | Rewrite that strips path prefix
**[strip_suffix](/docs/caddyfile/directives/strip_suffix)** | Rewrite that strips path suffix
**[templates](/docs/caddyfile/directives/templates)** | Execute templates on the response
**[tls](/docs/caddyfile/directives/tls)** | Customize TLS settings
**[try_files](/docs/caddyfile/directives/try_files)** | Rewrite that depends on file existence
**[uri_replace](/docs/caddyfile/directives/uri_replace)** | Rewrite that replaces substrings in URI


## Syntax

The syntax of each directive will look something like this:

```
directive [<matcher>] <args...> {
	subdirective [<args...>]
}
```

The `<carets>` indicate tokens to be substituted by actual values.

The`[brackets]` indicate optional parameters.

The ellipses `...` indicates a continuation, i.e. one or more parameters or lines.

Subdirectives are always optional unless documented otherwise, even though they don't appear in `[brackets]`.


### Matchers

Most directives accept [matcher tokens](/docs/caddyfile/concepts#matchers), and they are usually optional. You will often see this in a directive's syntax description:

```
[<matcher>]
```

When you see this in the syntax of a directive, it means a matcher token. Because this is the same with most directives, it will not be described on every page; this reduces duplication. Instead, refer to the centralized [matcher documentation](/docs/caddyfile/concepts#matchers).


## Directive order

Many directives manipulate the HTTP handler chain. The order in which those directives are evaluated matters, so a default ordering is hard-coded into Caddy:

```
root

redir
rewrite

strip_prefix
strip_suffix
uri_replace
try_files

basicauth
headers
request_header
encode
templates

handle
route

respond
reverse_proxy
php_fastcgi
file_server
```

You can override or customize this ordering by using the [`order` global option](/docs/caddyfile/options) or the [`route` directive](/docs/caddyfile/directives/route).