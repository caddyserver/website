// Load subscription info
$.get("/api/user-subscription").done(function(json) {
	updateSubscriptionInfo(json.subscription);
}).fail(function() {
	updateSubscriptionInfo(null);
});

// Load usage info  
$.get("/api/user-usage").done(function(json) {
	updateUsageInfo(json.usage);
}).fail(function() {
	updateUsageInfo(null);
});

// Track API-key state so we can show the plan's key allowance
let apiKeyState = { keys: [], limit: undefined, hasAPIAccess: undefined };

// Load API keys
$.get("/api/user-api-keys").done(function(json) {
	apiKeyState.keys = json.api_keys || [];
	renderApiKeys();
}).fail(function() {
	apiKeyState.keys = [];
	renderApiKeys();
});

// Entitlements remain available for subscriptions whose plans are no longer listed.
$.get("/api/user-subscription").done(function(json) {
	const sub = json && json.subscription;
	apiKeyState.hasAPIAccess = !!(sub && sub.api_access);
	apiKeyState.limit = sub ? sub.max_api_keys : 0; // -1 means unlimited
	renderApiKeys();
}).fail(function() {
	renderApiKeys();
});

function updateSubscriptionInfo(subscription) {
	const planInfo = $('#plan-info');
	const subscriptionActions = $('#subscription-actions');
	const cancelButton = $('#cancel-subscription');

	if (!subscription) {
		planInfo.html(`
			<div class="plan-details">
				<div class="plan-name">Free Plan</div>
				<div class="plan-limits">10 builds per month</div>
				<div class="plan-features">No API access</div>
			</div>
		`);
		subscriptionActions.show();
		cancelButton.hide();
	} else {
		const isActive = subscription.status === 'active' || subscription.status === 'trialing';
		const isPastDue = subscription.status === 'past_due';
		const statusClass = isPastDue ? 'status-warning' : (isActive ? 'status-active' : 'status-inactive');
		const cancelText = subscription.cancel_at_period_end ? ' (Will cancel at period end)' : '';
		
		planInfo.html(`
			<div class="plan-details">
				<div class="plan-name"></div>
				<div class="plan-status ${statusClass}"></div>
				<div class="plan-period">
					Period: <span class="period-start"></span> - <span class="period-end"></span>
				</div>
			</div>
		`);
		planInfo.find('.plan-name').text(subscription.plan_name);
		planInfo.find('.plan-status').text(`${subscription.status}${cancelText}`);
		planInfo.find('.period-start').text(new Date(subscription.current_period_start).toLocaleDateString());
		planInfo.find('.period-end').text(new Date(subscription.current_period_end).toLocaleDateString());
		
		subscriptionActions.show();
		if ((isActive || isPastDue) && !subscription.cancel_at_period_end) {
			cancelButton.show();
		} else {
			cancelButton.hide();
		}
	}
}

function updateUsageInfo(usage) {
	const usageStats = $('#usage-stats');
	
	if (!usage) {
		usageStats.html('<div>Unable to load usage information</div>');
		return;
	}
	
	const percent = usage.builds_limit > 0 ? (usage.builds_used / usage.builds_limit * 100) : 0;
	const limitText = usage.builds_limit === -1 ? 'Unlimited' : usage.builds_limit;
	
	usageStats.html(`
		<div class="usage-bar">
			<div class="usage-progress" style="width: ${Math.min(percent, 100)}%"></div>
		</div>
		<div class="usage-text">
			${usage.builds_used} / ${limitText} builds used this month
		</div>
		<div class="usage-period">
			Period: ${new Date(usage.period_start).toLocaleDateString()} - 
			${new Date(usage.period_end).toLocaleDateString()}
		</div>
	`);
}

function updateAPIKeys(apiKeys) {
	const table = $('#api-keys-table');
	// Remove existing rows except header
	table.find('tr:not(:first)').remove();
	
	if (apiKeys.length === 0) {
		table.append('<tr><td colspan="4" class="text-center">No API keys created yet</td></tr>');
		return;
	}
	
	apiKeys.forEach(key => {
		const lastUsed = key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never';
		const created = new Date(key.created).toLocaleDateString();
		const row = $('<tr>').attr('data-key-id', key.id);
		row.append($('<td>').text(key.name));
		row.append($('<td>').text(created));
		row.append($('<td>').text(lastUsed));
		row.append($('<td>').append($('<button type="button" class="revoke-api-key">').text('Revoke')));
		table.append(row);
	});
}

