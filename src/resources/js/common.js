document.addEventListener('DOMContentLoaded', function() {
	// Algolia search
	docsearch({
		apiKey: '14275a785f6ebd31d162f9d2d8fc0125',
		indexName: 'caddyserver',
		inputSelector: '#search',
		debug: false // Set debug to true if you want to inspect the dropdown
	});
});

const caddyImportPath = 'github.com/caddyserver/caddy/v2';

function isStandard(packagePath) {
	return packagePath.startsWith(caddyImportPath);
}

function truncate(str, maxLen) {
	if (!str) return "";
	str = str.trim();
	let firstPeriod = str.match(/\.(\s|$)/); // first dot not in the middle of a word, or at end of string
	let terminate = firstPeriod ? firstPeriod.index+1 : str.length;
	str = str.substring(0, terminate);
	if (str.length <= maxLen) {
		return str;
	}
	return str+"...";
}

function moduleDocsPreview(mod, maxLen) {
	if (!mod || !mod.docs) return "";
	let short = truncate(mod.docs, maxLen);
	if (short.indexOf(mod.name) === 0) {
		short = short.substr(mod.name.length).trim();
	}
	return short;
}