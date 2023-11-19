<script>
document.addEventListener("DOMContentLoaded", (event) => {
	window.$('.ex-local-https pre.chroma').classList.add('light');
});
</script>

<div class="ex-local-https">

```caddy
localhost {
	respond "Hello from HTTPS!"
}

192.168.1.10 {
	respond "Also HTTPS!"
}

http://localhost {
	respond "Plain HTTP"
}
```

</div>
