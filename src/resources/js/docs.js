$(function() {
	function hasPrefix(str, prefix) {
		if (!prefix) return true;
		if (!str)    return false;
		return str.indexOf(prefix) === 0;
	}

	// highlight current page in left nav
	var $currentPageLink = $('main nav a[href="'+window.location.pathname+'"]');
	if (hasPrefix(window.location.pathname, "/docs/json/")) {
		// as a special case, highlight the JSON structure link anywhere within it
		$currentPageLink = $('main nav a[href="/docs/json/"]');
	}
	if (hasPrefix(window.location.pathname, "/docs/modules/")) {
		// as another special case, highlight the modules link anywhere within it
		$currentPageLink = $('main nav a[href="/docs/modules/"]');
	}
	$currentPageLink.addClass('current');

	// add anchor links, inspired by https://github.com/bryanbraun/anchorjs
	$('article > h1[id], article > h2[id], article > h3[id], article > h4[id], article > h5[id], article > h6[id]').each(function() {
		var $anchor = $('<a href="#'+this.id+'" class="anchor-link" title="Direct link">🔗</a>');
		$(this).append($anchor);
	});

	// the server-side markdown renderer annoyingly renders
	// colored code blocks differently from plain ones, in that
	// colorized ones do not have the additional <code> inside
	// the <pre>; this line finds those and adds a .chroma class
	// to the outer pre element, and our CSS file has a style to
	// ensure the inner code block does not produce extra padding
	$('article > pre:not(.chroma) > code:not(.cmd)').parent().addClass('chroma');

	// Add links to Caddyfile directives in code blocks.
	// See include/docs-head.html for the whitelist bootstrapping logic
	$('pre.chroma .k')
		.filter(function (k, item) {
			return window.CaddyfileDirectives.includes(item.innerText);
		})
		.map(function(k, item) {
			$(item).html(
				'<a href="/docs/caddyfile/directives/' + item.innerText + '"'
					+ 'style="color: inherit;"'
				+ '>'
					+ item.innerText
				+ '</a>'
			);
		});
});