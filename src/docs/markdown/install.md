---
title: "Install"
---

# Install

This page describes various methods for installing Caddy on your system.

**Official:**

- [Static binaries](#static-binaries)
- [Debian, Ubuntu, Raspbian packages](#debian-ubuntu-raspbian)
- [Fedora, RedHat, CentOS packages](#fedora-redhat-centos)
- [Arch Linux, Manjaro, Parabola packages](#arch-linux-manjaro-parabola)
- [Docker image](#docker)

<aside class="tip">

Our [official packages](https://github.com/caddyserver/dist) come only with the standard modules. If you need third-party plugins, [build from source with `xcaddy`](/docs/build#xcaddy) or use [our download page](/download).

</aside>


**Community-maintained:**

- [Homebrew](#homebrew)
- [Webi](#webi)
- [Chocolatey](#chocolatey)
- [Ansible](#ansible)
- [Scoop](#scoop)
- [Termux](#termux)


## Static binaries

**If installing onto a production system, we recommend using our official package for your distro if available below.**

1. Obtain a Caddy binary:
	- [from releases on GitHub](https://github.com/caddyserver/caddy/releases) (expand "Assets")
		- Refer to [Verifying Asset Signatures](/docs/signature-verification) for how to verify the asset signature
	- [from our download page](/download)
	- [by building from source](/docs/build) (either with `go` or `xcaddy`)
2. [Install Caddy as a system service.](/docs/running#manual-installation) This is strongly recommended, especially for production servers.

Place the binary in one of your `$PATH` (or `%PATH%` on Windows) directories so you can run `caddy` without typing the full path of the executable file. (Run `echo $PATH` to see the list of directories that qualify.)

You can upgrade static binaries by replacing them with newer versions and restarting Caddy. The [`caddy upgrade` command](/docs/command-line#caddy-upgrade) can make this easy.



## Debian, Ubuntu, Raspbian

Installing this package automatically starts and runs Caddy as a [systemd service](/docs/running#linux-service) named `caddy`. It also comes with an optional `caddy-api` service which is _not_ enabled by default, but should be used if you primarily configure Caddy via its API instead of config files.

**Stable releases:**

<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

**Testing releases** (includes betas and release candidates):

<pre><code class="cmd"><span class="bash">sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/testing/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-testing-archive-keyring.gpg</span>
<span class="bash">curl -1sLf 'https://dl.cloudsmith.io/public/caddy/testing/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-testing.list</span>
<span class="bash">sudo apt update</span>
<span class="bash">sudo apt install caddy</span></code></pre>

[**View the Cloudsmith repos**](https://cloudsmith.io/~caddy/repos/)

If you wish to use the packaged support files (systemd services, bash completion and default configuration) with a custom Caddy build, instructions can be [found here](https://caddyserver.com/docs/build#package-support-files-for-custom-builds-for-debianubunturaspbian).


## Fedora, RedHat, CentOS

This package comes with both of Caddy's [systemd service](/docs/running#linux-service) unit files, but does not enable them by default.

Fedora or RHEL/CentOS 8:

<pre><code class="cmd"><span class="bash">dnf install 'dnf-command(copr)'</span>
<span class="bash">dnf copr enable @caddy/caddy</span>
<span class="bash">dnf install caddy</span></code></pre>

RHEL/CentOS 7:

<pre><code class="cmd"><span class="bash">yum install yum-plugin-copr</span>
<span class="bash">yum copr enable @caddy/caddy</span>
<span class="bash">yum install caddy</span></code></pre>

[**View the Caddy COPR**](https://copr.fedorainfracloud.org/coprs/g/caddy/caddy/)


## Arch Linux, Manjaro, Parabola

This package comes with heavily modified versions of both of Caddy's [systemd service](/docs/running#linux-service) unit files, but does not enable them by default.
Those modifications include a custom start/stop behavior and additional sandboxing flags which are explained in [systemd's exec documentation](https://www.freedesktop.org/software/systemd/man/systemd.exec.html#Sandboxing), which may lead to certain host directories not being available to the Caddy process. 

<pre><code class="cmd"><span class="bash">pacman -Syu caddy</span></code></pre>

[**View Caddy in the Arch Linux repositories**](https://archlinux.org/packages/community/x86_64/caddy/) and [**the Arch Linux Wiki**](https://wiki.archlinux.org/title/Caddy)

## Docker

<pre><code class="cmd bash">docker pull caddy</code></pre>

[**View on Docker Hub**](https://hub.docker.com/_/caddy)


## Homebrew

_Note: This is a community-maintained installation method._

<pre><code class="cmd bash">brew install caddy</code></pre>

[**View the Homebrew formula**](https://formulae.brew.sh/formula/caddy)


## Webi

_Note: This is a community-maintained installation method._

Linux and macOS:

<pre><code class="cmd bash">curl -sS https://webi.sh/caddy | sh</code></pre>

Windows:

<pre><code class="cmd">curl.exe https://webi.ms/caddy | powershell</code></pre>

You may need to adjust the Windows firewall rules to allow non-localhost incoming connections.

[**View on Webi**](https://webinstall.dev/caddy)


## Chocolatey

_Note: This is a community-maintained installation method._

<pre><code class="cmd">choco install caddy</code></pre>

[**View the Chocolatey package**](https://chocolatey.org/packages/caddy)


## Ansible

_Note: This is a community-maintained installation method._

<pre><code class="cmd bash">ansible-galaxy install nvjacobo.caddy</code></pre>

[**View the Ansible role repository**](https://github.com/nvjacobo/caddy)


## Scoop

_Note: This is a community-maintained installation method._

<pre><code class="cmd">scoop install caddy</code></pre>

[**View the Scoop manifest**](https://github.com/ScoopInstaller/Main/blob/master/bucket/caddy.json)


## Termux

_Note: This is a community-maintained installation method._

<pre><code class="cmd">pkg install caddy</code></pre>

[**View the Termux build.sh file**](https://github.com/termux/termux-packages/blob/master/packages/caddy/build.sh)

