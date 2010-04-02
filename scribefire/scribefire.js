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
			case "blogs":
				// Refill the blogs list.
				SCRIBEFIRE.populateBlogsList();
			break;
			case "selectedBlog":
				SCRIBEFIRE.prefs.setCharPref("selectedEntry", "");
			break;
		}
	},
	
	genericError : function (rv) {
		alert("Error ("+rv.status+"): " + rv.msg);
	},
	
	populateBlogsList : function () {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		$("#list-blogs").html("");
		
		for (var i in blogs) {
			var blog = $("<option/>");
			blog.attr("value", blogs[i].url);
			blog.html(blogs[i].name);
			$("#list-blogs").append(blog);
		}
		
		$("#list-blogs").val(SCRIBEFIRE.prefs.getCharPref("selectedBlog"));
		$("#list-blogs").change();
	},
	
	populateEntriesList : function () {
		$("#list-entries").html('<option value="">(new)</option>');
		
		SCRIBEFIRE.getAPI().getPosts(
			{ },
			function success(rv) {
				var selectedEntry = SCRIBEFIRE.prefs.getCharPref("selectedEntry");
				
				for (var i = 0; i < rv.length; i++) {
					var entry = $("<option/>");
					
					for (var x in rv[i]) {
						entry.attr(x, rv[i][x]);
					}
					
					entry.attr("value", rv[i].id);
					entry.html(rv[i].title);
					
					if (selectedEntry && (entry.attr("value") == selectedEntry)) {
						entry.attr("selected", "selected");
					}
					
					$("#list-entries").append(entry);
				}
				
				$("#list-entries").change();
			},
			SCRIBEFIRE.genericError
		);
	},
	
	deletePost : function (postId) {
		var params = { "id": postId };
		
		SCRIBEFIRE.getAPI().deletePost(
			params,
			function success(rv) {
				if (rv) {
					$("#list-entries option[value='"+postId+"']").remove();
					alert("Done");
				}
			},
			SCRIBEFIRE.genericError
		);
	},
	
	addCategory : function (categoryName) {
		var params = { "name" : categoryName };
		
		SCRIBEFIRE.getAPI().addCategory(
			params,
			function success(rv) {
				var option = $("<option/>");
				option.html(rv.name);
				option.attr("value", rv.name);
				option.attr("categoryId", rv.id);
				option.attr("selected", "selected");
				$("#list-categories").append(option);
			},
			SCRIBEFIRE.genericError
		);
	},
	
	removeBlog : function (url) {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		if (url in blogs) {
			delete blogs[url];
			
			SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
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
		var blog = SCRIBEFIRE.getBlog(selectedBlog);
		
		var api = getBlogAPI(blog.type);
		api.init(blog);
		
		return api;
	},
	
	getBlogMetaData : function (url, callback) {
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
		
		if (metaData.type) {
			callback(metaData);
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
						
						for (var i = 0; i < linkTags.length; i++) {
							var link = $(linkTags[i]);
							
							if (link.attr("rel") == 'service.post' && link.attr("type") == 'application/atom+xml' && link.attr("href").indexOf("posts/") != -1) {
								metaData.type = "blogger_atom";
								metaData.apiUrl = link.attr("href");
								callback(metaData);
								return;
							}
							else if (link.attr("rel") == "pingback" && link.attr("href")) {
								metaData.type = "wordpress";
								metaData.apiUrl = link.attr("href");
								callback(metaData);
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
											console.log(rsdReq.responseText);
											
											var xml = rsdReq.responseXML;
											var jxml = $(xml);
											
											var engineName = $(jxml).find("engineName:first").text().toLowerCase();
											
											if (engineName == "typepad") {
												metaData.type = "typepad";
												metaData.apiUrl = "http://www.typepad.com/t/api";
												callback(metaData);
												return;
											}
											
											var apis = $(jxml).find("api");
											
											for (var i = 0; i < apis.length; i++) {
												var api = $(apis[i]);

												var name = api.attr("name").toLowerCase();
												var apiUrl = api.attr("apiLink");
												
												switch (name) {
													case "blogger":
														metaData.type = "blogger";
													break;
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
													callback(metaData);
													return;
												}
											}
											
											alert("Well, this is embarrassing (RSD)...");
										}
										else {
											alert("RSD Check Error: "+rsdReq.status);
										}
									}
								};
								
								rsdReq.send(null);
								
								return;
							}
						}
						
						alert("Well, this is embarrassing...");
					}
					else {
						alert("API Check Error: "+req.status);
					}
				}
			};
			
			req.send(null);
		}
	},
	
	publish : function () {
		var params = {};
		params.title = $("#text-title").val();
		params.content = $("#text-content").val();
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#checkbox-draft").is(":checked");
		params.id = $("#list-entries").val();
		
		SCRIBEFIRE.getAPI().publish(
			params,
			function success(rv) {
				// @todo
				alert("Success!");
				console.log(rv);
			},
			SCRIBEFIRE.genericError
		);
	},
	
	populateCategoriesList : function () {
		$("#list-categories").html("");
		
		SCRIBEFIRE.getAPI().getCategories(
			{ },
			function success(rv) {
				for (var i = 0; i < rv.length; i++) {
					var option = $("<option/>");
					option.html(rv[i].name);
					option.attr("value", rv[i].name);
					option.attr("categoryId", rv[i].id);
					
					$("#list-categories").append(option);
				}
			},
			SCRIBEFIRE.genericError
		);
	},
	
	getBlogs : function (params, successCallback, failureCallback) {
		getBlogAPI(params.type).getBlogs(
			params,
			function success(rv) {
				var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
				
				for (var i = 0; i < rv.length; i++) {
					var blog = rv[i];
					blog.type = params.type;
					blog.username = params.username;
					blog.password = params.password;
					
					blogs[blog.url] = blog;
				}
				
				SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
				
				successCallback(rv);
			},
			function (rv) {
				SCRIBEFIRE.genericError(rv);
				failureCallback();
			}
		);
	}
};