// AJQuery: https://github.com/coolaj86/ajquery.js (modified slightly by me)
function $_(sel, el) { return ((typeof el === 'string' ? $_(el) : el) || document).querySelector(sel); }
function $$_(sel, el) { return (el || document).querySelectorAll(sel); }

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
	const elem = $_(tplSelector);
	if (!elem) return;
	return elem.content.firstElementChild.cloneNode(true);
	// return document.importNode(elem.content, true);
}

// Find the first element matching a selector which contains the specified text
function findWithContent(selector, text) {
	const selected = document.querySelectorAll(selector);
	let found = null;
	selected.forEach(element => {
		if (element.textContent.includes(text)) {
			found = element;
		}
	});
	return found;
}

// Find the next element containing the specified text
function findNextText(startElement, nextText) {
	let currentElement = startElement.nextSibling;
	while (currentElement) {
		if (currentElement.textContent.includes(nextText)) {
			return currentElement;
		}
		currentElement = currentElement.nextSibling;
	}
	return null;
}

// Function to wrap the range between startElement and endElement in a new span
function wrapRangeWithSpan(startElement, endElement, className) {
    // Check if startElement and endElement are the same
    if (startElement === endElement) {
        const span = document.createElement('span');
        span.className = className;
        span.appendChild(startElement.cloneNode(true));
        startElement.parentNode.replaceChild(span, startElement);
        return span;
    }

    // Create a new span element
    const span = document.createElement('span');
    span.className = className;

    // Reference the parent node of the common ancestor
    const parent = startElement.parentNode;

    // Iterate through siblings and wrap them in the span
	const toRemove = [];
    for (var node = startElement; node; node = node.nextSibling) {
		var clonedNode = node.cloneNode(true);
		span.appendChild(clonedNode);
        if (node === endElement) {
			parent.replaceChild(span, endElement);
			toRemove.forEach(node => parent.removeChild(node));
            break;
        }
		toRemove.push(node);
    }

    return span;
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
	if (theme !== "light" && theme !== "dark" && theme !== "system") {
		theme = "system";
	}
	localStorage.setItem("theme", theme);
	ready(function() { $_('#current-theme').innerText = theme; });
	let lightOrDarkTheme = theme;
	if (lightOrDarkTheme == "system") {
		lightOrDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";	
	}
	applyTheme(lightOrDarkTheme);
}

// applyTheme simply adds or removes the 'dark' class to the HTML.
function applyTheme(lightOrDark) {
	if (lightOrDark == "dark") {
		$_('html').classList.add('dark');
	} else {
		$_('html').classList.remove('dark');
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


 

// hoversplash effect!
on('mouseover', '.button:not(.cool), button:not(.cool)', (e) => {
	const elem = document.createElement('span');
	elem.classList.add('hover-splash');

	// get coordinates relative to container
	const rect = e.target.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;

	elem.style.left = `${x}px`;
	elem.style.top = `${y}px`;

	e.target.append(elem);

	setTimeout(function() {
		elem.remove();
	}, 1000);
});


// mouseover highlights for feature sections that explain config
on('mouseover', '.rollover', e => {
	const target =  e.target.closest('.rollover') || e.target;
	$$_(`.${target.dataset.rollover}`).forEach(elem => elem.classList.add('show'));
});
on('mouseout', '.rollover', e => {
	const target =  e.target.closest('.rollover') || e.target;
	$$_(`.${target.dataset.rollover}`).forEach(elem => elem.classList.remove('show'));
});



// immediately set the configured theme to avoid flash
setTheme(getTheme());
