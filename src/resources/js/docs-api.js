// TODO: sanitize all HTML renderings, especially markdown: https://github.com/cure53/DOMPurify

var pageData = {}, pageDocs = {};

var $renderbox, $hovercard;

$(function() {
	$renderbox = $('#renderbox');
	$hovercard = $('#hovercard');

	var hoverTimeout;
	$hovercard.hover(function() {
		clearTimeout(hoverTimeout);
	}, function() {
		clearTimeout(hoverTimeout);
		$hovercard.removeClass('popup');
	});

	// toggle an object as expanded or collapsed
	$('#renderbox').on('click', '.toggle-obj', function() {
		if ($(this).hasClass('expanded')) {
			// collapse
			$(this).html('&#9656;');
		} else {
			// expand
			$(this).html('&#9662;');
		}
		$(this).nextUntil('.end-obj').toggleClass('collapsed');
		$(this).toggleClass('expanded');
	});

	$('body').on({
		mouseenter: function() {
			// don't allow hoverbox to close anymore, we're re-opening it
			clearTimeout(hoverTimeout);

			var pos = $(this).offset();

			// there is a gap between the hoverbox and the link that originated it;
			// there may be a different link in this gap; if the hover box is visible,
			// then we should ignore the hover on this link to allow cursor to visit
			// the hoverbox if that is where it is going; this makes it possible to
			// visit the hoverbox while it is over a list of links that are tightly
			// stacked vertically; if user wants to visit hoverbox for link in this
			// gap, they can just move the cursor slow enough to fire the timeout
			if ($hovercard.is(':visible') && $hovercard.offset().top - 10 < pos.top) {
				return;
			}

			// fill out hovercard

			var elemPath = $(this).data('path');
			var modNamespace = $(this).data('namespace');

			$('.hovercard-elem').hide();

			if ($(this).hasClass('module')) {
				// module
				var $list =$('<div/>');
				if (pageData.namespaces && pageData.namespaces[modNamespace]) {
					for (var i = 0; i < pageData.namespaces[modNamespace].length; i++) {
						var modInfo = pageData.namespaces[modNamespace][i];
						var href = canTraverse() ? '.'+elemPath+'/'+modInfo.name+'/' : './'+modNamespace+'.'+modInfo.name;
						$list.append('<a href="'+href+'" class="module-link">'+modInfo.name+'<span class="module-link-description">'+truncate(modInfo.docs, 115)+'</span></a>');
					}
				}
				$('#hovercard-module-list').html($list);
				$('#hovercard-namespace').text(modNamespace)
				$('#hovercard-module').show();
				
			} else if ($(this).hasClass('module-inline-key')) {
				// inline key
				$('#hovercard-inline-key').show();
				
			} else if ($(this).hasClass('breadcrumb')) {
				// breadcrumb siblings
				
				var siblingPath = $(this).data('sibling-path');
				var bcVal = pageData.breadcrumb[siblingPath];
				var bcSiblings = [];

				// drill down to the true underlying type
				while (bcVal.elems) {
					bcVal = bcVal.elems;
				}
				
				switch (bcVal.type) {
				case "struct":
					for (var j = 0; j < bcVal.struct_fields.length; j++) {
						var sf = bcVal.struct_fields[j];
						bcSiblings.push({name: sf.key, path: siblingPath})
					}
					break;

				case "module":
				case "module_map":
					for (var j = 0; j < pageData.namespaces[bcVal.module_namespace].length; j++) {
						var mod = pageData.namespaces[bcVal.module_namespace][j];
						bcSiblings.push({name: mod.name, path: siblingPath})
					}
				}

				var $siblings = $('<div class="breadcrumb-siblings"/>').append('<div class="breadcrumb-siblings-title">Siblings:</div>');
				for (var j = 0; j < bcSiblings.length; j++) {
					var sib = bcSiblings[j];
					var sibPath = sib.path;
					if (sibPath) {
						sibPath += "/";
					}
					sibPath += sib.name+"/";
					$siblings.append('<a href="'+jsonDocsPathPrefix+sibPath+'">'+sib.name+'</a>');
				}
				$('#hovercard-breadcrumb-siblings').html($siblings).show();

			} else if ($(this).hasClass('documented')) {
				// docs
				var elemDocs = truncate(pageDocs[elemPath], 500);
				if (!elemDocs) {
					elemDocs = '<p class="explain">There are no docs for this property.</p>';
					return;
				}
				$('#hovercard-docs').html(markdown(elemDocs)).show();
				$('#hovercard-inline-link').html('<a href="#'+elemPath.substr(1)+'">View docs below &#8595;</a>').show();
			}

			// show hoverbox for this link
			var height = $(this).height();
			var linkWidth = $(this).width();
			var boxWidth = $hovercard.width();
			$hovercard.css({
				'top': pos.top + height*1.5 + 10, // '+10' counters 'translateY(-10px)'
				'left': pos.left + (linkWidth/2) - (boxWidth/2)
			}).addClass('popup');
		},
		mouseleave: function() {
			// don't hide the hoverbox right away; user might need a
			// few milliseconds to get the cursor over the hovercard
			hoverTimeout = setTimeout(function() {
				$hovercard.removeClass('popup');
			}, 200);
		}
	}, '.has-popup');
});


