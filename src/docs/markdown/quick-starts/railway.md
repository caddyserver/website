---
title: Railway Quick-start
---

# Railway quick-start

Deploying Caddy on Railway is an easy, no-fuss way to deploy a custom Caddy build with plugins.

**Prerequisites:**
- A free [Railway](https://railway.com) account

## Deploy Caddy on Railway

Go to our [Download page](/download) and select any plugins you need, then click the purple "Deploy on Railway" button at the top.

<details>
	<summary>Or, configure the template manually</summary>

Alternatively, if you want to configure the Railway template yourself, here is how to do it.

Go to the template on Railway:

<a href="https://railway.com/deploy/caddy?referralCode=YOPtw9&amp;utm_medium=integration&amp;utm_source=template&amp;utm_campaign=generic"><img src="https://railway.com/button.svg" alt="Deploy on Railway"></a>

and add any plugins you need by clicking "Configure":

![Deploy screen](/resources/images/railway/deploy-screen.png)

Then paste the plugins into the `CADDY_PLUGINS` variable, separated by spaces:

![Adding plugins](/resources/images/railway/deploy-config.png)

</details>

Click Deploy, then after the deployment finishes, you can try it out by clicking the link here:

![Visit your deployment](/resources/images/railway/prod-link.png)

You should see a welcome page showing that your new server is working!

Next, you can customize your deployment to serve your own site or proxy to another Railway service.

## Customize the deployment

To serve your own website, or to change the config, simply "eject" [our template](https://railway.com/deploy/caddy?referralCode=YOPtw9&amp;utm_medium=integration&amp;utm_source=template&amp;utm_campaign=generic) into your own repository:

![Eject template](/resources/images/railway/eject.png)

From your own repository, you can:

- Put your own site into the `www` folder.
- Modify Caddy's configuration, which is the [Caddyfile](/docs/caddyfile).

Simply commit the changes and push, then you can redeploy on Railway.

If you want to change the plugins in your Caddy build, all you have to do is edit the `CADDY_PLUGINS` variable and redeploy:

![Change plugins](/resources/images/railway/plugins-variable.png)

## Tips

Railway terminates TLS for you, so you should write your Caddy config as if it is being proxied to (because it is). Hence, if you use hosts in your Caddyfile site addresses, you should use `auto_https off` in your global options. Caddy is not edge-facing with our template.


## Variables

Environment variables you can set in your Railway project that this template may use:

Name | Description | Default | Example(s)
---- | ----------- | ------- | ----------
`CADDY_PLUGINS` | Space-separated list of Caddy plugins | ` ` | `github.com/caddy-dns/cloudflare github.com/mholt/caddy-ratelimit`