// renderApiKeys draws the key table and reflects the plan's key allowance,
// disabling the create button when the account has no API access or is at its
// plan's key limit.
function renderApiKeys() {
	updateAPIKeys(apiKeyState.keys);

	const $btn = $('#create-api-key');
	const $status = $('#api-key-allowance');
	const count = apiKeyState.keys.length;
	const limit = apiKeyState.limit;
	const hasAccess = apiKeyState.hasAPIAccess;

	if (hasAccess === undefined) {
		return; // allowance not resolved yet
	}

	if (!hasAccess) {
		$status.text('API access requires a paid plan with API access.');
		$btn.prop('disabled', true).attr('title', 'Upgrade to a plan with API access');
	} else if (limit === -1) {
		$status.text(`${count} API key${count === 1 ? '' : 's'} · unlimited on your plan`);
		$btn.prop('disabled', false).removeAttr('title');
	} else {
		$status.text(`${count} of ${limit} API keys used on your plan`);
		const atLimit = count >= limit;
		$btn.prop('disabled', atLimit).attr('title', atLimit ? 'Revoke a key or upgrade for more' : '');
	}
}

function loadSubscriptionPlans() {
	$.get('/api/subscription-plans').done(function(json) {
		showPlansModal(json.plans);
	}).fail(function(jqxhr) {
		swal({
			icon: "error",
			title: "Error",
			content: errorContent(jqxhr)
		});
	});
}

function showPlansModal(plans) {
	const container = $('#plans-container');
	container.empty();
	
	plans.forEach(plan => {
		let priceHtml;
		if (plan.price_cents === 0) {
			priceHtml = 'Free';
		} else {
			const dollars = Math.floor(plan.price_cents / 100);
			const cents = plan.price_cents % 100;
			priceHtml = `$${dollars}${cents > 0 ? '.' + cents.toString().padStart(2, '0') : ''}<span>/mo</span>`;
		}
		
		const buildsText = plan.monthly_builds === -1 ? 'Unlimited builds' : `${plan.monthly_builds} builds/month`;
		const apiText = plan.api_access ? 'API access' : 'No API access';
		let keysText = '';
		if (plan.api_access) {
			keysText = plan.max_api_keys === -1
				? 'Unlimited API keys'
				: `${plan.max_api_keys} API key${plan.max_api_keys === 1 ? '' : 's'}`;
		}
		const isPopular = plan.name === 'Enterprise';

		const planCard = $('<div>').addClass(`plan-card${isPopular ? ' popular' : ''}`).attr('data-plan-id', plan.id);
		planCard.append($('<h3>').text(plan.name));
		planCard.append($('<div class="plan-price">').html(priceHtml));
		planCard.append($('<div class="plan-description">').text(plan.description));
		const features = $('<div class="plan-features">');
		features.append($('<div>').text(buildsText));
		features.append($('<div>').text(apiText));
		if (keysText) features.append($('<div>').text(keysText));
		planCard.append(features);
		planCard.append($('<button type="button" class="select-plan">').text('Select Plan'));
		container.append(planCard);
	});
	
	$('#plans-modal').show();
}

// Event handlers for subscription features
$(function() {
	// Upgrade plan button
	$('#upgrade-plan').click(function() {
		loadSubscriptionPlans();
	});
	
	// Close modal
	$('#close-modal, #plans-modal').click(function(e) {
		if (e.target === this) {
			$('#plans-modal').hide();
		}
	});

	// Close payment modal
	$('#close-payment-modal, #payment-modal').click(function(e) {
		if (e.target === this) {
			$('#payment-modal').hide();
		}
	});
	
	// Select plan
	$(document).on('click', '.select-plan', function() {
		const planId = $(this).closest('.plan-card').data('plan-id');
		createSubscription(planId);
	});
	
	// Cancel subscription
	$('#cancel-subscription').click(function() {
		if (confirm('Are you sure you want to cancel your subscription?')) {
			cancelSubscription();
		}
	});
	
	// Create API key
	$('#create-api-key').click(function() {
		const name = prompt('Enter a name for your API key:');
		if (name) {
			createAPIKey(name);
		}
	});
	
	// Revoke API key
	$(document).on('click', '.revoke-api-key', function() {
		const keyId = $(this).closest('tr').data('key-id');
		if (confirm('Are you sure you want to revoke this API key?')) {
			revokeAPIKey(keyId);
		}
	});
});

function createSubscription(planId) {
	$('#plans-modal').hide();
	
	$.post('/api/create-subscription', {
		plan_id: planId
	}).done(function(json) {
		if (json.client_secret) {
			handleStripePayment(json.client_secret, json.message);
		} else {
			swal({
				icon: "success",
				title: "Plan Updated",
				text: json.message || "Your plan has been updated."
			}).then(function() {
				location.reload();
			});
		}
	}).fail(function(jqxhr) {
		swal({
			icon: "error",
			title: "Error",
			content: errorContent(jqxhr)
		});
	});
}

