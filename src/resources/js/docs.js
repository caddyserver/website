ready(function() {
	// highlight current page in left nav
	let currentPageLink = $_('main nav a[href="'+window.location.pathname+'"]');
	if (window.location.pathname.startsWith("/docs/json/")) {
		// as a special case, highlight the JSON structure link anywhere within it
		currentPageLink = $_('main nav a[href="/docs/json"]');
	}
	if (window.location.pathname.startsWith("/docs/modules/")) {
		// as another special case, highlight the modules link anywhere within it
		currentPageLink = $_('main nav a[href="/docs/modules"]');
	}
	currentPageLink?.classList?.add('current');

	// generate in-page nav before adding anchor links to headings;
	// only show sidebar if there are any navigable headers
	// TODO: support h3 too
	const spacingMS = 50;
	let delay = spacingMS;
	const h2elems = $$_('main article h2');
	if (h2elems.length) {
		$_('#pagenav .heading').style.display = 'block';
		h2elems.forEach(elem => {
			const a = document.createElement('a');
			a.innerText = elem.innerText;
			a.href = `#${elem.id}`;
			setTimeout(function() {
				$_('#pagenav').append(a);
			}, delay);
			delay += spacingMS;
		});
	}

	// add anchor links, inspired by https://github.com/bryanbraun/anchorjs
	$$_('article > h2[id], article > h3[id], article > h4[id], article > h5[id], article > h6[id]').forEach(function(elem) {
		const anchor = document.createElement('a');
		anchor.href = `#${elem.id}`;
		anchor.classList.add('anchor-link');
		anchor.title = "Link to this section";
		anchor.innerText = '🔗';
		elem.append(anchor);
	});

	// the server-side markdown renderer annoyingly renders
	// colored code blocks differently from plain ones, in that
	// colorized ones do not have the additional <code> inside
	// the <pre>; this line finds those and adds a .chroma class
	// to the outer pre element, and our CSS file has a style to
	// ensure the inner code block does not produce extra padding
	$$_('article > pre:not(.chroma) > code:not(.cmd)').forEach(function(elem) {
		elem.parentElement.classList.add('chroma');
	});

	// Add links to Caddyfile directive tokens in code blocks.
	// See include/docs-head.html for the whitelist bootstrapping logic
	$$_('pre.chroma .k').forEach(item => {
		if (window.CaddyfileDirectives.includes(item.innerText) || item.innerText === '<directives...>') {
			let text = item.innerText;
			let url = text === '<directives...>'
				? '/docs/caddyfile/directives'
				: '/docs/caddyfile/directives/' + text;
			text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
			item.innerHTML = `<a href="${url}" style="color: inherit;" title="Directive">${text}</a>`;
		}
	});

	// Add links to [<matcher>] or named matcher tokens in code blocks.
	// The matcher text includes <> characters which are parsed as HTML,
	// so we must use text() to change the link text.
	$$_('pre.chroma .nd').forEach(item => {
		let text = item.innerText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
		item.innerHTML = `<a href="/docs/caddyfile/matchers#syntax" style="color: inherit;" title="Matcher token">${text}</a>`;
	});

	// Add links to [<matcher>] or named matcher tokens in code blocks.
	// The matcher text includes <> characters which are parsed as HTML,
	// so we must use text() to change the link text.
	const matcherElements = [
		...$$_('pre.chroma .s'),
	].filter(item =>
		item.innerText.includes('<response_matcher>') ||
		item.innerText.includes('<inline_response_matcher>')
	);

	matcherElements.forEach(item => {
		const anchor = document.createElement("a");
		anchor.href = "/docs/caddyfile/response-matchers#syntax";
		anchor.style.color = "inherit";
		anchor.title = "Response matcher token";
		item.replaceWith(anchor);
		anchor.appendChild(item);
	});

	// Wrap all tables in a div so we can apply overflow-x: scroll
	$$_('table').forEach(table => {
		const wrapper = document.createElement('div');
		wrapper.className = 'table-wrapper';
		table.parentNode.insertBefore(wrapper, table);
		wrapper.appendChild(table);
	});


	// navigation aids
	const autonav = $_('#autonav');

	// when a left-side-nav-link is hovered, show the in-page nav in a popout to the side
	on('mouseover', 'main nav li a:not(#autonav a)', async e => {
		// only show the pop-out nav if not on mobile/narrow screen
		if ($_('#docs-menu').offsetParent != null) {
			return;
		}

		// transform user-facing URL to direct link to markdown file for the hover submenu
		let href = e.target.getAttribute('href');
		const trimPrefix = "/docs/";
		if (href.startsWith(trimPrefix)) {
			href = href.slice(trimPrefix.length);
		}

		const response = await fetch(`/docs/markdown/${href}.md`);
		const markdown = await response.text();
		const tokens = marked.lexer(markdown);

		// empty the container
		autonav.replaceChildren();
		
		let seenH1 = false;
		for (const tkn of tokens) {
			if (tkn.type != "heading") continue;
			if (tkn.depth == 1) {
				seenH1 = true;
			}
			if (!seenH1 || tkn.depth != 2) continue;

			// this includes HTML entities like &lt; (i.e. not user-facing text), but
			// that's how the server-side markdown renderer does it too ¯\_(ツ)_/¯
			const anchor = anchorID(tkn.text);

			const a = document.createElement('a');
			a.classList.add('autonav-link');
			a.innerHTML = marked.parseInline(tkn.text);
			a.href = `${e.target.href}#${anchor}`;
			autonav.append(a);
		}
		
		if ($_('#autonav *')) {
			const sections = document.createElement('div')
			sections.classList.add('heading');
			sections.innerText = 'Sections';
			autonav.prepend(sections);
			e.target.closest('li').append(autonav);
			autonav.style.display = ''; // unhide the container
		} else {
			// no links; hide the container so we don't see an empty box
			autonav.style.display = 'none';
		}

	});

	// toggle an object as expanded or collapsed
	on('click', '.renderbox .toggle-obj', function(event) {
		if (event.target.classList.contains('expanded')) {
			event.target.innerHTML = '&#9656;'; // collapse
		} else {
			event.target.innerHTML = '&#9662;'; // expand
		}
		let el = event.target.nextElementSibling;
		while (el && !el.matches('.end-obj')) {
			el.classList.toggle('collapsed');
			el = el.nextElementSibling;
		}
		// event.target.nextUntil('.end-obj').classList.toggle('collapsed');
		event.target.classList.toggle('expanded');
	});
});


