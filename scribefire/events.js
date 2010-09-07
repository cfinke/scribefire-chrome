var windowWidth = 0;

$(window).load(function () {
	windowWidth = $(window).width();
});

var editor = {
	val : function (new_val) {
		if (typeof new_val != 'undefined') {
			if (switchEditors.mode == 'tinymce') {
				tinyMCE.get('text-content').setContent(switchEditors._wp_Autop(new_val));
			}
			else {
				$("#text-content").val(switchEditors._wp_Nop(new_val));
			}
		}
		else {
			if (switchEditors.mode == 'tinymce') {
				return tinyMCE.get('text-content').getContent().replace(/^\s+|\s+$/g, "");
			}
			else {
				return switchEditors._wp_Autop($("#text-content").val().replace(/^\s+|\s+$/g, ""));
			}
		}
	}
};

var accountWizardBlog = {};

function getTimestamp() {
	if ($("#text-datestamp-year").val() === "" || !$("#text-datestamp-day").val() || $("#text-timestamp-hour").val() === "" || $("#text-timestamp-minute").val() === "") {
		return false;
	}
	
	var datestamp = $("#text-datestamp-year").val() + "-" + $("#list-datestamp-month").val() + "-" + $("#text-datestamp-day").val();
	var timestamp = pad(Math.max(0, $("#text-timestamp-hour").val())) + ":" + pad(Math.max(0, $("#text-timestamp-minute").val())) + ":00";
	
	return datestamp + " " + timestamp;
}

function setTimestamp(date) {
	if (date instanceof Date) {
		date = phpdate(date, "Y-m-d H:i");
	}
	
	if (date) {
		var parts = date.split(/[^0-9]/);
		
		$("#text-datestamp-year").val(parts[0]);
		$("#list-datestamp-month").val(parts[1]);
		$("#text-datestamp-day").val(parts[2]);
		$("#text-timestamp-hour").val(parts[3]);
		$("#text-timestamp-minute").val(parts[4]);
	}
	else {
		$("#text-datestamp-year").val("");
		$("#text-datestamp-month").val("");
		$("#text-datestamp-day").val("");
		$("#text-timestamp-hour").val("");
		$("#text-timestamp-minute").val("");
	}
}

