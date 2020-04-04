// We want to run this as early as possible
(function() {
	// Grab the cached preferred color scheme
	let cachedPref = localStorage.getItem('prefers-color-scheme');

	// Grab the current preferred color scheme
	let currentPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

	// If the preferred color scheme has changed since last page load
	if (cachedPref !== currentPref) {
		// We clear the toggle's value so it doesn't override the system choice
		localStorage.removeItem('dark-mode-toggle');
	}

	// Set the preferred color scheme so it can be checked on a future page load
	localStorage.setItem('prefers-color-scheme', currentPref);
})();

document.addEventListener('DOMContentLoaded', function() {
	// Algolia search
	docsearch({
		apiKey: '14275a785f6ebd31d162f9d2d8fc0125',
		indexName: 'caddyserver',
		inputSelector: '#search',
		debug: false // Set debug to true if you want to inspect the dropdown
	});
});
