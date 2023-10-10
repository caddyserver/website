const resp = fetch("/resources/testimonials.json").then(async resp => {
	const testimonials = await resp.json();
	console.log(testimonials);

	ready(function() {
		for (let i = 0; i < testimonials.length; i++) {
			const testimonial = testimonials[i];
			const tpl = cloneTemplate('#tpl-testimonial');
			$('.testimonial-picture', tpl).src = testimonial.picture || "";
			$('.testimonial-quote', tpl).innerText = `"${testimonial.quote}"`;
			$('.testimonial-name', tpl).innerText = testimonial.name || "";
			$('.testimonial-role', tpl).innerText = testimonial.role || "";
			$(`.testimonial-col:nth-child(${i%3 + 1})`).append(tpl);
		}
	});
});