$(document).ready(function () {
	$("#text-slug").live("change", function () {
		if ($(this).val()) {
			$("#slug-display").html($(this).val());
		}
		else {
			$("#slug-display").html("Automatic");
		}
	});
	
	$("#slug-toggle").live("click", function (e) {
		e.preventDefault();
		
		var slug = $("#text-slug");
		
		if (slug.is(":visible")) {
			slug.hide();
			$("#slug-display").show();
		}
		else {
			$("#slug-display").hide();
			slug.show();
		}
	});
	
	$(".trap").live("click", function (e) {
		e.preventDefault();
		e.stopPropagation();
	});
	
	$("#link-help").live("click", function (e) {
		$.facebox("<div><h2>How can I help you?</h2><p>If you found a bug, <a href=\"https://code.google.com/p/scribefire-chrome/issues/entry?template=Defect%20report%20from%20user\" target=\"_blank\">fill out this form</a>.</p><p>If you want to request a feature, <a href=\"https://code.google.com/p/scribefire-chrome/issues/entry?template=Feature%20Request\" target=\"_blank\">fill out this form</a>.</p><p>If you need help using ScribeFire, you can <a href=\"mailto:chris@scribefire.com\">email chris@scribefire.com</a>.</p><p>If you just want to talk, you can ping <a href=\"http://twitter.com/scribefire\" target=\"_blank\">@scribefire</a> on Twitter.</p></div>");
	});
	
	$("#toggle-schedule").live("click", function (e) {
		e.preventDefault();
		
		if (!$("#toggle-schedule-scheduled").is(":visible") && !$("#text-datestamp-day").val()) {
			setTimestamp(new Date());
		}
		
		$("#toggle-schedule-immediately").toggle();
		$("#toggle-schedule-scheduled").toggle();
	});
	
	$("#list-blog-types").live("change", function (e) {
		var option = $(this).find("option:selected");
		
		if (option.attr("requires_id") == "true") {
			$("#text-add-blog-id-container").show();
		}
		else {
			$("#text-add-blog-id-container").hide();
		}
	});
	
	$("#button-category-add").live("click", function (e) {
		e.preventDefault();
		
		var button = $(this);
		button.addClass("busy");
		
		var categoryName = prompt("New category name:");
		
		if (categoryName) {
			function callback() {
				button.removeClass("busy");
			}
			
			SCRIBEFIRE.addCategory(categoryName, callback, callback);
		}
		else {
			button.removeClass("busy");
		}
	});
	
	$("#reset-button").live("click", function (e) {
		e.preventDefault();
		
		SCRIBEFIRE.clearData();
	});
	
	$(".button-addblog-cancel").live("click", function (e) {
		e.preventDefault();
		
		$("#dialog-blog-add").hide();	
		
		// @todo Cancel any requests.
		$("#button-blog-urlcheck").removeClass("busy");
	});
	
	$("#button-blog-remove").live("click", function (e) {
		e.preventDefault();
		
		if (confirm("Are you sure?")) {
			SCRIBEFIRE.removeBlog($("#list-blogs").val());
		}
	});
	
	$("#button-entry-remove").live("click", function (e){
		e.preventDefault();
		
		var button = $(this);
		button.addClass("busy");
		
		if (confirm("Are you sure you want to delete this post? It will be removed from your blog's server, and it will no longer appear on your blog.")) {
			function callback() {
				button.removeClass("busy");
			}
			
			SCRIBEFIRE.deletePost(
				$("#list-entries").val(),
				function success() {
					SCRIBEFIRE.notify("Post deleted successfully.");
					
					SCRIBEFIRE.clearData();
					
					button.removeClass("busy");
				},
				function failure() {
					button.removeClass("busy");
				}
			);
		}
	});
	
	$(".bar").live("click", function () {
		if ($(this).attr("id") == "bar-content") return;
		
		if ($(this).attr("disabled") != "true") {
			if ($(this).attr("open") == "true") {
				$(this).attr("open", "false");
				$(this).parent().find(".underbar:first").attr("open", "false");
			}
			else {
				$(this).attr("open", "true");
				$(this).parent().find(".underbar:first").attr("open", "true");
			}
		}
		
		$(this).persist("open");
		$(this).parent().find(".underbar:first").persist("open");
	});

	$(".subbar").live("click", function () {
		if ($(this).attr("disabled") != "true") {
			$(this).parent().find(".subunderbar:first").toggle();
		
			if ($(this).attr("open") == "true") {
				$(this).attr("open", "false");
			}
			else {
				$(this).attr("open", "true");
			}
		}
	});
	
	$("#text-title").live("change", function () {
		$("#label-current-title").html($(this).val());
	});
	
	$("#text-tags").live("change", function () {
		$("#label-current-tags").html($(this).val());
	});
	
	$("#list-blogs").live("change", function () {
		$("#button-inlinks").hide();
		
		if (!$(this).val()) {
			$(".button-blog-meta").hide();
		}
		else {
			$(".button-blog-meta").show();
			SCRIBEFIRE.populateEntriesList();
			SCRIBEFIRE.populateCategoriesList();
			
			if ($(this).find("option:selected").data("type") == "wordpress") {
				$("#button-inlinks").show();
			}
		}
		
		SCRIBEFIRE.prefs.setCharPref("selectedBlog", $(this).val());
		$("#label-current-blog").html($(this).find("option:selected").text());
		
		SCRIBEFIRE.updateOptionalUI();
	});
	
	$("#button-update-auth").live("click", function (e) {
		e.preventDefault();
		
		alert("@Todo");
	});
	
	$("#list-entries").live("change", function () {
		var postId = $(this).val();
		
		$("#buttons-publish-published").hide();
		$("#buttons-publish-draft").show();
		
		if (!postId) {
			$("#button-entry-remove").hide();
		}
		else {
			$("#button-entry-remove").show();
			
			var entry = $(this).find("option:selected");
		
			if (entry.data("published")) {
				$("#buttons-publish-published").show();
				$("#buttons-publish-draft").hide();
			}
			
			if (!$(this).attr("ignoreContent")) {
				$("#text-title").val(entry.data("title")).change();
				
				editor.val(entry.data("content"));
				
				$("#text-tags").val(entry.data("tags"));
				
				if (entry.data("timestamp") instanceof Date) {
					setTimestamp(entry.data("timestamp"));
					$("#toggle-schedule-immediately").hide();
					$("#toggle-schedule-scheduled").show();
				}
				else {
					setTimestamp();
					$("#toggle-schedule-immediately").show();
					$("#toggle-schedule-scheduled").hide();
				}
				
				$("#text-slug").val(entry.data("slug"));
				$("#checkbox-private").attr("checked", entry.data("private"));
				
				SCRIBEFIRE.clearCustomFields();
				
				if (custom_fields = entry.data("custom_fields")) {
					for (var i = 0; i < custom_fields.length; i++) {
						SCRIBEFIRE.addCustomField(custom_fields[i].id, custom_fields[i].key, custom_fields[i].value);
					}
				}
				
				SCRIBEFIRE.getAPI().getPostCategories(
					{ "id" : postId },
					function success (categories, key) {
						if (key == "value") {
							$("#list-categories").val(categories).change();
						}
						else {
							var vals = [];
							
							for (var i = 0; i < categories.length; i++) {
								var val = $("#list-categories option[categoryId='"+categories[i]+"']").attr("value");
								
								if (val) {
									vals.push(val);
								}
							}
							
							$("#list-categories").val(vals).change();
						}
					},
					function failure(rv) {
						rv.func = "getPostCategories";
						SCRIBEFIRE.genericError(rv);
					}
				);
			}
		}
		
		$("#label-current-entry").html($(this).find("option:selected").data("title"));
	});
	
	$("#list-categories").live("change", function (e) {
		if (!$(this).val()) {
			$("#label-current-categories").html("(none)");
		}
		else {
			var categories = [];
			
			$(this).find("option:selected").each(function () {
				categories.push($(this).text());
			});
			
			$("#label-current-categories").html(categories.join(", "));
		}
	});
	
	$("#button-blog-add").live("click", function (e) {
		accountWizardBlog = {};
		
		$("#dialog-blog-add").show();
		
		$("#text-blog-url").val("").change();
		$("#list-blog-types").val("").change();
		$("#text-blog-api-url").val("").change();
		$("#text-blog-username").val("");
		$("#text-blog-password").val("");
		$("#text-addblog-id").val("").change();
		
		$("#dialog-blog-add .subbar[open='true']").click();
		$("#bar-add-blog-url").click();
		
		$("#text-blog-url").focus();
	});
	
	$("#text-blog-url").live("change", function () {
		$("#label-add-blog-url").html($(this).val());
	});
	
	$("#list-blog-types").live("change", function () {
		$("#label-add-blog-type").html($(this).find("option:selected").html());
	});
	
	$("#text-blog-api-url").live("change", function () {
		$("#label-add-blog-apiurl").html($(this).val());
	});
	
	$("#text-addblog-id").live("change", function () {
		$("#label-add-blog-blogid").html($(this).val());
	});
	
	$("#button-blog-urlcheck").live("click", function (e) {
		var button = $(this);
		
		button.addClass("busy");
		
		$("#list-blog-types").val("").change();
		$("#text-blog-api-url").val("").change();
		$("#text-blog-username").val("");
		$("#text-blog-password").val("");
		$("#text-addblog-id").val("").change();
		
		SCRIBEFIRE.getBlogMetaData(
			$("#text-blog-url").val(),
			function (metaData) {
				button.removeClass("busy");
				
				$("#text-add-blog-id-container").hide();
				
				accountWizardBlog = metaData;
				
				$("#list-blog-types").val(metaData.type).change();
				$("#list-blog-types").removeAttr("disabled");
				
				$("#text-blog-api-url").val(metaData.apiUrl).change();
				$("#text-blog-api-url").removeAttr("disabled");
				
				if (metaData.id) {
					$("#text-addblog-id").val(metaData.id).change();
				}
				else {
					$("#text-addblog-id").val("").change();
				}
				
				$("#dialog-blog-add .step-2 *[disabled]").removeAttr("disabled");
				
				$("#dialog-blog-add .step-2 .subbar").each(function () {
					if (!$(this).attr("open") == "true") {
						$(this).click();
					}
				});
				
				// Collapse the URL container
				// Collapse the blog type container
				// Collapse the API URL container.
				$("#bar-add-blog-url, #bar-add-blog-type, #bar-add-blog-apiurl").each(function () {
					if ($(this).attr("open") == "true") {
						$(this).click();
					}
				});
				
				$("#bar-add-blog-credentials").each(function () {
					if (!$(this).attr("open") || $(this).attr("open") == "false") {
						$(this).click();
					}
				});
				
				$("#text-blog-username").focus();
			},
			function failure(code, status) {
				button.removeClass("busy");
				
				var error = "While trying to determine your blog's settings, ScribeFire tripped over this code: " + code;
				
				if (code == "UNKNOWN_BLOG_TYPE") {
					error += "\n\nYou're welcome to try and configure your blog manually.";
					
					$("#list-blog-types").removeAttr("disabled");
					$("#text-blog-api-url").removeAttr("disabled");
					
					$("#dialog-blog-add .step-2 *[disabled]").removeAttr("disabled");
					
					$("#dialog-blog-add .step-2 .subbar").each(function () {
						if (!$(this).attr("open") == "true") {
							$(this).click();
						}
					});
				}
				
				SCRIBEFIRE.error(error);
			}
		);
	});
	
	$("#button-blog-logincheck").live("click", function (e) {
		var button = $(this);
		button.addClass("busy");
		
		var params = accountWizardBlog;
		
		params.apiUrl = $("#text-blog-api-url").val();
		params.type = $("#list-blog-types").val();
		params.username = $("#text-blog-username").val();
		params.password = $("#text-blog-password").val();
		params.blogUrl = $("#text-blog-url").val();
		
		if ("url" in params) {
			params.blogUrl = params.url;
			delete params.url;
		}
		
		if ($("#text-addblog-id").val()) {
			params.id = $("#text-addblog-id").val();
		}
		
		SCRIBEFIRE.getBlogs(
			params,
			function (rv) {
				button.removeClass("busy");
				
				$("#dialog-blog-add").hide();
				
				SCRIBEFIRE.notify("Your blog was added successfully!");
				
				if (!$("#list-entries").val()) {
					// Only select a new blog if the user wasn't working on an entry from another blog.
					$("#list-blogs").val(rv[0].username + "@" + rv[0].url).change();
				}
			},
			function (rv) {
				button.removeClass("busy");
			}
		);
	});
	
	$("#button-publish-draft").live("click", function (e) {
		e.preventDefault();
		
		$("#status-draft").val("0");
		
		var button = $(this);
		button.addClass("busy");
		
		SCRIBEFIRE.publish(
			function success(rv) {
				button.removeClass("busy");
				SCRIBEFIRE.notify(
					"Published successfully!", 
					"Open blog in a new tab",
					function (button) { 
						var url = SCRIBEFIRE.getAPI().url;

						if (typeof chrome != 'undefined') {
							chrome.tabs.create({ "url": url });
						}
						else {
							window.open(url);
						}
					}
				);
			},
			function error(rv) {
				button.removeClass("busy");
			});
	});
	
	$("#button-publish").live("click", function (e) {
		e.preventDefault();
		
		var button = $(this);
		button.addClass("busy");
		
		SCRIBEFIRE.publish(
			function success(rv) {
				button.removeClass("busy");
				SCRIBEFIRE.notify(
					"Updated successfully!", 
					"Open blog in a new tab",
					function (button) { 
						var url = SCRIBEFIRE.getAPI().url;

						if (typeof chrome != 'undefined') {
							chrome.tabs.create({ "url": url });
						}
						else {
							window.open(url);
						}
					}
				);
			},
			function error(rv) {
				button.removeClass("busy");
			});
	});
	
	$("#button-save-progress").live("click", function (e) {
		e.preventDefault();
		
		$("#status-draft").val("1");
		
		var button = $(this);
		button.addClass("busy");
		
		SCRIBEFIRE.publish(
			function success(rv) {
				button.removeClass("busy");
				SCRIBEFIRE.notify(
					"Draft saved."
				);
			},
			function error(rv) {
				button.removeClass("busy");
			});
	});
	
	$("#button-blog-edit").live("click", function (e) {
		e.preventDefault();
		
		var blog = SCRIBEFIRE.getBlog();
		
		$("#panel-blog-edit .blog-edit-field").each(function () {
			$(this).val(blog[$(this).attr("name")]);
		});
		
		$.facebox($("#panel-blog-edit"));
		$("#panel-blog-edit").show();
	});
	
	$("#button-blog-view").live("click", function (e) {
		e.preventDefault();
		
		var url = SCRIBEFIRE.getAPI().url;

		if (typeof chrome != 'undefined') {
			chrome.tabs.create({ "url": url });
		}
		else {
			window.open(url);
		}
	});
	
	$("#button-blog-edit-finish").live("click", function (e) {
		e.preventDefault();
		
		var blog = SCRIBEFIRE.getBlog();
		
		$("#panel-blog-edit .blog-edit-field").each(function () {
			blog[$(this).attr("name")] = $(this).val();
		});
		
		SCRIBEFIRE.setBlog(blog);
		
		$.facebox.close();
	});
	
	$("#button-inlinks").live("click", function (e) {
		e.preventDefault();
		
		$.facebox($("#panel-inlinks"));
		$("#panel-inlinks").show();
	});
	
	$("#button-add-custom-field").live("click", function (e) {
		e.preventDefault();
		
		SCRIBEFIRE.addCustomField(null, null, null, true);
	});
	
	$(".button-remove-custom-field").live("click", function (e) {
		e.preventDefault();
		
		if ($(".custom_field").length == 1) {
			SCRIBEFIRE.clearCustomFields();
		}
		else {
			$(this).parent(".custom_field").remove();
		}
	});
	
	$(window).bind("beforeunload", function (e) {
		// Grab all of the input values for state persistence.
		SCRIBEFIRE.prefs.setCharPref("state.entryId", $("#list-entries").val());
		SCRIBEFIRE.prefs.setCharPref("state.title",   $("#text-title").val());
		SCRIBEFIRE.prefs.setCharPref("state.content", editor.val());
		SCRIBEFIRE.prefs.setCharPref("state.tags",	$("#text-tags").val());
		SCRIBEFIRE.prefs.setCharPref("state.timestamp",getTimestamp());
		SCRIBEFIRE.prefs.setBoolPref("state.draft",   $("#status-draft").val() == "1");
		SCRIBEFIRE.prefs.setJSONPref("state.categories", $("#list-categories").val());
		SCRIBEFIRE.prefs.setCharPref("state.slug", $("#text-slug").val());
		SCRIBEFIRE.prefs.setJSONPref("state.customFields", SCRIBEFIRE.getCustomFields(true));
	});
	
	$("#text-title").val(SCRIBEFIRE.prefs.getCharPref("state.title"));
	SCRIBEFIRE.prefs.setCharPref("state.title", "");
	
	$("#text-tags").val(SCRIBEFIRE.prefs.getCharPref("state.tags"));
	SCRIBEFIRE.prefs.setCharPref("state.tags", "");
	
	setTimestamp(SCRIBEFIRE.prefs.getCharPref("state.timestamp"));
	
	if (getTimestamp()) {
		$("#toggle-schedule-immediately").hide();
		$("#toggle-schedule-scheduled").show();
	}
	else {
		$("#toggle-schedule-immediately").show();
		$("#toggle-schedule-scheduled").hide();
	}
	
	SCRIBEFIRE.prefs.setCharPref("state.timestamp");
	
	$("#status-draft").val(SCRIBEFIRE.prefs.getBoolPref("state.draft") ? "1" : "0").change();
	SCRIBEFIRE.prefs.setBoolPref("state.draft", false);
	
	$("#text-slug").val(SCRIBEFIRE.prefs.getCharPref("state.slug")).change();
	SCRIBEFIRE.prefs.setCharPref("state.slug", "");
	
	var custom_fields = SCRIBEFIRE.prefs.getJSONPref("state.customFields", []);
	SCRIBEFIRE.prefs.setJSONPref("state.customFields", []);
	
	for (var i = 0; i < custom_fields.length; i++) {
		SCRIBEFIRE.addCustomField(custom_fields[i].id, custom_fields[i].key, custom_fields[i].value);
	}
	
	$(".custom_field input[name='key']").live("focus", function () {
		$(this).autocomplete(customFieldAutocompleteData);
	});
	
	$("#text-tags").val(SCRIBEFIRE.prefs.getCharPref("state.tags"));
	SCRIBEFIRE.prefs.setCharPref("state.tags", "");
	
	$("#text-tags").autocomplete(tagsAutocompleteData);
	
	SCRIBEFIRE.load();
	
	$(window).load(function () {
		var editorContent = SCRIBEFIRE.prefs.getCharPref("state.content");
		SCRIBEFIRE.prefs.setCharPref("state.content", "");
		
		var blogThisText = "";
		
		if (blogThisText = SCRIBEFIRE.prefs.getCharPref("blogThis")) {
			editorContent += blogThisText;
			
			SCRIBEFIRE.prefs.setCharPref("blogThis", "");
		}
		
		editorContent = editorContent.replace(/^\s+|\s+$/g, "");
		
		$("#text-content").val(editorContent);
		
		tinyMCE.init({
			// General options
			mode : "exact",
			elements : "text-content",
			theme : "advanced",
			plugins : "wordpress,fullscreen",
			
			// Theme options
			theme_advanced_buttons1 : "fontselect,fontsizeselect,bold,italic,underline,strikethrough,sub,sup,forecolor,blockquote,removeformat,|,link,unlink,image,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,|,wp_more,fullscreen",//,|,removeformat",//,|,tablecontrols",
			theme_advanced_buttons2 : "", theme_advanced_buttons3 : "", theme_advanced_buttons4 : "",
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			theme_advanced_statusbar_location : "bottom",
			theme_advanced_resizing : true,
			more_colors_func : false,
			
			// Example content CSS (should be your site CSS)
			content_css : "skin/editor_content.css",
		});
		
		adjustForSize();
		
		// We use .parent() here because putting an id on the element breaks the flex box model someho
		// $("#text-content").parent().resize();
	});
	
	$(window).resize(function () {
		clearTimeout(resize_timeout);
		
		resize_timeout = setTimeout(adjustForSize, 100);
	});
});