// addLinkaddLinksToSubdirectivessToAnchors finds all the ID anchors
// in the article, and turns any directive or subdirective span into
// links that have an ID on the page. This is opt-in for each page,
// because it's not necessary to run everywhere.
function addLinksToSubdirectives() {
	let anchors = Array.from($$_('article *[id]')).map(el => el.id);
	$$_('pre.chroma .k').forEach(item => {
		if (anchors.includes(item.innerText)) {
			let text = item.innerText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
			let url = '#' + item.innerText;
			item.innerHTML = `<a href="${url}" style="color: inherit;" title="${text}">${text}</a>`;
		}
	});
}

// toggle left-nav when menu link is clicked
on('click', '#docs-menu', e => {
	const nav = $_('#docs-menu-container');
	if (!nav.offsetHeight) {
		nav.style.height = `${nav.scrollHeight}px`;
	} else {
		nav.style.height = 0;
	}
});

function anchorID(text) {
	return text.trim().toLowerCase().replace(/\s/g, '-').replace(/[^\w-]/g, '');
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

const caddyImportPath = 'github.com/caddyserver/caddy/v2';

function isStandard(packagePath) {
	return packagePath.startsWith(caddyImportPath);
}

// splitTypeName splits a fully qualified type name into
// its package path and type name components, for example:
// "github.com/foo/bar.Type" => "github.com/foo/bar" and "Type".
function splitTypeName(fqtn) {
	let lastDotPos = fqtn.lastIndexOf('.');
	let pkg = fqtn.substr(0, lastDotPos);
	let typeName = fqtn.substr(lastDotPos+1);
	return {pkg: pkg, typeName: typeName};
}

function stripScheme(url) {
	return url.substring(url.indexOf("://")+3);
}

