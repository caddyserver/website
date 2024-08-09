The Caddy Website
=================

This is the source of the Caddy website, [caddyserver.com](https://caddyserver.com).


## Requirements

- Caddy v2.7.6 or newer (installed in your PATH as `caddy`)
- To display the retro hit counter (just for fun), the [caddy-hitcounter](https://github.com/mholt/caddy-hitcounter) plugin. Then uncomment the relevant lines in the Caddyfile.


## Quick start

1. `git clone https://github.com/caddyserver/website.git`
2. `cd website`
3. `caddy run`

Your first time, you may be prompted for a password. This is so Caddy can serve the site over local HTTPS. If you can't bind to low ports, change [the address at the top of the Caddyfile](https://github.com/caddyserver/website/blob/master/Caddyfile#L1), for example `localhost:2015`.

You can then load [https://localhost](https://localhost) (or whatever address you configured) in your browser.

### Docker

You can run rootless with docker with
```
docker stop caddy-website || true && docker rm caddy-website || true
docker run --name caddy-website -it -p 8443:443 -v ./:/wd caddy sh -c "cd /wd && caddy run"
```

This will allow you to connect to https://localhost:8443

