var SCRIBEFIRE = {
	prefs : {
		namespace : "extensions.scribefire.",

		getPref : function (prefName) {
			var key = this.namespace + prefName;

			if (key in localStorage) {
				return localStorage[this.namespace + prefName];
			}
			else {
				return null;
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
				localStorage[this.namespace + prefName] = prefVal;
				
				SCRIBEFIRE.observe(null, null, prefName);
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
	
	populateBlogsList : function () {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		var oldSelectedBlog = $("#list-blogs").val();
		var newSelectedBlog = null;
		
		$("#list-blogs").html("");
		
		var count = 0;
		
		for (var i in blogs) {
			var blog = $("<option/>");
			blog.attr("value", blogs[i].url);
			blog.html(blogs[i].name + " ("+blogs[i].url+")");
			blog.attr("label", "test");
			$("#list-blogs").append(blog);
			
			if (blogs[i].url == oldSelectedBlog) {
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
			$("#list-blogs").val("");
		}
		
		if (!newSelectedBlog) {
			$("#list-blogs").change();
		}
	},
	
	populateEntriesList : function () {
		$("#list-entries").html('<option value="">(new)</option>');
		
		$("#bar-entries").addClass("bar-busy");
		
		SCRIBEFIRE.getAPI().getPosts(
			{ },
			function success(rv) {
				$("#list-entries").attr("ignoreContent", "true");
				
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
					
					$("#list-entries").append(entry);
				}
				
				$("#list-entries").change();
				$("#list-entries").removeAttr("ignoreContent")
				$("#bar-entries").removeClass("bar-busy");
			},
			function failure(rv) {
				rv.func = "getPosts";
				$("#bar-entries").removeClass("bar-busy");
				
				SCRIBEFIRE.genericError(rv);
			}
		);
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
	
	removeBlog : function (url) {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		if (url in blogs) {
			delete blogs[url];
			
			SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
			
			SCRIBEFIRE.populateBlogsList();
		}
/*		
		$("#list-blogs option[value='"+url+"']").remove();
		*/
	},
	
	getBlog : function (url) {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		if (url in blogs) {
			return blogs[url];
		}
		
		return false;
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
		params.content = WYSIWYG.val('text-content');
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#checkbox-draft").is(":checked");
		
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
		params.content = params.content.replace(/<wbr>/gi, "<wbr/>");
		
		// Get rid of MS Word stuff.
		params.content = params.content.replace(/<[^>\s]+:[^\s>]+[^>]*>/g, " ");
		
		SCRIBEFIRE.getAPI().publish(
			params,
			function success(rv) {
				$("#list-entries").val("").change();
				SCRIBEFIRE.populateEntriesList();
				SCRIBEFIRE.clearData();
				
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
		$("#text-title").val("").change();
		WYSIWYG.val('text-content', '');
		$("#checkbox-draft").removeAttr("checked");
		$("#text-tags").val("");
		setTimestamp();
			$("#toggle-schedule-immediately").show();
			$("#toggle-schedule-scheduled").hide();
		$("#list-categories").val("").change();
		$("#button-publish").html("Publish Post");
	},
	
	populateCategoriesList : function () {
		$("#list-categories").html("").change();
		
		$("#bar-categories").addClass("bar-busy");
		
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
				
				$("#bar-categories").removeClass("bar-busy");
			},
			function failure(rv) {
				rv.func = "getCategories";
				
				$("#bar-categories").removeClass("bar-busy");
				
				SCRIBEFIRE.genericError(rv);
			}
		);
	},
	
	setBlogProperty : function (blogUrl, property, value) {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		var blog = blogs[blogUrl];
		
		blog[property] = value;
		
		blogs[blogUrl] = blog;
		
		SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
	},
	
	getBlogs : function (params, callbackSuccess, callbackFailure) {
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
					
					blogs[blog.url] = blog;
				}
				
				SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
				SCRIBEFIRE.populateBlogsList();
				
				callbackSuccess(rv);
			},
			function failure (rv) {
				SCRIBEFIRE.error("Sigh... ScribeFire couldn't get the information it needed about your blog. Helpfully, your blog returned this message:\n\n" + rv.msg);
				callbackFailure(rv);
			}
		);
	},
	
	updateOptionalUI : function () {
		var api = SCRIBEFIRE.getAPI();
		
		for (x in api.ui) {
			//console.log(x + ": " + api.ui[x]);
			
			if (!api.ui[x]) {
				$("#ui-" + x).hide();
			}
			else {
				$("#ui-" + x).show();
			}
		}
	},
	
	error : function (msg) {
		msg = msg.replace(/</g, "&lt;").replace(/\n/g, "<br />");
		
		$.facebox("<div class='error'><h3>Well, this is embarrassing...</h3><p>"+msg+"</p></div>");
	}
};