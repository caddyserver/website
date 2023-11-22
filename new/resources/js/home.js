const resp = fetch("/resources/testimonials.json").then(async resp => {
	const testimonials = await resp.json();
	console.log(testimonials);

	ready(function() {
		for (let i = 0; i < testimonials.length; i++) {
			const testimonial = testimonials[i];
			const tpl = cloneTemplate('#tpl-testimonial');
			$_('.testimonial-picture', tpl).src = testimonial.picture || "";
			$_('.testimonial-quote', tpl).innerText = `"${testimonial.quote}"`;
			if (testimonial.username) {
				$_('.testimonial-name', tpl).innerText = ` @${testimonial.username}`;
			} else {
				$_('.testimonial-name', tpl).innerText = testimonial.name || "";
			}
			$_('.testimonial-role', tpl).innerText = testimonial.role || "";
			if (testimonial.org) {
				$_('.testimonial-role', tpl).appendChild(document.createElement("br"));
				$_('.testimonial-role', tpl).appendChild(document.createTextNode(testimonial.org));
			}
			$_(`.testimonial-col:nth-child(${i%3 + 1})`).append(tpl);
		}
	});
});