function beginRendering(json) {
	pageData = json;
	console.log("DATA:", pageData);
	
	if (pageData.structure.doc) {
		// for most types, just render their docs
		$('#top-doc').html(markdown(pageData.structure.doc));
	} else if (pageData.structure.elems) {
		// for maps or arrays, fall through to the underlying type
		$('#top-doc').html(markdown(pageData.structure.elems.doc));
	}
	$('#top-doc').append(makeSubmoduleList("", pageData.structure));

	renderData(pageData.structure, 0, "", $('<div class="group"/>'));
	console.log("DOCS:", pageDocs);

	if ($('#field-list-contents').html().trim()) {
		$('#field-list').show();
	}

	// if the browser tried to navigate directly to an element
	// on the page when it loaded, it would have failed since
	// we hadn't rendered it yet; but now we can scroll to it
	// directly since rendering has finished
	if (window.location.hash) {
		window.location.hash = window.location.hash;
	}
}

function renderData(data, nesting, path, $group) {
	switch (data.type) {
	case "struct":
		$group.append('{<a href="javascript:" class="toggle-obj expanded" title="Collapse/expand">&#9662;</a>');
		nesting++;

		var $fieldGroup = $('<div class="group"/>');
		renderModuleInlineKey(data, nesting, $fieldGroup);
		$group.append($fieldGroup);
		if (data.struct_fields) {
			// TODO: Not sure if sorting the struct fields is a good idea...
			// data.struct_fields.sort(function(a, b) {
			// 	if (a.key > b.key) return 1;
			// 	if (b.key > a.key) return -1;
			// 	return 0;
			// });
			for (var i = 0; i < data.struct_fields.length; i++) {
				var field = data.struct_fields[i];
				var fieldPath = path+"/"+field.key;
				var cleanFieldPath = fieldPath.slice(1); // trim leading slash

				// store the docs for this path
				let linkClass = "documented";
				if (field.doc) {
					pageDocs[fieldPath] = field.doc;
					linkClass += " has-popup";
				}

				// render the docs to the page
				var fieldDoc = markdown(field.doc) || '<p class="explain">There are no docs for this property.</p>';
				fieldDoc += makeSubmoduleList(fieldPath, field.value);
				appendToFieldDocs(cleanFieldPath, fieldDoc);

				// render the field to the JSON box
				var $fieldGroup = $('<div class="group"/>');
				indent(nesting, $fieldGroup);
				var keyATag = '<a ';
				if (canTraverse()) {
					keyATag += 'href=".'+fieldPath+'/" ';
				}
				keyATag += 'data-path="'+fieldPath+'" class="'+linkClass+'">'+field.key+'</a>';
				$fieldGroup.append('<span class="qu">"</span><span class="key">'+keyATag+'</span><span class="qu">"</span>: ');
				renderData(field.value, nesting, fieldPath, $fieldGroup);
				if (i < data.struct_fields.length-1) {
					$fieldGroup.append(',');
				}
				$group.append($fieldGroup);
			}
		}
		nesting--;
		indent(nesting, $group);
		$group.append('<span class="end-obj">}</span>');
		break;

	case "bool":
		$group.append('<span class="bool">false</span>'); // TODO: default value?
		break;

	case "int":
	case "uint":
	case "float":
	case "complex":
		$group.append('<span class="num">0</span>'); // TODO: default value?
		break;

	case "string":
		$group.append('<span class="qu">"</span><span class="str"></span><span class="qu">"</span>'); // TODO: default value?
		break;

	case "array":
		$group.append('[');
		if (data.elems.type == "module_map") {
			$group.append('{<a href=".'+path+'/" class="module has-popup" data-namespace="'+(data.elems.module_namespace || '')+'" data-path="'+path+'">&bull;&bull;&bull;</a>}');
		} else {
			renderData(data.elems, nesting, path, $group);
		}
		$group.append(']');
		break;

	case "map":
		$group.append('{\n')
		nesting++;
		renderModuleInlineKey(data, nesting, $group);
		indent(nesting, $group);
		renderData(data.map_keys, nesting, path, $group);
		$group.append(': ');
		renderData(data.elems, nesting, path, $group);
		$group.append('\n');
		nesting--;
		indent(nesting, $group);
		$group.append('}');
		break;

	case "module":
	case "module_map":
		var aTag = '<a';
		if (canTraverse()) {
			aTag += ' href=".'+path+'/"';
		}
		aTag += ' class="module has-popup" data-namespace="'+(data.module_namespace || '')+'" data-path="'+path+'">&bull;&bull;&bull;</a>';
		$group.append('{'+aTag+'}');
		break;
	}

	$renderbox.append($group);
}

