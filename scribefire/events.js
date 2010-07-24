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
				return tinyMCE.get('text-content').getContent();
			}
			else {
				return switchEditors._wp_Autop($("#text-content").val());
			}
		}
	}
};

var accountWizardBlog = {};

function getTimestamp() {
	if ($("#text-timestamp-year").val() === "" || $("#text-timestamp-month").val() === "" || $("#text-timestamp-day").val() === "" || $("#text-timestamp-hour").val() === "" || $("#text-timestamp-minute").val() === "") {
		return false;
	}
	else {
		return Math.max(1000, $("#text-timestamp-year").val()) + "-" + pad(Math.max(1, $("#text-timestamp-month").val())) + "-" + pad(Math.max(1, $("#text-timestamp-day").val())) + " " + pad(Math.max(0, $("#text-timestamp-hour").val())) + ":" + pad(Math.max(0, $("#text-timestamp-minute").val())) + ":00";
	}
}

function setTimestamp(date) {
	if (date instanceof Date) {
		date = phpdate(date, "Y-m-d H:i");
	}
	
	if (date) {
		var parts = date.split(/[^0-9]/);
		
		$("#text-timestamp-year").val(parts[0]);
		$("#text-timestamp-month").val(parts[1]);
		$("#text-timestamp-day").val(parts[2]);
		$("#text-timestamp-hour").val(parts[3]);
		$("#text-timestamp-minute").val(parts[4]);
	}
	else {
		$("#text-timestamp-year").val("");
		$("#text-timestamp-month").val("");
		$("#text-timestamp-day").val("");
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
	
	$("#button-addblog-cancel").live("click", function (e) {
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
		
		if (confirm("Are you sure?")) {
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
			$("#button-blog-edit, #button-blog-remove").hide();
		}
		else {
			$("#button-blog-edit, #button-blog-remove").show();
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
	
	$("#list-entries").live("change", function () {
		var postId = $(this).val();
		
		if (!postId) {
			$("#button-entry-remove").hide();
			$("#button-publish").html("Send to Blog");
		}
		else {
			$("#button-entry-remove").show();
			$("#button-publish").html("Send Edited Post to Blog");
			
			if (!$(this).attr("ignoreContent")) {
				var entry = $(this).find("option:selected");
			
				$("#text-title").val(entry.data("title")).change();
				
				editor.val(entry.data("content"));
				
				console.log(entry.data("title"));
				
				$("#checkbox-draft").attr("checked", !entry.data("published"));
				
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
				
				$("#text-slug").val(entry.data("slug")).change();
				$("#checkbox-private").attr("checked", entry.data("private"));
				
				SCRIBEFIRE.getAPI().getPostCategories(
					{ "id" : postId },
					function success (categories) {
						$("#list-categories").val(categories).change();
					},
					function failure(rv) {
						rv.func = "getPostCategories";
						SCRIBEFIRE.genericError(rv);
					}
				);
			}
		}
		
		$("#label-current-entry").html($(this).find("option:selected").text());
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
		
		$("#dialog-blog-add .step-2 .subbar").attr("open", "false");
		$("#dialog-blog-add .step-2 .subunderbar").attr("open", "false");
		$("#dialog-blog-add .step-2").find("input, select");
		$("#dialog-blog-add .step-2 .subunderbar").hide();
		
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
				
				$("#list-blogs").val(rv[0].username + "@" + rv[0].url).change();
				$("#dialog-blog-add").hide();
				SCRIBEFIRE.clearData();
				
				SCRIBEFIRE.notify("Your blog was added successfully!");
			},
			function (rv) {
				button.removeClass("busy");
			}
		);
	});
	
	$("#button-publish").live("click", function (e) {
		e.preventDefault();
		
		var button = $(this);
		button.addClass("busy");
		
		function callback() {
			button.removeClass("busy");
		}

		SCRIBEFIRE.publish(
			function success(rv) {
				button.removeClass("busy");
				SCRIBEFIRE.notify(
					"Sent to blog successfully!", 
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

	$("#button-inlinks").live("click", function (e) {
		e.preventDefault();
		
		$.facebox($("#panel-inlinks"));
		$("#panel-inlinks").show();
	});
	
	$(window).bind("beforeunload", function (e) {
		// Grab all of the input values for state persistence.
		SCRIBEFIRE.prefs.setCharPref("state.entryId", $("#list-entries").val());
		SCRIBEFIRE.prefs.setCharPref("state.title",   $("#text-title").val());
		SCRIBEFIRE.prefs.setCharPref("state.content", editor.val());
		SCRIBEFIRE.prefs.setCharPref("state.tags",	$("#text-tags").val());
		SCRIBEFIRE.prefs.setCharPref("state.timestamp",getTimestamp());
		SCRIBEFIRE.prefs.setBoolPref("state.draft",   $("#checkbox-draft").is(":checked"));
		SCRIBEFIRE.prefs.setJSONPref("state.categories", $("#list-categories").val());
		SCRIBEFIRE.prefs.setCharPref("state.slug", $("#text-slug").val());
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
	
	$("#checkbox-draft").attr("checked", SCRIBEFIRE.prefs.getBoolPref("state.draft"));
	SCRIBEFIRE.prefs.setBoolPref("state.draft", false);
	
	$("#text-slug").val(SCRIBEFIRE.prefs.getCharPref("state.slug")).change();
	SCRIBEFIRE.prefs.setCharPref("state.slug", "");
	
	SCRIBEFIRE.load();
	
	$(window).load(function () {
		$("#text-content").val(SCRIBEFIRE.prefs.getCharPref("state.content"));
		SCRIBEFIRE.prefs.setCharPref("state.content", "");
		
		tinyMCE.init({
			// General options
			mode : "exact",
			elements : "text-content",
			theme : "advanced",
			plugins : "wordpress,fullscreen",
			
			// Theme options
			theme_advanced_buttons1 : "fontselect,fontsizeselect,bold,italic,underline,strikethrough,sub,sup,forecolor,blockquote,|,link,unlink,image,|,justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,|,wp_more,fullscreen",//,|,removeformat",//,|,tablecontrols",
			theme_advanced_buttons2 : "", theme_advanced_buttons3 : "", theme_advanced_buttons4 : "",
			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",
			//theme_advanced_statusbar_location : "bottom",
			theme_advanced_resizing : false,
			more_colors_func : false,
			
			// Example content CSS (should be your site CSS)
			content_css : "skin/editor_content.css",
		});
		
		adjustForSize();
		
		// We use .parent() here because putting an id on the element breaks the flex box model someho
		$("#text-content").parent().resize();
	});
	
	$(window).resize(function () {
		clearTimeout(resize_timeout);
		
		resize_timeout = setTimeout(adjustForSize, 100);
	});
	
	$("#text-content").parent().resize(function () {
		if (switchEditors.mode == 'tinymce') {
			if ("activeEditor" in tinyMCE && tinyMCE.activeEditor) {
				tinyMCE.activeEditor.theme.resizeTo($("#text-content").parent().width() - 10, $("#text-content").parent().height() - 40);
			}
		}
	});
});

tinyMCE.execCommand("mceRemoveControl", true, "text-content");

var resize_timeout = null;

function adjustForSize() {
	$("body").height( $(window).height() );
	
	if (platform != "gecko") {
	//	return;
	}
	
	/*
	var movableElementsTop = [ "entries", "blogs" ];
	var movableElementsBottom = [ "categories", "tags" ];
	
	var container = "main";
	
	// 915 is the width of the toolbar of the editor.
	if ($(window).width() > 915 && $(window).width() > $(window).height()) {
		// Only add the sidebar when the window is wide enough to show the full editor toolbar
		// and sidebar without a horizontal scroll (and only if it's wider than it is tall).
		container = "sidebar";
	}
	
	if ($("#ui-" + movableElementsTop[0]).parent().attr("id") == container) {
		return;
	}
	
	if (container == "sidebar") {
		$("#sidebar").css("width", "30%");
		$("#main").css("width", "65%");
	}
	else {
		$("#sidebar").css("width", "0%");
		$("#main").css("width", "100%");
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