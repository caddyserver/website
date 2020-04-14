---
title: "Install"
---

# Install

Caddy is available for every platform as a [static binary](https://github.com/caddyserver/caddy/releases) (it has no dependencies). You can also [build from source](#build-from-source) to customize your build.


## Official packages

We maintain [official distributions](https://github.com/caddyserver/dist) for the following platforms:

- **Docker**
[docker pull caddy](https://hub.docker.com/_/caddy)

- **Fedora, RedHat, CentOS**
Read how to [install the Caddy COPR](https://copr.fedorainfracloud.org/coprs/g/caddy/caddy/).

- **DigitalOcean**
[Create a Caddy droplet](https://marketplace.digitalocean.com/apps/caddy) and get started in 90 seconds.



## Linux service

Requirements:

- `caddy` binary that you downloaded or built from source
- `systemctl --version` 232 or newer
- `sudo` privileges

Move the caddy binary into your `$PATH`, for example:
<pre><code class="cmd bash">sudo mv caddy /usr/bin/</code></pre>

Test that it worked:
<pre><code class="cmd bash">caddy version</code></pre>

Create a group named `caddy`:
<pre><code class="cmd bash">groupadd --system caddy</code></pre>

Create a user named `caddy`, with a writeable home folder:
<pre><code class="cmd bash">useradd --system \
	--gid caddy \
	--create-home \
	--home-dir /var/lib/caddy \
	--shell /usr/sbin/nologin \
	--comment "Caddy web server" \
	caddy</code></pre>

Next, [choose a systemd service file](https://github.com/caddyserver/dist/blob/master/init) based on your use case:

- [**`caddy.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy.service) if you configure Caddy with a file.
- [**`caddy-api.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) if you configure Caddy solely through its API.

They are very similar but with minor differences in the ExecStart and ExecReload commands to accommodate your workflow. Customize the file accordingly.

**Double-check the `ExecStart` and `ExecReload` directives.** Make sure the binary's location and command line arguments are correct for your installation!

To start the service for the first time, do the usual systemctl dance:

<pre><code class="cmd"><span class="bash">sudo systemctl daemon-reload</span>
<span class="bash">sudo systemctl enable caddy</span>
<span class="bash">sudo systemctl start caddy</span></code></pre>

Verify that it is running:
<pre><code class="cmd bash">systemctl status caddy</code></pre>

When running with our official service file, Caddy's output will be redirected to `journalctl`:
<pre><code class="cmd bash">journalctl -u caddy</code></pre>

If using a config file, you can gracefully apply any changes:
<pre><code class="cmd bash">sudo systemctl reload caddy</code></pre>

You can stop the service with:
<pre><code class="cmd bash">sudo systemctl stop caddy</code></pre>

<aside class="advice">
	Do not stop the service to change Caddy's configuration. Stopping the server will incur downtime. Use the reload command instead.
</aside>

## Build from source

Requirements:

- [Go](https://golang.org/dl) 1.14 or newer
- [Go modules](https://github.com/golang/go/wiki/Modules) enabled

Download the source code:

<pre><code class="cmd bash">git clone "https://github.com/caddyserver/caddy.git"</code></pre>

Build:

<pre><code class="cmd"><span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>


### With plugins

Using [xcaddy](https://github.com/caddyserver/xcaddy), you can compile Caddy with extra plugins, for example:

<pre><code class="cmd bash">xcaddy build v2.0.0-rc.3 \
    --with github.com/caddyserver/nginx-adapter
	--with github.com/caddyserver/ntlm-transport@v0.1.0</code></pre>