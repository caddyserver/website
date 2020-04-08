---
title: Caddyfile Quick-start
---

# Caddyfile Quick-start

Create a new text file named `Caddyfile` (no extension).

The first thing to type in a Caddyfile is your site's address:

```
localhost
```

<aside class="tip">
	If the HTTP and HTTPS ports (80 and 443, respectively) are privileged ports on your OS, you will either need to run with elevated privileges or use a higher port. To use a higher port, just change the address to something like <code>localhost:2015</code> and change the HTTP port using the <a href="/docs/caddyfile/options">http_port</a> Caddyfile option.
</aside>

Then hit enter and type what you want it to do, so it looks like this:

```
localhost

respond "Hello, world!"
```

Save this and run Caddy from the same folder that contains your Caddyfile:

<pre><code class="cmd bash">caddy start</code></pre>

You will probably be asked for your password, because Caddy serves all sites -- even local ones -- over HTTPS by default. (The password prompt should only happen the first time!)

<aside class="tip">
	For local HTTPS, Caddy automatically generates certificates and unique private keys for you. The root certificate is added to your system's trust store, which is why the password prompt is necessary. It allows you to develop locally over HTTPS without certificate errors.
</aside>

If you get permission errors, you may need to run with elevated privileges.

Either open your browser to [localhost](http://localhost) or `curl` it:

<pre><code class="cmd"><span class="bash">curl https://localhost</span>
Hello, world!</code></pre>

You can define multiple sites in a Caddyfile by wrapping them in curly braces `{ }`. Change your Caddyfile to be:

```
localhost {
	respond "Hello, world!"
}

localhost:2016 {
	respond "Goodbye, world!"
}
```

You can give Caddy the updated configuration two ways, either with the API directly:

<pre><code class="cmd bash">curl localhost:2019/load \
	-X POST \
	-H "Content-Type: text/caddyfile" \
	--data-binary @Caddyfile
</code></pre>

or with the reload command, which does the same API request for you:

<pre><code class="cmd bash">caddy reload</code></pre>

Try out your new "goodbye" endpoint [in your browser](https://localhost:2016) or with `curl` to make sure it works:

<pre><code class="cmd"><span class="bash">curl https://localhost:2016</span>
Goodbye, world!</code></pre>

When you are done with Caddy, make sure to stop it:

<pre><code class="cmd bash">caddy stop</code></pre>

## Further reading

- [Caddyfile concepts](/docs/caddyfile/concepts)
- [Directives](/docs/caddyfile/directives)