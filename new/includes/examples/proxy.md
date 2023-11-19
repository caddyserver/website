<script>
document.addEventListener("DOMContentLoaded", (event) => {
	let startElement, endElement;

	startElement = findWithContent('.ex-proxy pre.chroma code span', 'php_fastcgi');
	endElement = findNextText(startElement, '9000');
	wrapRangeWithSpan(startElement, endElement, 'rollover-php rollover-green');

	startElement = findWithContent('.ex-proxy pre.chroma code span.line', 'reverse_proxy /api/* {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-dynamic-backends rollover-purple');

	startElement = findWithContent('.ex-proxy pre.chroma code span.line', 'reverse_proxy /service/* {');
	endElement = findNextText(startElement, '}');
	wrapRangeWithSpan(startElement, endElement, 'rollover-ha rollover-blue');
});
</script>

<div class="ex-proxy">

```caddy
example.com

# Serve PHP sites
handle /blog/* {
	root * /var/www/wordpress
	php_fastcgi localhost:9000
	file_server
}

# Proxy an autoscaling API with dynamic backends
reverse_proxy /api/* {
	dynamic srv _api._tcp.example.com
}

# Proxy a compute-heavy distributed service
# with load balancing and health checks
reverse_proxy /service/* {
	to              10.0.1.1:80 10.0.1.2:80 10.0.1.3:80
	lb_policy       least_conn
	lb_try_duration 10s
	fail_duration   5s
}

# Proxy everything else to an HTTPS upstream
reverse_proxy https://service.example.com {
	header_up Host {upstream_hostport}
}
```

</div>
