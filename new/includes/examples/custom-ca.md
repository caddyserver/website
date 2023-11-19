<script>
document.addEventListener("DOMContentLoaded", (event) => {
	window.$('.ex-custom-ca pre.chroma').classList.add('light');
});
</script>

<div class="ex-custom-ca">

```caddy
{
	pki {
		ca corporate {
			name "Our Corporation Authority"
		}
	}
}

internal.example.com {
	# ACME endpoint: /acme/corporate/directory
	acme_server {
		ca corporate
	}
}
```

</div>
