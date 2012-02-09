var SCRIBEFIRE = {
	currentAPI : null,
	
	error_codes : {
		USER_TRIGGERED_FAILURE : -1
	},
	
	// Whether the current content needs to be saved somewhere to avoid losing it.
	dirty : false,
	
	autocomplete : {
		tags : [],
		custom_field_keys : []
	},
	
	prefs : {
		namespace : "extensions.scribefire.",
		
		_observers : {},
		
		addObserver : function (observer) {
			var key = Math.random();
			
			this._observers[key] = observer;
			
			return key;
		},
		
		removeObserver : function (key) {
			delete this._observers[key];
		},
		
		getPref : function (prefName) {
			var key = this.namespace + prefName;
			
			if (platform == 'gecko') {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(this.namespace);
				
				try {
					return prefs.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
				} catch (e) {
					return null;
				}
			}
			else {
				if (key in localStorage) {
					return localStorage[this.namespace + prefName];
				}
				else {
					return null;
				}
			}
		},

		getBoolPref : function (prefName) {
			var rv = this.getPref(prefName);

			if (!rv || rv == "false" || rv == "null") {
				return false;
			}

			return true;
		},

		getCharPref : function (prefName) {
			var rv = this.getPref(prefName);
			
			if (typeof rv == 'undefined' || rv == "null") {
				rv = "";
			}

			return rv;
		},
		
		getIntPref : function (prefName) {
			var rv = this.getPref(prefName);

			if (!rv || rv == "0" || rv == "null") {
				return 0;
			}

			return parseInt(rv, 10);
		},
		
		getJSONPref : function (prefName, defaultValue) {
			var rv = this.getCharPref(prefName);
			
			if (!rv) {
				return defaultValue;
			}
			else {
				return JSON.parse(rv);
			}
		},
		
		setPref : function (prefName, prefVal) {
			var existing = this.getPref(prefName);
			
			if (existing !== prefVal) {
				if (typeof prefVal == 'undefined' || prefVal === null) {
					prefVal = "";
				}
				
				if (platform == 'gecko') {
					var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(this.namespace);
					
					var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
					str.data = prefVal;
					
					try {
						prefs.setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
					} catch (e) {
						alert("Invalid pref: " + prefName + " " + prefVal);
					}
				}
				else {
					localStorage[this.namespace + prefName] = prefVal;
				}
				
				SCRIBEFIRE.observe(null, "nsPref:changed", prefName);
				
				for (var i in this._observers) {
					this._observers[i].observe(null, "nsPref:changed", prefName);
				}
			}
		},

		setCharPref : function (prefName, prefVal) {
			this.setPref(prefName, prefVal);
		},
		
		setJSONPref : function (prefName, prefVal) {
			var stringPrefVal = JSON.stringify(prefVal);
			
			this.setCharPref(prefName, stringPrefVal);
		},
		
		setBoolPref : function (prefName, prefVal) {
			this.setPref(prefName, !!prefVal);
		},
		
		setIntPref : function (prefName, prefVal) {
			this.setPref(prefName, parseInt(prefVal, 10));
		}
	},

	load : function () {
		function pref(name, val) {
			if (SCRIBEFIRE.prefs.getPref(name) === null) {
				SCRIBEFIRE.prefs.setPref(name, val);
			}
		}
		
		pref("stats.asked", false);
		pref("stats.allowed", false);
		pref("stats.loadCounter", 0);
		pref("markdown", true);
		pref("multipost", true);
		pref("defaultLinkTarget", "");
		pref("blogThisTemplate", '<a href="$U">$T</a>\n<blockquote>$S</blockquote>\n\n');
		pref("rtl", false);
		
		SCRIBEFIRE.populateBlogsList();
		SCRIBEFIRE.populateTemplatesList();
		
		SCRIBEFIRE.prefs.setIntPref("stats.loadCounter", SCRIBEFIRE.prefs.getIntPref("stats.loadCounter") + 1);
		
		if (($("#list-blogs option").length == 0)) {
			if (!SCRIBEFIRE.prefs.getBoolPref("firstrun")) {
				$.facebox(
					$("<div/>")
					.append(
						$("<h2/>")
							.addClass("i18n")
							.attr("data-key", "firsttime_header")
							.text(scribefire_string("firsttime_header"))
						)
					.append(
						$("<p/>")
							.addClass("i18n")
							.attr("data-key", "firsttime_text")
							.text(scribefire_string("firsttime_text"))
						)
					);
				
				SCRIBEFIRE.prefs.setBoolPref("firstrun", true);
			}
		}
		
		SCRIBEFIRE.observe("ignore", "ignore", "rtl");
	},
	
	observe : function (subject, topic, prefName) {
		switch (prefName) {
			case "rtl":
				if (SCRIBEFIRE.prefs.getBoolPref("rtl")) {
					$("body").css("direction", "rtl");
				}
				else {
					$("body").css("direction", "ltr");
				}
			break;
		}
	},
	
	localize : function (page) {
		page = $(page);
		
		page.find("i18n").each(function () {
			var $this = $(this);
		
			var string = scribefire_string($this.attr("data-key"));
		
			if (string) {
				$this.replaceWith(string);
			}
		});
	
		page.find(".i18n").each(function () {
			var $this = $(this);
		
			var string = scribefire_string($this.attr("data-key"));
		
			if (string) {
				$this.html(string);
			}
		});
	},
	
	genericError : function (rv) {
		//console.log("Error ("+rv.status+"): " + rv.msg);
		
		SCRIBEFIRE.notify(/*"Debugging error ("+rv.status+"): " + rv.func*/rv.msg, null, null, null, "notifier-error");
	},
	
	notify : function (msg, buttonLabel, buttonCallback, buttonProperties, notifyClass) {
		$(".notifier").remove();
	
		var notifier = $("<div />");
		notifier.addClass("notifier");
	
		if (notifyClass) {
			notifier.addClass(notifyClass);
		}
	
		notifier.text(msg);
	
		if (buttonLabel) {
			var button = $("<button />");
			button.text(buttonLabel);
		
			if (buttonProperties) {
				for (x in buttonProperties) {
					button.attr(x, buttonProperties[x]);
				}
			}
		
			button.click(function (e) {
				e.preventDefault();
			
				buttonCallback($(this));
			});
		
			notifier.append(button);
		}
	
		notifier.mouseover(function (e) {
			clearTimeout(notifier.timer);
		});
	
		notifier.mouseout(function (e) {
			notifier.timer = setTimeout(function () { notifier.hide("slow"); }, 2000);
		});

		$("body").prepend(notifier.hide()).addClass("notifying");
	
		notifier.show("slow", function () {
			notifier.timer = setTimeout(function () { notifier.hide("slow"); }, 5000);
		});
	},
	
	notifyButton : function (button, msg) {
		var currentText = button.text();
		
		button.text(msg);
		
		setTimeout(function (label) { button.text(label); }, 2000, currentText);
	},

	notifyModal : function (msg, buttons) {
		$(document).trigger("close.facebox");
		
		var container = $("<div/>");
		container.attr("id", "notification-modal");
		
		var textContainer = $("<p/>");
		textContainer.html(msg);
		container.append(textContainer);
		
		var buttonContainer = $("<div/>");
		buttonContainer.addClass("buttons");
		
		container.append(buttonContainer);
		
		$.facebox(container);
		
		for (var i = 0, _len = buttons.length; i < _len; i++) {
			var button = $("<button/>");
			buttonContainer.append(button);
		
			button.text(buttons[i].label);
			
			if ("class" in buttons[i]) {
				button.addClass(buttons[i]["class"]);
			}
			
			button.attr("abc", buttons[i].callback);
		}
	},
	
	clearNotifyModal : function () {
		$(document).trigger("close.facebox");
		$("#notification-modal").remove();
	},
	
	formatBlogThisData : function (url, title, selection) {
		var template = SCRIBEFIRE.prefs.getCharPref("blogThisTemplate");
		return template.replace(/\$U/g, url).replace(/\$T/g, title).replace(/\$S/g, selection);
	},
	
	blogThis : function (url, title, selection) {
		editor.val(editor.val() + SCRIBEFIRE.formatBlogThisData(url, title, selection));
	},
	
	viewBlog : function () {
		var url = SCRIBEFIRE.getAPI().url;

		if (typeof chrome != 'undefined') {
			chrome.tabs.create({ "url": url });
		}
		else {
			window.open(url);
		}
	},
	
	populateBlogsList : function () {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		var oldSelectedBlog = $("#list-blogs").val();
		var newSelectedBlog = null;
		
		$("#list-blogs").html("");
		
		var count = 0;
		
		for (var i in blogs) {
			var blog = $("<option/>");
			blog.attr("value", i);
			
			// Only show the username as part of the label if the blog URL is listed twice.
			var label = blogs[i].name + " (" + blogs[i].url + ")";
			
			for (var j in blogs) {
				if (j != i && blogs[j].url == blogs[i].url && blogs[i].username) {
					label = blogs[i].name + " ("+blogs[i].username + " @ " + blogs[i].url+")";
					break;
				}
			}
			
			blog.text(label);
			
			for (var x in blogs[i]) {
				blog.data(x, blogs[i][x]);
			}
			
			$("#list-blogs").append(blog);
			
			if (i == oldSelectedBlog) {
				newSelectedBlog = oldSelectedBlog;
			}
			
			count++;
		}
		
		if (count > 0) {
			$("#list-blogs").val(SCRIBEFIRE.prefs.getCharPref("selectedBlog"));
			$("#list-blogs").show();
		}
		else {
			$("#list-blogs").hide();
			$(".blog-meta").hide();
			$(".blog-unmeta").show();
			$("#list-blogs").val("");
		}
		
		if (!newSelectedBlog) {
			$("#list-blogs").change();
		}
	},
	
	entryListCache : null,
	
	populateEntriesList : function (filter, useCache) {
		// @todo localize
		$("#list-entries").html('<option value="scribefire:new:posts" type="posts">' + scribefire_string("entry_new_label") + '</option>');
		
		$("#buttons-publish-published").hide();
		$("#buttons-publish-draft").show();
		
		$("#bar-entries").attr("busy", "true");
		
		for (var i in SCRIBEFIRE.autocomplete) {
			SCRIBEFIRE.autocomplete[i] = [];
		}
		
		var filters = [];
		
		if (filter) {
			var filterString = filter.toLowerCase().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
			var filterParts = [];

			// We now have a space delimited filter string, but it may included quoted phrases
			var currentFilter = "";
			var inQuotes = 0;

			for (var i = 0; i < filterString.length; i++) {
				var theChar = filterString.charAt(i);

				if (theChar == "'" || theChar == '"') {
					if (inQuotes == theChar) {
						inQuotes = false;
					}
					else if (currentFilter.length == 0 || (currentFilter.length == 1 && (currentFilter == "-"))){
						inQuotes = theChar;
					}
					else {
						currentFilter += theChar;
					}
				}
				else if (theChar == "+" && currentFilter.length == 0) {
				}
				else {
					if (theChar == " "){ 
						if (!inQuotes) {
							filterParts.push(currentFilter);
							currentFilter = "";
							continue;
						}
					}

					currentFilter += filterString.charAt(i);
				}
			}

			if (currentFilter != "") filterParts.push(currentFilter);

			for (var i = 0; i < filterParts.length; i++) {
				var nomatch = false;

				if (filterParts[i].charAt(0) == '-') {
					filterParts[i] = filterParts[i].substring(1);
					nomatch = true;
				}

				if (filterParts[i]) {
					filters.push( { "nomatch" : nomatch, "regex" : new RegExp(filterParts[i], "i") } );
				}
			}
		}
		
		function passesFilter(str, filters) {
			if (filters.length == 0) {
				return true;
			}
			else {
				for (var i = 0, _len = filters.length; i < _len; i++) {
					if (filters[i].nomatch) {
						if (str.match(filters[i].regex)) {
							return false;
						}
					}
					else {
						if (!str.match(filters[i].regex)) {
							return false;
						}
					}
				}
			}
			
			return true;
		}
		
		function success(rv_) {
			SCRIBEFIRE.entryListCache = rv_;
			
			// @todo localize
			if ("length" in rv_) {
				var rv = { "Posts" : rv_ };
			}
			else {
				var rv = rv_;
			}
			
			$("#list-entries").html('');
			
			$("#list-entries").attr("ignoreContent", "true");
			
			var tags = [];
			var custom_field_keys = [];
			
			var selectedEntry = SCRIBEFIRE.prefs.getCharPref("state.entryId");
			
			// Move drafts up to the top of the list.
			for (var label in rv) {
				for (var i = 0, _len = rv[label].length; i < _len; i++) {
					if (!rv[label][i].published) {
						var entry = rv[label][i];
						rv[label].splice(i, 1);
						rv[label].unshift(entry);
					}
				}
			}
			
			var notes = SCRIBEFIRE.prefs.getJSONPref("notes", {});
			
			// @todo localize
			if (!("Posts" in rv)) {
				rv.Posts = [];
			}
			
			for (var i in notes) {
				rv.Posts.unshift(notes[i]);
			}
			
			var main_list = $("#list-entries");
			var list = main_list;
			
			var entry_lists = rv;
			
			for (var label in entry_lists) {
				var rv = entry_lists[label];
				
				var list = $("<optgroup />");
				list.attr("label", label);
			
				main_list.append(list);
				
				var postType = label.toLowerCase();
				
				var option = $("<option/>");
				option.attr("value", "scribefire:new:" + postType);
				option.text(scribefire_string("entry_new_label"));
				option.data("type", postType);
				list.append(option);
				
				for (var i = 0; i < rv.length; i++) {
					var optionText = rv[i].title;
					
					if (!rv[i].published) {
						if (rv[i].id.toString().indexOf("local:") == 0) {
							optionText = scribefire_string("entry_label_format", [ scribefire_string("entry_localDraft_label"), optionText ]);
						}
						else {
							optionText = scribefire_string("entry_label_format", [ scribefire_string("entry_draft_label"), optionText ]);
						}
					}
					else if (rv[i].timestamp) {
						var publishDate = rv[i].timestamp;
					
						if (publishDate.getTime() > (new Date().getTime())) {
							optionText = scribefire_string("entry_label_format", [ scribefire_string("entry_scheduled_label"), optionText ]);
						}
					}
					
					if (filters.length > 0) {
						if (!(selectedEntry && rv[i].id == selectedEntry)) {
							if (!passesFilter(optionText.toLowerCase(), filters)) {
								continue;
							}
						}
					}
					
					var entry = $("<option/>");
					
					for (var x in rv[i]) {
						entry.data(x, rv[i][x]);
					}
					
					entry.data("type", postType);
					
					entry.attr("value", rv[i].id);
					entry.text(optionText);
					
					if ("tags" in rv[i] && rv[i].tags) {
						var tag_parts = rv[i].tags.split(",");
					
						for (var j = 0; j < tag_parts.length; j++) {
							var tag = tag_parts[j].replace(/^\s+|\s+$/g, "");

							if (tag) {
								tags.push(tag);
							}
						}
					}
				
					if ("custom_fields" in rv[i]) {
						for (var j = 0; j < rv[i].custom_fields.length; j++) {
							var custom_field_key = rv[i].custom_fields[j].key;
						
							if (custom_field_key[0] == "_") continue;
						
							custom_field_keys.push(custom_field_key);
						}
					}
				
					list.append(entry);
				}
			}
			
			if (selectedEntry) {
				if ($("#list-entries option[value='" + selectedEntry + "']").length > 0) {
					$("#list-entries").val(selectedEntry);
				
					SCRIBEFIRE.prefs.setCharPref("state.entryId", "");
				}
			}
			
			SCRIBEFIRE.autocomplete.tags = tags.unique();
			SCRIBEFIRE.autocomplete.custom_field_keys = custom_field_keys.unique();
			
			$("#list-entries").change();
			$("#list-entries").removeAttr("ignoreContent")
			$("#bar-entries").attr("busy", "false");
		}
		
		if (useCache && SCRIBEFIRE.entryListCache) {
			success(SCRIBEFIRE.entryListCache);
		}
		else {
			SCRIBEFIRE.getAPI().getPosts(
				{ },
				success,
				function failure(rv) {
					rv.func = "getPosts";
					$("#bar-entries").attr("busy", "false");
				
					SCRIBEFIRE.genericError(rv);
				}
			);
		}
	},
	
	populateTemplatesList : function () {
		var templates = SCRIBEFIRE.prefs.getJSONPref("templates", {});
		var templateList = $("#list-templates");
		
		templateList.children(":not(:first)").remove();
		
		for (var i in templates) {
			var option = $("<option/>");
			option.val(i);
			
			var optionText = "";
			
			if (templates[i].title) {
				optionText = templates[i].title + ": " + templates[i].content.substr(0,30);
				
				if (templates[i].content.length > 30) {
					optionText += "...";
				}
			}
			else {
				optionText = templates[i].content.substr(0,50);
				
				if (templates[i].content.length > 50) {
					optionText += "...";
				}
			}
			
			option.text(optionText);
			option.data("title", templates[i].title);
			option.data("content", templates[i].content);
			
			templateList.append(option);
		}
		
		templateList.val("");
	},
	
	clearCustomFields : function () {
		var template = $(".custom_field:first").clone(true);
		template.find("input, textarea").val("");
		
		$(".custom_field").remove();
		
		$("#custom-fields").append(template);
	},
	
	addCustomField : function (id, key, val, force) {
		if (key && key[0] == "_") return;
		
		var template = $(".custom_field:first").clone(true);
		template.find("input, textarea").val("");
		template.find("*[name='id']").val(id);
		template.find("*[name='key']").val(key);
		template.find("*[name='value']").val(val);
		
		if (!force && $(".custom_field").length == 1 && !$(".custom_field:first *[name='key']").val() && !$(".custom_field:first *[name='value']").val()) {
			$(".custom_field:first").remove();
		}
		
		$("#custom-fields").append(template);
	},
	
	getCustomFields : function (fullSet) {
		var custom_fields = [];
		
		$(".custom_field").each(function () { 
			var field = { };
			field.id = $(this).find("*[name='id']").val();
			
			if (!field.id) delete field.id;
			
			field.key = $(this).find("*[name='key']").val();
			field.value = $(this).find("*[name='value']").val();
			
			if (field.key || fullSet) {
				custom_fields.push(field);
			}
		});
		
		return custom_fields;
	},
	
	deletePost : function (postId, callbackSuccess, callbackFailure) {
		function success(rv) {
			$("#list-entries option[value='"+postId+"']").remove();
			
			if (callbackSuccess) {
				callbackSuccess(rv);
			}
		}
		
		if (postId.toString().indexOf("local:") == 0) {
			var notes = SCRIBEFIRE.prefs.getJSONPref("notes", {});
			delete notes[postId];
			SCRIBEFIRE.prefs.setJSONPref("notes", notes);
			
			success({ "msg" : scribefire_string("notification_delete_draft") });
		}
		else {
			var params = { "id": postId };
		
			var option = $("#list-entries option[value='"+params.id+"']:first");
		
			// Pass along any custom post metadata that the API stored.
			var attrs = option.data();
		
			for (var x in attrs) {
				params[x] = attrs[x];
			}
		
			SCRIBEFIRE.getAPI().deletePost(
				params,
				success,
				function failure(rv) {
					SCRIBEFIRE.error(scribefire_string("error_post_delete", [ rv.status, rv.msg ]));
					
					if (callbackFailure) {
						callbackFailure(rv);
					}
				}
			);
		}
	},
	
	addCategory : function (categoryName, callbackSuccess, callbackFailure) {
		var params = { "name" : categoryName };
		
		SCRIBEFIRE.getAPI().addCategory(
			params,
			function success(rv) {
				var option = $("<option/>");
				option.text(rv.name);
				option.attr("value", rv.name);
				option.attr("categoryId", rv.id);
				option.attr("selected", "selected");
				$("#list-categories").append(option).change();
				
				if (callbackSuccess) {
					callbackSuccess(rv);
				}
			},
			function failure(rv) {
				// @localize
				
				SCRIBEFIRE.error(scribefire_string("error_category_add", rv.status));
				
				if (callbackFailure) {
					callbackFailure(rv);
				}
			}
		);
	},
	
	removeBlog : function (blogKey) {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		delete blogs[blogKey];
		
		SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
		
		SCRIBEFIRE.populateBlogsList();
	},
	
	getBlog : function (blogKey) {
		if (!blogKey) {
			blogKey = $("#list-blogs").val();
		}
		
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		return blogs[blogKey];
	},
	
	setBlog : function (blog, blogKey) {
		if (!blogKey) {
			blogKey = $("#list-blogs").val();
		}
		
		var newBlogKey = blog.url;
		if (blog.username) newBlogKey = blog.username + "@" + newBlogKey;
		
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		if (blogKey in blogs) delete blogs[blogKey];
		blogs[newBlogKey] = blog;
		
		SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
		
		// Check if there is another blog at this URL.
		var count = 0;
		
		for (var i in blogs) {
			if (blogs[i].url == blog.url) {
				count++;
				
				if (count >= 2) {
					break;
				}
			}
		}
		
		var label = blog.name;
		
		if (count >= 2) {
			label += " (" + blog.username + " @ " + blog.url + ")";
		}
		else {
			label += " (" + blog.url + ")";
		}
		
		// Set the new label and the new blogKey
		$("#list-blogs option[value='" + blogKey + "']").text(label).val(newBlogKey);
		
		if (blog.url in blogApis) {
			delete blogApis[blog.url];
		}
	},
	
	getAPI : function () {
		if (!SCRIBEFIRE.currentAPI) {
			var selectedBlog = $("#list-blogs").val();
			
			if (!selectedBlog) {
				SCRIBEFIRE.currentAPI = new blogAPI();
			}
			else {
				var blog = SCRIBEFIRE.getBlog(selectedBlog);
				
				SCRIBEFIRE.currentAPI = getBlogAPI(blog.type, blog.apiUrl).init(blog);
			}
		}
		
		return SCRIBEFIRE.currentAPI;
	},
	
	/**
	 * Given a URL, retrieve any discoverable metadata about the blog's publishing system.
	 *
	 * @param {String} url The URL of the blog.
	 * @param {Function} callbackSuccess The function to call if no errors occur.
	 * @param {Function} callbackFailure The function to call if an error occurs.
	 * @param {Boolean} secondTry Whether or not we've already tried bypassing adult content
	 *        notices on the blog.
	 */
	
	getBlogMetaData : function (url, callbackSuccess, callbackFailure, secondTry) {
		url = $.trim(url);
		
		if (!url.match(/^https?:\/\//)) {
			url = "http://" + url;
		}
		
		if (url.indexOf("/", url.indexOf("://") + 3) == -1) {
			// Add a trailing slash to domain-only URLs
			url += "/";
		}
		
		var parsed = parseUri(url);
		
		var metaData = {
			type : null,
			apiUrl : null,
			url : null
		};
		
		metaData.url = url;
		
		// Standard URL blog services.
		if (parsed.host.search(/\.tumblr\.com$/i) != -1) {
			metaData.type = "tumblr";
			metaData.apiUrl = "http://www.tumblr.com/api";
		}
		else if (parsed.host.search(/\.posterous\.com$/i) != -1) {
			metaData.type = "posterous";
			metaData.apiUrl = "http://posterous.com/api";
		}
		else if (parsed.host.search(/\.xanga\.com$/i) != -1) {
			metaData.type = "metaweblog";
			metaData.id = 1;
			metaData.apiUrl = "http://api.xanga.com/metaweblogapi";
		}
		else if (parsed.host.search(/\.dreamwidth\.org$/i) != -1) {
			metaData.type = "livejournal";
			metaData.apiUrl = "http://www.dreamwidth.org/interface/xmlrpc";
		}
		
		if (metaData.type) {
			callbackSuccess(metaData);
		}
		else {
			// Do some requests to try and figure this sucker out.
			var req = new XMLHttpRequest();
			req.open("GET", url, true);
			
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					if (req.status < 300) {
						// Check for a <link /> tag.
						var linkTags = req.responseText.match(/<link(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g); //'
						
						var atomAPIs = {};
						
						if (linkTags) {
							for (var i = 0, _len = linkTags.length; i < _len; i++) {
								var link = $(linkTags[i]);
								
								if (link.attr("rel").match(/^service\./i) && link.attr("type") == 'application/atom+xml') {
									atomAPIs[link.attr("rel").toLowerCase()] = link.attr("href");
									
									metaData.type = "atom";
								}
								else if (!metaData.type) {
									if (link.attr("rel") == "pingback" && link.attr("href")) {
										metaData.type = "wordpress";
										metaData.apiUrl = link.attr("href");
										callbackSuccess(metaData);
										return;
									}
									else if (link.attr("title") == "RSD" && link.attr("href")) {
										// Check the RSD file.
										var rsdReq = new XMLHttpRequest();
										rsdReq.open("GET", resolveHref(url, link.attr("href")), true);
										rsdReq.overrideMimeType("text/xml");
								
										rsdReq.onreadystatechange = function () {
											if (rsdReq.readyState == 4) {
												if (rsdReq.status < 300) {
													var xml = xmlFromRequest(rsdReq);
													var jxml = $(xml);
											
													var engineName = $(jxml).find("engineName:first").text().toLowerCase();
											
													/*
													if (engineName == "typepad") {
														metaData.type = "typepad";
														metaData.apiUrl = "http://www.typepad.com/t/api";
														callbackSuccess(metaData);
														return;
													}
													*/
												
													var apis = [ $(jxml).find("api[preferred='true']"), $(jxml).find("api") ];
												
													for (var j = 0; j < apis.length; j++) {
														var api_set = apis[j];
													
														for (var i = 0; i < api_set.length; i++) {
															var api = $(api_set[i]);

															var name = api.attr("name").toLowerCase();
															var apiUrl = resolveHref(url, api.attr("apiLink"));
															
															switch (name) {
																/*
																case "blogger":
																	metaData.type = "blogger";
																break;
																*/
																case "metaweblog":
																	metaData.type = "metaweblog";
																break;
																case "movabletype":
																case "movable type":
																	metaData.type = "movabletype";
																break;
																case "wordpress":
																	metaData.type = "wordpress";
																break;
															}
												
															if (metaData.type) {
																if (api.attr("blogID")) {
																	metaData.id = api.attr("blogID");
																}
													
																metaData.apiUrl = apiUrl;
																callbackSuccess(metaData);
																return;
															}
														}
													}
												
													callbackFailure("INCOMPATIBLE");
												}
												else {
													callbackFailure("RSD_ERROR", req.status);
												}
											}
										};
										
										rsdReq.send(null);
										
										return;
									}
								}
							}
							
							if ("service.post" in atomAPIs) {
								if (atomAPIs["service.post"].indexOf("blogger") != -1) {
									metaData.type = "blogger";
								}
								else {
									metaData.type = "atom";
								}
								
								metaData.atomAPIs = atomAPIs;
								
								if ("service.feed" in atomAPIs) {
									metaData.apiUrl = atomAPIs["service.feed"];
								}
								else {
									metaData.apiUrl = atomAPIs["service.post"];
									
									atomAPIs["service.feed"] = atomAPIs["service.post"];
								}
								
								callbackSuccess(metaData);
								return;
							}
						}
						
						var metaTags = req.responseText.match(/<meta(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g); //'
						
						if (metaTags) {
							for (var i = 0, _len = metaTags.length; i < _len; i++) {
								var meta = $(metaTags[i]);
								
								if (meta.attr("name") == "generator" && meta.attr("content") == "Posterous") {
									metaData.type = "posterous";
									metaData.apiUrl = "http://posterous.com/api";
									callbackSuccess(metaData);
									return;
								}
							}
						}
						
						// Hack for LiveJournal Adult Content Notice pages
						if (!secondTry && req.responseText.indexOf("http://www.livejournal.com/misc/adult_concepts.bml") != -1) {
							var adultReq = new XMLHttpRequest();
							adultReq.open("POST", "http://www.livejournal.com/misc/adult_concepts.bml", true);
							adultReq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
							
							adultReq.onreadystatechange = function () {
								if (adultReq.readyState == 4) {
									SCRIBEFIRE.getBlogMetaData(url, callbackSuccess, callbackFailure, true);
								}
							};
							
							adultReq.send("ret=" + encodeURIComponent(url) + "&adult_check=" + encodeURIComponent("Yes, I am at least 14 years old."));
							return;
						}
						
						callbackFailure("UNKNOWN_BLOG_TYPE");
					}
					else {
						callbackFailure("REMOTE_ERROR", req.status);
					}
				}
			};
			
			req.send(null);
		}
	},
	
	publish : function (callbackSuccess, callbackFailure) {
		var localDraft = false;
		
		var params = {};
		
		params.id = $("#list-entries").val();
		
		var option = $("#list-entries option[value='"+params.id+"']:first");
		
		// Pass along any custom post metadata that the API stored.
		var attrs = option.data();
		
		for (var x in attrs) {
			params[x] = attrs[x];
		}
		
		if (params.id.toString().indexOf("scribefire:new") == -1) {
			// Wordpress resets the post slug if you send an edit request without the original.
			// @bug-wordpress
			if (attrs.slug) {
				params.slug = attrs.slug;
			}
		}
		else {
			params.id = "";
		}
		
		params.title = $("#text-title").val();
		params.content = editor.val();
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#status-draft").val() == "1";
		params.slug = $("#text-slug").val();
		params.private = $("#checkbox-private").is(":checked");
		params.excerpt = $("#text-excerpt").val();
		params.custom_fields = SCRIBEFIRE.getCustomFields();
		/*
		params.featured_image = { id : $("#text-featured-image-id").val() };
		*/
		
		if ($("#toggle-schedule-scheduled").is(":visible")) {
			var timestampObject = new Date();
			
			var timestamp = getTimestamp();
		
			if (timestamp) {
				var timestampObject = new Date();
				timestamp = timestamp.replace(/[^0-9]/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
				timestampParts = timestamp.split(" ");
			
				timestampObject.setFullYear(timestampParts[0]);
				timestampObject.setMonth(timestampParts[1] - 1);
				timestampObject.setDate(timestampParts[2]);
				timestampObject.setHours(timestampParts[3]);
				timestampObject.setMinutes(timestampParts[4]);
				timestampObject.setSeconds(0);
			}
			
			params.timestamp = timestampObject;
		}
		
		// Not sure if this section is needed now with the Wordpress JavaScript.
		// Preserve newlines and angle brackets in <pre>
		
		if (params.content.match(/<pre[^>]*>/i)) {
			try {
				var allMatches = params.content.match(/<pre[^>]*>([\s\S]+?)<\/pre>/img);
				
				for (var i = 0; i < allMatches.length; i++) {
					var currentMatch = allMatches[i];
					
					var toReplace = currentMatch.match(/<pre[^>]*>([\s\S]+?)<\/pre>/im)[1];
					
					var replaced = toReplace.replace(/\n/g, "SCRIBEFIRE_NEWLINE");
					//replaced = replaced.replace(/</g, "&lt;");
					//replaced = replaced.replace(/>/g, "&gt;");
					
					// $ is a special backreference char.
					replaced = replaced.replace(/\$/g, "$$$$");
					
					params.content = params.content.replace(toReplace, replaced);
				}
			} catch (e) {
			}
		}
		
		// Many APIs convert newlines to <br />
		params.content = params.content.replace(/\n/g, "");
		params.content = params.content.replace(/SCRIBEFIRE_NEWLINE/g, "\n");
		
		// Don't think this is needed now.
		// params.content = params.content.replace(/<wbr>/gi, "<wbr/>");
		
		// Get rid of MS Word stuff.
		params.content = params.content.replace(/<[^>\s]+:[^\s>]+[^>]*>/g, " ");
		
		function success(rv) {
			SCRIBEFIRE.dirty = false;
			
			SCRIBEFIRE.prefs.setCharPref("state.entryId", rv.id);
			
			$("#list-entries").val("scribefire:new:" + $("#list-entries option:selected").data("type")).change();
			
			if (localDraft && rv.id.toString().indexOf("local:") == -1) {
				// Delete a local draft once it is published.
				var notes = SCRIBEFIRE.prefs.getJSONPref("notes", {});
				delete notes[localDraft];
				SCRIBEFIRE.prefs.setJSONPref("notes", notes);
			}
			
			SCRIBEFIRE.populateEntriesList($("#filter-entries").val());
			
			if (callbackSuccess) {
				rv.url = SCRIBEFIRE.getAPI().url;
				callbackSuccess(rv);
			}
		}
		
		if (params.draft && !SCRIBEFIRE.getAPI().ui.draft) {
			// The Blog API doesn't support drafts, so we'll save it locally.
			var notes = SCRIBEFIRE.prefs.getJSONPref("notes", {});
			
			if (!params.id) {
				localDraft = "local:" + (new Date().getTime());
				params.id = localDraft;
			}
			else {
				localDraft = params.id;
			}
			
			notes[params.id] = params;
			SCRIBEFIRE.prefs.setJSONPref("notes", notes);
			
			success( { "id" : params.id } );
			
			return;
		}
		else if (!params.draft && params.id && params.id.toString().indexOf("local:") == 0) {
			localDraft = params.id;
			params.id = "";
		}
		
		var entryType = $("#list-entries option:selected").data("type");
		
		if (entryType != "posts" && entryType != "pages") {
			// Posts are still loading.
			entryType = "posts";
		}
		
		if (entryType == 'posts') {
			SCRIBEFIRE.getAPI().publish(
				params,
				success,
				function (rv) {
					if (rv.status == SCRIBEFIRE.error_codes.USER_TRIGGERED_FAILURE) {
						if (rv.msg) {
							SCRIBEFIRE.notify(rv.msg);
						}
					}
					else {
						SCRIBEFIRE.error(scribefire_string("error_post_publish", rv.msg));
					}
					
					callbackFailure();
				}
			);
		}
		else if (entryType == 'pages') {
			SCRIBEFIRE.getAPI().publish(
				params,
				success,
				function (rv) {
					SCRIBEFIRE.error(scribefire_string("error_page_publish", rv.msg));
					callbackFailure();
				}
			);
		}
	},
	
	multipublish : function (blog, callbackSuccess, callbackFailure) {
		var params = {};
		params.id = "";
		params.title = $("#text-title").val();
		params.content = editor.val();
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#status-draft").val() == "1";
		params.slug = $("#text-slug").val();
		params.private = $("#checkbox-private").is(":checked");
		params.excerpt = $("#text-excerpt").val();
		params.custom_fields = SCRIBEFIRE.getCustomFields();
		/*
		params.featured_image = { id : $("#text-featured-image-id").val() };
		*/
		
		if ($("#toggle-schedule-scheduled").is(":visible")) {
			var timestampObject = new Date();
			
			var timestamp = getTimestamp();
		
			if (timestamp) {
				var timestampObject = new Date();
				timestamp = timestamp.replace(/[^0-9]/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
				timestampParts = timestamp.split(" ");
				
				timestampObject.setFullYear(timestampParts[0]);
				timestampObject.setMonth(timestampParts[1] - 1);
				timestampObject.setDate(timestampParts[2]);
				timestampObject.setHours(timestampParts[3]);
				timestampObject.setMinutes(timestampParts[4]);
				timestampObject.setSeconds(0);
			}
			
			params.timestamp = timestampObject;
		}
		
		// Not sure if this section is needed now with the Wordpress JavaScript.
		// Preserve newlines and angle brackets in <pre>
		
		if (params.content.match(/<pre[^>]*>/i)) {
			try {
				var allMatches = params.content.match(/<pre[^>]*>([\s\S]+?)<\/pre>/img);
				
				for (var i = 0; i < allMatches.length; i++) {
					var currentMatch = allMatches[i];
					
					var toReplace = currentMatch.match(/<pre[^>]*>([\s\S]+?)<\/pre>/im)[1];
					
					var replaced = toReplace.replace(/\n/g, "SCRIBEFIRE_NEWLINE");
					//replaced = replaced.replace(/</g, "&lt;");
					//replaced = replaced.replace(/>/g, "&gt;");
					
					// $ is a special backreference char.
					replaced = replaced.replace(/\$/g, "$$$$");
					
					params.content = params.content.replace(toReplace, replaced);
				}
			} catch (e) {
			}
		}
		
		// Many APIs convert newlines to <br />
		params.content = params.content.replace(/\n/g, "");
		params.content = params.content.replace(/SCRIBEFIRE_NEWLINE/g, "\n");
		
		// Get rid of MS Word stuff.
		params.content = params.content.replace(/<[^>\s]+:[^\s>]+[^>]*>/g, " ");
		
		var entryType = $("#list-entries option:selected").data("type");
		
		if (entryType != "posts" && entryType != "pages") {
			// Posts are still loading.
			entryType = "posts";
		}
		
		params.type = entryType;
		
		getBlogAPI(blog.type, blog.apiUrl).init(blog).publish(
			params,
			callbackSuccess,
			callbackFailure
		);
	},
	
	clearData : function () {
		SCRIBEFIRE.prefs.setCharPref("state.entryId", "scribefire:new:" + $("#list-entries option:selected").data("type"))
		
		$("#list-entries").val("scribefire:new:" + $("#list-entries option:selected").data("type")).change();
		$("#text-title").val("").change();
		$("#text-tags").val("").change();
		$("#text-excerpt").val("").change();
		setTimestamp();
			$("#toggle-schedule-immediately").show();
			$("#toggle-schedule-scheduled").hide();
		$("#status-draft").val("0").change();
		$("#list-categories").val("").change();
		$("#text-slug").val("").change();
		$("#checkbox-private").get(0).checked = false;
		
		editor.val('');
		
		SCRIBEFIRE.clearCustomFields();
		SCRIBEFIRE.dirty = false;
	},
	
	populateCategoriesList : function () {
		$("#list-categories").html("").change();
		
		$("#bar-categories").attr("busy", "true");
		
		SCRIBEFIRE.getAPI().getCategories(
			{ },
			function success(rv) {
				var selectedCategories = SCRIBEFIRE.prefs.getJSONPref("state.categories", []);
				
				for (var i = 0; i < rv.length; i++) {
					var option = $("<option/>");
					option.text(rv[i].name);
					option.attr("value", rv[i].name);
					option.attr("categoryId", rv[i].id);
					
					$("#list-categories").append(option);
				}
				
				if (selectedCategories.length > 0) {
					$("#list-categories").val(selectedCategories).change();
					SCRIBEFIRE.prefs.setJSONPref("state.categories", []);
				}
				
				$("#bar-categories").attr("busy", "false");
			},
			function failure(rv) {
				rv.func = "getCategories";
				
				$("#bar-categories").attr("busy", "false");
				
				SCRIBEFIRE.genericError(rv);
			}
		);
	},
	
	setBlogProperty : function (blogUrl, username, property, value) {
		// Not used. Referenced from a theoretical ATOM method.
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		if (blogUrl in blogs) {
			var blog = blogs[blogUrl];
		}
		else if ((username + "@" + blogUrl) in blogs) {
			var blog = blogs[username + "@" + blogUrl];
		}
		
		if (blog) {
			blog[property] = value;
		
			blogs[blogUrl] = blog;
		
			SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
		}
		else {
			throw new Exception("BlogNotFound");
		}
	},
	
	getBlogs : function (params, callbackSuccess, callbackFailure) {
		//console.log(params);
		
		getBlogAPI(params.type, params.apiUrl).init(params).getBlogs(
			params,
			function success (rv) {
				var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
				
				for (var i = 0; i < rv.length; i++) {
					var blog = rv[i];
					blog.type = params.type;
					blog.username = params.username;
					blog.password = params.password;
					
					if ("oauthToken" in params) {
						blog.oauthToken = params.oauthToken;
					}
					
					for (x in rv[i]) {
						blog[x] = rv[i][x];
					}
					
					var key = blog.url;
					if (blog.username) key = blog.username + "@" + key;
					
					blogs[key] = blog;
				}
				
				SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
				SCRIBEFIRE.populateBlogsList();
				
				callbackSuccess(rv);
			},
			function failure (rv) {
				SCRIBEFIRE.error(scribefire_string("error_api_getBlogs", rv.msg));
				callbackFailure(rv);
			}
		);
	},
	
	updateOptionalUI : function (doc) {
		if (!doc) doc = document;
		
		if ($("#list-blogs").val()) {
			$(".blog-unmeta").hide();
			$(".blog-meta").show();
		}
		
		var api = SCRIBEFIRE.getAPI();
		var contentType = $("#list-entries option:selected").data("type");
		
		if (!contentType || contentType === "null") {
			contentType = "default";
		}
		
		for (x in api.ui) {
			// x refers to a classname: ui-draft, ui-tags, etc.
			var id = ".ui-" + x;
			var widget = $(doc).find(id);
			
			if (!widget.length) {
				// x is really an ID (because we can't help it)
				id = "#" + x;
				widget = $(doc).find(id);
			}
			
			if (widget.length) {
				if (typeof api.ui[x] == 'object') {
					// This UI is differentiated between content types.
					if (!api.ui[x][contentType]) {
						widget.hide();
					}
					else {
						widget.show();
					}
				}
				else {
					if (!api.ui[x]) {
						widget.hide();
					}
					else {
						widget.show();
					}
				}
			}
		}
		
		if (!$("#list-blogs").val()) {
			$(".blog-meta").hide();
			$(".blog-unmeta").show();
		}
		
		adjustForSize();
	},
	
	exportData : function () {
		var exportJSON = {
			"blogs" : SCRIBEFIRE.prefs.getJSONPref("blogs", {}),
			"google_tokens" : SCRIBEFIRE.prefs.getJSONPref("google_tokens", {}),
			"notes" : SCRIBEFIRE.prefs.getJSONPref("notes", {}),
			"adbull.username" : SCRIBEFIRE.prefs.getCharPref("adbull.username"),
			"adbull.password" : SCRIBEFIRE.prefs.getCharPref("adbull.password"),
			"zemanta.tos" : SCRIBEFIRE.prefs.getBoolPref("zemanta.tos"),
			"zemanta.track" : SCRIBEFIRE.prefs.getBoolPref("zemanta.track"),
			"zemanta.key" : SCRIBEFIRE.prefs.getCharPref("zemanta.key"),
			"zemanta.config_url" : SCRIBEFIRE.prefs.getCharPref("zemanta.config_url"),
			"zemanta.hidePromo" : SCRIBEFIRE.prefs.getBoolPref("zemanta.hidePromo"),
			"zemanta.lastType" : SCRIBEFIRE.prefs.getCharPref("zemanta.lastType")
		};
		
		var jsonText = JSON.stringify(exportJSON);
		
		var exportComment = "/" + "**\n";
		exportComment += " * Save this file to your hard drive; you can import it into\n";
		exportComment += " * ScribeFire on another computer to transfer your blogs and settings.\n";
		exportComment += " * Once you've imported it, make sure to delete this file, as it\n";
		exportComment += " * contains encoded versions of your usernames and passwords.\n";
		
		if (browser === "chrome") {
			exportComment += " *\n";
			exportComment += " * You may need to copy and paste the contents of this file into \n";
			exportComment += " * a text file in order to save it.\n";
		}
		
		exportComment += " *" + "/\n\n";
		
		var formatComment = "/" + "* format=application/json;base64 *" + "/";
		
		function chunk_split (body, chunklen, end) {
			chunklen = parseInt(chunklen, 10) || 76;    end = end || '\r\n';

			if (chunklen < 1) {
				return false;
			} 

			return body.match(new RegExp(".{0," + chunklen + "}", "g")).join(end);
		}
		
		var exportFileText = exportComment + chunk_split(btoa(unescape(encodeURIComponent(jsonText))), 78, "\n") + "\n" + formatComment;
		
		if (platform === 'gecko') {
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, "Save as...", nsIFilePicker.modeSave);
			
			fp.appendFilter("Text file", "*.txt");
			fp.defaultString = "scribefire-export.txt";
			
			var result = fp.show();
			
			if (result !== nsIFilePicker.returnCancel){
				var file = fp.file;
				
				//convert to utf-8 from native unicode
				var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].getService(Components.interfaces.nsIScriptableUnicodeConverter);
				converter.charset = 'UTF-8';
				exportFileText = converter.ConvertFromUnicode(exportFileText);
				var outputStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
				
				outputStream.init(file, 0x04 | 0x08 | 0x20, 420, 0 );
				outputStream.write(exportFileText, exportFileText.length);
				outputStream.close();
			}
		}
		else {
			window.open("data:text/plain;base64,"+btoa(exportFileText));
		}
		
		$(document).trigger("close.facebox");
	},
	
	importData : function (files) {
		SCRIBEFIRE.importHelper(files, function (exportFileText) {
			// File Format is: 
			// Part 1: Comment to user.
			// Part 2: base64-encoded JSON
			// Part 3: Format comment
			
			// @todo Error handler.
			
			var base64 = exportFileText.replace(/\/\*[\s\S]*?\*\//mg, "").replace(/\s/g, "");
			var jsonText = decodeURIComponent(escape(atob(base64)));
			var json = JSON.parse(jsonText);
			
			SCRIBEFIRE.doImport(json);
			
			$("#import-file").val("");
			$(document).trigger("close.facebox");
			alert(scribefire_string("notification_import_complete"));
		});
	},
	
	doImport : function (json) {
		if ("blogs" in json) {
			var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
			for (var i in json.blogs) {
				blogs[i] = json.blogs[i];
			}
		
			SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
		}
	
		if ("google_tokens" in json) {
			var google_tokens = SCRIBEFIRE.prefs.getJSONPref("google_tokens", {});
		
			for (var i in json.google_tokens) {
				google_tokens[i] = json.google_tokens[i];
			}
		
			SCRIBEFIRE.prefs.setJSONPref("google_tokens", google_tokens);
		}
	
		if ("notes" in json) {
			var notes = SCRIBEFIRE.prefs.getJSONPref("notes", {});
			
			for (var i in json.notes) {
				var noteKey = i;
				
				/*
				while (noteKey in notes && (notes[noteKey] != json.notes[i])) {
					noteKey += "" + Math.floor(Math.random() * 9);
				}
				*/
				
				notes[noteKey] = json.notes[i];
			}
		
			SCRIBEFIRE.prefs.setJSONPref("notes", notes);
		}
		
		if ("adbull.username" in json && json["adbull.username"] && !SCRIBEFIRE.prefs.getCharPref("adbull.username")) {
			SCRIBEFIRE.prefs.setCharPref("adbull.username", json["adbull.username"]);
		}
		
		if ("adbull.password" in json && json["adbull.password"] && !SCRIBEFIRE.prefs.getCharPref("adbull.password")) {
			SCRIBEFIRE.prefs.setCharPref("adbull.password", json["adbull.password"]);
		}
		
		if ("zemanta.tos" in json && json["zemanta.tos"] && !SCRIBEFIRE.prefs.getBoolPref("zemanta.tos")) {
			SCRIBEFIRE.prefs.setBoolPref("zemanta.tos", true);
		}

		if ("zemanta.track" in json && json["zemanta.track"] && !SCRIBEFIRE.prefs.getBoolPref("zemanta.track")) {
			SCRIBEFIRE.prefs.setBoolPref("zemanta.track", true);
		}

		if ("zemanta.key" in json && json["zemanta.key"] && !SCRIBEFIRE.prefs.getCharPref("zemanta.key")) {
			SCRIBEFIRE.prefs.setCharPref("zemanta.key", json["zemanta.key"]);
		}

		if ("zemanta.config_url" in json && json["zemanta.config_url"] && !SCRIBEFIRE.prefs.getCharPref("zemanta.config_url")) {
			SCRIBEFIRE.prefs.setCharPref("zemanta.config_url", json["zemanta.config_url"]);
		}
		
		if ("zemanta.hidePromo" in json && json["zemanta.hidePromo"] && !SCRIBEFIRE.prefs.getBoolPref("zemanta.hidePromo")) {
			SCRIBEFIRE.prefs.setBoolPref("zemanta.hidePromo", true);
		}

		if ("zemanta.lastType" in json && json["zemanta.lastType"] && !SCRIBEFIRE.prefs.getCharPref("zemanta.lastType")) {
			SCRIBEFIRE.prefs.setCharPref("zemanta.lastType", json["zemanta.lastType"]);
		}
	},
	
	importMozilla : function () {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, "Select a file", nsIFilePicker.modeOpen);
		var res = fp.show();
		
		if (res == nsIFilePicker.returnOK){
			var file = fp.file;
			
			var fileInStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); 
			fileInStream.init(file, 0x01, 0644, false);
			
			var binaryInStream = Components.classes["@mozilla.org/binaryinputstream;1"] .createInstance(Components.interfaces.nsIBinaryInputStream); 
			binaryInStream.setInputStream(fileInStream); 
			
			var exportFileText = binaryInStream.readBytes(binaryInStream.available());
			
			var base64 = exportFileText.replace(/\/\*[\s\S]*?\*\//mg, "").replace(/\s/g, "");
			var jsonText = atob(base64);
			var json = JSON.parse(jsonText);
			
			SCRIBEFIRE.doImport(json);
			
			alert(scribefire_string("notification_import_complete"));
		}
	},
	
	importHelper : function (files, callback) {
		var f = files[0];
		
		var reader = new FileReader();
		
		reader.onload = (function (theFile) {
			return function (e) {
				var binaryData = e.target.result;
				
				callback(binaryData);
			};
		})(f);
		
		reader.readAsBinaryString(f);
	},
	
	blogsToImport : [],
	
	migrate : function (blogs, notes) {
		if (notes.length > 0) { 
			for (var i = 0, _len = notes.length; i < _len; i++) {
				var params = {};
				params.title = notes[i].title;
				params.content = notes[i].content;
				params.id = "local:imported:" + notes[i].modified;
			
				var localDrafts = SCRIBEFIRE.prefs.getJSONPref("notes", {});
				
				if (!(params.id in notes)) {
					localDrafts[params.id] = params;
					SCRIBEFIRE.prefs.setJSONPref("notes", localDrafts);
				}
			}
		
			SCRIBEFIRE.populateEntriesList(null, true);
		}
		
		SCRIBEFIRE.importBlogs(blogs);
	},
	
	importBlogs : function (blogs) {
		SCRIBEFIRE.blogsToImport = blogs;
		
		SCRIBEFIRE.importNextBlog();
	},
	
	importNextBlog : function () {
		if (SCRIBEFIRE.blogsToImport.length > 0) {
			var blog = SCRIBEFIRE.blogsToImport.shift();
			
			var existingBlogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
			
			if (!((blog.username + "@" + blog.url) in existingBlogs && !(blog.url in existingBlogs))) {
				$("#button-blog-add").click();
				
				$(".dialog-blog-add-import").show();
				$(".dialog-blog-add-normal").hide();
				
				$("#text-blog-url").val(blog.url);
				$("#text-blog-username").val(blog.username);
				$("#text-blog-password").val(blog.password);
				$("#text-addblog-id").val(blog.blog_id);
				$("#button-blog-urlcheck").click();
			}
			else {
				SCRIBEFIRE.importNextBlog();
			}
		}
	},
	
	dragAndDropUploadTimer : null,
	
	enableDragAndDropUpload : function () {
		clearTimeout(SCRIBEFIRE.dragAndDropUploadTimer);
		
		$("#hidden-file-upload").attr("active", true);
		
		SCRIBEFIRE.dragAndDropUploadTimer = setTimeout(SCRIBEFIRE.disableDragAndDropUpload, 2000);
	},
	
	disableDragAndDropUpload : function () {
		$("#hidden-file-upload").removeAttr("active");
		
		clearTimeout(SCRIBEFIRE.dragAndDropUploadTimer);
	},
	
	error : function (msg, errorCode) {
		var container = $("<div/>");
		var header = $("<h3/>");
		header.text(scribefire_string("error_header"));
		container.append(header);
		
		var message = $("<p/>");
		message.text(msg);
		container.append(message);
		
		if ($("#dialog-blog-add").is(":visible")) {
			$("#dialog-blog-add-error").html("").append(container).fadeIn();
			$("button.busy").removeClass("busy");
		}
		else {
			/*
			if (errorCode == 'BadAuthentication') {
				errorHTML += '<p><a href="#" id="button-update-auth">Click here to update your username and password.</a></p>';
			}
			*/
			
			container.addClass("error");
			
			$.facebox(container);
		}
	},
	
	addTab : function (url) {
		window.open(url);
	}
};

var SCRIBEFIRE_ACCOUNT_WIZARD = {
	accountWizardBlog : {},
	
	add : function () {
		SCRIBEFIRE_ACCOUNT_WIZARD.accountWizardBlog = {};

		$.facebox($("#dialog-blog-add"));

		$("#text-blog-url").die("change").live("change", function () {
			$("#label-add-blog-url").text($(this).val());
		});

		$("#text-blog-api-url").die("change").live("change", function () {
			$("#label-add-blog-apiurl").text($(this).val());
		});

		$("#text-addblog-id").die("change").live("change", function () {
			$("#label-add-blog-blogid").text($(this).val());
		});
		
		$(".step-2-oauth").hide();
		$(".step-2-nooauth").show();

		$("#button-blog-urlcheck").die("click").live("click", function (e) {
			var button = $(this);

			button.addClass("busy");

			$("#list-blog-types").val("").change();
			$("#text-blog-api-url").val("").change();
//			$("#text-blog-username").val("");
//			$("#text-blog-password").val("");
//			$("#text-addblog-id").val("").change();

			SCRIBEFIRE.getBlogMetaData(
				$("#text-blog-url").val(),
				function (metaData) {
					button.removeClass("busy");
					
					$("#text-add-blog-id-container").hide();
					
					SCRIBEFIRE_ACCOUNT_WIZARD.accountWizardBlog = metaData;
					
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
						if (!$(this).attr("is_open")) {
							$(this).click();
						}
					});
				
					// Collapse the URL container
					// Collapse the blog type container
					// Collapse the API URL container.
					$("#bar-add-blog-url, #bar-add-blog-type, #bar-add-blog-apiurl").each(function () {
						if ($(this).attr("is_open")) {
							$(this).click();
						}
					});

					$("#bar-add-blog-credentials").each(function () {
						if (!$(this).attr("is_open")) {
							$(this).click();
						}
					});
					
					if (false && ( metaData.url.indexOf(".wordpress.com") != -1 || metaData.url.indexOf(".blogspot.com") != -1 ) ) {
						$("#oauth-token-input").hide();
						
						// Use the OAuth2 authentication for wordpress.com.
						$(".step-2-oauth").show();
						$(".step-2-nooauth").hide();
						
						// Open up the auth container.
						$("#bar-oauth").each(function () {
							if (!$(this).attr("is_open")) {
								$(this).click();
							}
						});
						
						$("#button-oauth-authorize").unbind("click").click(function () {
							var button = $(this).addClass("busy");
							
							// $("#oauth-token-input").show();
							
							if (metaData.url.indexOf(".wordpress.com") != -1) {
								var tempApi = new wordpressAPI();
							}
							else {
								var tempApi = new bloggerAPI();
							}
						
							// Wait for the token pref to be sent by the content script.
							var prefObserver = {
								observe : function (subject, topic, data) {
									if (topic == 'nsPref:changed') {
										if (data == 'oauth_token') {
											if (platform == 'gecko') {
												prefs.removeObserver("", prefObserver);
											}
											else {
												SCRIBEFIRE.prefs.removeObserver(observerKey);
											}
											
											var token = SCRIBEFIRE.prefs.getCharPref("oauth_token");
//											$("#text-oauth-token").val(token);
											
											if (!token) {
												// If a blank token was set, an error message should have also been set.
												button.removeClass("busy");
											
												var error = SCRIBEFIRE.prefs.getCharPref("oauth_token_error");
											
												SCRIBEFIRE.error(error);
											
												SCRIBEFIRE.prefs.setCharPref("oauth_token_error", "");
											
												return;
											}
											
											// Exchange the access token for an auth token.
											tempApi.getAuthToken(token, function (t) {
												SCRIBEFIRE_ACCOUNT_WIZARD.accountWizardBlog.oauthToken = t;
											
												var params = SCRIBEFIRE_ACCOUNT_WIZARD.accountWizardBlog;
												params.apiUrl = $("#text-blog-api-url").val();
												params.type = $("#list-blog-types").val();
												params.username = "";
												params.password = "";
												params.blogUrl = $("#text-blog-url").val();
											
												if ("url" in params) {
													params.blogUrl = params.url;
													delete params.url;
												}
												
												SCRIBEFIRE.getBlogs(
													params,
													function (rv) {
														button.removeClass("busy");
													
														$(document).trigger("close.facebox");
													
														SCRIBEFIRE.notify(scribefire_string("notification_blog_add"));
													
														if ($("#list-entries").val().indexOf("scribefire:new") == 0) {
															// Only select a new blog if the user wasn't working on an entry from another blog.
															$("#list-blogs").val(rv[0].url).change();
														}
													
														if (SCRIBEFIRE.blogsToImport.length > 0) {
															SCRIBEFIRE.importNextBlog();
														}
													},
													function (rv) {
														button.removeClass("busy");
													}
												);
											});
										}
									}
								}
							};
						
							if (platform == 'gecko') {
								var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch).getBranch("extensions.scribefire.");
								prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
							
								prefs.addObserver("", prefObserver, false);
							}
							else {
								var observerKey = SCRIBEFIRE.prefs.addObserver(prefObserver);
							}
						
							SCRIBEFIRE.addTab(tempApi.oauth.endpoints.authorizationUrl(metaData));
						});
					}
					else {
						$("#text-blog-username").focus();
					}
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
							if (!$(this).attr("is_open")) {
								$(this).click();
							}
						});
					}

					SCRIBEFIRE.error(error);
				}
			);
		});

		$("#button-blog-logincheck").die("click").live("click", function (e) {
			var button = $(this);
			button.addClass("busy");

			var params = SCRIBEFIRE_ACCOUNT_WIZARD.accountWizardBlog;

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
					
					if (SCRIBEFIRE.blogsToImport.length > 0) {
						SCRIBEFIRE.importNextBlog();
					}
					else {
						$(document).trigger("close.facebox");
						
						SCRIBEFIRE.notify(scribefire_string("notification_blog_add"));
						
						if ($("#list-entries").val().indexOf("scribefire:new") == 0) {
							// Only select a new blog if the user wasn't working on an entry from another blog.
							$("#list-blogs").val(rv[0].username + "@" + rv[0].url).change();
						}
					}
				},
				function (rv) {
					button.removeClass("busy");
				}
			);
		});
		
		if (SCRIBEFIRE.blogsToImport.length == 0) {
			$(".dialog-blog-add-normal").show();
			$(".dialog-blog-add-import").hide();
		}
		else {
			$(".dialog-blog-add-import").show();
			$(".dialog-blog-add-normal").hide();
		}

		$("#dialog-blog-add").show()
			.find(".subbar[is_open]").removeAttr("is_open").end()
			.find(".subunderbar").hide().end()
			.find(".step-1 .subbar").click();//each(function () { $(this).click(); });
			
		$("#text-blog-url").val("").change();
		$("#list-blog-types").val("").change();
		$("#text-blog-api-url").val("").change();
		$("#text-blog-username").val("");
		$("#text-blog-password").val("");
		$("#text-addblog-id").val("").change();
		
		$("#text-blog-url").focus();
	}
};

