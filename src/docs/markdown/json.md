<div id="json-docs-container" class="fullspan">
	<div class="breadcrumbs">
		<!--Populated by JS-->
	</div>
	{{include "/includes/docs/renderbox.html"}}
	{{include "/includes/docs/details.html"}}
</div>

{{include "/includes/docs/hovercard.html"}}

<style>
	article {
		padding-top: 0 !important;
	}

	article h1 {
		padding-top: 8%;
	}

	.renderbox {
		border-radius: 0;
		font-size: 20px;
		line-height: 1.6em;
	}

	pre > code.json {
		border-radius: 10px;
	}

	@media (prefers-color-scheme: dark) {
		pre > code.json {
			background-color: #30caec0f;
		}
	}
</style>