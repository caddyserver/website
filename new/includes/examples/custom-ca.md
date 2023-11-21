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

<script>
window.$_('.ex-custom-ca code').classList.add('light');
</script>