if (typeof chrome != 'undefined') {
	chrome.extension.onRequest.addListener(
		function (request, sender, sendResponse) {
			if ("token" in request) {
				SCRIBEFIRE.prefs.setCharPref("google_token", request.token);
				chrome.tabs.remove(sender.tab.id);
			}
			else if ("oauth_token" in request) {
				if (!request.oauth_token) {
					SCRIBEFIRE.prefs.setCharPref("oauth_token_error", request.error);
				}
				
				SCRIBEFIRE.prefs.setCharPref("oauth_token", request.oauth_token);
				chrome.tabs.remove(sender.tab.id);
			}
		}
	);
}
else if (typeof opera != "undefined") {
	opera.extension.onmessage = function (evt) {
		var msg = JSON.parse(evt.data);
		
		if (msg.subject == 'token') {
			SCRIBEFIRE.prefs.setCharPref("google_token", msg.token);
		}
		else if (msg.subject == 'oauth_token') {
			SCRIBEFIRE.prefs.setCharPref("oauth_token_error", msg.error);
			SCRIBEFIRE.prefs.setCharPref("oauth_token", msg.oauth_token);
		}
	};
}
else if (typeof safari != 'undefined') {
	function waitForMessage(msgEvent) {
		if (msgEvent.name == "oauth_token") {
			var msg = JSON.parse(msgEvent.message);
			
			SCRIBEFIRE.prefs.setCharPref("oauth_token_error", msg.error);
			SCRIBEFIRE.prefs.setCharPref("oauth_token", msg.oauth_token);
		}
	}
	
	safari.self.addEventListener("message", waitForMessage, false);
}