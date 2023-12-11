if (loggedIn()) window.location = '/account/';

$(function() {
	var qsParams = new URLSearchParams(window.location.search);
	var email = qsParams.get("email");
	var token = qsParams.get("token");
	$('input[name=email]').val(email);
	$('input[name=token]').val(token);
	if (email && token) showStep2();

	$('form input:visible').first().focus();

	$('#reset-password-step1').submit(function(event) {
		$('button').prop('disabled', false);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				icon: "info",
				title: "Check your email",
				text: "If we have an account with that email address, we just sent you some instructions."
			}).then(function() {
				window.location = '/';
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: error,
				content: errorContent(jqxhr)
			});
			$('button').prop('disabled', false);
		});

		return false;
	});

	$('#reset-password-step2').submit(function(event) {
		$('button').prop('disabled', false);

		$.post($(this).prop("action"), $(this).serialize()).done(function() {
			swal({
				icon: "success",
				title: "Reset completed",
				text: "You may now log in with your new password."
			}).then(function() {
				window.location = '/account/login';
			});
		}).fail(function(jqxhr, status, error) {
			swal({
				icon: "error",
				title: "Error",
				content: errorContent(jqxhr)
			});
			$('button').prop('disabled', false);
		});

		return false;
	});

	$('#goto-step1').click(function(event) {
		$('#reset-password-step2').hide('fast');
		$('#reset-password-step1').show('fast', function() {
			$('input:visible').first().focus();
		});
		return false;
	});
	$('#goto-step2').click(function(event) {
		showStep2();
		return false;
	});
});

function showStep2() {
	$('#reset-password-step1').hide('fast');
	$('#reset-password-step2').show('fast', function() {
		if ($('input[name=token]').val() != "")
			$('input[name=password]').focus();
		else
			$('input:visible').first().focus();
	});
}