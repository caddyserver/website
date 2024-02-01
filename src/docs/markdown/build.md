---
title: "Build from source"
---

# Build from source

There are 2 ways to build Caddy, as opposed to installation of pre-built executable:
- Build from Git repo
- Build using `xcaddy`
- Build custom Docker image

Requirements:

- [Go](https://golang.org/doc/install) 1.20 or newer

The [last section](#package-support-files-for-custom-builds-for-debianubunturaspbian) contains instructions for users who installed Caddy using the APT command on Debian-derivative system yet need the custom build executable for their operations.

## Build from Git repo

Requirements:

- Go installed (see above)

Clone the repository:

<pre><code class="cmd bash">git clone "https://github.com/caddyserver/caddy.git"</code></pre>

If you don't have git, you can download the source code as a file archive [from GitHub](https://github.com/caddyserver/caddy). Each [release](https://github.com/caddyserver/caddy/releases) also has source snapshots.

Build:

<pre><code class="cmd"><span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>


<aside class="tip">

Due to [a bug in Go](https://github.com/golang/go/issues/29228), these basic steps do not embed version information. If you want the version (`caddy version`), you need to compile Caddy as a dependency rather than as the main module. Instructions for this are in Caddy's [main.go](https://github.com/caddyserver/caddy/blob/master/cmd/caddy/main.go) file. Or, you can use [`xcaddy`](#xcaddy) which automates this.

</aside>

Go programs are easy to compile for other platforms. Just set the `GOOS`, `GOARCH`, and/or `GOARM` environment variables that are different. ([See the go documentation for details.](https://golang.org/doc/install/source#environment))

For example, to compile Caddy for Windows when you're not on Windows:

<pre><code class="cmd bash">GOOS=windows go build</code></pre>

Or similarly for Linux ARMv6 when you're not on Linux or on ARMv6:

<pre><code class="cmd bash">GOOS=linux GOARCH=arm GOARM=6 go build</code></pre>

## Build using `xcaddy`

The [`xcaddy` command](https://github.com/caddyserver/xcaddy) is the easiest way to build Caddy with version information and/or plugins.

Requirements:

- Go installed (see above)
- Make sure [`xcaddy`](https://github.com/caddyserver/xcaddy/releases) is in your PATH

You do **not** need to download the Caddy source code (it will do that for you).

Then building Caddy (with version information) is as easy as:

<pre><code class="cmd bash">xcaddy build</code></pre>

To build with plugins, use `--with`:

<pre><code class="cmd bash">xcaddy build \
    --with github.com/caddyserver/nginx-adapter
	--with github.com/caddyserver/ntlm-transport@v0.1.1</code></pre>

As you can see, you can customize the versions of plugins with `@` syntax. Versions can be a tag name, commit SHA, or branch.

Cross-platform compilation with `xcaddy` works the same as with the `go` command. For example, to cross-compile for macOS:

<pre><code class="cmd bash">GOOS=darwin xcaddy build</code></pre>

## Build Custom Docker Image

Most users deploying production sites will not want to rely on mounting files into a container, but will instead base their own images on `caddy`:

```Dockerfile
# note: never use the :latest tag in a production site
FROM caddy:<version>

COPY Caddyfile /etc/caddy/Caddyfile
COPY site /srv
```

#### Adding custom Caddy modules

Caddy is extendable through the use of "modules". See https://caddyserver.com/docs/extending-caddy for full details. You can find a list of available modules on [the Caddy website's download page](https://caddyserver.com/download).

You can use the `:builder` image as a short-cut to building a new Caddy binary:

```Dockerfile
FROM caddy:<version>-builder AS builder

RUN xcaddy build \
    --with github.com/caddyserver/nginx-adapter \
    --with github.com/hairyhenderson/caddy-teapot-module@v0.0.3-0

FROM caddy:<version>

COPY --from=builder /usr/bin/caddy /usr/bin/caddy
```

Note the second `FROM` instruction - this produces a much smaller image by simply overlaying the newly-built binary on top of the regular `caddy` image.

The [`xcaddy`](https://caddyserver.com/docs/build#xcaddy) tool is used to [build a new Caddy entrypoint](https://github.com/caddyserver/caddy/blob/4217217badf220d7d2c25f43f955fdc8454f2c64/cmd/caddy/main.go#L15..L25), with the provided modules. You can specify just a module name, or a name with a version (separated by `@`). You can also specify a specific version (can be a version tag or commit hash) of Caddy to build from. Read more about [`xcaddy` usage](https://github.com/caddyserver/xcaddy#command-usage).

Note that the "standard" Caddy modules ([`github.com/caddyserver/caddy/master/modules/standard`](https://github.com/caddyserver/caddy/tree/master/modules/standard)) are always included.

## Package support files for custom builds for Debian/Ubuntu/Raspbian

This procedure aims to simplify running custom `caddy` binaries while keeping support files from the `caddy` package.

This procedure allows users to take advantage of the default configuration, systemd service files and bash-completion from the official package.

Requirements:
- Install `caddy` package according to these [instructions](/docs/install#debian-ubuntu-raspbian)
- Build your custom `caddy` binary according to the procedure listed in this document. (see above)
- Your custom `caddy` binary should be located in the current directory.

Procedure:
<pre><code class="cmd"><span class="bash">sudo dpkg-divert --divert /usr/bin/caddy.default --rename /usr/bin/caddy</span>
<span class="bash">sudo mv ./caddy /usr/bin/caddy.custom</span>
<span class="bash">sudo update-alternatives --install /usr/bin/caddy caddy /usr/bin/caddy.default 10</span>
<span class="bash">sudo update-alternatives --install /usr/bin/caddy caddy /usr/bin/caddy.custom 50</span>
<span class="bash">sudo systemctl restart caddy</span>
</code></pre>


`dpkg-divert` will move `/usr/bin/caddy` binary to `/usr/bin/caddy.default` and put a diversion in place in case any package want to install a file to this location.

`update-alternatives` will create a symlink from the desired caddy binary to `/usr/bin/caddy`

`systemctl restart caddy` will shut down the default version of the Caddy server and start the custom one.

You can change between the custom and default `caddy` binaries by executing
<pre><code class="cmd bash">update-alternatives --config caddy</code></pre>
and following the on screen information, then restarting the Caddy service.
