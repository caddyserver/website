---
title: "Placeholder Support"
---

# Placeholders

In Caddy, placeholders are processed by each individual plugin themselves. They are not parsed at config time, but instead preserved and processed at runtime.

This means that if you wish for your plugin to support placeholders, you must explicitly add support for them.

If you are not yet familiar with placeholders, start by reading [here](/docs/conventions#placeholders)!

## Placeholder Internals

Internally, placeholders are simply a string in format `{foo.bar}` used as valid configuration values, which is later parsed at runtime.

Placeholders-like strings which start with a dollar sign (`{$FOO}`), are evaulated at Caddyfile parse time, and do not need to be dealt with by your plugin. This is because these are not placeholders, but Caddyfile-specific [environmental variable substitution](/docs/caddyfile/concepts#environmental-variables), they just happen to share the `{}` syntax.

It is therefore important to understand that `{env.HOST}` is inherently different from something like `{$HOST}`

As an example, see the following caddyfile:
```caddyfile
:8080 {
  respond {$HOST} 200
}

:8081 {
  respond {env.HOST} 200
}
```

When you adapt this Caddyfile with `HOST=example caddy adapt` you will get
```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [
            ":8080"
          ],
          "routes": [
            {
              "handle": [
                {
                  "body": "example",
                  "handler": "static_response",
                  "status_code": 200
                }
              ]
            }
          ]
        },
        "srv1": {
          "listen": [
            ":8081"
          ],
          "routes": [
            {
              "handle": [
                {
                  "body": "{env.HOST}",
                  "handler": "static_response",
                  "status_code": 200
                }
              ]
            }
          ]
        }
      }
    }
  }
}
```

Importantly, look at the `"body"` field in both `srv0` and `srv1`.

Since `srv0` used `{$HOST}`, the special environmental variable replacement with `$`, the value became `example`, as it was processed during Caddyfile parse time.

Since `srv1` used `{env.HOST}`, a normal placeholder, it was parsed as its own raw string value, `{env.HOST}`

Some users may immediately notice that this means it is impossible to use the `{$ENV}` syntax in a JSON config. The solution to this is to process such placeholders at Provision time, which is covered below.


## How to use placeholders in your plugin

#### Parse the raw placeholder value in your unmarshaler

Placeholders are not evaluated at Caddyfile parse time, and should be preserved for later use. They are used as their raw string values.

In other words, parsing a placeholder is no different from parsing any other string.

```go
func (g *Gizmo) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next()
	if !d.Args(&g.Name) {
		// not enough args
		return d.ArgErr()
	}
}
```

#### Evaluate the placeholder during Match or Serve

In order to now correctly read our `g.Name` placeholder in a plugin matcher or middleware, we must extract the replacer from the context and use that replacer on our saved placeholder string.

This gives us a string with all valid replacements done, which we can then use in whichever way we want. In the example, we write those bytes to output

```go
func (g *Gizmo) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	repl := r.Context().Value(caddy.ReplacerCtxKey).(*caddy.Replacer)
	_, err := w.Write([]byte(repl.ReplaceAll(g.Name,"")))
	if err != nil {
		return err
	}
	return next.ServeHTTP(w, r)
}
```

#### Alternatively, resolve the placeholder during Provision

If you only use global placeholders, like `env`, then you may initialize a global replacer at provision time, and use it to replace such values. This also allows users of config file formats other than Caddyfile to use environmental variables.

```go
func (g *Gizmo) Provision(ctx caddy.Context) error {
	repl := caddy.NewReplacer()
	g.Name = repl.ReplaceAll(g.Name,"")
	return nil
}


func (g *Gizmo) ServeHTTP(w http.ResponseWriter, r *http.Request, next caddyhttp.Handler) error {
	// in this case, you don't need to replace at serve-time anymore
	_, err := w.Write([]byte(g.Name))
	if err != nil {
		return err
	}
	return next.ServeHTTP(w, r)
}
```
