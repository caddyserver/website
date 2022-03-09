---
title: method (Caddyfile directive)
---

# method

Rewrites the request to change the HTTP method.


## Syntax

```caddy-d
method [<matcher>] <method>
```

- **&lt;method&gt;** is the HTTP method to change the request to.


## Examples

Change the method for all requests under `/api` to `POST`:

```caddy-d
method /api* POST
```
