<div id="module-list-container">
	<h1>All Modules</h1>
	<p>
		This page lists all registered Caddy modules. Modules are plugins which extend Caddy's <a href="/docs/json">JSON configuration structure</a>.
	</p>
	<p>
		We recommend using your browser's "Find in page" feature for quick lookups.
	</p>
	<table id="module-list">
		<tr>
			<th></th>
			<th>Module ID</th>
			<th>Description</th>
		</tr>
		<!--Populated by JS-->
	</table>
</div>

<div id="module-docs-container">
	<div class="pad"><h1 class="module-name"><!--Populated by JS--></h1></div>
	<div id="module-multiple-repos">
		There is more than one module named <b class="module-name"><!--Populated by JS--></b>. Choose one by its repository.
	</div>
	<div id="module-template" class="module-repo-container">
		<div class="module-repo-selector"></div>
		<article>
			{{include "/includes/docs/renderbox.html"}}
			{{include "/includes/docs/details.html"}}
		</article>
	</div>
</div>

{{include "/includes/docs/hovercard.html"}}