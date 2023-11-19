quickAssist = function() {
	let history = [];

	const states = {
		start: {
			prompt: "What are you looking for?",
			options: [
				{
					text: "How to install Caddy",
					next: "install"
				},
				{
					text: "Help configuring Caddy",
					next: "configure"
				},
				{
					text: "A solution to a problem",
					next: "solution"
				},
				{
					text: "An example for my use case",
					next: "example"
				}
			]
		},
		install: {
			prompt: "How do you want to install Caddy?",
			options: [
				{
					text: "OS package manager",
					next: "install_pkgmgr"
				},
				{
					text: "Docker",
					next: "install_docker"
				},
				{
					text: "Build from source",
					next: "install_build"
				},
				{
					text: "Build with plugins",
					next: "install_with_plugins"
				},
				{
					text: "Pre-built binary",
					next: "install_binary"
				}
			]
		},
		install_pkgmgr: {
			prompt: "Which OS are you using?",
			options: [
				{
					text: "Linux (Debian, Ubuntu, Raspbian)",
					next: "install_dpkg"
				},
				{
					text: "Linux (Fedora, RedHat, CentOS)",
					next: "install_rpm"
				},
				{
					text: "Linux (Arch, Manjaro, Parabola)",
					next: "install_arch"
				},
				{
					text: "macOS",
					next: "install_mac"
				},
				{
					text: "Windows",
					next: "install_windows"
				},
				{
					text: "Nix/NixOS",
					next: "install_nix"
				},
				{
					text: "Android",
					next: "install_android"
				},
				{
					text: "Other",
					next: "install_other"
				}
			]
		},
		install_dpkg: {
			title: "Install Caddy on Debian-based systems",
			content: `<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#debian-ubuntu-raspbian"
				}
			]
		},
		install_rpm: {
			title: "Install Caddy via RPM",
			content: `<pre><code class="cmd"><span class="bash">dnf install 'dnf-command(copr)'</span>
<span class="bash">dnf copr enable @caddy/caddy</span>
<span class="bash">dnf install caddy</span></code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#fedora-redhat-centos"
				}
			]
		},
		install_arch: {
			title: "Install Caddy on Arch/Manjaro/Parabola Linux",
			content: `<pre><code class="cmd"><span class="bash">pacman -Syu caddy</span></code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#arch-linux-manjaro-parabola"
				}
			]
		},
		install_mac: {
			title: "Install Caddy on macOS",
			content: `<pre><code class="cmd bash">brew install caddy</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#homebrew"
				}
			]
		},
		install_windows: {
			title: "Install Caddy on Windows",
			content: `<p>Chocolatey:</p> <pre><code class="cmd">choco install caddy</code></pre>
				<p>Scoop:</p> <pre><code class="cmd">scoop install caddy</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#windows"
				}
			]
		},
		install_nix: {
			title: "Install Caddy on Nix/Nixpkgs/NixOS",
			content: `<ul>
				<li>Package name: <a href="https://search.nixos.org/packages?channel=unstable&amp;show=caddy&amp;query=caddy"><code>caddy</code></a></li>
				<li>NixOS module: <a href="https://search.nixos.org/options?channel=unstable&amp;show=services.caddy.enable&amp;query=services.caddy"><code>services.caddy</code></a></li>
			</ul>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#nixnixpkgsnixos"
				}
			]
		},
		install_android: {
			title: "Install Caddy on Android",
			content: `In Termux: <pre><code class="cmd">pkg install caddy</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#termux"
				}
			]
		},
		install_other: {
			title: "Miscellaneous install methods",
			content: `				<h4>Webi</h2>
				<p>Linux and macOS:</p>
				<pre><code class="cmd bash">curl -sS https://webi.sh/caddy | sh</code></pre>
				<p>Windows:</p>
				<pre><code class="cmd">curl.exe https://webi.ms/caddy | powershell</code></pre>
				<h4>Ansible</h4>
				<pre><code class="cmd bash">ansible-galaxy install nvjacobo.caddy</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#fedora-redhat-centos"
				}
			]
		},
		install_docker: {
			title: "Official Docker image",
			content: `<pre><code class="cmd bash">docker pull caddy</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/install#docker"
				}
			]
		},
		install_build: {
			title: "Build Caddy from source",
			content: `<p>Make sure to have <code>git</code> and the latest version of <a href="https://go.dev">Go</a> installed.</p>
				<pre><code class="cmd"><span class="bash">git clone "https://github.com/caddyserver/caddy.git"</span>
<span class="bash">cd caddy/cmd/caddy/</span>
<span class="bash">go build</span></code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/build"
				}
			]
		},
		install_with_plugins: {
			title: "Build Caddy with plugins",
			content: `
				<p>
					<code><a href="https://github.com/caddyserver/xcaddy">xcaddy</a></code> is a command line tool
					that helps you build Caddy with plugins. A basic build looks like:
				</p>
				<pre><code class="cmd bash">xcaddy build</code></pre>
				<p>
					To build with plugins, use <code>--with</code>:
				</p>
				<pre><code class="cmd bash">xcaddy build \\
	--with github.com/caddyserver/nginx-adapter
	--with github.com/caddyserver/ntlm-transport@v0.1.1</code></pre>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/build#xcaddy"
				}
			]
		},
		install_binary: {
			title: "Install Caddy binary manually",
			content: `
				<ol>
					<li>
						Obtain a Caddy binary:
						<ul>
							<li>
								<a href="https://github.com/caddyserver/caddy/releases">from releases on GitHub</a> (expand
									&quot;Assets&quot;)
								<ul>
									<li>Refer to <a href="/docs/signature-verification">Verifying Asset Signatures</a> for how to verify
										the asset signature</li>
								</ul>
							</li>
							<li><a href="/download">from our download page</a></li>
							<li><a href="/docs/build">by building from source</a> (either with <code>go</code> or <code>xcaddy</code>)
						</ul>
					</li>
					<li>
						<a href="/docs/running#manual-installation">Install Caddy as a system service.</a> This is strongly recommended,
						especially for production servers.
					</li>
				</ol>
				<p>Place the binary in one of your <code>$PATH</code> (or <code>%PATH%</code> on Windows) directories so you can run
					<code>caddy</code> without typing the full path of the executable file. (Run <code>echo $PATH</code> to see the list
					of directories that qualify.)</p>
				<p>You can upgrade static binaries by replacing them with newer versions and restarting Caddy. The <a
						href="/docs/command-line#caddy-upgrade"><code>caddy upgrade</code> command</a> can make this easy.</p>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/build#xcaddy"
				}
			]
		},

		configure: {
			prompt: "What are you trying to configure?",
			options: [
				{
					text: "On-demand TLS",
					next: "cfg_ondemand"
				},
				{
					text: "Authentication",
					next: "cfg_authentication"
				},
				{
					text: "Load balancing",
					next: "cfg_loadbalancing"
				}
			]
		},
		cfg_ondemand: {
			prompt: "Do you control the (DNS records of) the domain names you're serving?",
			options: [
				{
					text: "Yes",
					breadcrumb: "I control the domains",
					next: "cfg_ondemand_havecontrol"
				},
				{
					text: "No",
					breadcrumb: "DNS out of my control",
					next: "cfg_ondemand_ok"
				}
			]
		},
		cfg_ondemand_havecontrol: {
			prompt: "Do you have hundreds or thousands of your own domain names to serve?",
			options: [
				{
					text: "Yes",
					breadcrumb: "Lots of domains",
					next: "cfg_ondemand_ok"
				},
				{
					text: "No",
					breadcrumb: "Small scale",
					next: "cfg_ondemand_smallscale"
				}
			]
		},
		cfg_ondemand_smallscale: {
			title: "You likely don't need on-demand TLS.",
			content: `On-demand TLS is designed for situations when you either don't control the domain names,
				or you have too many certificates to load all at once when the server starts. For every other
				use case, standard TLS automation is likely better suited.`,
			options: [
				{
					text: "Learn more",
					href: "/docs/automatic-https#on-demand-tls"
				}
			]
		},
		cfg_ondemand_ok: {
			prompt: "Are you using the Caddyfile or JSON to configure Caddy?",
			options: [
				{
					text: "Caddyfile",
					next: "cfg_ondemand_caddyfile"
				},
				{
					text: "JSON",
					next: "cfg_ondemand_json"
				}
			]
		},
		cfg_ondemand_caddyfile: {
			title: "Setting up On-Demand TLS",
			content: `
				<p>In order to prevent abuse, you must first configure an <code>ask</code> endpoint so Caddy
				can check whether it should get a certificate. Add this to your global options at the top:</p>
				<pre><code>on_demand_tls {
	ask http://localhost:5555/check
}</code></pre>
				<p>Change that endpoint to be something you've set up that will respond with HTTP 200 if the
				domain given in the <code>domain=</code> query parameter is allowed to have a certificate.</p>
				<p>Then create a site block that serves all sites/hosts on the TLS port:</p>
				<pre><code>https:// {
	tls {
		on_demand
	}
}</code></pre>
				<p>This is the minimum config to enable Caddy to accept and service TLS connections for arbitrary
				hosts. This config doesn't invoke any handlers. Usually you'll also <code>reverse_proxy</code>
				to your backend application.</p>`,
			options: [
				{
					text: "Learn more",
					href: "/docs/automatic-https#on-demand-tls"
				}
			]
		},
	};

	// show renders the given state into the quick assist box
	function show(state) {
		// reset & show prompt/content
		$_('.quick-assist-question').innerHTML = state.prompt || state.title;
		$_('.quick-assist-content').innerHTML = state.content || '';
		$_('.quick-assist-options').innerHTML = '';

		// render options
		let hasNext = false;
		if (state.options) {
			for (const opt of state.options) {
				if (opt.next) {
					hasNext = true;
				}
				const btn = document.createElement('a');
				btn.classList.add('button');
				btn.innerText = opt.text || "";
				if (opt.next) {
					btn.dataset.next = opt.next;
					btn.dataset.breadcrumb = opt.breadcrumb || opt.text;
				} else if (opt.href) {
					btn.href = opt.href;
				}
				$_('.quick-assist-options').append(btn);
			}
		}

		// if there's no "next" state, then this must be the end of
		// assistance, so show a button to reset
		if (!hasNext) {
			const reset = document.createElement('a');
			reset.classList.add('button', 'reset');
			reset.innerText = "Reset";
			$_('.quick-assist-options').append(reset);
		}

		history.push(state);
	}

	// reset clears history and shows the start state; it does NOT delete things
	// from the UI, however.
	function reset() {
		history = [];
		show(states.start);
	}

	// clicking breadcrumbs should take you to that point in the state machine
	on('click', '.quick-assist-history a', event => {
		// remove later breadcrumbs
		for (let sibling = event.target.nextElementSibling; sibling != null; sibling = event.target.nextElementSibling) {
			sibling.remove();
			history.pop();
		}

		// show the state represented by the breadcrumb clicked
		if (event.target.dataset.index) {
			show(history[Number(event.target.dataset.index)]);
		} else {
			reset();
		}
	});

	// when an option is selected, add breadcrumb and show that state
	on('click', '.quick-assist-options a[data-next]', event => {
		const link = document.createElement('a');
		link.innerText = event.target.dataset.breadcrumb || event.target.innerText;
		link.dataset.index = history.length;
		$_('.quick-assist-history').append(link);
		show(states[event.target.dataset.next]);
	});

	on('click', '.quick-assist-options a.reset', event => {
		$_('.quick-assist-history a:first-child').dispatchEvent(new Event('click', { bubbles: true }));
	})

	// when page loads, show the start of the quick assist
	reset();
};



ready(() => {
	quickAssist();
});
