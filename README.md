The Caddy Website
=================

This is the source of the Caddy website, [caddyserver.com](https://caddyserver.com).


## Requirements

- Caddy v2.7.6 or newer (installed in your PATH as `caddy`)
- To display the retro hit counter (just for fun), the [caddy-hitcounter](https://github.com/mholt/caddy-hitcounter) plugin.


## Quick start

1. `git clone https://github.com/caddyserver/website.git`
2. `cd website`
3. `caddy run`

Your first time, you may be prompted for a password. This is so Caddy can serve the site over local HTTPS. If you can't bind to low ports, change [the address at the top of the Caddyfile](https://github.com/caddyserver/website/blob/master/Caddyfile#L1), for example `localhost:2015`.

You can then load [https://localhost](https://localhost) (or whatever address you configured) in your browser.


