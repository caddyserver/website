---
title: Caddyfile Directives
---

# Caddyfile Directives

The following directives come standard with Caddy, and can be used in the HTTP Caddyfile:

Directive | Description
----------|------------
**[abort](/docs/caddyfile/directives/abort)** | Aborts the HTTP request
**[acme_server](/docs/caddyfile/directives/acme_server)** | An embedded ACME server
**[basicauth](/docs/caddyfile/directives/basicauth)** | Enforces HTTP Basic Authentication
**[bind](/docs/caddyfile/directives/bind)** | Customize the server's socket address
**[encode](/docs/caddyfile/directives/encode)** | Encodes (usually compresses) responses
**[error](/docs/caddyfile/directives/error)** | Trigger an error
**[file_server](/docs/caddyfile/directives/file_server)** | Serve files from disk
**[handle](/docs/caddyfile/directives/handle)** | A mutually-exclusive group of directives
**[handle_errors](/docs/caddyfile/directives/handle_errors)** | Defines routes for handling errors
**[handle_path](/docs/caddyfile/directives/handle_path)** | Like handle, but strips path prefix
**[header](/docs/caddyfile/directives/header)** | Sets or removes response headers
**[import](/docs/caddyfile/directives/import)** | Include snippets or files
**[log](/docs/caddyfile/directives/log)** | Enables access/request logging
**[map](/docs/caddyfile/directives/map)** | Maps an input value to one or more outputs
**[metrics](/docs/caddyfile/directives/metrics)** | Configures the Prometheus metrics exposition endpoint
**[php_fastcgi](/docs/caddyfile/directives/php_fastcgi)** | Serve PHP sites over FastCGI
**[push](/docs/caddyfile/directives/push)** | Push content to the client using HTTP/2 server push
**[redir](/docs/caddyfile/directives/redir)** | Issues an HTTP redirect to the client
**[request_body](/docs/caddyfile/directives/request_body)** | Manipulates request body
**[request_header](/docs/caddyfile/directives/request_header)** | Manipulates request headers
**[respond](/docs/caddyfile/directives/respond)** | Writes a hard-coded response to the client
**[reverse_proxy](/docs/caddyfile/directives/reverse_proxy)** | A powerful and extensible reverse proxy
**[rewrite](/docs/caddyfile/directives/rewrite)** | Rewrites the request internally
**[root](/docs/caddyfile/directives/root)** | Set the path to the site root
**[route](/docs/caddyfile/directives/route)** | A group of directives treated literally as single unit
**[templates](/docs/caddyfile/directives/templates)** | Execute templates on the response
**[tls](/docs/caddyfile/directives/tls)** | Customize TLS settings
**[try_files](/docs/caddyfile/directives/try_files)** | Rewrite that depends on file existence
**[uri](/docs/caddyfile/directives/uri)** | Manipulate the URI


## Syntax

The syntax of each directive will look something like this:

```caddy-d
directive [<matcher>] <args...> {
	subdirective [<args...>]
}
```

The `<carets>` indicate tokens to be substituted by actual values.

The`[brackets]` indicate optional parameters.

The ellipses `...` indicates a continuation, i.e. one or more parameters or lines.

Subdirectives are always optional unless documented otherwise, even though they don't appear in `[brackets]`.


### Matchers

Most---but not all---directives accept [matcher tokens](/docs/caddyfile/matchers#syntax), which let you filter requests. Matcher tokens are usually optional. If you see this in a directive's syntax:

```caddy-d
[<matcher>]
```

then the directive accepts a matcher token, letting you filter which requests the directive applies to.

Because matcher tokens all work the same, the various possibilities for the matcher token will not be described on every page, to reduce duplication. Instead, refer to the centralized [matcher documentation](/docs/caddyfile/matchers).


## Directive order

Many directives manipulate the HTTP handler chain. The order in which those directives are evaluated matters, so a default ordering is hard-coded into Caddy:

```caddy-d
map
root

header
request_body

redir
rewrite

uri
try_files

basicauth
request_header
encode
templates

handle
handle_path
route
push

respond
metrics
reverse_proxy
php_fastcgi
file_server
acme_server
abort
error
```

You can override/customize this ordering by using the [`order` global option](/docs/caddyfile/options) or the [`route` directive](/docs/caddyfile/directives/route).
