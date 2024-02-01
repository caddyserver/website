This folder contains the Caddy config for the On-Demand TLS demo on the Caddy website.

It is hosted on a separate machine from the Caddy website so we can isolate canary builds in a production environment when necessary.

This config requires the [caddy-psl](https://github.com/mholt/caddy-psl) and [replace-response](https://github.com/caddyserver/replace-response) plugins.
