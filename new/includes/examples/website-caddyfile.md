<script>
ready(() => {
	window.$_('.ex-website-caddyfile pre.chroma').classList.add('light');
});
</script>

<div class="ex-website-caddyfile">

```caddy
caddyserver.com

root * src

file_server
templates # markdown & syntax highlighting!
encode zstd gzip

redir   /docs/json   /docs/json/
rewrite /docs/json/* /docs/json/index.html
rewrite /docs/*      /docs/index.html

reverse_proxy /api/* localhost:9002
```

</div>
