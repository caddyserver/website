---
title: route (Caddyfile directive)
---

# route

Evaluates a group of directives literally and as a single unit.

Directives contained in a route block will not be [reordered internally](/docs/caddyfile/directives#directive-order). Only HTTP handler directives (directives which add handlers or middleware to the chain) can be used in a route block.

This directive is a special case in that its subdirectives are also regular directives.


## Syntax

```caddy-d
route [<matcher>] {
	<directives...>
}
```

- **<directives...>** is a list of directives or directive blocks, one per line, just like outside of a route block; except these directives will not be reordered. Only HTTP handler directives can be used.



## Utility

The `route` directive is helpful in certain advanced use cases or edge cases to take absolute control over parts of the HTTP handler chain.

Because the order of HTTP middleware evaluation is significant, the Caddyfile will normally reorder directives after parsing to make the Caddyfile easier to use; you don't have to worry about what order you type things.

While the [built-in order](/docs/caddyfile/directives#directive-order) is compatible with most sites, sometimes you need to take manual control over the order, either for the whole site or just a part of it. That's what the `route` directive is for.

To illustrate, consider the case of two terminating handlers: [`redir`](redir) and [`file_server`](file_server). Both write the response to the client and do not call the next handler in the chain, so only one of these will be executed for a certain request. So which comes first? Normally, `redir` is executed before `file_server` because usually you would want to issue a redirect only in specific cases and serve files in the general case.

However, there may be occasions where the first directive (`file_server`) has a more specific matcher than the second (`redir`). In other words, you want to redirect in the general case, and serve only a specific file.

So you might try a Caddyfile like this (but this will not work as expected!):

```caddy
example.com {
	file_server /specific.html
	redir https://anothersite.com{uri}
}
```

The problem is that after the [directives are sorted](/docs/caddyfile/directives#sorting-algorithm), `redir` comes before `file_server`.

But in this case the matcher for `redir` (an implicit [`*`](/docs/caddyfile/matchers#wildcard-matchers)) is a superset of the matcher for `file_server` (`*` is a superset of `/specific.html`).

Fortunately, the solution is easy: just wrap those two directives in a `route` block, to ensure that `file_server` is executed before `redir`:

```caddy
example.com {
	route {
		file_server /specific.html
		redir https://anothersite.com{uri}
	}
}
```

<aside class="tip">

Another way to do this is to make the two matchers mutually exclusive, but this can quickly become complex if there are more than one or two conditions. With the `route` directive, the mutual exclusivity of the two handlers is implicit because they are both terminal handlers.

</aside>

And now `file_server` will be chained in before `redir` because the order is taken literally.



## Similar directives

There are other directives that can wrap HTTP handler directives, but each has its use depending on the behavior you want to convey:

- [`handle`](handle) wraps other directives like `route` does, but with two distinctions: 1) handle blocks are mutually exclusive to each other, and 2) directives within a handle are [re-ordered](/docs/caddyfile/directives#directive-order) normally.

- [`handle_path`](handle_path) does the same as `handle`, but it strips a prefix from the request before running its handlers.

- [`handle_errors`](handle_errors) is like `handle`, but is only invoked when Caddy encounters an error during request handling.



## Examples

Proxy requests to `/api` as-is, and rewrite all other requests based on whether they match a file on disk, otherwise `/index.html`. Then that file is served.

Since [`try_files`](try_files) has a higher directive order than [`reverse_proxy`](reverse_proxy), then it would normally get sorted higher and run first; this would cause the API requests to all get rewritten to `/index.html` and fail to match `/api*`, so none of them would get proxied and instead would result in a `404` from [`file_server`](file_server). Wrapping it all in a `route` ensures that `reverse_proxy` always runs first, before the request is rewritten.

```caddy
example.com {
	root * /srv
	route {
		reverse_proxy /api* localhost:9000

		try_files {path} /index.html
		file_server
	}
}
```

<aside class="tip">

This is not the only solution to this problem. You could also use a pair of [`handle`](handle) blocks, with the first matching `/api*` to `reverse_proxy`, and the second acting as a fallback and serving the files. See [this example](/docs/caddyfile/patterns#single-page-apps-spas) of an SPA.

</aside>
