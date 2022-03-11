---
title: method (Caddyfile directive)
---

# method

Changes the HTTP method on the request.


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
