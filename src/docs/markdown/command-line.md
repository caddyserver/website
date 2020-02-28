---
title: "Command Line"
---

# Command Line

Caddy has a standard unix-like command line interface. Basic usage is:

```
caddy <command> [<args...>]
```

The `<carets>` indicate parameters that get replaced by your input.

The`[brackets]` indicate optional parameters.

The ellipses `...` indicates a continuation, i.e. one or more parameters.

**Quick start: `caddy help`**

---

- **[caddy adapt](#caddy-adapt)**
  Adapts a config document to native JSON

- **[caddy environ](#caddy-environ)**
  Prints the environment

- **[caddy file-server](#caddy-file-server)**
  A simple but production-ready file server

- **[caddy hash-password](#caddy-hash-password)**
  Hashes a password and outputs base64

- **[caddy help](#caddy-help)**
  View help for caddy commands

- **[caddy list-modules](#caddy-list-modules)**
  Lists the installed Caddy modules

- **[caddy reload](#caddy-reload)**
  Changes the config of the running Caddy process

- **[caddy reverse-proxy](#caddy-reverse-proxy)**
  A simple but production-ready reverse proxy

- **[caddy run](#caddy-run)**
  Starts the Caddy process in the foreground

- **[caddy start](#caddy-start)**
  Starts the Caddy process in the background

- **[caddy stop](#caddy-stop)**
  Stops the running Caddy process

- **[caddy validate](#caddy-validate)**
  Tests whether a config file is valid

- **[caddy version](#caddy-version)**
  Prints the version



## Subcommands


### `caddy adapt`

<pre><code class="cmd bash">caddy adapt
	--config &lt;path&gt;
	[--adapter &lt;name&gt;]
	[--pretty]
	[--validate]</code></pre>

Adapts a configuration to Caddy's native JSON config structure and writes the output to stdout, along with any warnings to stderr.

`--config` is the path to the config file. If blank, will default to `Caddyfile` in current directory if it exists; otherwise, this flag is required.

`--adapter` specifies the config adapter to use; default is `caddyfile`.

`--pretty` will format the output with indentation for human readability.

`--validate` will load and provision the adapted configuration to check for validity (but it will not actually start running the config).

Note that a config which is successfully adapted may still fail validation. For an example of this, use this Caddyfile:

```
localhost

tls cert_notexist.pem key_notexist.pem
```

Try adapting it:

<pre><code class="cmd bash">caddy adapt --config Caddyfile</code></pre>

It succeeds without error. Then try:

<pre><code class="cmd"><span class="bash">caddy adapt --config Caddyfile --validate</span>
adapt: validation: loading app modules: module name 'tls': provision tls: loading certificates: open cert_notexist.pem: no such file or directory
</code></pre>

Even though that Caddyfile can be adapted to JSON without errors, the actual certificate and/or key files do not exist, so validation fails because that error arises during the provisioning phase. Thus, validation is a stronger error check than adaptation is.

#### Example

To adapt a Caddyfile to JSON that you can easily read and tweak manually:

<pre><code class="cmd bash">caddy adapt --config /path/to/Caddyfile --pretty</code></pre>




### `caddy environ`

<pre><code class="cmd bash">caddy environ</code></pre>

Prints the environment as seen by caddy, then exits. Can be useful when debugging init systems or process manager units like systemd.




### `caddy file-server`

<pre><code class="cmd bash">caddy file-server
	[--root &lt;path&gt;]
	[--listen &lt;addr&gt;]
	[--domain &lt;example.com&gt;]
	[--browse]</code></pre>

Spins up a simple but production-ready static file server.

`--root` specifies the root file path. Default is the current working directory.

`--listen` accepts a listener address. Default is `:2015`, unless `--domain` specifies a name that qualifies for HTTPS, then `:443` will be the default.

`--domain` will only serve files through that domain name, and Caddy will attempt to serve it over HTTPS if it qualifies for a certificate (i.e. is a public domain name), so make sure its DNS is configured properly first. If the name qualifies for a certificate, the default port will be changed to 443.

`--browse` will enable directory listings if a directory without an index file is requested.

This command disables the admin API, making it easier to run multiple instances on a local development machine.



### `caddy hash-password`

<pre><code class="cmd bash">caddy hash-password
	--plaintext &lt;password&gt;
	[--algorithm &lt;name&gt;]
	[--salt &lt;string&gt;]</code></pre>

Hashes a password and writes the output to stdout in base64 encoding.

`--plaintext` is the plaintext form of the password.

`--algorithm` may be bcrypt or scrypt. Default is bcrypt.

`--salt` is used only if the algorithm requires an external salt (like scrypt).




### `caddy help`

<pre><code class="cmd bash">caddy help [&lt;command&gt;]</code></pre>

Prints CLI help text, optionally for a specific subcommand.



### `caddy list-modules`

<pre><code class="cmd bash">caddy list-modules
	[--versions]</code></pre>

Prints the Caddy modules that are installed, optionally with version information from their associated Go modules.

NOTE: Due to [a bug in Go](https://github.com/golang/go/issues/29228), version information is only available if Caddy is built as a dependency and not as the main module. TODO: Link to docs that explain how to build Caddy with version info



### `caddy reload`

<pre><code class="cmd bash">caddy reload
	[--config &lt;path&gt;]
	[--adapter &lt;name&gt;]
	[--address &lt;interface&gt;]</code></pre>

Gives the running Caddy instance a new configuration. This has the same effect as POSTing a document to the [/load endpoint](/docs/api#post-load), but this command is convenient for simple workflows revolving around config files.

`--config` is the config file to apply. If not specified, it will try a file called `Caddyfile` in the current working directory and, if it exists, it will adapt it using the `caddyfile` config adapter; otherwise, it is an error if there is no config file to load.

`--adapter` specifies a config adapter to use, if any.

`--address` needs to be used if the admin endpoint is not listening on the default address and if it is different from the address in the provided config file.



### `caddy reverse-proxy`

<pre><code class="cmd bash">caddy reverse-proxy
	--from &lt;addr&gt;
	--to &lt;addr&gt;
	--change-host-header</code></pre>

Spins up a simple but production-ready reverse proxy.

`--from` is the address to proxy from.

`--to` is the address to proxy to.

`--change-host-header` will cause Caddy to change the Host header from the incoming value to the address of the upstream.

Both `--from` and `--to` parameters can be URLs, as scheme, domain name, and URI rewrite information will be inferred from the provided URL (paths and query strings ignored). Or they can be a simple network address and not a complete URL.

This command disables the admin API, making it easier to run multiple instances on a local development machine.


### `caddy run`

<pre><code class="cmd bash">caddy run
	[--config &lt;path&gt;]
	[--adapter &lt;name&gt;]
	[--environ]
	[--resume]</code></pre>

Runs Caddy and blocks indefinitely; i.e. "daemon" mode.

`--config` specifies an initial config file to immediately load and use. If no config is specified, Caddy will run with a blank configuration and use default settings for the [admin API endpoints](/docs/api), which can be used to feed it new configuration. As a special case, if the current working directory has a file called "Caddyfile" and the `caddyfile` config adapter is plugged in (default), then that file will be loaded and used to configure Caddy, even without any command line flags.

`--adapter` is the name of the config adapter to use when loading the initial config, if any. This flag is not necessary if the `--config` filename starts with "Caddyfile" which assumes the `caddyfile` adapter. Otherwise, this flag is required if the provided config file is not in Caddy's native JSON format. Any warnings will be printed to the log, but beware that any adaptation without errors will immediately be used, even if there are warnings. If you want to review the results of the adaptation first, use the [`caddy adapt`](#caddy-adapt) subcommand.

`--environ` prints out the environment before starting. This is the same as the `caddy environ` command, but does not exit after printing.

`--resume` uses the last loaded configuration. This flag is useful primarily in [API](/docs/api)-heavy deployments, and overrides `--config` if a saved config exists.


### `caddy start`

<pre><code class="cmd bash">caddy start
	[--config &lt;path&gt;]
	[--adapter &lt;name&gt;]</code></code></pre>

Same as `caddy run`, but in the background. This command only blocks until the background process is running successfully (or fails to run), then returns.

Use of this command is discouraged with system services or on Windows. On Windows, the child process will remain attached to the terminal, so closing the window will forcefully stop Caddy, which is not obvious.

Once started, you can use [`caddy stop`](#caddy-stop) or [the /stop API endpoint](/docs/api#post-stop) to exit the background process.



### `caddy stop`

<pre><code class="cmd bash">caddy stop [--address &lt;interface&gt;]</code></pre>

Gracefully stops the running Caddy process (other than the process of the stop command) and causes it to exit. It uses the [/stop endpoint](/docs/api#post-stop) of the admin API to perform a graceful shutdown.

`--address` can be used if the running instance's admin API is not on the default port; an alternate address can be specified here.

If you want to stop the current configuration but do not want to exit the process, use [`caddy reload`](#caddy-reload) with a blank config, or the [`DELETE /config/`](/docs/api#delete-configpath) endpoint.



### `caddy validate`

<pre><code class="cmd bash">caddy validate
	[--config &lt;path&gt;]
	[--adapter &lt;name&gt;]</code></pre>

Validates a configuration file. This command deserializes the config, then loads and provisions all of its modules as if to start the config, but the config is not actually started. This exposes errors in a configuration that arise during loading or provisioning phases and is a stronger error check than merely serializing a config as JSON.

`--config` is the config file to validate.

`--adapter` is the name of the config adapter to use, if the config file is not in Caddy's native JSON format.



### `caddy version`
<pre><code class="cmd bash">caddy version</code></pre>

Prints the version.