var customFieldAutocompleteData = {
	minLength : 0,
	
	source : function (request, response) {
		var toMatch = request.term;
		
		response($.ui.autocomplete.filter(SCRIBEFIRE.autocomplete.custom_field_keys, toMatch));
	}
};

var tagsAutocompleteData = {
	minLength : 0,
	source : function (request, response) {
		var toMatch = "";
		
		if (request.term) {
			toMatch = request.term.split(/,\s*/).pop();
		}
		
		response($.ui.autocomplete.filter(SCRIBEFIRE.autocomplete.tags, toMatch));
	},
	focus : function () {
		return false;
	},
	select: function(event, ui) {
		var terms = this.value.split(/,\s*/);
		// remove the current input
		terms.pop();
		// add the selected item
		terms.push( ui.item.value );
		// add placeholder to get the comma-and-space at the end
		terms.push("");
		this.value = terms.join(", ");
		return false;
	}
};

var resize_timeout = null;
// var editor_resize_timeout = null;

function adjustForSize() {
	// Resize the editor proportionally to how wide the window was made.
	editorWidth = $("#text-content_ifr").width();
	editorHeight = $("#text-content_ifr").height();
	
	var newWindowWidth = $(window).width();
	
	var difference = newWindowWidth - windowWidth;
	windowWidth = newWindowWidth;
	
	if (difference != 0) {
		if (switchEditors.mode == 'tinymce') {
			if ("activeEditor" in tinyMCE && tinyMCE.activeEditor) {
				var newEditorWidth = editorWidth + difference;
				if (newEditorWidth > windowWidth) {
					newEditorWidth = windowWidth - 20;
				}

				tinyMCE.activeEditor.theme.resizeTo(newEditorWidth, editorHeight);
			}
		}
	}
	
	// Ensure that the body doesn't exceed the window.  Mainly a hack for Firefox and scroll bars.
	$("body").width( $(window).width() - 3 );//.height( Math.max( $("body").height(), $(window).height() ));
	
	return;
	/*
	if (platform != "gecko") {
	//	return;
	}
	
	var movableElementsTop = [ "entries", "blogs" ];
	var movableElementsBottom = [ "categories", "tags" ];
	
	var container = "main";
	
	// 740 is the width of the toolbar of the editor.
	if ($(window).width() > (740 * 10 / 7) && $(window).width() > $(window).height()) {
		// Only add the sidebar when the window is wide enough to show the full editor toolbar
		// and sidebar without a horizontal scroll (and only if it's wider than it is tall).
		container = "sidebar";
	}
	
	if ($("#ui-" + movableElementsTop[0]).parent().attr("id") == container) {
		return;
	}
	
	if (container == "sidebar") {
		$("#main").attr("flex", "7");
		$("#sidebar").attr("flex", "3");
	}
	else {
		$("#sidebar").attr("flex", "0");
		$("#main").attr("flex", "1");
	}
	
	if (container == "main") {
		$("#sidebar select").css( { "max-width" : null } );
	}
	
	for (var i = 0; i < movableElementsBottom.length; i++) {
		var e = $("#ui-" + movableElementsBottom[i]);
	
		e.remove();
	
		$("#" + container).append(e);
	}
	
	for (var i = 0; i < movableElementsTop.length; i++) {
		var e = $("#ui-" + movableElementsTop[i]);
	
		e.remove();
	
		$("#" + container).prepend(e);
	}
	*/
}

if (typeof safari != 'undefined') {
	// BlogThis listener
	function handleSafariMessages(msgEvent) {
		if (msgEvent.name == "blog-this") {
			var responseParts = msgEvent.message.split("\t");

			var title = responseParts.shift();
			var url = responseParts.shift();
			var selection = responseParts.join("\t");
			
			var html = '<p><a href="' + url + '">' + title + '</a></p><p>' + selection + '</p>';
			
			SCRIBEFIRE.blogThis(html);
		}
	}
	
	safari.self.addEventListener("message", handleSafariMessages, false);
}