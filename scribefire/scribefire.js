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
			localStorage[this.namespace + prefName] = prefVal;
			
			SCRIBEFIRE.observe(null, null, prefName);
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
		}
	},
	
	populateBlogsList : function () {
		var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
		
		$("#list-blogs").html("");
		
		for (var i in blogs) {
			var blog = $("<option/>");
			blog.attr("value", blogs[i].url);
			blog.html(blogs[i].blogName);
			$("#list-blogs").append(blog);
		}
	},
	
	populateEntriesList : function () {
		$("#list-entries").html('<option value="">(new)</option>');
		
		var api = SCRIBEFIRE.getAPI();
		
		XMLRPC_LIB.doCommand(
			api.xmlrpc,
			api.getRecentPosts(),
			function success(rv) {
				console.log(rv);
				
				for (var i = 0; i < rv.length; i++) {
					var entry = $("<option/>");
					
					for (var x in rv[i]) {
						entry.attr(x, rv[i][x]);
					}
					
					entry.attr("value", rv[i].postid);
					entry.html(rv[i].title);
					
					$("#list-entries").append(entry);
				}
			},
			function failure(status, msg) {
				alert("Error ("+status+"): " + msg);
			}
		);
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
		
		callback(metaData);
	},
	
	publish : function () {
		var params = {};
		
		params.title = $("#text-title").val();
		params.content = $("#text-content").val();
		params.categories = $("#list-categories").val() || [];
		params.tags = $("#text-tags").val();
		params.draft = $("#checkbox-draft").is(":checked");
		
		var api = SCRIBEFIRE.getAPI();
		
		XMLRPC_LIB.doCommand(
			api.xmlrpc,
			api.newPost(params),
			function success(rv) {
				console.log(rv);
				alert("success");
				// @todo
			},
			function failure(status, msg) {
				alert("Error ("+status+"): " + msg);
			}
		);
	},
	
	populateCategoriesList : function () {
		console.log("in pop cat");
		
		$("#list-categories").html("");
		
		var api = SCRIBEFIRE.getAPI();
		
		XMLRPC_LIB.doCommand(
			api.xmlrpc,
			api.getCategoryList(),
			function success(rv) {
				console.log(rv);
				
				for (var i = 0; i < rv.length; i++) {
					var option = $("<option/>");
					option.html(rv[i].categoryName);
					option.attr("value", rv[i].categoryName);
					option.attr("categoryId", rv[i].categoryId);
					
					$("#list-categories").append(option);
				}
			},
			function failure(status, msg) {
				alert("Error ("+status+"): " + msg);
			}
		);
	},
	
	tryBlogLogin : function (apiUrl, apiType, username, password, successCallback, failureCallback) {
		var api = getBlogAPI(apiType);
		api.init({ "xmlrpc": apiUrl, "username": username, "password": password});
		
		XMLRPC_LIB.doCommand(
			api.xmlrpc, 
			api.login(username, password),
			function success(rv) {
				alert("Succes: " + rv);
				
				var blogs = SCRIBEFIRE.prefs.getJSONPref("blogs", {});
				
				for (var i = 0; i < rv.length; i++) {
					var blog = rv[i];
					blog.type = apiType;
					blog.username = username;
					blog.password = password;
					blogs[blog.url] = blog;
				}
				
				SCRIBEFIRE.prefs.setJSONPref("blogs", blogs);
			},
			function failure(status, msg) {
				alert("Error ("+status+"): " + msg);
			}
		);
	}
};