<div class="ex-frankenphp">

```caddy
{
	# Enable FrankenPHP
	frankenphp
	order php_server before file_server
}

example.com {
	# Serve PHP app from current directory
	php_server
}
```

</div>

<script>
window.$_('.ex-frankenphp code').classList.add('dark');
</script>