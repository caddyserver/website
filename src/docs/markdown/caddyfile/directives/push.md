---
title: push (Caddyfile directive)
---

# push

Configures the server to pre-emptively send resources to the client using HTTP/2 server push.

Resources can be linked for server push by specifying the Link header(s) of the response. This directive will automatically push resources described by upstream Link headers in these formats:

- `<resource>; as=script`
- `<resource>; as=script,<resource>; as=style`
- `<resource>; nopush`
- `<resource>;<resource2>;...`

where `<resource>` begins with a forward slash `/` (i.e. is a URI path with the same host). Only same-host resources can be pushed. If a linked resource is external or if it has the `nopush` attribute, it will not be pushed.

By default, push requests will include some headers deemed safe to copy from the original request:

- Accept-Encoding
- Accept-Language
- Accept
- Cache-Control
- User-Agent

as it is assumed many requests would fail without these headers; these do not need to be configured manually.

Push requests are virtualized internally, so they are very lightweight.


## Syntax

```caddy-d
push [<matcher>] [<resource>] {
	[GET|HEAD] <resource>
	headers {
		[+]<field> [<value|regexp> [<replacement>]]
		-<field>
	}
}
```

- **&lt;resource&gt;** is the target URI path to push. If used within the block, may optionally be preceded by the method (GET or POST; GET is default).
- **&lt;headers&gt;** manipulates the headers of the push request using the same syntax as the [`header` directive](/docs/caddyfile/directives/header). Some headers are carried over by default and do not need to be explicitly configured (see above).



## Examples

Push any resources described by `Link` headers in the response:

```caddy-d
push
```

Same, but also push `/resources/style.css` for all requests:

```caddy-d
push * /resources/style.css
```

Push `/foo.jpg` only when `/foo.html` is requested by the client:

```caddy-d
push /foo.html /foo.jpg
```
