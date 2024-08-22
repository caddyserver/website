---
title: "Placeholder Support"
---

# Placeholders

In Caddy, placeholders are processed by each individual plugin as needed; they do not automatically work everywhere.

This means that if you wish for your plugin to support placeholders, you must explicitly add support for them.

If you are not yet familiar with placeholders, start by reading [here](/docs/conventions#placeholders)!

## Placeholders Overview

Placeholders are a string in the format `{foo.bar}` used as dynamic configuration values, which is later evaluated at runtime.

Placeholders-like strings which start with a dollar sign (`{$FOO}`), are evaulated at Caddyfile parse time, and do not need to be dealt with by your plugin. This is because these are not placeholders, but Caddyfile-specific [environmental variable substitution](/docs/caddyfile/concepts#environment-variables), they just happen to share the `{}` syntax.

It is therefore important to understand that `{env.HOST}` is inherently different from something like `{$HOST}`.

As an example, see the following Caddyfile:
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


## Implementing placeholder support

You should not process placeholders when ummarshaling your Caddyfile. Instead, unmarshal the placeholders as strings in your configuration and evaluate them during either your module's execution (e.g. `ServeHTTP()` for HTTP handlers, `Match()` for matchers, etc.) or in the `Provision()` step, using a `caddy.Replacer`.


### Examples

In this example, we are using a newly constructed replacer to process placeholders. It has access to [global placeholders](/docs/conventions#placeholders) such as `{env.HOST}`, but NOT request placeholder such as `{http.request.uri}`

```go
func (g *Gizmo) Provision(ctx caddy.Context) error {
	repl := caddy.NewReplacer()
	g.Name = repl.ReplaceAll(g.Name,"")
	return nil
}
```

Here, we extract a replacer out of the `context.Context` inside the `*http.Request`. This replacer not only has access to global placeholders, but also request placeholders such as `{http.request.uri}`.

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
