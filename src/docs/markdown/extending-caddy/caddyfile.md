---
title: "Caddyfile Support"
---

# Caddyfile Support

Caddy modules are automatically added to the [native JSON config](/docs/json/) by virtue of their namespace when they are [registered](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#RegisterModule), making them both usable and documented. This makes Caddyfile support purely optional, but it is often requested by users who prefer the Caddyfile.

## Unmarshaler

To add Caddyfile support for your module, simply implement the [`caddyfile.Unmarshaler`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc#Unmarshaler) interface. You get to choose the Caddyfile syntax your module has by how you parse the tokens.

An unmarshaler's job is simply to set up your module's type, e.g. by populating its fields, using the [`caddyfile.Dispenser`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc#Dispenser) passed to it. For example, a module type named `Gizmo` might have this method:

```go
// UnmarshalCaddyfile implements caddyfile.Unmarshaler. Syntax:
//
// gizmo <name> [<option>]
//
func (g *Gizmo) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next() // consume directive name

	if !d.Args(&g.Name) {
		// not enough args
		return d.ArgErr()
	}
	if d.NextArg() {
		// optional arg
		g.Option = d.Val()
	}
	if d.NextArg() {
		// too many args
		return d.ArgErr()
	}

	return nil
}
```

It is a good idea to document the syntax in the godoc comment for the method. See the [godoc for the `caddyfile` package](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc) for more information about parsing the Caddyfile.

The directive name token can be consumed/skipped with a simple `d.Next()` call.

Make sure to check for missing and/or excess arguments with `d.NextArg()` or `d.RemainingArgs()`. Use `d.ArgErr()` for a simple "invalid case" message, or use `d.Errf("some message")` to craft a helpful error message with an explanation of the problem (and ideally, a suggested solution).

You should also add an [interface guard](/docs/extending-caddy#interface-guards) to ensure the interface is satisfied properly:

```go
var _ caddyfile.Unmarshaler = (*Gizmo)(nil)
```

### Blocks

To accept more configuration than can fit on a single line, you may wish to allow a block with subdirectives. This can be done using `d.NextBlock()` and iterating until you return to the original nesting level:

```go
for nesting := d.Nesting(); d.NextBlock(nesting); {
	switch d.Val() {
		case "sub_directive_1":
		// ...
		case "sub_directive_2":
		// ...
	}
}
```

As long as each iteration of the loop consumes the entire segment (line or block), then this is an elegant way to handle blocks.

## HTTP Directives

The HTTP Caddyfile is Caddy's default Caddyfile adapter syntax (or "server type"). It is extensible, meaning you can [register](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#RegisterDirective) your own "top-level" directives for your module:

```go
func init() {
	httpcaddyfile.RegisterDirective("gizmo", parseCaddyfile)
}
```

If your directive only returns a single HTTP handler (as is common), you may find [`RegisterHandlerDirective`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#RegisterHandlerDirective) easier:

```go
func init() {
	httpcaddyfile.RegisterHandlerDirective("gizmo", parseCaddyfileHandler)
}
```

The basic idea is that [the parsing function](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#UnmarshalFunc) you associate with your directive returns one or more [`ConfigValue`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#ConfigValue) values. (Or, if using `RegisterHandlerDirective`, it simply returns the populated `caddyhttp.MiddlewareHandler` value directly.) Each config value is associated with a ["class"](#classes) which helps the HTTP Caddyfile adapter to know which part(s) of the final JSON config it can be used in. All the config values get dumped into a pile from which the adapter draws when constructing the final JSON config.

This design allows your directive to return any config values for any recognized classes, which means it can influence any parts of the config that the HTTP Caddyfile adapter has a designated class for.

If you've already implemented the `UnmarshalCaddyfile()` method, then your parse function could be as simple as:

```go
// parseCaddyfileHandler unmarshals tokens from h into a new middleware handler value.
func parseCaddyfileHandler(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var g Gizmo
	err := g.UnmarshalCaddyfile(h.Dispenser)
	return g, err
}
```

See the [`httpcaddyfile` package godoc](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc) for more information about how to use the `httpcaddyfile.Helper` type.

### Handler order

All directives which return HTTP middleware/handler values need to be evaluated in the correct order. For example, a handler that sets the root directory of the site has to come before a handler that accesses the root directory, so that it will know what the directory path is.

The HTTP Caddyfile [has a hard-coded ordering for the standard directives](/docs/caddyfile/directives#directive-order). This ensures that users do not need to know the implementation details of the most common functions of their web server, and makes it easier for them to write correct configurations. A single, hard-coded list also prevents nondeterminism given the extensible nature of the Caddyfile.

**When you register a new handler directive, it must be added to that list before it can be used (outside of a `route` block).** This is done using one of three methods:

- (Recommended) The plugin author can call [`httpcaddyfile.RegisterDirectiveOrder`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile#RegisterDirectiveOrder) in `init()` after registering the directive, to insert the directive into the order relative to another [standard directive](/docs/caddyfile/directives#directive-order). Doing so, users can use the directive directly in their sites without extra setup. For example, to insert your directive `gizmo` to be evaluated after the `header` handler:

	```go
	httpcaddyfile.RegisterDirectiveOrder("gizmo", httpcaddyfile.After, "header")
	```

- Users may add the [`order` global option](/docs/caddyfile/options) to modify the standard order for their Caddyfile. For example: `order gizmo before respond` will insert a new directive `gizmo` to be evaluated before the `respond` handler. Then the directive can be used normally.

- Users can place the directive in a [`route` block](/docs/caddyfile/directives/route). Because directives in a route block are not reordered, the directives used in a route block do not need to appear in the list.

If you choose one of the latter two options, please document a recommendation for your users for where in the list is the right place for your directive to be ordered, so that they can use it properly.

### Classes

This table describes each class with exported types that is recognized by the HTTP Caddyfile adapter:

Class name | Expected type | Description
---------- | ------------- | -----------
bind | `[]string` | Server listener bind addresses
route | `caddyhttp.Route` | HTTP handler route
error_route | `*caddyhttp.Subroute` | HTTP error handling route
tls.connection_policy | `*caddytls.ConnectionPolicy` | TLS connection policy
tls.cert_issuer | `certmagic.Issuer` | TLS certificate issuer
tls.cert_loader | `caddytls.CertificateLoader` | TLS certificate loader

## Server Types

Structurally, the Caddyfile is a simple format, so there can be different types of Caddyfile formats (sometimes called "server types") to suit different needs.

The default Caddyfile format is the HTTP Caddyfile, which you are probably familiar with. This format primarily configures the [`http` app](/docs/modules/http) while only potentially sprinkling some config in other parts of the Caddy config structure (e.g. the `tls` app to load and automate certificates).

To configure apps other than HTTP, you may want to implement your own config adapter that uses [your own server type](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc#Adapter). The Caddyfile adapter will actually parse the input for you and give you the list of server blocks, and options, and it's up to your adapter to make sense of that structure and turn it into a JSON config.
