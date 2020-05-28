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
//     gizmo <name> [<option>]
//
func (g *Gizmo) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	for d.Next() {
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
	}
	return nil
}
```

It is a good idea to document the syntax in the godoc comment for the method. See the [godoc for the `caddyfile` package](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc) for more information about parsing the Caddyfile.

It is also important for an unmarshaler to accept multiple occurrences of its directive (rare, but can happen in some cases). Since the first token will typically be the module's name or directive (and can often be skipped by the unmarshaler), this usually means wrapping your parsing logic in a `for d.Next() { ... }` loop.

Make sure to check for missing or excess arguments.

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

The basic idea is that [the parsing function](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#UnmarshalFunc) you associate with your directive returns one or more [`ConfigValue`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile?tab=doc#ConfigValue) values. (Or, if using `RegisterHandlerDirective`, it simply returns the populated `caddyhttp.MiddlewareHandler` value directly.) Each config value is associated with a "class" which helps the HTTP Caddyfile adapter to know which part(s) of the final JSON config it can be used in. All the config values get dumped into a pile from which the adapter draws when constructing the final JSON config.

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


### Classes

This table describes each class with exported types that is recognized by the HTTP Caddyfile adapter:

Class name | Expected type | Description
---------- | ------------- | -----------
bind | `[]string` | Server listener bind addresses
tls.connection_policy | `*caddytls.ConnectionPolicy` | TLS connection policy
route | `caddyhttp.Route` | HTTP handler route
error_route | `*caddyhttp.Subroute` | HTTP error handling route
tls.cert_issuer | `certmagic.Issuer` | TLS certificate issuer
tls.cert_loader | `caddytls.CertificateLoader` | TLS certificate loader


## Server Types

Structurally, the Caddyfile is a simple format, so there can be different types of Caddyfile formats (sometimes called "server types") to suit different needs.

The default Caddyfile format is the HTTP Caddyfile, which you are probably familiar with. This format primarily configures the [`http` app](/docs/modules/http) while only potentially sprinkling some config in other parts of the Caddy config structure (e.g. the `tls` app to load and automate certificates).

To configure apps other than HTTP, you may want to implement your own config adate