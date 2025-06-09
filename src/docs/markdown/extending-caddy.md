---
title: "Extending Caddy"
---

# Extending Caddy

Caddy is easy to extend because of its modular architecture. Most kinds of Caddy extensions (or plugins) are known as _modules_ if they extend or plug into Caddy's configuration structure. To be clear, Caddy modules are distinct from [Go modules](https://github.com/golang/go/wiki/Modules) (but they are also Go modules).

**Prerequisites:**
- Basic understanding of [Caddy's architecture](/docs/architecture)
- Go language proficiency
- [`go` <img src="/old/resources/images/external-link.svg" class="external-link">](https://golang.org/doc/install)
- [`xcaddy` <img src="/old/resources/images/external-link.svg" class="external-link">](https://github.com/caddyserver/xcaddy)


## Quick Start

A Caddy module is any named type that registers itself as a Caddy module when its package is imported. Crucially, a module always implements the [`caddy.Module`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Module) interface, which provides its name and a constructor function.

In a new Go module, paste the following template into a Go file and customize your package name, type name, and Caddy module ID:

```go
package mymodule

import "github.com/caddyserver/caddy/v2"

func init() {
	caddy.RegisterModule(Gizmo{})
}

// Gizmo is an example; put your own type here.
type Gizmo struct {
}

// CaddyModule returns the Caddy module information.
func (Gizmo) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "foo.gizmo",
		New: func() caddy.Module { return new(Gizmo) },
	}
}
```

Then run this command from your project's directory, and you should see your module in the list:

<pre><code class="cmd bash">xcaddy list-modules
...
foo.gizmo
...</code></pre>

<aside class="tip">

The [`xcaddy` command](https://github.com/caddyserver/xcaddy) is an important part of every module developer's workflow. It compiles Caddy with your plugin, then runs it with the given arguments. It discards the temporary binary each time (similar to `go run`).

</aside>


Congratulations, your module registers with Caddy and can be used in [Caddy's config document](/docs/json/) in whatever places use modules in the same namespace.

Under the hood, `xcaddy` is simply making a new Go module that requires both Caddy and your plugin (with an appropriate `replace` to use your local development version), then adds an import to ensure it is compiled in:

```go
import _ "github.com/example/mymodule"
```


## Module Basics

Caddy modules:

1. Implement the `caddy.Module` interface to provide an ID and constructor
2. Have a unique name in the proper namespace
3. Usually satisfy some interface(s) that are meaningful to the host module for that namespace

**Host modules** (or _parent modules_) are modules which load/initialize other modules. They typically define namespaces for guest modules.

**Guest modules** (or _child modules_) are modules which get loaded or initialized. All modules are guest modules.


## Module IDs

Each Caddy module has a unique ID, consisting of a namespace and name:

- A complete ID looks like `foo.bar.module_name`
- The namespace would be `foo.bar`
- The name would be `module_name` which must be unique in its namespace

Module IDs must use `snake_case` convention.

### Namespaces

Namespaces are like classes, i.e. a namespace defines some functionality that is common among all modules within it. For example, we can expect that all modules within the `http.handlers` namespace are HTTP handlers. It follows that a host module may type-assert guest modules in that namespace from `interface{}` types into a more specific, useful type such as `caddyhttp.MiddlewareHandler`.

A guest module must be properly namespaced in order for it to be recognized by a host module because host modules will ask Caddy for modules within a certain namespace to provide the functionality desired by the host module. For example, if you were to write an HTTP handler module called `gizmo`, your module's name would be `http.handlers.gizmo`, because the `http` app will look for handlers in the `http.handlers` namespace.

Put another way, Caddy modules are expected to implement [certain interfaces](/docs/extending-caddy/namespaces) depending on their module namespace. With this convention, module developers can say intuitive things such as, "All modules in the `http.handlers` namespace are HTTP handlers." More technically, this usually means, "All modules in the `http.handlers` namespace implement the `caddyhttp.MiddlewareHandler` interface." Because that method set is known, the more specific type can be asserted and used.

**[View a table mapping all the standard Caddy namespaces to their Go types.](/docs/extending-caddy/namespaces)**

The `caddy` and `admin` namespaces are reserved and cannot be app names.

To write modules which plug into 3rd-party host modules, consult those modules for their namespace documentation.

### Names

The name within a namespace is significant and highly visible to users, but is not particularly important, as long as it is unique, concise, and makes sense for what it does.


## App Modules

Apps are modules with an empty namespace, and which conventionally become their own top-level namespace. App modules implement the [`caddy.App`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#App) interface.

These modules appear in the [`"apps"`](/docs/json/#apps) property of the top-level of Caddy's config:

```json
{
	"apps": {}
}
```

Example [apps](/docs/json/apps/) are `http` and `tls`. Theirs is the empty namespace.

Guest modules written for these apps should be in a namespace derived from the app name. For example, HTTP handlers use the `http.handlers` namespace and TLS certificate loaders use the `tls.certificates` namespace.

## Module Implementation

A module can be virtually any type, but structs are the most common because they can hold user configuration.


### Configuration

Most modules require some configuration. Caddy takes care of this automatically, as long as your type is compatible with JSON. Thus, if a module is a struct type, it will need struct tags on its fields, which should use `snake_casing` according to Caddy convention:

```go
type Gizmo struct {
	MyField string `json:"my_field,omitempty"`
	Number  int    `json:"number,omitempty"`
}
```

Using the `omitempty` option in the struct tag will omit the field from the JSON output if it is the zero value for its type. This is useful to keep the JSON config clean and concise when marshaled (e.g. adapting from Caddyfile to JSON).

When a module is initialized, it will already have its configuration filled out. It is also possible to perform additional [provisioning](#provisioning) and [validation](#validating) steps after a module is initialized.


### Module Lifecycle

A module's life begins when it is loaded by a host module. The following happens:

1. [`New()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#ModuleInfo.New) is called to get an instance of the module's value.
2. The module's configuration is unmarshaled into that instance.
3. If the module is a [`caddy.Provisioner`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Provisioner), the `Provision()` method is called.
4. If the module is a [`caddy.Validator`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Validator), the `Validate()` method is called.
5. At this point, the host module is given the loaded guest module as an `interface{}` value, so the host module will usually type-assert the guest module into a more useful type. Check the documentation for the host module to know what is required of a guest module in its namespace, e.g. what methods need to be implemented.
6. When a module is no longer needed, and if it is a [`caddy.CleanerUpper`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#CleanerUpper), the `Cleanup()` method is called.

Note that multiple loaded instances of your module may overlap at a given time! During config changes, new modules are started before the old ones are stopped. Be sure to use global state carefully. Use the [`caddy.UsagePool`](https://pkg.go.dev/github.com/caddyserver/caddy/v2#UsagePool) type to help manage global state across module loads. If your module listens on a socket, use `caddy.Listen*()` to get a socket that supports overlapping usage.

### Provisioning

A module's configuration will be unmarshaled into its value automatically (when loading the JSON config). This means, for example, that struct fields will be filled out for you.

However, if your module requires additional provisioning steps, you can implement the (optional) [`caddy.Provisioner`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Provisioner) interface:

```go
// Provision sets up the module.
func (g *Gizmo) Provision(ctx caddy.Context) error {
	// TODO: set up the module
	return nil
}
```

This is where you should set default values for fields that were not provided by the user (fields that are not their zero value). If a field is required, you may return an error if it is not set. For numeric fields where the zero value has meaning (e.g. some timeout duration), you may want to support `-1` to mean "off" rather than `0`, so you may set a default value if the user did not configure it.

This is also typically where host modules will load their guest/child modules.

A module may access other apps by calling `ctx.App()`, but modules must not have circular dependencies. In other words, a module loaded by the `http` app cannot depend on the `tls` app if a module loaded by the `tls` app depends on the `http` app. (Very similar to rules forbidding import cycles in Go.)

Additionally, you should avoid performing expensive operations in `Provision`, since provisioning is performed even if a config is only being validated. When in the provisioning phase, do not expect that the module will actually be used.

#### Logs

See [how logging works](/docs/logging) in Caddy. If your module needs logging, do not use `log.Print*()` from the Go standard library. In other words, **do not use Go's global logger**. Caddy uses high-performance, highly flexible, structured logging with [zap](https://github.com/uber-go/zap).

To emit logs, get a logger in your module's Provision method:

```go
func (g *Gizmo) Provision(ctx caddy.Context) error {
	g.logger = ctx.Logger() // g.logger is a *zap.Logger
}
```

Then you can emit structured, leveled logs using `g.logger`. See [zap's godoc](https://pkg.go.dev/go.uber.org/zap?tab=doc#Logger) for details.


### Validating

Modules which would like to validate their configuration may do so by satisfying the (optional) [`caddy.Validator`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Validator) interface:

```go
// Validate validates that the module has a usable config.
func (g Gizmo) Validate() error {
	// TODO: validate the module's setup
	return nil
}
```

Validate should be a read-only function. It is run after the `Provision()` method.


### Interface guards

Caddy module behavior is implicit because Go interfaces are satisfied implicitly. Simply adding the right methods to your module's type is all it takes to make or break your module's correctness. Thus, making a typo or getting the method signature wrong can lead to unexpected (lack of) behavior.

Fortunately, there is an easy, no-overhead, compile-time check you can add to your code to ensure you've added the right methods. These are called interface guards:

```go
var _ InterfaceName = (*YourType)(nil)
```

Replace `InterfaceName` with the interface you intend to satisfy, and `YourType` with the name of your module's type.

For example, an HTTP handler such as the static file server might satisfy multiple interfaces:

```go
// Interface guards
var (
	_ caddy.Provisioner           = (*FileServer)(nil)
	_ caddyhttp.MiddlewareHandler = (*FileServer)(nil)
)
```

This prevents the program from compiling if `*FileServer` does not satisfy those interfaces.

Without interface guards, confusing bugs can slip in. For example, if your module must provision itself before being used but your `Provision()` method has a mistake (e.g. misspelled or wrong signature), provisioning will never happen, leading to head-scratching. Interface guards are super easy and can prevent that. They usually go at the bottom of the file.


## Host Modules

A module becomes a host module when it loads its own guest modules. This is useful if a piece of the module's functionality can be implemented in different ways.

A host module is almost always a struct. Normally, supporting a guest module requires two struct fields: one to hold its raw JSON, and another to hold its decoded value:

```go
type Gizmo struct {
	GadgetRaw json.RawMessage `json:"gadget,omitempty" caddy:"namespace=foo.gizmo.gadgets inline_key=gadgeter"`

	Gadget Gadgeter `json:"-"`
}
```

The first field (`GadgetRaw` in this example) is where the raw, unprovisioned JSON form of the guest module can be found.

The second field (`Gadget`) is where the final, provisioned value will eventually be stored. Since the second field is not user-facing, we exclude it from JSON with a struct tag. (You could also unexport it if it is not needed by other packages, and then no struct tag is needed.)

### Caddy struct tags

The `caddy` struct tag on the raw module field helps Caddy to know the namespace and name (comprising the complete ID) of the module to load. It is also used for generating documentation.

The struct tag has a very simple format: `key1=val1 key2=val2 ...`

For module fields, the struct tag will look like:

```go
`caddy:"namespace=foo.bar inline_key=baz"`
```

The `namespace=` part is required. It defines the namespace in which to look for the module.

The `inline_key=` part is only used if the module's name will be found _inline_ with the module itself; this implies that the value is an object where one of the keys is the _inline key_, and its value is the name of the module. If omitted, then the field type must be a [`caddy.ModuleMap`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#ModuleMap) or `[]caddy.ModuleMap`, where the map key is the module name.


### Loading guest modules

To load a guest module, call [`ctx.LoadModule()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2?tab=doc#Context.LoadModule) during the provision phase:

```go
// Provision sets up g and loads its gadget.
func (g *Gizmo) Provision(ctx caddy.Context) error {
	if g.GadgetRaw != nil {
		val, err := ctx.LoadModule(g, "GadgetRaw")
		if err != nil {
			return fmt.Errorf("loading gadget module: %v", err)
		}
		g.Gadget = val.(Gadgeter)
	}
	return nil
}
```

Note that the `LoadModule()` call takes a pointer to the struct and the field name as a string. Weird, right? Why not just pass the struct field directly? It's because there are a few different ways to load modules depending on the layout of the config. This method signature allows Caddy to use reflection to figure out the best way to load the module and, most importantly, read its struct tags.

If a guest module must explicitly be set by the user, you should return an error if the Raw field is nil or empty before trying to load it.

Notice how the loaded module is type-asserted: `g.Gadget = val.(Gadgeter)` - this is because the returned `val` is a `interface{}` type which is not very useful. However, we expect that all modules in the declared namespace (`foo.gizmo.gadgets` from the struct tag in our example) implement the `Gadgeter` interface, so this type assertion is safe, and then we can use it!

If your host module defines a new namespace, be sure to document both that namespace and its Go type(s) for developers [like we have done here](/docs/extending-caddy/namespaces).

## Module Documentation

Register the module to make a new Caddy module show up in the module documentation and be available in http://caddyserver.com/download. The registration is available at http://caddyserver.com/account. Create a new account if you don't have one already and click on "Register package".

## Complete Example

Let's suppose we want to write an HTTP handler module. This will be a contrived middleware for demonstration purposes which prints the visitor's IP address to a stream on every HTTP request.

We also want it to be configurable via the Caddyfile, because most people prefer to use the Caddyfile in non-automated situations. We do this by registering a Caddyfile handler directive, which is a kind of directive that can add a handler to the HTTP route. We also implement the `caddyfile.Unmarshaler` interface. By adding these few lines of code, this module can be configured with the Caddyfile! For example: `visitor_ip stdout`.

Here is the code for such a module, with explanatory comments:

```go
package visitorip

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/caddyserver/caddy/v2"
	"github.com/caddyserver/caddy/v2/caddyconfig/caddyfile"
	"github.com/caddyserver/caddy/v2/caddyconfig/httpcaddyfile"
	"github.com/caddyserver/caddy/v2/modules/caddyhttp"
)

func init() {
	caddy.RegisterModule(Middleware{})
	httpcaddyfile.RegisterHandlerDirective("visitor_ip", parseCaddyfile)
}

// Middleware implements an HTTP handler that writes the
// visitor's IP address to a file or stream.
type Middleware struct {
	// The file or stream to write to. Can be "stdout"
	// or "stderr".
	Output string `json:"output,omitempty"`

	w io.Writer
}

// CaddyModule returns the Caddy module information.
func (Middleware) CaddyModule() caddy.ModuleInfo {
	return caddy.ModuleInfo{
		ID:  "http.handlers.visitor_ip",
		New: func() caddy.Module { return new(Middleware) },
	}
}

// Provision implements caddy.Provisioner.
func (m *Middleware) Provision(ctx caddy.Context) error {
	switch m.Output {
	case "stdout":
		m.w = os.Stdout
	case "stderr":
		m.w = os.Stderr
	default:
		return fmt.Errorf("an output stream is required")
	}
	return nil
}

// Validate implements caddy.Validator.
func (m *Middleware) Validate() error {
	if m.w == nil {
		return fmt.Errorf("no writer")
	}
	return nil
}

// ServeHTTP implements caddyhttp.MiddlewareHandler.
func (m Middleware) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	m.w.Write([]byte(r.RemoteAddr))
	return next.ServeHTTP(w, r)
}

// UnmarshalCaddyfile implements caddyfile.Unmarshaler.
func (m *Middleware) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next() // consume directive name

	// require an argument
	if !d.NextArg() {
		return d.ArgErr()
	}

	// store the argument
	m.Output = d.Val()
	return nil
}

// parseCaddyfile unmarshals tokens from h into a new Middleware.
func parseCaddyfile(h httpcaddyfile.Helper) (caddyhttp.MiddlewareHandler, error) {
	var m Middleware
	err := m.UnmarshalCaddyfile(h.Dispenser)
	return m, err
}

// Interface guards
var (
	_ caddy.Provisioner           = (*Middleware)(nil)
	_ caddy.Validator             = (*Middleware)(nil)
	_ caddyhttp.MiddlewareHandler = (*Middleware)(nil)
	_ caddyfile.Unmarshaler       = (*Middleware)(nil)
)
```