function renderModuleInlineKey(data, nesting, $group) {
	if (!data.module_inline_key) {
		return
	}
	var moduleName = pathComponents[pathComponents.length-2];
	indent(nesting, $group);
	$group.append('<span class="qu">"</span><span class="key module-inline-key has-popup">'+data.module_inline_key+'</span><span class="qu">"</span>: <span class="qu">"</span><span class="str"><b>'+moduleName+'</b></span><span class="qu">"</span>');
	if (data.struct_fields && data.struct_fields.length > 0) {
		$group.append(',');
	}
	$group.append('\n');

	appendToFieldDocs(data.module_inline_key, $('#hovercard-inline-key').html());
}

function appendToFieldDocs(cleanFieldPath, fieldDoc) {
	var dt = cleanFieldPath;
	if (canTraverse()) {
		dt = '<a href="./'+cleanFieldPath+'/">'+dt+'</a>';
	}
	$('#field-list-contents').append('<dt class="field-name" id="'+cleanFieldPath+'"><a href="#'+cleanFieldPath+'" class="inline-link">&#128279;</a>'+dt+'</dt> <dd>'+fieldDoc+'</dd>');
}

function indent(nesting, $group) {
	var $span = $('<span class="indent"></span>');
	$span.append('\t'.repeat(nesting));
	$group.append($span);
}

function truncate(str, len) {
	if (!str) return "";
	var startLen = str.length;
	str = str.substring(0, len);
	if (startLen > len) {
		str += "...";
	}
	return str;
}

function makeSubmoduleList(path, value) {
	while (value.elems) {
		value = value.elems;
	}
	if (value.type != "module" && value.type != "module_map") {
		return '';
	}
	var submodList = '<ul>';
	if (pageData.namespaces && pageData.namespaces[value.module_namespace]) {
		for (var j = 0; j < pageData.namespaces[value.module_namespace].length; j++) {
			var submod = pageData.namespaces[value.module_namespace][j];
			var href = canTraverse() ? '.'+path+'/'+submod.name+'/' : './'+value.module_namespace+'.'+submod.name;
			submodList += '<li><a href="'+href+'">'+submod.name+'</li>';
		}
	}
	submodList += '</ul>';
	return '<div><p>Fulfilled by modules in namespace: <b>'+value.module_namespace+'</b></p>'+submodList+'</div>';
}

// canTraverse returns true if the page data
// includes breadcrumbs; i.e. we are on a page
// that can traverse the JSON structure, not
// only render part of it in isolation.
function canTraverse() {
	return pageData.breadcrumb != null;
}

function markdown(input) {
	if (!input) {
		return "";
	}
	return marked(input);
}