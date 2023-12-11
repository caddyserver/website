<!--
	All the markdown content is hidden by default, and loaded by ID.
	The HTML ID should start with qa-content- followed by the state ID.
	Make sure to leave empty lines after the opening of the div and before the end,
	otherwise the markdown parsing will not work.
-->

<div id="qa-content-install_dpkg">

<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

</div>
<div id="qa-content-install_rpm">

<pre><code class="cmd"><span class="bash">dnf install 'dnf-command(copr)'</span>
<span class="bash">dnf copr enable @caddy/caddy</span>
<span class="bash">dnf install caddy</span></code></pre>

</div>
<div id="qa-content-install_arch">

<pre><code class="cmd"><span class="bash">pacman -Syu caddy</span></code></pre>

</div>
<div id="qa-content-install_mac">

<pre><code class="cmd bash">brew install caddy</code></pre>

</div>
<div id="qa-content-install_windows">

<p>Chocolatey:</p> <pre><code class="cmd">choco install caddy</code></pre>
<p>Scoop:</p> <pre><code class="cmd">scoop install caddy</code></pre>

</div>
<div id="qa-content-install_nix">

- Package name: [`caddy`](https://search.nixos.org/packages?channel=unstable&show=caddy&query=caddy)
- NixOS module: [`services.caddy`](https://search.nixos.org/options?channel=unstable&show=services.caddy.enable&query=services.caddy)

</div>
<div id="qa-content-install_android">

In Termux: <pre><code class="cmd">pkg install caddy</code></pre>

</div>
<div id="qa-content-install_other">

<h4>Webi</h2>
<p>Linux and macOS:</p>
<pre><code class="cmd bash">curl -sS https://webi.sh/caddy | sh</code></pre>
<p>Windows:</p>
<pre><code class="cmd">curl.exe https://webi.ms/caddy | powershell</code></pre>
<h4>Ansible</h4>
<pre><code class="cmd bash">ansible-galaxy install nvjacobo.caddy</code></pre>

</div>
<div id="qa-content-install_docker">

<pre><code class="cmd bash">docker pull caddy</code></pre>

</div>
<div id="qa-content-install_build">

Make sure to have `git` and the latest version of [Go](https://go.dev) installed.

<pre><code class="cmd"><span class="bash">git clone "https://github.com/caddyserver/caddy.git"</span>
<span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>

</div>
<div id="qa-content-install_with_plugins">


[`xcaddy`](https://github.com/caddyserver/xcaddy) is a command line tool that helps you build Caddy with plugins. A basic build looks like:

<pre><code class="cmd bash">xcaddy build</code></pre>

To build with plugins, use `--with`:

<pre><code class="cmd bash">xcaddy build \
	--with github.com/caddyserver/nginx-adapter
	--with github.com/caddyserver/ntlm-transport@v0.1.1</code></pre>

</div>
<div id="qa-content-install_binary">

1. Obtain a Caddy binary:
	- [from releases on GitHub](https://github.com/caddyserver/caddy/releases) (expand "Assets")
		- Refer to [Verifying Asset Signatures](/docs/signature-verification) for how to verify the asset signature
	- [from our download page](/download)
	- [by building from source](/docs/build) (either with `go` or `xcaddy`)
2. [Install Caddy as a system service.](/docs/running#manual-installation) This is strongly recommended, especially for production servers.

Place the binary in one of your `$PATH` (or `%PATH%` on Windows) directories so you can run `caddy` without typing the full path of the executable file. (Run `echo $PATH` to see the list of directories that qualify.)

You can upgrade static binaries by replacing them with newer versions and restarting Caddy. The [`caddy upgrade` command](/docs/command-line#caddy-upgrade) can make this easy.

</div>
<div id="qa-content-cfg_ondemand_smallscale">

On-demand TLS is designed for situations when you either don't control the domain names, or you have too many certificates to load all at once when the server starts. For every other use case, standard TLS automation is likely better suited.

</div>
<div id="qa-content-cfg_ondemand_caddyfile">


In order to prevent abuse, you must first configure an `ask` endpoint so Caddy can check whether it should get a certificate. Add this to your global options at the top:

```caddy
{
	on_demand_tls {
		ask http://localhost:5555/check
	}
}
```

Change that endpoint to be something you've set up that will respond with HTTP 200 if the domain given in the `domain=` query parameter is allowed to have a certificate.

Then create a site block that serves all sites/hosts on the TLS port:

```caddy
https:// {
	tls {
		on_demand
	}
}
```

This is the minimum config to enable Caddy to accept and service TLS connections for arbitrary hosts. This config doesn't invoke any handlers. Usually you'll also [`reverse_proxy`](/docs/caddyfile/directives/reverse_proxy) to your backend application.

</div>
