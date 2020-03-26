document.addEventListener('DOMContentLoaded', function() {
	// Algolia search
	docsearch({
		apiKey: '14275a785f6ebd31d162f9d2d8fc0125',
		indexName: 'caddyserver',
		inputSelector: '#search',
		debug: true // Set debug to true if you want to inspect the dropdown
	});
});
