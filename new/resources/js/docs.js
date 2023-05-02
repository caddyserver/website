ready(function() {
	// highlight current page in left nav
	let currentPageLink = $('main nav a[href="'+window.location.pathname+'"]');
	if (window.location.pathname.startsWith("/docs/json/")) {
		// as a special case, highlight the JSON structure link anywhere within it
		currentPageLink = $('main nav a[href="/docs/json/"]');
	}
	if (window.location.pathname.startsWith("/docs/modules/")) {
		// as another special case, highlight the modules link anywhere within it
		currentPageLink = $('main nav a[href="/docs/modules/"]');
	}
	currentPageLink?.classList?.add('current');

	// add anchor links, inspired by https://github.com/bryanbraun/anchorjs
	$$('article > h2[id], article > h3[id], article > h4[id], article > h5[id], article > h6[id]').forEach(function(elem) {
		const anchor = document.createElement('a');
		anchor.href = `#${elem.id}`;
		anchor.classList.add('anchor-link');
		anchor.title = "Link to this section";
		anchor.innerText = '🔗';
		elem.append(anchor);
	});
});