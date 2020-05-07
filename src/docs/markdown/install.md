---
title: "Install"
---

# Install

This page describes how to manually install Caddy as a service.

<aside class="tip">
	If you <a href="/docs/download">downloaded Caddy</a> using a package manager such as <code>apt</code> or <code>dnf</code>, then Caddy is already installed, and you should jump to <a href="/docs/getting-started">Getting Started</a>.
</aside>


## Linux service

Requirements:

- `caddy` binary that you [downloaded](/docs/download) or [built from source](/docs/build)
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

If using a config file, be sure it is readable by the `caddy` user you just created.

Next, [choose a systemd service file](https://github.com/caddyserver/dist/blob/master/init) based on your use case:

- [**`caddy.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy.service) if you configure Caddy with a file.
- [**`caddy-api.service`**](https://github.com/caddyserver/dist/blob/master/init/caddy-api.service) if you configure Caddy solely through its API.

They are very similar but have minor differences in the ExecStart and ExecReload commands to accommodate your workflow. Customize the file accordingly.

**Double-check the `ExecStart` and `ExecReload` directives.** Make sure the binary's location and command line arguments are correct for your installation! For example: if using a config file, change your `--config` path if it is different from our example.

The usual place to save the service file is: `/etc/systemd/system/caddy.service`

After saving your service file, you can start the service for the first time with the usual systemctl dance:

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

Now that Caddy is installed, see our [Getting Started](/docs/getting-started) tutorial to learn how to use it!