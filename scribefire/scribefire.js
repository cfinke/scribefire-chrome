var SCRIBEFIRE = {
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
		},
		
		removeObserver : function (key) {
			delete this._observers[key];
		},
		
		getPref : function (prefName) {
			var key = this.namespace + prefName;
			
			if (typeof Components != 'undefined') {
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
			var rv = this.getPref(prefName) + "";

			if (rv == "null") {
				rv = "";
			}

			return rv;
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
				
				if (typeof Components != 'undefined') {
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
		}
	},

	load : function () {
		function pref(name, val) {
			if (SCRIBEFIRE.prefs.getPref(name) === null) {
				SCRIBEFIRE.prefs.setPref(name, val);
			}
		}
		
		SCRIBEFIRE.populateBlogsList();
		
		if ($("#list-blogs option").length == 0) {
			if (!SCRIBEFIRE.prefs.getBoolPref("firstrun")) {
				$.facebox($("<div><h2>Welcome to ScribeFire!</h2><p>The first thing you're probably going to want to do is add your blog.  Close this dialog and click 'Add a New Blog' to get started.</p></div>"));
				SCRIBEFIRE.prefs.setBoolPref("firstrun", true);
			}
		}
	},
	
	observe : function (subject, topic, prefName) {
		switch (prefName) {
		}
	},
	
	genericError : function (rv) {
		//console.log("Error ("+rv.status+"): " + rv.msg);
		
		SCRIBEFIRE.notify("Debugging error ("+rv.status+"): " + rv.func, null, null, null, "notifier-error");
	},
	
	notify : function (msg, buttonLabel, buttonCallback, buttonProperties, notifyClass) {
		$(".notifier").remove();
	
		var notifier = $("<div />");
		notifier.addClass("notifier");
	
		if (notifyClass) {
			notifier.addClass(notifyClass);
		}
	
		notifier.html(msg);
	
		if (buttonLabel) {
			var button = $("<button />");
			button.html(buttonLabel);
		
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
	
	blogThis : function (html) {
		editor.val(editor.val() + html);
	},
	
	populateBlogsList : function () {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		var oldSelectedBlog = $("#list-blogs").val();
		var newSelectedBlog = null;
		
		$("#list-blogs").html("");
		$("#list-inlinks-blogs").html("");
		
		var count = 0;
		
		for (var i in blogs) {
			var blog = $("<option/>");
			blog.attr("value", i);
			
			// Only show the username as part of the label if the blog URL is listed twice.
			var label = blogs[i].name + " (" + blogs[i].url + ")";
			
			for (var j in blogs) {
				if (j != i && blogs[j].url == blogs[i].url) {
					label = blogs[i].name + " ("+blogs[i].username + " @ " + blogs[i].url+")";
					break;
				}
			}
			
			blog.html(label);
			
			for (var x in blogs[i]) {
				blog.data(x, blogs[i][x]);
			}
			
			$("#list-blogs").append(blog);
			
			if (i == oldSelectedBlog) {
				newSelectedBlog = oldSelectedBlog;
			}
			
			count++;
			
			if (blogs[i].type == 'wordpress' || blogs[i].type == 'drupal' || blogs[i].type == 'movabletype') {
				$("#list-inlinks-blogs").append('<li><a href="'+blogs[i].url+'" target="_blank">'+blogs[i].name+'</a></li>');
			}
		}
		
		if (count > 0) {
			$("#list-blogs").val(SCRIBEFIRE.prefs.getCharPref("selectedBlog"));
			$("#list-blogs").show();
		}
		else {
			$("#list-blogs").hide();
			$("#list-blogs").val("");
		}
		
		if (!newSelectedBlog) {
			$("#list-blogs").change();
		}
	},
	
	populateEntriesList : function () {
		$("#list-entries").html('<option value="">(new)</option>');
		
		$("#buttons-publish-published").hide();
		$("#buttons-publish-draft").show();
		
		$("#bar-entries").attr("busy", "true");
		
		for (var i in SCRIBEFIRE.autocomplete) {
			SCRIBEFIRE.autocomplete[i] = [];
		}
		
		SCRIBEFIRE.getAPI().getPosts(
			{ },
			function success(rv) {
				$("#list-entries").attr("ignoreContent", "true");
				
				var tags = [];
				var custom_field_keys = [];
				
				var selectedEntry = SCRIBEFIRE.prefs.getCharPref("state.entryId");
				
				for (var i = 0; i < rv.length; i++) {
					var entry = $("<option/>");
					
					for (var x in rv[i]) {
						entry.data(x, rv[i][x]);
					}
					
					entry.attr("value", rv[i].id);
					entry.html(rv[i].title);
					
					if (selectedEntry && (entry.attr("value") == selectedEntry)) {
						entry.attr("selected", "selected");
						SCRIBEFIRE.prefs.setCharPref("state.entryId", "");
					}
					
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
					
					if (!entry.data("published")) {
						entry.html("[Draft] " + entry.html());
					}
					else if (entry.data("timestamp")) {
						var publishDate = entry.data("timestamp");
						
						if (publishDate.getTime() > (new Date().getTime())) {
							entry.html("[Scheduled] " + entry.html());
						}
					}
					
					$("#list-entries").append(entry);
				}
				
				SCRIBEFIRE.autocomplete.tags = tags.unique();
				SCRIBEFIRE.autocomplete.custom_field_keys = custom_field_keys.unique();
				
				$("#list-entries").change();
				$("#list-entries").removeAttr("ignoreContent")
				$("#bar-entries").removeAttr("busy");
			},
			function failure(rv) {
				rv.func = "getPosts";
				$("#bar-entries").removeAttr("busy");
				
				SCRIBEFIRE.genericError(rv);
			}
		);
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
		var params = { "id": postId };
		
		var option = $("#list-entries option[value='"+params.id+"']:first");
		
		// Pass along any custom post metadata that the API stored.
		var attrs = option.data();
		
		for (var x in attrs) {
			params[x] = attrs[x];
		}
		
		SCRIBEFIRE.getAPI().deletePost(
			params,
			function success(rv) {
				$("#list-entries option[value='"+postId+"']").remove();
				
				if (callbackSuccess) {
					callbackSuccess(rv);
				}
			},
			function failure(rv) {
				SCRIBEFIRE.error("ScribeFire found this little error when trying to delete your post: " + rv.status + "\n\n" + rv.msg);
				
				if (callbackFailure) {
					callbackFailure(rv);
				}
			}
		);
	},
	
	addCategory : function (categoryName, callbackSuccess, callbackFailure) {
		var params = { "name" : categoryName };
		
		SCRIBEFIRE.getAPI().addCategory(
			params,
			function success(rv) {
				var option = $("<option/>");
				option.html(rv.name);
				option.attr("value", rv.name);
				option.attr("categoryId", rv.id);
				option.attr("selected", "selected");
				$("#list-categories").append(option).change();
				
				if (callbackSuccess) {
					callbackSuccess(rv);
				}
			},
			function failure(rv) {
				SCRIBEFIRE.error("ScribeFire really wanted to help, but something broke when trying to add a category.  The error code was "+rv.status+".");
				
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
		
		var newBlogKey = blog.username + "@" + blog.url;
		
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
		$("#list-blogs option[value='" + blogKey + "']").html(label).val(newBlogKey);
		
		if (blog.url in blogApis) {
			delete blogApis[blog.url];
		}
	},
	
	getAPI : function () {
		var selectedBlog = $("#list-blogs").val();
		
		if (!selectedBlog) {
			var api = new blogAPI();
		}
		else {
			var blog = SCRIBEFIRE.getBlog(selectedBlog);
		
			var api = getBlogAPI(blog.type, blog.apiUrl);
			api.init(blog);
		}
		
		return api;
	},
	
	getBlogMetaData : function (url, callbackSuccess, callbackFailure) {
		if (!url.match(/^https?:\/\//)) {
			url = "http://" + url;
		}
		
		var parsed = parseUri(url);
		
		var metaData = {
			type : null,
			apiUrl : null,
			url : null
		};
		
		metaData.url = url;
		
		// Standard URL blog services.
		if (parsed.host.search(/\.wordpress\.com$/i) != -1) {
			metaData.type = "wordpress";
			metaData.apiUrl = "http://wordpress.com/xmlrpc.php";
		}
		else if (parsed.host.search(/\.tumblr\.com$/i) != -1) {
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
						var linkTags = req.responseText.match(/<link(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g);
						
						var atomAPIs = {};
						
						if (linkTags) {
							for (var i = 0; i < linkTags.length; i++) {
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
										rsdReq.open("GET", link.attr("href"), true);
										rsdReq.overrideMimeType("text/xml");
								
										rsdReq.onreadystatechange = function () {
											if (rsdReq.readyState == 4) {
												if (rsdReq.status < 300) {
													var xml = rsdReq.responseXML;
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
															var apiUrl = api.attr("apiLink");
														
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
		var params = {};
		
		params.id = $("#list-entries").val();
		
		if (params.id) {
			var option = $("#list-entries option[value='"+params.id+"']:first");
			
			// Pass along any custom post metadata that the API stored.
			var attrs = option.data();
			
			for (var x in attrs) {
				params[x] = attrs[x];
			}
			
			// Wordpress resets the post slug if you send an edit request without the original.
			// @bug-wordpress
			if (attrs.slug) {
				params.slug = attrs.slug;
			}
		}
		
		params.title = $("#text-title").val();
		params.content = editor.val();
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#status-draft").val() == "1";
		params.slug = $("#text-slug").val();
		params.private = $("#checkbox-private").is(":checked");
		
		params.custom_fields = SCRIBEFIRE.getCustomFields();
		
		if ($("#toggle-schedule-scheduled").is(":visible")) {
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
			
				params.timestamp = timestampObject;
			}
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
					replaced = replaced.replace(/</g, "&lt;");
					replaced = replaced.replace(/>/g, "&gt;");
					
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
		
		SCRIBEFIRE.getAPI().publish(
			params,
			function success(rv) {
				if (params.draft) {
					SCRIBEFIRE.prefs.setCharPref("state.entryId", rv.id);
				}
				
				$("#list-entries").val("").change();
				SCRIBEFIRE.populateEntriesList();
				
				if (!params.draft) {
					SCRIBEFIRE.clearData();
				}
				
				if (callbackSuccess) {
					rv.url = SCRIBEFIRE.getAPI().url;
					callbackSuccess(rv);
				}
			},
			function (rv) {
				SCRIBEFIRE.error("ScribeFire couldn't publish your post. Here's the error message that bubbled up:\n\n"+rv.msg);
				callbackFailure();
			}
		);
	},
	
	clearData : function () {
		$("#list-entries").val("").change();
		$("#text-title").val("").change();
		$("#text-tags").val("").change();
		setTimestamp();
			$("#toggle-schedule-immediately").show();
			$("#toggle-schedule-scheduled").hide();
		$("#status-draft").val("0").change();
		$("#list-categories").val("").change();
		$("#text-slug").val("").change();
		
		editor.val('');
		
		SCRIBEFIRE.clearCustomFields();
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
					option.html(rv[i].name);
					option.attr("value", rv[i].name);
					option.attr("categoryId", rv[i].id);
					
					$("#list-categories").append(option);
				}
				
				if (selectedCategories.length > 0) {
					$("#list-categories").val(selectedCategories).change();
					SCRIBEFIRE.prefs.setJSONPref("state.categories", []);
				}
				
				$("#bar-categories").removeAttr("busy");
			},
			function failure(rv) {
				rv.func = "getCategories";
				
				$("#bar-categories").removeAttr("busy");
				
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
		
		getBlogAPI(params.type, params.apiUrl).getBlogs(
			params,
			function success (rv) {
				var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
				
				for (var i = 0; i < rv.length; i++) {
					var blog = rv[i];
					blog.type = params.type;
					blog.username = params.username;
					blog.password = params.password;
					
					for (x in rv[i]) {
						blog[x] = rv[i][x];
					}
					
					blogs[blog.username + "@" + blog.url] = blog;
				}
				
				SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
				SCRIBEFIRE.populateBlogsList();
				
				callbackSuccess(rv);
			},
			function failure (rv) {
				SCRIBEFIRE.error("ScribeFire couldn't get the information it needed about your blog. Helpfully, your blog returned this message:\n\n" + rv.msg);
				callbackFailure(rv);
			}
		);
	},
	
	updateOptionalUI : function (doc) {
		if (!doc) doc = document;
		
		var api = SCRIBEFIRE.getAPI();
		
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
				if (!api.ui[x]) {
					widget.hide();
				}
				else {
					widget.show();
				}
			}
		}
	},
	
	error : function (msg) {
		msg = msg.replace(/</g, "&lt;").replace(/\n/g, "<br />");
		
		$.facebox("<div class='error'><h3>Well, this is embarrassing...</h3><p>"+msg+"</p></div>");
	}
};