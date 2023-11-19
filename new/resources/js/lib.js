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

function trigger(el, eventType) {
	if (typeof el === 'string') {
		el = $_(el); // assume it was a selector, for convenience
	}

	// from youmightnotneedjquery.com
	if (typeof eventType === 'string' && typeof el[eventType] === 'function') {
		el[eventType]();
	} else {
		const event =
			typeof eventType === 'string'
				? new Event(eventType, { bubbles: true, cancelable: true })
				: eventType;
		el.dispatchEvent(event);
	}
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

// isVisible returns true if elem (an element or selector) is visible.
function isVisible(elem) {
	if (typeof elem === 'string') {
		elem = $_(elem);
	}
	return elem.offsetParent !== null;
}

// queryParam returns the named query string parameter's value(s).
function queryParam(name) {
	const urlSearchParams = new URLSearchParams(window.location.search);
	const params = Object.fromEntries(urlSearchParams.entries());
	return params[name];
}
