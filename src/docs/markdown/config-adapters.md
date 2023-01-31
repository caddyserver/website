---
title: Config Adapters
---

# Config Adapters

Caddy's native config language is [JSON](https://www.json.org/json-en.html), but writing JSON by hand can be tedious and error-prone. That's why Caddy supports being configured with other languages through **config adapters**. They are Caddy plugins which make it possible to use config in your preferred format by outputting [Caddy JSON](/docs/json/) for you.

For example, a config adapter could [turn your NGINX config into Caddy JSON](https://github.com/caddyserver/nginx-adapter).

## Known config adapters

The following config adapters are currently available (some are third-party projects):

- [**caddyfile**](/docs/caddyfile) (standard)
- [**nginx**](https://github.com/caddyserver/nginx-adapter)
- [**jsonc**](https://github.com/caddyserver/jsonc-adapter)
- [**json5**](https://github.com/caddyserver/json5-adapter)
- [**yaml**](https://github.com/abiosoft/caddy-yaml)
- [**cue**](https://github.com/caddyserver/cue-adapter)
- [**toml**](https://github.com/awoodbeck/caddy-toml-adapter)
- [**hcl**](https://github.com/francislavoie/caddy-hcl)
- [**dhall**](https://github.com/mholt/dhall-adapter)
- [**mysql**](https://github.com/zhangjiayin/caddy-mysql-adapter)

## Using config adapters

You can use a config adapter by specifying it on the command line by using the `--adapter` flag on most subcommands that take a config:

<pre><code class="cmd bash">caddy run --config caddy.yaml --adapter yaml</code></pre>

Or via the API at the [`/load` endpoint](/docs/api#post-load):

<pre><code class="cmd bash">curl localhost:2019/load \
	-H "Content-Type: application/yaml" \
	--data-binary @caddy.yaml</code></pre>

If you only want to get the output JSON without running it, you can use the [`caddy adapt`](/docs/command-line#caddy-adapt) command:

<pre><code class="cmd bash">caddy adapt --config caddy.yaml --adapter yaml</code></pre>

## Caveats

Not all config languages are 100% compatible with Caddy; some features or behaviors simply don't translate well or are not yet programmed into the adapter or Caddy itself.

Some adapters do a 1-1 translation, like YAML->JSON or TOML->JSON. Others are designed specifically for Caddy, like the Caddyfile. Generally, these adapters will always work.

However, not all adapters work all of the time. Config adapters do their best to translate your input to Caddy JSON with the highest fidelity and correctness. Because this conversion process is not guaranteed to be complete and correct all the time, we don't call them "converters" or "translators". They are "adapters" since they will at least give you a good starting point to finish crafting your final JSON config.

Config adapters can output the resulting JSON, warnings, and errors. JSON results if no errors occur. Errors occur when something is wrong with the input (for example, syntax errors). Warnings are emitted when something is wrong with the adaptation but which is not necessarily fatal (for example, feature not supported). Caution is advised if using configs that were adapted with warnings.
