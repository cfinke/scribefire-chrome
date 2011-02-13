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
	},
	
	change : function () {
		SCRIBEFIRE.dirty = true;
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
		date = date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
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
	$("i18n").each(function () {
		$(this).replaceWith(scribefire_string($(this).attr("data-key")));
	});
	
	$(".i18n").each(function () {
		$(this).text(scribefire_string($(this).attr("data-key")));
	});
		
	
	$("#text-slug").live("change", function () {
		if ($(this).val()) {
			$("#slug-display").text($(this).val());
		}
		else {
			$("#slug-display").text("Automatic");
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
		// @todo Localize
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
		
		var categoryName = prompt(scribefire_string("prompt_newCategory"));
		
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
	
	/*
	$(".button-addblog-cancel").live("click", function (e) {
		e.preventDefault();
		
		$(document).trigger("close.facebox");
//		$("#dialog-blog-add").hide();	
		
		// @todo Cancel any requests.
		$("#button-blog-urlcheck").removeClass("busy");
	});
	*/
	
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
		
		if (confirm(scribefire_string("confirm_deletePost"))) {
			function callback() {
				button.removeClass("busy");
			}
			
			SCRIBEFIRE.deletePost(
				$("#list-entries").val(),
				function success() {
					SCRIBEFIRE.notify(scribefire_string("notification_delete_post"));
					
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
		$("#label-current-title").text($(this).val());
	});
	
	$("#text-tags").live("change", function () {
		$("#label-current-tags").text($(this).val());
	});
	
	$("#text-excerpt").live("change", function () {
		var excerpt = $(this).val();
		if (excerpt) {
			if (excerpt.length > 100) {
				excerpt = excerpt.substring(0, 100) + "...";
			}
			
			$("#label-current-excerpt").text(excerpt);
		}
		else {
			$("#label-current-excerpt").text("");
		}
	});
	
	$("#list-blogs").live("change", function () {
		$("#button-inlinks").hide();
		
		if (!$(this).val()) {
			$(".button-blog-meta").hide();
		}
		else {
			$(".button-blog-meta").show();
			SCRIBEFIRE.populateEntriesList($("#filter-entries").val());
			SCRIBEFIRE.populateCategoriesList();
			
			if ($(this).find("option:selected").data("type") == "wordpress") {
				$("#button-inlinks").show();
			}
		}
		
		SCRIBEFIRE.prefs.setCharPref("selectedBlog", $(this).val());
		$("#label-current-blog").text($(this).find("option:selected").text());
		
		SCRIBEFIRE.updateOptionalUI();
	});
	
	$("#button-update-auth").live("click", function (e) {
		e.preventDefault();
		
		alert("@Todo");
	});
	
	$("#list-entries").live("change", function (e) {
		if (SCRIBEFIRE.dirty && $(this).data("lastPostId") && $(this).data("lastPostId") != $(this).val()) {
			if (!confirm(scribefire_string("confirm_not_saved"))) {
				$(this).val($(this).data("lastPostId"));
				
				e.preventDefault();
				e.stopPropagation();
				return;
			}
		}
		
		$(this).data("lastPostId", $(this).val());
		
		var postId = $(this).val();
		
		$("#buttons-publish-published").hide();
		$("#buttons-publish-draft").show();
		
		if (postId.toString().indexOf("scribefire:new") == 0) {
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
				
				try { $("#text-excerpt").val(entry.data("excerpt")).change(); } catch (e) { 
					//console.log(e); 
				}
				
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
		
		$("#label-current-entry").text(($(this).find("option:selected").data("title") || ""));
		
		switch ($(this).find("option:selected").data("type")) {
			case "pages":
			// @todo localize
				$(".entry-type-text").text("Page");
			break;
			case "posts":
			default:
			// @todo localize
				$(".entry-type-text").text("Post");
			break;
		}
		
		SCRIBEFIRE.updateOptionalUI();
		
		SCRIBEFIRE.dirty = false;
	});
	
	$("#list-categories").live("change", function (e) {
		if (!$(this).val()) {
			$("#label-current-categories").text("(none)");
		}
		else {
			var categories = [];
			
			$(this).find("option:selected").each(function () {
				categories.push($(this).text());
			});
			
			$("#label-current-categories").text(categories.join(", "));
		}
	});
	
	$("#button-blog-add").live("click", function (e) {
		accountWizardBlog = {};
		
		$.facebox($("#dialog-blog-add"));
		
		$("#text-blog-url").die("change");
		$("#text-blog-url").live("change", function () {
			$("#label-add-blog-url").text($(this).val());
		});

		$("#list-blog-types").die("change");
		$("#list-blog-types").live("change", function () {
			$("#label-add-blog-type").text($(this).find("option:selected").text());
		});
		
		$("#text-blog-api-url").die("change");
		$("#text-blog-api-url").live("change", function () {
			$("#label-add-blog-apiurl").text($(this).val());
		});

		$("#text-addblog-id").die("change");
		$("#text-addblog-id").live("change", function () {
			$("#label-add-blog-blogid").text($(this).val());
		});

		$("#button-blog-urlcheck").die("click");
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

					var error = scribefire_string("error_api_setup", code);

					if (code == "UNKNOWN_BLOG_TYPE") {
						error += "\n\n" + scribefire_string("error_api_setup_unknownBlogType");

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

		$("#button-blog-logincheck").die("click");
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

					$(document).trigger("close.facebox");
	//				$("#dialog-blog-add").hide();

					SCRIBEFIRE.notify(scribefire_string("notification_blog_add"));

					if ($("#list-entries").val().indexOf("scribefire:new") == 0) {
						// Only select a new blog if the user wasn't working on an entry from another blog.
						$("#list-blogs").val(rv[0].username + "@" + rv[0].url).change();
					}
				},
				function (rv) {
					button.removeClass("busy");
				}
			);
		});
		
		$("#dialog-blog-add").show();
//		$("#dialog-blog-add").show();
		
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
	
	$("#button-publish-draft").live("click", function (e) {
		e.preventDefault();
		
		$("#status-draft").val("0");
		
		var button = $(this);
		button.addClass("busy");
		
		SCRIBEFIRE.publish(
			function success(rv) {
				button.removeClass("busy");
				SCRIBEFIRE.notify(
					scribefire_string("notification_publish"),
					scribefire_string("action_openBlogInTab"),
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
					scribefire_string("notification_publish_update"),
					scribefire_string("action_openBlogInTab"),
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
					scribefire_string("notification_draft_save")
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
	
	$("#text-title").val(SCRIBEFIRE.prefs.getCharPref("state.title"));
	SCRIBEFIRE.prefs.setCharPref("state.title", "");
	
	$("#text-tags").val(SCRIBEFIRE.prefs.getCharPref("state.tags"));
	SCRIBEFIRE.prefs.setCharPref("state.tags", "");
	
	$("#text-excerpt").val(SCRIBEFIRE.prefs.getCharPref("state.excerpt")).change();
	SCRIBEFIRE.prefs.setCharPref("state.excerpt", "");
	
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
	
	var entry_filter_timeout = null;
	var last_filter = "";
	
	$("#filter-entries").live("keyup click", function (e) {
		var filter = $(this).val();
		
		if (filter != last_filter) {
			clearTimeout(entry_filter_timeout);
		
			entry_filter_timeout = setTimeout(
				function (f) {
					last_filter = f;
					
					SCRIBEFIRE.prefs.setCharPref("state.entryId", $("#list-entries").val());
					
					SCRIBEFIRE.populateEntriesList(f, true);
				}, 500, filter);
		}
		
		$(this).persist("value");
	});
	
	SCRIBEFIRE.load();
	
	$("#text-title").live("change", function() { SCRIBEFIRE.dirty = true; });
	$("#text-content").live("change", function() { SCRIBEFIRE.dirty = true; });
	$("#text-tags").live("change", function() { SCRIBEFIRE.dirty = true; });
	$("#list-categories").live("change", function() { SCRIBEFIRE.dirty = true; });
	
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
			plugins : "wordpress,fullscreen,sf_video_plugin,sf_zemanta_plugin",
			
			// Theme options
			theme_advanced_buttons1 : "fontselect,fontsizeselect,bold,italic,underline,strikethrough,sub,sup,forecolor,blockquote,removeformat,|,link,unlink,image,video,zemanta,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,|,wp_more,fullscreen",//,|,removeformat",//,|,tablecontrols",
			theme_advanced_buttons2 : "", theme_advanced_buttons3 : "", theme_advanced_buttons4 : "",
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			theme_advanced_statusbar_location : "bottom",
			theme_advanced_resizing : true,
			more_colors_func : false,
			
			// Example content CSS (should be your site CSS)
			content_css : "skin/editor_content.css",
			oninit : function () {
				if (SCRIBEFIRE.prefs.getCharPref("state.editor") == 'html') {
					switchEditors.go('text-content', 'html');
				}
			},
			onchange_callback : "editor.change"
		});
		
		adjustForSize();
		
		// We use .parent() here because putting an id on the element breaks the flex box model someho
		// $("#text-content").parent().resize();
		
		function saveEditorState() {
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
			SCRIBEFIRE.prefs.setCharPref("state.excerpt", $("#text-excerpt").val());

			SCRIBEFIRE.prefs.setCharPref("state.editor", switchEditors.mode);
		}
		
		$(window).bind("beforeunload", saveEditorState);
		
		if (platform === "presto") {
			// Opera doesn't support beforeunload, so we save the state every 5 seconds.
			setInterval(saveEditorState, 5000);
		}
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