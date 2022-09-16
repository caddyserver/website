if (!loggedIn()
	&& window.location.pathname != '/account/login'
	&& window.location.pathname != '/account/create'
	&& window.location.pathname != '/account/verify'
	&& window.location.pathname != '/account/reset-password') {
	window.location = '/account/login?redir='+encodeURIComponent(window.location);
}

$(function() {
	// highlight current page in left nav
	var $currentPageLink = $('.container > nav a[href="'+window.location.pathname+'"]');
	$currentPageLink.addClass('current');

	// shortcut any logout links to make the POST directly
	$('a[href="/account/logout"]').click(function() {
		logout();
		return false;
	});
});



function loggedIn() {
	return document.cookie.indexOf('user=') > -1;
}

function logout() {
	$.post('/api/logout').done(function() {
		window.location = '/';
	}).fail(function(jqxhr, status, error) {
		document.cookie = 'user=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		swal({
			icon: "error",
			title: error,
			content: errorContent(jqxhr)
		}).then(function() {
			window.location = '/account/'
		});
	});
}

function errorContent(jqxhr) {
	var div = document.createElement('div');
	var p1 = document.createElement('p');
	p1.appendChild(document.createTextNode("Sorry, something went wrong:"));
	div.appendChild(p1);

	var p2 = document.createElement('p');
	var p2b = document.createElement('b');
	p2b.appendChild(document.createTextNode(jqxhr.responseJSON ? jqxhr.responseJSON.error.message : jqxhr.status + " " + jqxhr.statusText));
	p2.appendChild(p2b)
	div.appendChild(p2);

	if (jqxhr.responseJSON) {
		var p3 = document.createElement('p');
		p3.appendChild(document.createTextNode("Please include this error ID if reporting:"));
		p3.appendChild(document.createElement('br'));
		p3.appendChild(document.createTextNode(jqxhr.responseJSON.error.id));
		div.appendChild(p3);
	}

	return div;
}