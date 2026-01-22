---
title: Conventions
---

# Conventions

The Caddy ecosystem adheres to a few conventions to make things consistent and intuitive across the platform.


- [Network addresses](#network-addresses)
- [Placeholders](#placeholders)
- [File locations](#file-locations)
  - [Data directory](#data-directory)
  - [Configuration directory](#configuration-directory)
- [Durations](#durations)



## Network addresses

When specifying a network address to dial or bind, Caddy accepts a string in the following format:

```
network/address
```

The network part is optional (defaulting to `tcp`), and is anything that [Go's `net.Dial` function](https://pkg.go.dev/net#Dial) recognizes. If a network is specified, a single forward slash `/` must separate the network and address portions.

The network can be any of the following; ones suffixed with `4` or `6` are IPv4 or IPv6 only, respectively:

- TCP: `tcp`, `tcp4`, `tcp6`
- UDP: `udp`, `udp4`, `udp6`
- IP: `ip`, `ip4`, `ip6`
- Unix: `unix`, `unixgram`, `unixpacket`

The address part may be any of these forms:

- `host`
- `host:port`
- `:port`
- `[ipv6%zone]:port`
- `/path/to/unix/socket`
- `/path/to/unix/socket|0200`

The host may be any hostname, resolvable domain name, or IP address.

In the case of IPv6 addresses, the address must be enclosed in square brackets `[]`. The zone identifier (starting with `%`) is optional (often used for link-local addresses).

The port may be a single value (`:8080`) or an inclusive range (`:8080-8085`). A port range will be multiplied into singular addresses. Not all config fields accept port ranges. The special port `:0` means any available port.

A unix socket path is only acceptable when using a `unix*` network type. The forward slash that separates the network and address is not considered part of the path.

When a unix socket is used as a bind address, you may optionally specify a file permission mode after the path, separated by a pipe `|`. The default is `0200` (octal), i.e. `u=w,g=,o=` (symbolic). The leading `0` is optional.

Valid examples:

```
:8080
127.0.0.1:8080
localhost:8080
localhost:8080-8085
tcp/localhost:8080
tcp/localhost:8080-8085
udp/localhost:9005
[::1]:8080
tcp6/[fe80::1%eth0]:8080
unix//path/to/socket
unix//path/to/socket|0200
```

<aside class="tip">

Caddy network addresses are not URLs. URLs couple the lower and higher layers of the [OSI model <img src="/old/resources/images/external-link.svg" class="external-link">](https://en.wikipedia.org/wiki/OSI_model#Layer_architecture), but Caddy often uses network addresses independently of a specific application, so combining them would be problematic. In Caddy, network addresses refer precisely to resources that can be dialed or bound at L3-L5, but URLs combine L3-L7, which is too many. A network address requires a host+port and path to be mutually exclusive, but URLs do not. Network addresses sometimes support port ranges, but URLs do not.

</aside>




## Placeholders

Caddy's configuration supports the use of _placeholders_. Using placeholders is a simple way to inject dynamic values into a static configuration.

<aside class="tip">

Placeholders are a similar idea to variables in other software. For example, [nginx has variables <img src="/old/resources/images/external-link.svg" class="external-link">](https://nginx.org/en/docs/varindex.html) like `$uri` and `$document_root`, whereas Caddy's equivalent would be [`{http.request.uri}`](/docs/json/apps/http/#docs) and [`{http.vars.root}`](/docs/caddyfile/directives/root).

</aside>


Placeholders are bounded on either side by curly braces `{ }` and contain the identifier inside, for example: `{foo.bar}`. The opening placeholder brace can be escaped `\{like.this}` to prevent replacement. Placeholder identifiers are typically namespaced with dots to avoid collisions across modules.

Which placeholders are available depends on the context. Not all placeholders are available in all parts of the config. For example, [the HTTP app sets placeholders](/docs/json/apps/http/#docs) that are only available in areas of the config related to handling HTTP requests.

The following placeholders are always available (global):

Placeholder | Description
------------|-------------
`{env.*}` | Environment variable; example: `{env.HOME}`
`{file.*}` | Contents from a file; example: `{file./path/to/secret.txt}`
`{system.hostname}` | The system's local hostname
`{system.slash}` | The system's filepath separator
`{system.os}` | The system's OS
`{system.arch}` | The system's architecture
`{system.wd}` | The current working directory
`{time.now}` | The current time as a Go Time struct
`{time.now.http}` | The current time in the format used in [HTTP headers <img src="/old/resources/images/external-link.svg" class="external-link">](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
`{time.now.unix}` | The current time as a unix timestamp in seconds
`{time.now.unix_ms}` | The current time as a unix timestamp in milliseconds
`{time.now.common_log}` | The current time in Common Log Format
`{time.now.year}` | The current year in YYYY format

Not all config fields support placeholders, but most do where you would expect it. Support for placeholders needs to have been explicitly added to those fields. Plugin authors can [read this article](/docs/extending-caddy/placeholders) to learn how to add support for placeholders in their own modules.




## File locations

This section contains information about where to find various files. File and directory paths described here are defaults at best; some can be overridden.

### Your config files

There is no single, conventional place for you to put your config files. Put them wherever makes the most sense to you.

<aside class="tip">

The only exception to this might be a file named `Caddyfile` in the current working directory, which the caddy command tries for convenience if no other config file is specified.

</aside>


Distributions that ship with a default config file should document where this config file is at, even if it might be obvious to the package/distro maintainers. For most Linux installations, the Caddyfile will be found at `/etc/caddy/Caddyfile`.


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

The configuration directory is *not* where you need to store [your config files](#your-config-files). (Though, you are allowed to.)

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

Duration strings are commonly used throughout Caddy's configuration. They take on the same format as [Go's `time.ParseDuration` syntax](https://golang.org/pkg/time/#ParseDuration) except you can also use `d` for day (we assume 1 day = 24 hours for simplicity). Valid units are:

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
