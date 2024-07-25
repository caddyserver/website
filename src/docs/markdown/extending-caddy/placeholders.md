---
title: "Placeholder Support"
---

# Placeholder Parsing Rules

Support for placeholders which do not start with a dollar sign (e.g. `{env.HOST}`) must be handled by the individual plugin, and will not be handled by the Caddyfile parser.

If you wish to use placeholders in your Caddy plugin, you must accept such placeholders as valid configuration values, and parse them at runtime

Placeholders which do start with a dollar sign (`{$HOST}`), are evaulated at Caddyfile parse time, and do not need to be dealt with by your plugin

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

## Using Placeholders in your Plugin

#### Parsing Placeholders in your Unmarshaler

Placeholders should be parsed as their raw values when parsing caddyfiles, just like any other string value


```go
func (g *Gizmo) UnmarshalCaddyfile(d *caddyfile.Dispenser) error {
	d.Next()
	if !d.Args(&g.Name) {
		// not enough args
		return d.ArgErr()
	}
```


#### Resolving Placeholders at Match/Serve time

In order to correctly read our `g.Name` placeholder, in a plugin matcher or middleware, we must extract the replacer from the context, and use that replacer on our saved placeholder string.

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

#### Resolving Placeholers at Provision time

If you only use global placeholders, like `env`, then you may also use the replacer at provision time

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
