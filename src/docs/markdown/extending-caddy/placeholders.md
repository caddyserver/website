---
title: "Placeholder Support"
---

# Placeholders

In Caddy, placeholders are a feature of the individual plugins. They are not parsed at config time, but instead preserved, and replaced at runtime.

This means that if you wish for your plugin to support placeholders, you must explicitly add support for it.

If you are not yet familiar with placeholders, start by reading [here](/docs/conventions#placeholders)!

## Placeholder Parsing Rules & Gotchas

If you wish to use placeholders in your Caddy plugin, you must accept placeholders strings, in format `{foo}` as valid configuration values, and parse them at runtime

Placeholders-like strings which start with a dollar sign (`{$foo}`), are evaulated at Caddyfile parse time, and do not need to be dealt with by your plugin.

This is because these are not placeholders, but Caddyfile-specific [environmental variable substitution](/docs/caddyfile/concepts/#environmental-variables), they just happen to share the `{}` syntax.

It is therefore important to understand that `{env.HOST}` is inherently different from something like `{$HOST}`

As an example, see the following caddyfile:
```
:8080 {
  respond {$HOST} 200
}

:8081 {
  respond {env.HOST} 200
}
```

When you adapt this Caddyfile with `HOST=example caddy adapt` you will get
```
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

Since `srv0` used `{$ENV}`, the special environmental variable placeholder with `$`, as it is parsed during Caddyfile parse time.

Since `srv1` used `{env.HOST}`, a standard placeholder, it was parsed as a normal string value for "body" field of the respond directive's config.

This means that down the line, the handler plugins will receive both `example` and `{env.Host}` respectively in their configurations.

## Using Placeholders in your Plugin

#### How to parse Placeholders in your Unmarshaler

Placeholders should be parsed as their raw values when parsing caddyfiles, just like any other string value

```go
func (g *Gizmo) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next()
	if !d.Args(&g.Name) {
		// not enough args
		return d.ArgErr()
	}
}
```

#### How to resolve Placeholders during Serve or Match

In order to now correctly read our `g.Name` placeholder, in a plugin matcher or middleware, we must extract the replacer from the context, and use that replacer on our saved placeholder string.

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

#### How to resolve Placeholders at Provision time

If you only use global placeholders, like `env`, then you may initialize a global replacer at provision time, and use it to replace such values.

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
