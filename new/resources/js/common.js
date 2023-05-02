// AJQuery: https://github.com/coolaj86/ajquery.js (modified slightly by me)
function $(sel, el) { return ((typeof el === 'string' ? $(el) : el) || document).querySelector(sel); }
function $$(sel, el) { return (el || document).querySelectorAll(sel); }

function ready(fn) {
	if (document.readyState !== 'loading') {
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

function on(eventName, elemSelector, handler, capture) {
	let events = [eventName];
	if (eventName.indexOf(',') >= 0) {
		events = eventName.split(',');
	}

	events.forEach(eventName => {
		// from youmightnotneedjquery.com
		document.addEventListener(eventName.trim(), function (e) {
			// loop parent nodes from the target to the delegation node
			for (let target = e.target; target && target != this; target = target.parentNode) {
				if (NodeList.prototype.isPrototypeOf(elemSelector)) {
					for (el of elemSelector) {
						if (el == target) {
							handler.call(target, e);
							return;
						}
					}
				} else if (!elemSelector || target.matches(elemSelector)) {
					handler.call(target, e);
					return;
				}
			}
		}, capture); // I find capture=true helpful when using :not() selectors to exclude one elem of the node tree
	});
}


// cloneTemplate does a deep clone of the <template> tag selected by tplSelector.
function cloneTemplate(tplSelector) {
	// Ohhhhhh wow, we need to use firstElementChild when cloning the content of a template tag (!!!!):
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template#avoiding_documentfragment_pitfall
	// I spent way too long on this.
	const elem = $(tplSelector);
	if (!elem) return;
	return elem.content.firstElementChild.cloneNode(true);
	// return document.importNode(elem.content, true);
}

ready(function() {
	// on page load, immediately set the configured theme
	setTheme(getTheme());

	const autonav = $('#autonav');

	// when a left-side-nav-link is hovered, show the in-page nav in a popout to the side
	on('mouseover', 'main nav li a:not(#autonav a)', async e => {
		const response = await fetch("/temporary-markdown-proxy"+e.target.getAttribute('href'));
		const markdown = await response.text();
		const tokens = marked.lexer(markdown);

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
		
		if ($('#autonav *')) {
			const sections = document.createElement('div')
			sections.classList.add('heading');
			sections.innerText = 'Sections';
			autonav.prepend(sections);
			e.target.closest('li').append(autonav);
		} else {
			// no links, so remove it from nav so as not to display an empty box
			$('body').append(autonav);
		}

	});

	const spacingMS = 50;
	let delay = spacingMS;
	$$('main article h2').forEach(elem => {
		const a = document.createElement('a');
		a.innerText = elem.innerText;
		a.href = `#${elem.id}`;
		setTimeout(function() {
			$('#pagenav').append(a);
		}, delay);
		delay += spacingMS;
	});
});

function anchorID(text) {
	return text.trim().toLowerCase().replace(/\s/g, '-').replace(/[^\w-]/g, '');
}


// when the system theme changes, apply that to our site if system theme is configured
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
	if (getTheme() == "system") {
		applyTheme(matches ? "dark" : "light");
	}
});

// getTheme returns the configured theme.
function getTheme() {
	return localStorage.getItem("theme") || "system";
}

// setTheme changes the configured theme to light, dark, or system and applies it.
function setTheme(theme) {
	localStorage.setItem("theme", theme);
	$('#current-theme').innerText = theme;
	if (theme == "system") {
		theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";	
	}
	applyTheme(theme);
}

// applyTheme simply adds or removes the 'dark' class to the HTML.
function applyTheme(lightOrDark) {
	if (lightOrDark == "dark") {
		$('html').classList.add('dark');
		$('#logo').src = '/resources/images/logo-dark.svg';
	} else {
		$('html').classList.remove('dark');
		$('#logo').src = '/resources/images/logo-light.svg';
	}
}

// nextTheme switches to the next theme in the rotation.
function nextTheme() {
	let theme = getTheme();
	if (theme == "system") {
		theme = "light";
	} else if (theme == "light") {
		theme = "dark";
	} else if (theme == "dark") {
		theme = "system";
	}
	setTheme(theme);
}