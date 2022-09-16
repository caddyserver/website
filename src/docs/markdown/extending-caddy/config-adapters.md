---
title: "Writing Config Adapters"
---

# Writing Config Adapters

For various reasons, you may wish to configure Caddy using a format that is not [JSON](/docs/json/). Caddy has first-class support for this through [config adapters](/docs/config-adapters).

If one does not already exist for the language/syntax/format you prefer, you can write one!

## Template

Here's a template you can start with:

```go
package myadapter

import (
	"fmt"

	"github.com/caddyserver/caddy/v2/caddyconfig"
)

func init() {
	caddyconfig.RegisterAdapter("adapter_name", MyAdapter{})
}

// MyAdapter adapts ____ to Caddy JSON.
type MyAdapter struct{
}

// Adapt adapts the body to Caddy JSON.
func (a MyAdapter) Adapt(body []byte, options map[string]interface{}) ([]byte, []caddyconfig.Warning, error) {
	// TODO: parse body and convert it to JSON
	return nil, nil, fmt.Errorf("not implemented")
}
```

- See godoc for [`RegisterAdapter()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig?tab=doc#RegisterAdapter)
- See godoc for ['Adapter'](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig?tab=doc#Adapter) interface

The returned JSON should **not** be indented; it should always be compact. The caller can always prettify it if they want to.

Note that while config adapters are Caddy _plugins_, they are not Caddy _modules_ because they do not integrate into a part of the config (but they will show up in `list-modules` for convenience). Thus, they do not have `Provision()` or `Validate()` methods or follow the rest of the module lifecycle. They need only implement the `Adapter` interface and be registered as adapters.

When populating fields of the config that are `json.RawMessage` types (i.e. module fields), use the `JSON()` and `JSONModuleObject()` functions:

- [`caddyconfig.JSON()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig?tab=doc#JSON) is for marshaling module values without the module name embedded. (Often used for ModuleMap fields where the module name is the map key.)
- [`caddyconfig.JSONModuleObject()`](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig?tab=doc#JSONModuleObject) is for marshaling module values with the module name added to the object. (Used pretty much everywhere else.)


## Caddyfile Server Types

It is also possible to implement a custom Caddyfile format. The Caddyfile adapter is a single adapter implementation and its default "server type" is HTTP, but it supports alternate "server types" at registration. For example, the HTTP Caddyfile is registered like so:

```go
func init() {
	caddyconfig.RegisterAdapter("caddyfile",  caddyfile.Adapter{ServerType: ServerType{}})
}
```

You would implement the [`caddyfile.ServerType` interface](https://pkg.go.dev/github.com/caddyserver/caddy/v2/caddyconfig/caddyfile?tab=doc#ServerType) and register your own adapter accordingly.
