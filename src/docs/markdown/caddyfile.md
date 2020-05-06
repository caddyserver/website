---
title: The Caddyfile
---

# The Caddyfile

The **Caddyfile** is a convenient Caddy configuration format for humans. It is most people's favorite way to use Caddy because it is easy to write, easy to understand, and expressive enough for most use cases.

It looks like this:

```
example.com

root * /var/www/wordpress
php_fastcgi unix//run/php/php-version-fpm.sock
file_server
```

(That's a real, production-ready Caddyfile that serves WordPress with fully-managed HTTPS.)

The basic idea is that you first type the address of your site, then the features or functionality you need your site to have.

## Menu

- #### [Quick start guide](/docs/quick-starts/caddyfile)
- #### [Full Caddyfile tutorial](/docs/caddyfile-tutorial)
- #### [Caddyfile concepts](/docs/caddyfile/concepts)
- #### [Directives](/docs/caddyfile/directives)
- #### [Request matchers](/docs/caddyfile/matchers)
- #### [Global options](/docs/caddyfile/options)
<!-- - #### [Caddyfile specification](/docs/caddyfile/spec) TODO: Finish this -->


## Note

The Caddyfile is just a [config adapter](/docs/config-adapters) for Caddy. It is usually preferred when manually crafting configurations by hand, but is not as expressive, flexible, or programmable as Caddy's [native JSON structure](/docs/json/). If you are automating your Caddy configurations/deployments, you may wish to use JSON with [Caddy's API](/docs/api). (You can actually use the Caddyfile with the API too, just to a limited extent.)
