ready(async function() {
	const resp = await fetch("/resources/testimonials.json");
  	const testimonials = await resp.json();
	console.log(testimonials);
});