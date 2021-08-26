---
title: Conventions
---

# Conventions

The Caddy ecosystem adheres to a few conventions to make things consistent and intuitive across the platform.


## Network addresses

When specifying a network address to dial or bind, Caddy accepts a string in the following format:

```
network/address
```

The network part is optional, and is anything that [Go's `net` package](https://golang.org/pkg/net/) recognizes. The default network is `tcp`. If a network is specified, a single forward slash `/` must separate the network and address portions.

The address part may be any of these forms:

- `host`
- `host:port`
- `:port`
- `/path/to/unix/socket`

The host may be any hostname, resolvable domain name, or IP address.

The port may be a single value (`:8080`) or an inclusive range (`:8080-8085`). A port range will be multiplied into singular addresses. Not all config fields accept port ranges. The special port `:0` means any available port.

A unix socket path is only acceptable when using a unix* network type. The forward slash that separates the network and address is not considered part of the path.

Valid examples:

```
:8080
127.0.0.1:8080
localhost:8080
localhost:8080-8085
tcp/localhost:8080
tcp/localhost:8080-8085
udp/localhost:9005
unix//path/to/socket
```

<aside class="tip">
	Caddy network addresses are not URLs. URLs couple the lower and higher layers of the <a href="https://en.wikipedia.org/wiki/OSI_model#Layer_architecture">OSI model</a>, but Caddy often uses network addresses independently of a specific application, so combining them would be problematic. In Caddy, network addresses refer precisely to resources that can be dialed or bound at L3-L5, but URLs combine L3-L7, which is too many. A network address requires a host+port and path to be mutually exclusive, but URLs do not. Network addresses sometimes support port ranges, but URLs do not.
</aside>


## Placeholders

Caddy's configuration supports the use of _placeholders_ (variables). Using placeholders is a simple way to inject dynamic values into a static configuration.

<aside class="tip">
	Placeholders are a similar idea to variables in other software. For example, <a href="https://nginx.org/en/docs/varindex.html">nginx has variables</a> like $uri and $document_root.
</aside>

Placeholders are bounded on either side by curly braces `{ }` and contain the variable name inside, for example: `{foo.bar}`. Placeholder braces can be escaped, `\{like so\}`. Variable names are typically namespaced with dots to avoid collisions across modules.

Which placeholders are available depends on the context. Not all placeholders are available in all parts of the config. For example, [the HTTP app sets placeholders](/docs/json/apps/http/) that are only available in areas of the config related to handling HTTP requests.

The following placeholders are always available:

Placeholder | Description
------------|-------------
`{env.*}` | Environment variable (example: `{env.HOME}`)
`{system.hostname}` | The system's local hostname
`{system.slash}` | The system's filepath separator
`{system.os}` | The system's OS
`{system.arch}` | The system's architecture
`{time.now}` | The current time as a Go Time struct
`{time.now.unix}` | The current time as a unix timestamp in seconds
`{time.now.unix_ms}` | The current time as a unix timestamp in milliseconds
`{time.now.common_log}` | The current time in Common Log Format
`{time.now.year}` | The current year in YYYY format

Not all config fields support placeholders, but most do where you would expect it.


## File locations

This section contains information about where to find various files. File and directory paths described here are defaults at best; some can be overridden.

### Your config files

There is no single, conventional place for you to put your config files. Put them wherever makes the most sense to you.

<aside class="tip">
	The only exception to this might be a file named "Caddyfile" in the current working directory, which the caddy command tries for convenience if no other config file is specified.
</aside>

Distributions that ship with a default config file should document where this config file is at, even if it might be obvious to the package/distro maintainers.


### Data directory

Caddy stores TLS certificates and other important assets in a data directory, which is backed by [the configured storage module](/docs/json/storage/) (default: local file system).

If the `XDG_DATA_HOME` environment variable is set, it is `$XDG_DATA_HOME/caddy`.

Otherwise, its path varies by platform, adhering to OS conventions:

OS | Data directory path
---|---------------------
**Linux, BSD** | `$HOME/.local/share/caddy`
**Windows** | `%AppData%\Caddy`
**macOS** | `$HOME/Library/Application Support/Caddy`
**Plan 9** | `$HOME/lib/caddy`
**Android** | `$HOME/caddy` (or `/sdcard/caddy`)

All other OSes use the Linux/BSD directory path.

**The data directory must not be treated as a cache.** Its contents are **not** ephemeral or merely for the sake of performance. Caddy stores TLS certificates, private keys, OCSP staples, and other necessary information to the data directory. It should not be purged without understanding the implications.

It is crucial that this directory is persistent and writeable by Caddy.


### Configuration directory

This is where Caddy may store certain configuration to disk. Most notably, it persists the last active configuration (by default) to this folder for easy resumption later using [`caddy run --resume`](/docs/command-line#caddy-run).

<aside class="tip">
	The configuration directory is <i>not</i> where you need to store <a href="#your-config-files">your config files</a>. (Though, you are allowed to.)
</aside>

If the `XDG_CONFIG_HOME` environment variable is set, it is `$XDG_CONFIG_HOME/caddy`.

Otherwise, its path varies by platform, adhering to OS conventions:


OS | Config directory path
---|---------------------
**Linux, BSD** | `$HOME/.config/caddy`
**Windows** | `%AppData%\Caddy`
**macOS** | `$HOME/Library/Application Support/Caddy`
**Plan 9** | `$HOME/lib/caddy`

All other OSes use the Linux/BSD directory path.

It is crucial that this directory is persistent and writeable by Caddy.


## Durations

Duration strings are commonly used throughout Caddy's configuration. They take on the same format as [Go's time.ParseDuration syntax](https://golang.org/pkg/time/#ParseDuration) except you can also use `d` for day (we assume 1 day = 24 hours for simplicity). Valid units are:

- `ns` (nanosecond)
- `us`/`µs` (microsecond)
- `ms` (millisecond)
- `s` (second)
- `m` (minute)
- `h` (hour)
- `d` (day)

Examples:

- `250ms`
- `5s`
- `1.5h`
- `2h45m`
- `90d`

In the [JSON config](/docs/json/), duration values can also be integers which represent nanoseconds.