// Stripe.js is loaded lazily and cached; the publishable key is provided by the
// backend so it never has to be hard-coded in the frontend.
let stripePromise = null;
function getStripe() {
	if (!stripePromise) {
		stripePromise = $.get('/api/stripe-config').then(function(json) {
			if (!json || !json.publishable_key) {
				return Promise.reject(new Error("Stripe is not configured on the server."));
			}
			return Stripe(json.publishable_key);
		});
	}
	return Promise.resolve(stripePromise);
}

let stripeElements = null;

function handleStripePayment(clientSecret, message) {
	setPaymentMessage("");
	$('#payment-plan-summary').text(message || "Confirm your payment to complete this plan change.");
	getStripe().then(function(stripe) {
		const elements = stripe.elements({ clientSecret: clientSecret });
		stripeElements = elements;

		const paymentElement = elements.create('payment');
		$('#payment-element').empty();
		paymentElement.mount('#payment-element');

		$('#payment-modal').show();

		// (re)bind the form submit handler for this payment attempt
		$('#payment-form').off('submit').on('submit', function(e) {
			e.preventDefault();
			confirmStripePayment(stripe, elements);
		});
	}).catch(function(err) {
		swal({
			icon: "error",
			title: "Payment Unavailable",
			text: (err && err.message) || "Unable to initialize payment. Please try again later."
		});
	});
}

function confirmStripePayment(stripe, elements) {
	setPaymentLoading(true);
	setPaymentMessage("");

	stripe.confirmPayment({
		elements: elements,
		confirmParams: {
			return_url: window.location.href
		},
		redirect: 'if_required'
	}).then(function(result) {
		if (result.error) {
			setPaymentMessage(result.error.message || "Payment failed. Please check your card details and try again.");
			setPaymentLoading(false);
			return;
		}

		const intent = result.paymentIntent;
		if (intent && (intent.status === 'succeeded' || intent.status === 'processing')) {
			$('#payment-modal').hide();
			swal({
				icon: "success",
				title: "Subscription Active",
				text: intent.status === 'processing'
					? "Your payment is processing. Your subscription will activate once it clears."
					: "Thank you! Your subscription is now active."
			}).then(function() {
				location.reload();
			});
		} else {
			setPaymentMessage("Payment could not be completed. Please try another payment method.");
			setPaymentLoading(false);
		}
	}).catch(function() {
		setPaymentMessage("An unexpected error occurred while processing your payment.");
		setPaymentLoading(false);
	});
}

function setPaymentLoading(isLoading) {
	$('#submit-payment').prop('disabled', isLoading);
	$('#payment-spinner').toggle(isLoading);
	$('#payment-button-text').text(isLoading ? 'Processing…' : 'Pay & Subscribe');
}

function setPaymentMessage(msg) {
	const el = $('#payment-message');
	if (msg) {
		el.text(msg).show();
	} else {
		el.text("").hide();
	}
}

function cancelSubscription() {
	$.post('/api/cancel-subscription').done(function(json) {
		swal({
			icon: "success",
			title: "Subscription Cancelled",
			text: json.message || "Your subscription will be cancelled at the end of the billing period."
		}).then(function() {
			location.reload();
		});
	}).fail(function(jqxhr) {
		swal({
			icon: "error",
			title: "Error",
			content: errorContent(jqxhr)
		});
	});
}

function createAPIKey(name) {
	$.post('/api/create-api-key', {
		name: name
	}).done(function(json) {
		swal({
			icon: "success",
			title: "API Key Created",
			text: json.message,
			content: {
				element: "div",
				attributes: {
					innerHTML: `
						<p>Your API key:</p>
						<code style="background:#f0f0f0;padding:10px;display:block;margin:10px 0;word-break:break-all;">${json.key}</code>
						<p><strong>Important:</strong> Copy this key now. You won't be able to see it again.</p>
					`
				}
			}
		}).then(function() {
			location.reload();
		});
	}).fail(function(jqxhr) {
		swal({
			icon: "error",
			title: "Error",
			content: errorContent(jqxhr)
		});
	});
}

function revokeAPIKey(keyId) {
	$.post('/api/revoke-api-key', {
		key_id: keyId
	}).done(function(json) {
		swal({
			icon: "success",
			title: "API Key Revoked",
			text: json.message || "The API key has been revoked successfully."
		}).then(function() {
			location.reload();
		});
	}).fail(function(jqxhr) {
		swal({
			icon: "error",
			title: "Error",
			content: errorContent(jqxhr)
		});
	});
}
