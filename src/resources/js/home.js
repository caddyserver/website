const resp = fetch("/resources/testimonials.json").then(async resp => {
	const testimonials = await resp.json();

	ready(function() {
		for (let i = 0; i < testimonials.length; i++) {
			const testimonial = testimonials[i];
			const tpl = cloneTemplate('#tpl-testimonial');
			$_('.testimonial-picture', tpl).src = testimonial.picture || "";
			$_('.testimonial-quote', tpl).innerText = `"${testimonial.quote}"`;
			if (testimonial.name) {
				$_('.testimonial-name', tpl).innerText = testimonial.name || "";
			} else {
				$_('.testimonial-name', tpl).innerText = ` @${testimonial.username}`;
			}
			if (testimonial.link) {
				$_('.testimonial-name', tpl).href = testimonial.link;
			}
			$_('.testimonial-role-text', tpl).innerText = testimonial.role || "";
			if (testimonial.org) {
				console.log($_('.testimonial-org', tpl), tpl);
				// $_('.testimonial-role', tpl).prepend(document.createElement("br"));
				$_('.testimonial-org', tpl).innerText = testimonial.org;
				if (testimonial.org_link) {
					$_('.testimonial-org', tpl).href = testimonial.org_link;
				}
			}
			$_(`.testimonial-col:nth-child(${i%3 + 1})`).append(tpl);
		}
	});
});
