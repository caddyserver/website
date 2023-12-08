<script>
ready(() => {
	let startElement, endElement;

	startElement = findWithContent('.ex-on-demand pre.chroma code span.line', 'on_demand_tls {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-abuse rollover-purple');

	startElement = findWithContent('.ex-on-demand pre.chroma code span.line', 'tls');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-ondemand rollover-green');

	window.$_('.ex-on-demand code').classList.add('light');
});
</script>

<div class="ex-on-demand">

```caddy
{
	on_demand_tls {
		ask http://localhost:9123/check
	}
}

https:// {
	tls {
		on_demand
	}
	# reverse_proxy, etc...
}

# other sites...
```

</div>
