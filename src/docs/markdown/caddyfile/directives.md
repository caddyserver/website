---
title: Caddyfile Directives
---

<style>
#directive-table table {
	margin: 0 auto;
	overflow: hidden;
}

#directive-table tr:hover {
	background: rgba(109, 226, 255, 0.11);
}

#directive-table tr td:first-child {
	position: relative;
}

#directive-table a:before {
	content: '';
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	display: block;
	width: 100vw;
}
</style>

# Caddyfile Directives

Directives are functional keywords that appear within site [blocks](/docs/caddyfile/concepts#blocks). Sometimes, they may open blocks of their own which can contain _subdirectives_, but directives **cannot** be used within other directives unless noted. For example, you can't use `basic_auth` inside a `file_server` block, because `file_server` does not know how to do authentication. However, you _may_ use some directives within special directive blocks like `handle` and `route` because they are specifically designed to group HTTP handler directives.

- [Syntax](#syntax)
- [Directive Order](#directive-order)
- [Sorting Algorithm](#sorting-algorithm)

The following directives come standard with Caddy, and can be used in the HTTP Caddyfile:

<div id="directive-table">

Directive | Description
----------|------------
**[abort](/docs/caddyfile/directives/abort)** | Aborts the HTTP request
**[acme_server](/docs/caddyfile/directives/acme_server)** | An embedded ACME server
**[basic_auth](/docs/caddyfile/directives/basic_auth)** | Enforces HTTP Basic Authentication
**[bind](/docs/caddyfile/directives/bind)** | Customize the server's socket address
**[encode](/docs/caddyfile/directives/encode)** | Encodes (usually compresses) responses
**[error](/docs/caddyfile/directives/error)** | Trigger an error
**[file_server](/docs/caddyfile/directives/file_server)** | Serve files from disk
**[forward_auth](/docs/caddyfile/directives/forward_auth)** | Delegate authentication to an external service
**[fs](/docs/caddyfile/directives/fs)** | Set the file system to use for file I/O
**[handle](/docs/caddyfile/directives/handle)** | A mutually-exclusive group of directives
**[handle_errors](/docs/caddyfile/directives/handle_errors)** | Defines routes for handling errors
**[handle_path](/docs/caddyfile/directives/handle_path)** | Like handle, but strips path prefix
**[header](/docs/caddyfile/directives/header)** | Sets or removes response headers
**[import](/docs/caddyfile/directives/import)** | Include snippets or files
**[intercept](/docs/caddyfile/directives/intercept)** | Intercept responses written by other handlers
**[invoke](/docs/caddyfile/directives/invoke)** | Invoke a named route
**[log](/docs/caddyfile/directives/log)** | Enables access/request logging
**[log_append](/docs/caddyfile/directives/log_append)** | Append a field to the access log
**[log_skip](/docs/caddyfile/directives/log_skip)** | Skip access logging for matched requests
**[log_name](/docs/caddyfile/directives/log_name)** | Override the logger name(s) to write to
**[map](/docs/caddyfile/directives/map)** | Maps an input value to one or more outputs
**[method](/docs/caddyfile/directives/method)** | Change the HTTP method internally
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
**[timeouts](/docs/caddyfile/directives/timeouts)** | Set idle read and write timeouts
**[tls](/docs/caddyfile/directives/tls)** | Customize TLS settings
**[tracing](/docs/caddyfile/directives/tracing)** | Integration with OpenTelemetry tracing
**[try_files](/docs/caddyfile/directives/try_files)** | Rewrite that depends on file existence
**[uri](/docs/caddyfile/directives/uri)** | Manipulate the URI
**[vars](/docs/caddyfile/directives/vars)** | Set arbitrary variables

</div>

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

Subdirectives are typically optional unless documented otherwise, even though they don't appear in `[brackets]`.


### Matchers

Most—but not all—directives accept [matcher tokens](/docs/caddyfile/matchers#syntax), which let you filter requests. Matcher tokens are usually optional. Directives support matchers if you see this in a directive's syntax:

```caddy-d
[<matcher>]
```

Because matcher tokens all work the same, the various possibilities for the matcher token will not be described on every page, to reduce duplication. Instead, refer to the [matcher documentation](/docs/caddyfile/matchers) for a detailed explanation of the syntax.


## Directive order

Many directives manipulate the HTTP handler chain. The order in which those directives are evaluated matters, so a default ordering is hard-coded into Caddy.

You can override/customize this ordering by using the [`order` global option](/docs/caddyfile/options#order) or the [`route` directive](/docs/caddyfile/directives/route).

```caddy-d
tracing

map
vars
fs
root
log_append
log_skip
log_name

header
copy_response_headers # only in reverse_proxy's handle_response block
request_body
timeouts

redir

# incoming request manipulation
method
rewrite
uri
try_files

# middleware handlers; some wrap responses
basic_auth
forward_auth
request_header
encode
push
intercept
templates

# special routing & dispatching directives
invoke
handle
handle_path
route

# handlers that typically respond to requests
abort
error
copy_response # only in reverse_proxy's handle_response block
respond
metrics
reverse_proxy
php_fastcgi
file_server
acme_server
```



## Sorting algorithm

For ease of use, the Caddyfile adapter sorts directives according to the following rules:

- Differently named directives are sorted by their position in the [default order](#directive-order). The default order can be overridden with the [`order` global option](/docs/caddyfile/options). Directives from plugins _do not_ have an order, so the [`order`](/docs/caddyfile/options) global option or the [`route`](/docs/caddyfile/directives/route) directive should be used to set one.

- Same-named directives are sorted according to their [matchers](/docs/caddyfile/matchers#syntax).

  - A directive with a single [path matcher](/docs/caddyfile/matchers#path-matchers) value, such as `/foo*`, is sorted by specificity relative to other directives with a single path, from most specific to least specific. This also applies to a [named matcher](/docs/caddyfile/matchers#named-matchers) with a `path` matcher that has only one path.

    In general, this is performed by sorting by the length of the path, ignoring a trailing `*`. If the paths of the two matchers are otherwise the same, the matcher with no `*` is considered more specific and sorted higher. Paths of the same length are sorted alphabetically.

    For example:
    - `/foobar` is more specific than `/foo`
    - `/foo` is more specific than `/foo*`
    - `/foo/*` is more specific than `/foo*`

  - A directive with any other matcher, such as a named matcher or a path matcher with multiple values, keeps the order it appears in the Caddyfile. Directives with a single path are _not_ sorted past it, so they are only sorted among the other single-path directives next to them.

    For example, these directives are not reordered at all, because the `@api` named matcher separates them:

    ```caddy-d
    respond /a*  "1"
    respond @api "2"
    respond /a/b "3"
    respond /a   "4"
    ```

  - A directive with no matcher (i.e. matching all requests) is sorted last.

  If the sorted order is not what you need, use the [`route`](/docs/caddyfile/directives/route) directive to set the order explicitly, or mutually exclusive [`handle`](/docs/caddyfile/directives/handle) blocks.

- The [`vars`](/docs/caddyfile/directives/vars) directive has its ordering by matcher reversed, because it involves setting values which can overwrite each other, so the most specific matcher should be evaluated last.

- The contents of the [`route`](/docs/caddyfile/directives/route) directive ignores all the above rules, and preserves the order the directives appear within.
