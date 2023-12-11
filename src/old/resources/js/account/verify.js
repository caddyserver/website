if (loggedIn()) window.location = '/account/';

$(function() {
	$('form input').first().focus();

	$('form').submit(function(event) {
		$('#submit').prop('disabled', true);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				icon: "success",
				title: "Account confirmed",
				text: "Thank you. You may now log in and use your account!"
			}).then(function() {
				window.location = "/account/login";
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: error,
				content: errorContent(jqxhr)
			});
			$('#submit').prop('disabled', false);
		});

		return false;
	});

	// if info is in the query string, fill use and submit it
	var qsParams = new URLSearchParams(window.location.search);
	var email = qsParams.get("email");
	var acct = qsParams.get("code");
	$('input[name=email]').val(email);
	$('input[name=account_id]').val(acct);
	if (email && acct) $('form').submit();
});