---
title: "Build from source"
---

# Build from source

Requirements:

- [Go](https://golang.org/doc/install) 1.17 or newer

Clone the repository:

<pre><code class="cmd bash">git clone "https://github.com/caddyserver/caddy.git"</code></pre>

If you don't have git, you can download the source code as a file archive [from GitHub](https://github.com/caddyserver/caddy). Each [release](https://github.com/caddyserver/caddy/releases) also has source snapshots.

Build:

<pre><code class="cmd"><span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>


<aside class="tip">

Due to [a bug in Go](https://github.com/golang/go/issues/29228), these basic steps do not embed version information. If you want the version (`caddy version`), you need to compile Caddy as a dependency rather than as the main module. Instructions for this are in Caddy's [main.go](https://github.com/caddyserver/caddy/blob/master/cmd/caddy/main.go) file. Or, you can use [`xcaddy`](#xcaddy) which automates this.

</aside>


## xcaddy

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

Cross-platform compilation with `xcaddy` works the same as with the `go` command (see below).


## Cross-platform

Go programs are easy to compile for other platforms. Just set the `GOOS`, `GOARCH`, and/or `GOARM` environment variables that are different. ([See the go documentation for details.](https://golang.org/doc/install/source#environment))

For example, to compile Caddy for Windows when you're not on Windows:

<pre><code class="cmd bash">GOOS=windows go build</code></pre>

Or similarly for Linux ARMv6 when you're not on Linux or on ARMv6:

<pre><code class="cmd bash">GOOS=linux GOARCH=arm GOARM=6 go build</code></pre>

The same works for `xcaddy`. To cross-compile for macOS:

<pre><code class="cmd bash">GOOS=darwin xcaddy build</code></pre>

## Package support files for custom builds for Debian/Ubuntu/Raspbian

This procedure aims to simplify running custom `caddy` binaries while keeping support files from the `caddy` package.

This procedure allows users to take advantage of the default configuration, systemd service files and bash-completion from the official package.

Requirements:
- Install `caddy` package according to these [instructions](https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
- Build your custom `caddy` binary according to the procedure listed in this document. (see above)
- Your custom `caddy` binary should be located in the current directory.

Procedure:
<pre><code class="cmd"><span class="bash">dpkg-divert --divert /usr/bin/caddy.default --rename /usr/bin/caddy</span>
<span class="bash">mv ./caddy /usr/bin/caddy.custom</span>
<span class="bash">update-alternatives --install /usr/bin/caddy caddy /usr/bin/caddy.default 10</span>
<span class="bash">update-alternatives --install /usr/bin/caddy caddy /usr/bin/caddy.custom 50</span>
</code></pre>


`dpkg-divert` will move `/usr/bin/caddy` binary to `/usr/bin/caddy.default` and put a diversion in place in case any package want to install a file to this location.

`update-alternatives` will create a symlink from the desired caddy binary to `/usr/bin/caddy`

You can change between the custom and default `caddy` binaries by executing
<pre><code class="cmd bash">update-alternatives --config caddy</code></pre>
and following the on screen information.
