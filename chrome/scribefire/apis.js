var blogApis = {
};

function getBlogAPI(type, apiUrl) {
	if (apiUrl in blogApis) {
		return blogApis[apiUrl];
	}
	
	var api = null;
	
	switch (type) {
		case "wordpress":
			api = new wordpressAPI();
		break;
		case "blogger":
			api = new bloggerAPI();
		break;
		case "tumblr":
			api = new tumblrAPI();
		break;
		case "metaweblog":
			api = new genericMetaWeblogAPI();
		break;
		case "movabletype":
		case "movable type":
			api = new genericMovableTypeAPI();
		break;
		case "atom":
			api = new genericAtomAPI();
		break;
		case "posterous":
			api = new posterousAPI();
		break;
		case "livejournal":
			api = new livejournalAPI();
		break;
		default:
			SCRIBEFIRE.error(scribefire_string("error_api_invalid", type));
		break;
	}
	
	if (api) {
		api.apiUrl = apiUrl;
		blogApis[apiUrl] = api;
		return api;
	}
}

var blogAPI = function () {
	this.ui = {};
	this.ui.categories = true;
	this.ui["add-category"] = true;
	this.ui.tags = true;
	this.ui.draft = false;
	this.ui.deleteEntry = true;	
	this.ui.timestamp = true;
	this.ui.slug = false;
	this.ui.private = false;
	this.ui["text-content_wp_more"] = false;
	this.ui.upload = false;
	this.ui["custom-fields"] = false;
	this.ui.excerpt = false;
	this.ui.pages = false;
	this.ui.getPosts = true;
	this.ui.oauth = false;
	this.ui.nooauth = true;
	
	this.oauthToken = null
	this.accessToken = null;
	
	/*
	this.ui["featured-image"] = false;
	*/
};

blogAPI.prototype = {
	init : function (blogObject) {
		for (x in blogObject) {
			this[x] = blogObject[x];
		}
		
		this.postInit();
		
		return this;
	},
	
	postInit : function () { },
	
	getBlogs : function (params, success, failure) {
		/**
		 * params = { "apiUrl" : "http://...", "username": "john", "password" : "secret123" }
		 */
		
		/**
		 * success(params) = [ {"url" : "http://...", "id" : "123", "name": "My Blog", 
		 *                      "apiUrl" : "http://...", "type": "wordpress", "username": "john", 
		 *                      "password": "secret123"}, ... ]
		 */
	},
	
	getPosts : function (params, success, failure) {
		/**
		 * params = { "limit": <int> }
		 */
		
		/**
		 * success(params) = [ { "id": <int>, "title": <string>, "content": <string>, "published": <bool>, "tags": <string>, "categories": <string>[] } ]
		 */
		
		success([]);
	},
	
	publish : function (params, success, failure) {
		/**
		 * params = { "title": <string>, "content": <string>, 
		 *            "categories": <int>[], "tags": <string>, 
		 *            "draft": <bool>, "id": <int> }
		 */
		
		/**
		 * success(params) = { "id": "123" }
		 */
		
		failure({"status": 0, "msg": scribefire_string("error_api_noBlog")});
	},
	
	deletePost : function (params, success, failure) {
		/**
		 * params = { "id" : <int> }
		 */
		
		/**
		 * success(params) = true
		 */
	},

	getCategories : function (params, success, failure) {
		/**
		 * params = { }
		 */
		
		/**
		 * success(params) = [ { "id": 1, "name": "Category 1" }, ... ]
		 */
		
		success([]);
	},
	
	addCategory : function (params, success, failure) {
		/**
		 * params = { "id": 1, "name": "Category" }
		 */
		
		/**
		 * success(params) = { "id": 1, "name": "Category" }
		 */
		
		if (failure) {
			failure({ "status": 0, "msg": scribefire_string("error_api_noCategorySupport")});
		}
		else {
			success(false);
		}
	},
	
	upload : function () {
		failure({ "status": 0, "msg": scribefire_string("error_api_noUploadSupport")});
	},
	
	getPostCategories : function (params, success, failure) {
		success($("#list-entries option[value='"+params.id+"']:first").data("categories"), "value");
	}
};

var genericMetaWeblogAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;

	this.ui.categories = false;
	this.ui.timestamp = true;
	this.ui.tags = false;
	this.ui.upload = !!((platform == 'gecko') || (window.File && window.FileReader && window.FileList && window.Blob));
	this.ui.draft = true;
	
	this.postInit = function () {
		this.ui.timestamp = !(this.apiUrl.indexOf("http://api.xanga.com/") == 0 || this.apiUrl.indexOf("http://my.opera.com/") == 0);
		this.ui.draft = !(this.apiUrl.indexOf("http://my.opera.com/") == 0);
	};
	
	this.getBlogs = function (params, success, failure) {
		// How safe is it to assume that MetaWeblog APIs implement the blogger_ methods?
		
		if (!params.id || !("id" in params)) {
			params.id = "0";
		}
		
		var args = [params.id, params.username, params.password];
		var xml = performancingAPICalls.blogger_getUsersBlogs(args);
		
		XMLRPC_LIB.doCommand(
			params.apiUrl,
			xml,
			function (rv) {
				if (success) {
					if (rv.length) {
						var blogs = [];
						
						for (var i = 0, _len = rv.length; i < _len; i++) {
							var blog = {};
							blog.url = resolveHref(params.apiUrl, rv[i].url);
							blog.id = rv[i].blogid;
							blog.name = rv[i].blogName;
							blog.apiUrl = params.apiUrl;
							blog.type = params.type;
							blog.username = params.username;
							blog.password = params.password;
						
							blogs.push(blog);
						}
					
						success(blogs);
					}
					else {
						if (failure) {
							failure( {"status" : 200, "msg" : scribefire_string("error_api_cannotConnect")});
						}
					}
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		
		if (!("limit" in params)) params.limit = 100;
		
		var args = [this.id, this.username, this.password, params.limit];
		
		var xml = performancingAPICalls.metaWeblog_getRecentPosts(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					for (var i = 0; i < rv.length; i++) {
						rv[i].id = rv[i].postid;
						rv[i].tags = rv[i].mt_keywords;
						rv[i].published = (rv[i].post_status != "draft");
						rv[i].private = (rv[i].post_status == "private");
						rv[i].content = rv[i].description;
						
						if (("mt_text_more" in rv[i]) && rv[i].mt_text_more) {
							rv[i].content += '<!--more-->';
							rv[i].content += rv[i].mt_text_more;
						}
						
						if (!("categories" in rv[i])){
							rv[i].categories = [];
						}
						
						if ("wp_slug" in rv[i]) {
							rv[i].slug = rv[i].wp_slug;
							delete rv[i].wp_slug;
						}
						
						if ("mt_excerpt" in rv[i]) {
							rv[i].excerpt = rv[i].mt_excerpt;
							delete rv[i].mt_excerpt;
						}
						
						rv[i].permalink = rv[i].permaLink;
						
						if ("date_created_gmt" in rv[i]) {
							rv[i].timestamp = rv[i].date_created_gmt;
							delete rv[i].date_created_gmt;
						}
						else if ("dateCreated" in rv[i]) {
							rv[i].timestamp = rv[i].dateCreated;
							delete rv[i].dateCreated;
						}
						
						/*
						if ("wp_featured_image" in rv[i]) {
							rv[i].featured_image = rv[i].wp_featured_image;
							delete rv[i].wp_featured_image;
						}
						*/
						
						delete rv[i].postid;
						delete rv[i].mt_keywords;
						delete rv[i].post_status;
						delete rv[i].mt_text_more;
						delete rv[i].description;
						delete rv[i].permaLink;
					}
					
					// success(rv);
					
					if (self.ui.pages) {
						var args = [self.id, self.username, self.password, params.limit];
						var xml = performancingAPICalls.wp_getPages(args);
						
						XMLRPC_LIB.doCommand(
							self.apiUrl,
							xml, 
							function (pages_rv) {
								// @todo Localize
								var true_rv = { "Posts" : rv, "Pages" : [] };
								
								for (var j = 0; j < pages_rv.length; j++) {
									var i = true_rv.Pages.length;
									
									true_rv.Pages[i] = pages_rv[j];
									
									if ("page_id" in true_rv.Pages[i]) {
										true_rv.Pages[i].id = true_rv.Pages[i].page_id;
										delete true_rv.Pages[i].page_id;
									}
									
									true_rv.Pages[i].published = (true_rv.Pages[i].page_status != "draft");
									true_rv.Pages[i].private = (true_rv.Pages[i].page_status == "private");
									delete true_rv.Pages[i].page_status;
									
									true_rv.Pages[i].content = true_rv.Pages[i].description;
									delete true_rv.Pages[i].description;

									if (("text_more" in true_rv.Pages[i]) && true_rv.Pages[i].text_more) {
										true_rv.Pages[i].content += '<!--more-->';
										true_rv.Pages[i].content += true_rv.Pages[i].text_more;
									}
									
									delete true_rv.Pages[i].text_more;

									if (!("categories" in true_rv.Pages[i])){
										true_rv.Pages[i].categories = [];
									}

									if ("wp_slug" in true_rv.Pages[i]) {
										true_rv.Pages[i].slug = true_rv.Pages[i].wp_slug;
										delete true_rv.Pages[i].wp_slug;
									}
									
									true_rv.Pages[i].permalink = true_rv.Pages[i].permaLink;
									delete true_rv.Pages[i].permaLink;
									
									if ("date_created_gmt" in true_rv.Pages[i]) {
										true_rv.Pages[i].timestamp = true_rv.Pages[i].date_created_gmt;
										delete true_rv.Pages[i].date_created_gmt;
									}
									else if ("dateCreated" in true_rv.Pages[i]) {
										true_rv.Pages[i].timestamp = true_rv.Pages[i].dateCreated;
										delete true_rv.Pages[i].dateCreated;
									}
								}
								
								success(true_rv);
							},
							function (status, msg) {
								success(rv);
								/*
								if (failure) {
									failure({"status": status, "msg": msg});
								}
								*/
							},
							self.oauthToken
						);
					}
					else {
						success(rv);
					}
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};

	this.publish = function (params, success, failure) {
		this.doPublish(params, success, failure);
	};
	
	this.doPublish = function (params, success, failure) {
		var contentStruct = { };

		if ("title" in params) {
			contentStruct.title = params.title;
		}

		if ("content" in params) {
			contentStruct.description = params.content;
		}

		if ("categories" in params) {
			contentStruct.categories = params.categories;
		}

		if ("tags" in params) {
			contentStruct.mt_keywords = params.tags;
		}
		
		if ("timestamp" in params && params.timestamp) {
			// It's converted to UTC in the conversion to XML Step.
			contentStruct.date_created_gmt = params.timestamp;
			// contentStruct.dateCreated = params.timestamp;
		}
		
		if ("private" in params && params.private) {
			contentStruct.post_status = "private";
		}
		
		if ("slug" in params && params.slug) {
			contentStruct.wp_slug = params.slug;
		}

		if ("draft" in params) {
			var publish = params.draft ? "bool0" : "bool1";
			
			if (params.draft) {
				// At least in Wordpress, a private post marked as a draft will just be published.
				if ("private" in params && params.private) {
					if (confirm(scribefire_string("confirm_private_status"))) {
						delete contentStruct.post_status;
					}
					else {
						failure({"status" : -1, "msg" : scribefire_string("cancel_private_status") });
						return;
					}
				}
			}
		}
		else {
			var publish = "bool1";
		}
		
		if ("custom_fields" in params) {
			contentStruct.custom_fields = params.custom_fields;
		}
		
		if (this.ui.excerpt) {
			if ("excerpt" in params) {
				contentStruct.mt_excerpt = params.excerpt;
			}
		}
		
		/*
		if (this.ui["featured-image"] && "featured_image" in params) {
			contentStruct.wp_featured_image = params.wp_featured_image;
		}
		*/
		
		if (("id" in params) && params.id) {
			var args = [params.id, this.username, this.password, contentStruct, publish];
			var xml = performancingAPICalls.metaWeblog_editPost(args);
		}
		else {
			var args = [this.id, this.username, this.password, contentStruct, publish];
			var xml = performancingAPICalls.metaWeblog_newPost(args);
		}
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					if (("id" in params) && params.id) {
						success({ "id" : params.id });
					}
					else {
						success({ "id": rv });
					}
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};
	
	this.deletePost = function (params, success, failure) {
		this.doDeletePost(params, success, failure);
	};
	
	this.doDeletePost = function (params, success, failure) {
		var args = ["0123456789ABCDEF", params.id, this.username, this.password, "bool1"];
		var xml = performancingAPICalls.blogger_deletePost(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml,
			function (rv) {
				if (success) {
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};
	
	this.upload = function (fileName, fileType, fileData, success, failure) {
		var bits = btoa(fileData);
		
		var args = [this.id, this.username, this.password, { name : fileName, type : fileType, bits : bits } ];
		var xml = performancingAPICalls.metaWeblog_newMediaObject(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					success( { "url" : rv.url } );
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	}
};
genericMetaWeblogAPI.prototype = new blogAPI();

var genericMovableTypeAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;
	
	this.ui.categories = true;
	this.ui["add-category"] = false;
	this.ui.draft = false;
	this.ui.excerpt = true;
	
	this.publish = function (params, success, failure) {
		/*
		// MovableType is hacky about publishing and categories.
		
		// MT supposedly uses the "draft" setting to determine whether
		// to rebuild static pages, not whether it's actually a draft.

		var trueDraft = params.draft;
		params.draft = false;
		*/
		
		var self = this;
		
		this.doPublish(params, 
			function newSuccess(rv) {
				if (("id" in rv) && rv.id) {
					var postId = rv.id;
				}
				else {
					var postId = rv;
				}
				
				var categories = [];
				
				$("#list-categories option").each(function () {
					var value = $(this).attr("value");
					var categoryId = $(this).attr("categoryId");
					
					for (var i = 0; i < params.categories.length; i++) {
						if (params.categories[i] == value) {
							categories.push( categoryId );
							break;
						}
					}
				});
				
				var newParams = {
					"id": postId,
					"categories": categories
				};
				
				self.setCategories(newParams,
					function categorySuccess(rv) {
						self.publishPost(
							newParams,
							function publishSuccess(rv) {
								success({ "id": postId });
							},
							function publishFailure(status, msg) {
								failure({"status": status, "msg": msg});
							}
						);
					},
					function categoryFailure(rv) {
						failure(rv);
					}
				);
			},
			function newFailure(status, msg) {
				failure({"status": status, "msg": msg});
			}
		);
	};
	
	this.getCategories = function (params, success, failure) {
		var args = [this.id, this.username, this.password];
		var xml = performancingAPICalls.mt_getCategoryList(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					for (var i = 0; i < rv.length; i++) {
						rv[i].id = rv[i].categoryId;
						rv[i].name = rv[i].categoryName;
						
						delete rv[i].categoryId;
						delete rv[i].categoryName;
					}
					
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.setCategories = function (params, success, failure) {
		var categories = [];
		
		for (var i = 0; i < params.categories.length; i++) {
			categories.push({"categoryId" : params.categories[i]});
		}
		
		var args = [params.id, this.username, this.password, categories];
		
		var xml = performancingAPICalls.mt_setPostCategories(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function privateCategorySuccess (rv) {
				// rv == true
				if (success) {
					success(rv);
				}
			},
			function privateCategoryFailure (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.getPostCategories = function (params, success, failure) {
		var args = [params.id, this.username, this.password];
		var xml = performancingAPICalls.mt_getPostCategories(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					var categories = [];
					
					for (var i = 0; i < rv.length; i++) {
						categories.push(rv[i].categoryId);
					}
					
					success(categories, "categoryId");
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.publishPost = function (params, success, failure) {
		var args = [params.id, this.username, this.password];
		
		var xml = performancingAPICalls.mt_publishPost(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				// rv == true
				if (success) {
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
};
genericMovableTypeAPI.prototype = new genericMetaWeblogAPI();
genericMovableTypeAPI.prototype.parent = genericMetaWeblogAPI.prototype;

var wordpressAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;
	
	this.ui.categories = { "posts" : true, "pages" : false, "default": true };
	this.ui.slug = true;
	this.ui.private = { "posts" : true, "pages" : false, "default": true };
	this.ui["text-content_wp_more"] = true;
	this.ui["custom-fields"] = true;
	this.ui["tags"] = { "posts" : true, "pages" : false, "default": true };
	this.ui.excerpt = true;
	this.ui.pages = true;
	
	this.oauthToken = null;
	
	this.oauth = {
		clientId : 13,
		clientSecret : "JejQPQMRkqLsOcwphSUxyGBtuNO7njtLXehgv0atRTNfCO9hjg6uPnnK1kwq57MB",
		redirectUri : "http://www.scribefire.com/oauth2/",
		endpoints : {
			authorizationUrl : function (metaData) {
				return "https://public-api.wordpress.com/oauth2/authorize?client_id=13&redirect_uri=" + encodeURIComponent("http://www.scribefire.com/oauth2/") + "&response_type=code&blog=" + encodeURIComponent(metaData.blogUrl || metaData.url);
			}
		}
	};
	
	/*
	this.ui["featured-image"] = (this.ui.upload);
	*/
	
	this.postInit = function () {
		/*
		if (this.oauthToken) {
			this.id = null;
			this.username = null;
			this.password = null;
			
			this.ui.oauth = true;
			this.ui.nooauth = false;
		}
		*/
	};
	
	this.getAuthToken = function (code, callback) {
		var req = new XMLHttpRequest();
		req.open("POST", "https://public-api.wordpress.com/oauth2/token", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				var text = req.responseText;
				var json = JSON.parse(text);
				
				var token = json.access_token;
				callback(token);
			}
		};
		
		var argString = "client_id=" + encodeURIComponent(this.oauth.clientId) + "&redirect_uri=" + encodeURIComponent(this.oauth.redirectUri) + "&client_secret=" + encodeURIComponent(this.oauth.clientSecret) + "&code=" + encodeURIComponent(code) + "&grant_type=authorization_code";
		
		req.send(argString);
	};
	
	this.publish = function (params, success, failure) {
		// Some Wordpress plugins apparently rely on linebreaks being \n and not <br />. This is dumb.
		params.content = params.content.replace(/<br\s*\/?>/g, "\n");
		params.content = params.content.replace(/<\/p>\s*<p>/g, "\n\n");
		
		if (params.type == "posts") {
			/*
			if ("featured_image" in params) {
				params.wp_featured_image = parseInt(params.featured_image.id, 10);
			}
			*/
			
			this.doPublish(params, success, failure);
		}
		else {
			var contentStruct = { };

			if ("title" in params) {
				contentStruct.title = params.title;
			}

			if ("content" in params) {
				contentStruct.description = params.content;
			}

			if ("timestamp" in params && params.timestamp) {
				contentStruct.dateCreated = params.timestamp;
			}
		
			if ("slug" in params && params.slug) {
				contentStruct.wp_slug = params.slug;
			}

			if ("draft" in params) {
				var publish = params.draft ? "bool0" : "bool1";
			}
			else {
				var publish = "bool1";
			}
		
			if ("custom_fields" in params) {
				contentStruct.custom_fields = params.custom_fields;
			}
		
			if (this.ui.excerpt) {
				if ("excerpt" in params) {
					contentStruct.mt_excerpt = params.excerpt;
				}
			}
			
			if (("id" in params) && params.id) {
				var args = [params.id, this.username, this.password, contentStruct, publish];
				var xml = performancingAPICalls.metaWeblog_editPost(args);
			}
			else {
				var args = [this.id, this.username, this.password, contentStruct, publish];
				var xml = performancingAPICalls.wp_newPage(args);
			}
			
			XMLRPC_LIB.doCommand(
				this.apiUrl,
				xml, 
				function (rv) {
					if (success) {
						if (("id" in params) && params.id) {
							success({ "id" : params.id });
						}
						else {
							success({ "id": rv });
						}
					}
				},
				function (status, msg) {
					if (failure) {
						failure({"status": status, "msg": msg});
					}
				},
				this.oauthToken
			);
		}
	};
	
	this.getBlogs = function (params, success, failure) {
		var args = [params.username, params.password];
		var xml = performancingAPICalls.wp_getUsersBlogs(args);
		
		var self = this;
		
		XMLRPC_LIB.doCommand(
			params.apiUrl,
			xml,
			function (rv) {
				if (success) {
					if (rv.length) {
						var blogs = [];
				
						for (var i = 0, _len = rv.length; i < _len; i++) {
							if (rv[i].xmlrpc == params.apiUrl) {
								var blog = {};
								blog.url = rv[i].url;
								blog.id = rv[i].blogid;
								blog.name = rv[i].blogName;
								blog.apiUrl = rv[i].xmlrpc;
								blog.type = params.type;
								blog.username = params.username;
								blog.password = params.password;
								
								blogs.push(blog);
							}
						}
					
						success(blogs);
					}
					else {
						if (failure) {
							failure( {"status" : 200, "msg" : scribefire_string("error_api_cannotConnect")});
						}
					}
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};
	
	this.getCategories = function (params, success, failure) {
		var args = [this.id, this.username, this.password];
		var xml = performancingAPICalls.mt_getCategoryList(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					for (var i = 0; i < rv.length; i++) {
						rv[i].id = rv[i].categoryId;
						rv[i].name = rv[i].categoryName;
						
						delete rv[i].categoryId;
						delete rv[i].categoryName;
					}
					
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			},
			this.oauthToken
		);
	};
	
	this.addCategory = function (params, success, failure) {
		var args = [this.id, this.username, this.password, { name : params.name } ];
		var xml = performancingAPICalls.wp_newCategory(args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					success({ "id": rv, "name": params.name });
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}	,
				this.oauthToken
		);
	}
	
	this.deletePost = function (params, success, failure) {
		if (params.type == "posts") {
			this.doDeletePost(params, success, failure);
		}
		else {
			var args = [params.id, this.username, this.password, params.id];
			var xml = performancingAPICalls.wp_deletePage(args);

			XMLRPC_LIB.doCommand(
				this.apiUrl,
				xml,
				function (rv) {
					if (success) {
						success(rv);
					}
				},
				function (status, msg) {
					if (failure) {
						failure({"status": status, "msg": msg});
					}
				}	,
					this.oauthToken
			);
		}
	}
	
	this.getMediaLibrary = function (params, success, failure) {
		var args = [params.id, this.username, this.password, { number : 1 } ];
		var xml = performancingAPICalls.wp_getMediaLibrary(args);

		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml,
			function (rv) {
				if (success) {
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}	,
				this.oauthToken
		);
	};
};
wordpressAPI.prototype = new genericMetaWeblogAPI();

var livejournalAPI = function () {
	// LiveJournal doesn't actually use this anymore. It uses Atom.
	// But some other blogs still use this interface.
	
	this.ui.private = true;
	this.ui.categories = false;
	this.ui["add-category"] = false;
	this.ui.tags = false;
	this.ui.timestamp = false;
	this.ui["text-content_wp_more"] = true;
	
	this.getBlogs = function (params, success, failure) {
		var self = this;
		
		var args = [ { username : params.username, password : params.password } ];
		var xml = XMLRPC_LIB.makeXML("LJ.XMLRPC.login", args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				var blogs = [];
				
				var blog = {};
				blog.name = params.username;
				blog.url = self.apiUrl.replace("www.", params.username + ".").replace("interface/xmlrpc", "");
				blog.id = rv.userid;
				blog.apiUrl = self.apiUrl;
				blog.type = "livejournal";
				blog.username = params.username;
				blog.password = params.password;
				
				blogs.push(blog);
				
				success(blogs);
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		var args = [ { username : this.username, password : this.password, selecttype : "lastn", howmany : 50, ver : 1 } ];
		var xml = XMLRPC_LIB.makeXML("LJ.XMLRPC.getevents", args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				var posts = [];
				
				for (var i = 0, _len = rv.events.length; i < _len; i++) {
					var event = rv.events[i];
					
					var post = {};
					
					post.content = event.event;
					
					post.content = post.content
						.replace(/<a name=.cutid1.><\/a>/, '<!--more-->')
						.replace(/<a name=.cutid1-end.><\/a>/, '<!--endmore-->');
					
					post.title = event.subject;
					
					var val = event.eventtime;
					
					// Check for a timezone offset
					var possibleOffset = val.substr(-6);
					var hasTimezone = false;
					var minutes = null;
					
					if (possibleOffset.charAt(0) == "-" || possibleOffset.charAt(0) == "+") {
						var hours = parseInt(possibleOffset.substr(1,2), 10);
						var minutes = (hours * 60) + parseInt(possibleOffset.substr(4,2), 10);
						
						if (possibleOffset.charAt(0) == "+") {
							minutes *= -1;
						}
						
						hasTimezone = true;
					}
					
					val = val.replace(/-/gi, "");
					
					var year = parseInt(val.substring(0, 4), 10);
					var month = parseInt(val.substring(4, 6), 10) - 1
					var day = parseInt(val.substring(6, 8), 10);
					var hour = parseInt(val.substring(9, 11), 10);
					var minute = parseInt(val.substring(12, 14), 10);
					var second = parseInt(val.substring(15, 17), 10);
					
					var dateutc =  Date.UTC(year, month, day, hour, minute, second);
					dateutc = new Date(dateutc);
					
					if (!hasTimezone) {
						minutes = new Date(dateutc).getTimezoneOffset();
					}
					
					var offsetDate = dateutc.getTime();
					offsetDate += (1000 * 60 * minutes);
					dateutc.setTime(offsetDate);
					
					post.timestamp = dateutc;
					
					post.categories = [];
					post.url = event.url;
					post.id = event.itemid;
					post.published = true;
					post.private = false;
					
					if ("security" in event && event.security == "private") {
						post.private = true;
					}
					posts.push(post);
				}
				
				success(posts);
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.publish = function (params, success, failure) {
		var contentStruct = { };
		contentStruct.username = this.username;
		contentStruct.password = this.password;
		contentStruct.ver = 1;
		contentStruct.subject = params.title;
		
		if (params.content.indexOf('<!--more-->') != -1) {
			params.content = params.content.replace('<!--more-->', '<lj-cut text="Read more...">');
		
			if (params.content.indexOf('<!--endmore-->') == -1) {
				params.content += '</lj-cut>';
			}
			else {
				params.content = params.content.replace('<!--endmore-->', '</lj-cut>');
			}
		}
		
		contentStruct.event = params.content;
		
		if ("private" in params && params.private) {
			contentStruct.security = "private";
		}
		
		var now = new Date();
		
		contentStruct.year = now.getFullYear();
		contentStruct.mon = now.getMonth() + 1;
		contentStruct.day = now.getDate();
		contentStruct.hour = now.getHours();
		contentStruct.min = now.getMinutes();
		
		var args = [ contentStruct ];
		
		if ("id" in params && params.id) {
			contentStruct.itemid = params.id;
			
			var xml = XMLRPC_LIB.makeXML("LJ.XMLRPC.editevent", [ contentStruct ] );
		}
		else {
			var xml = XMLRPC_LIB.makeXML("LJ.XMLRPC.postevent", [ contentStruct ]);
		}
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml, 
			function (rv) {
				if (success) {
					if (("itemid" in rv) && rv.itemid) {
						success({ "id" : rv.itemid });
					}
					else if ("id" in params && params.id) {
						success({ "id" : params.id });
					}
					else {
						success({ "id" : rv });
					}
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
	};
	
	this.deletePost = function (params, success, failure) {
		var args = [ { username : this.username, password : this.password, ver : 1, itemid : params.id, event : "" } ];
		var xml = XMLRPC_LIB.makeXML("LJ.XMLRPC.editevent", args);
		
		XMLRPC_LIB.doCommand(
			this.apiUrl,
			xml,
			function (rv) {
				if (success) {
					success(rv);
				}
			},
			function (status, msg) {
				if (failure) {
					failure({"status": status, "msg": msg});
				}
			}
		);
		
	};
};
livejournalAPI.prototype = new blogAPI();

var genericAtomAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;

	this.ui.tags = false;
	this.ui.categories = false;
	this.ui["text-content_wp_more"] = true;
	
	this.processResponse = function (req, callback, failure) {
		callback(false);
	};
	
	this.getBlogs = function (params, success, failure) {
		this.init(params);
		
		var self = this;
		
		this.buildRequest(
			"GET",
			this.apiUrl,
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						self.processResponse(req, function (redo) {
							if (redo) {
								self.getBlogs(params, success, failure);
							}
							else {
								if (req.status < 300) {
									var xml = xmlFromRequest(req);
							
									if (!xml) {
										if (failure) {
											failure({"status": req.status, "msg": req.responseText});
										}
									}
									else {
										var jxml = $(xml);
								
										var blogs = [];
								
										var blog = {};
										blog.url = jxml.find("link[rel='alternate']:first").attr("href");
										blog.name = jxml.find("title:first").text();
										blog.id = jxml.find("id:first").text().split(":blog-")[1];
										blog.apiUrl = params.apiUrl;
										blog.type = params.type;
										blog.username = params.username;
										blog.password = params.password;
								
										blog.atomAPIs = self.atomAPIs;
								
										blogs.push(blog);
								
										success(blogs);
									}
								}
								else {
									if (failure) {
										failure({"status": req.status, "msg": req.responseText});
									}
								}
							}
						}, failure);
					}
				};
				
				req.send(null);
			}
		);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		
		this.buildRequest(
			"GET",
			this.atomAPIs["service.feed"],
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						self.processResponse(req, function (redo) {
							if (redo) {
								self.getPosts(params, success, failure);
							}
							else {
								if (req.status < 300) {
									// Firefox doesn't do well with namespaced elements
									var fakeReq = {};
									fakeReq.responseText = req.responseText.replace(/<(\/)?app:/g, "<$1app_");
							
									var xml = xmlFromRequest(fakeReq);
							
									var jxml = $(xml);
							
									var posts = [];
						
									jxml.find("entry").each(function () {
										var post = {};
								
										post.content = $(this).find("content:first").text();
										post.content = post.content
											.replace(/<a name=.cutid1.><\/a>/, '<!--more-->')
											.replace(/<a name=.cutid1-end.><\/a>/, '<!--endmore-->');
								
										post.title = $(this).find("title:first").text();
								
										var val = $(this).find("published:first").text();
								
										// Check for a timezone offset
										var possibleOffset = val.substr(-6);
										var hasTimezone = false;
										var minutes = null;
								
										if (possibleOffset.charAt(0) == "-" || possibleOffset.charAt(0) == "+") {
											var hours = parseInt(possibleOffset.substr(1,2), 10);
											var minutes = (hours * 60) + parseInt(possibleOffset.substr(4,2), 10);
									
											if (possibleOffset.charAt(0) == "+") {
												minutes *= -1;
											}
									
											hasTimezone = true;
										}
								
										val = val.replace(/-/gi, "");
								
										var year = parseInt(val.substring(0, 4), 10);
										var month = parseInt(val.substring(4, 6), 10) - 1
										var day = parseInt(val.substring(6, 8), 10);
										var hour = parseInt(val.substring(9, 11), 10);
										var minute = parseInt(val.substring(12, 14), 10);
										var second = parseInt(val.substring(15, 17), 10);
								
										var dateutc =  Date.UTC(year, month, day, hour, minute, second);
										dateutc = new Date(dateutc);
								
										if (!hasTimezone) {
											minutes = new Date(dateutc).getTimezoneOffset();
										}
								
										var offsetDate = dateutc.getTime();
										offsetDate += (1000 * 60 * minutes);
										dateutc.setTime(offsetDate);
								
										post.timestamp = dateutc;
								
										post.categories = [];
								
										$(this).find("category").each(function () {
											post.categories.push($(this).attr("term"));
										});
								
										$(this).find("link").each(function () {
											if ($(this).attr("rel") == "alternate") {
												post.url = $(this).attr("href");
											}
										});
								
										//var postUrl = $(this).find("id:first").text();
								
										post.id = $(this).find("id:first").text();//postUrl.match( /(?:\/|post-)(\d{5,})(?!\d*\/)/)[1];
								
										if ($(this).find("link[rel='service.edit']:first").length > 0) {
											post["service.edit"] = $(this).find("link[rel='service.edit']:first").attr("href");
										}
										else {
											post["service.edit"] = $(this).find("link[rel='edit']:first").attr("href");
										}
								
										post.published = true;
								
										$(this).find("app_draft").each(function () {
											if ($(this).text() == "yes") {
												post.published = false;
											}
										});
								
										posts.push(post);
									});
							
									success(posts);
								}
								else {
									failure({ "status": req.status, "msg": req.responseText });
								}
							}
						}, failure);
					}
				};
				
				req.send(null);
			}
		);
	};
		
	this.publish = function (params, success, failure) {
		var self = this;
		
		var method = "POST";
		var apiUrl = this.atomAPIs["service.post"];
		
		var body = "";
		body += '<?xml version="1.0" encoding="UTF-8" ?>';
		body += '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://purl.org/atom/app#">';

		if ("id" in params && params.id) {
			method = "PUT";
			
			apiUrl = params["service.edit"];
			
			// Apparently LiveJournal requires this, but Blogger overlooks it.
			body += '<id>'+params.id+'</id>';
		}
		
		if ("title" in params) {
			body += '<title><![CDATA[' + params.title + ']]></title>';
		}
		
		if ("categories" in params) {
			for (var i = 0; i < params.categories.length; i++) {
				// Not all Atom APIs will respect this.
				body += '<category scheme="http://www.blogger.com/atom/ns#" term="'+params.categories[i].replace(/&/g,'&amp;')+'"/>';
			}
		}
		
		if ("timestamp" in params && params.timestamp) {
			var date = params.timestamp;
			
			body += '<published>' + date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + "T" + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":00.000Z" + '</published>';
		}
		
		if ("content" in params) {
			if (params.content.indexOf('<!--more-->') != -1) {
				params.content = params.content.replace('<!--more-->', '<lj-cut text="Read more...">');
			
				if (params.content.indexOf('<!--endmore-->') == -1) {
					params.content += '</lj-cut>';
				}
				else {
					params.content = params.content.replace('<!--endmore-->', '</lj-cut>');
				}
			}
			
			body += '<content type="html"><![CDATA[' + params.content + ']]></content>';
		}

		if ("draft" in params && params.draft) {
			body += '<app:control>';
				body += '<app:draft>yes</app:draft>';
			body += '</app:control>';
		}
		
		body += '</entry>';
		
		this.buildRequest(
			method,
			apiUrl,
			function (req) {
				/**
				 * If any Atom implementations actually respected it, this is how we would
				 * set the post slug.
				 */
				
				/*
				if ("slug" in params) {
					req.setRequestHeader("Slug", params.slug);
				}
				*/
				
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						self.processResponse(req, function (redo) {
							if (redo) {
								self.publish(params, success, failure);
							}
							else {
								if (req.status < 300) {
									var xml = xmlFromRequest(req);
									var jxml = $(xml);

									var postId = jxml.find("id:first").text();//.split(".post-")[1];

									if (!postId && params.id) {
										postId = params.id;
									}

									success({ "id": postId });
								}
								else {
									failure({ "status": req.status, "msg": req.responseText });
								}
							}
						}, failure);
					}
				};
				
				req.send(body);
			}
		);
	};
	
	/*
	
	// You would think that if the list of categories is made available, it would be possible to add
	// a category to an entry, but noooooo.
	
	this.getCategories = function (params, success, failure) {
		// This API is checked for exposure the first time that categories need to be loaded.
		if ("service.categories" in this.atomAPIs) {
			if (this.atomAPIs["service.categories"]) {
				this.buildRequest(
					"GET",
					this.atomAPIs["service.categories"],
					function (req) {
						req.onreadystatechange = function () {
							if (req.readyState == 4) {
								if (req.status < 300) {
									var xml = xmlFromRequest(req);
									var jxml = $(xml);
							
									var categories = [];
							
									jxml.find("subject").each(function () {
										var cat = $(this).text();
								
										categories.push({ "id": cat, "name": cat });
									});
							
									success(categories);
							
								}
								else {
									failure({ "status": req.status, "msg": req.responseText });
								}
							}
						};
						
						req.send(null);
					}
				);
			}
			else {
				this.ui.categories = false;
				
				SCRIBEFIRE.updateOptionalUI();
				
				success([]);
			}
		}
		else {
			var self = this;
			
			this.buildRequest(
				"GET",
				this.atomAPIs["service.feed"],
				function (req) {
					req.onreadystatechange = function () {
						if (req.readyState == 4) {
							if (req.status < 300) {
								var xml = xmlFromRequest(req);
								var jxml = $(xml);
								
								var interfaceUrl = jxml.find("entry:first link[rel='self']:first").attr("href");
								
								self.buildRequest(
									"GET",
									interfaceUrl,
									function (creq) {
										creq.onreadystatechange = function () {
											if (creq.readyState == 4) {
												if (creq.status < 300) {
													var cxml = xmlFromRequest(creq);
													var cjxml = $(cxml);
												
													var categoryLink = cjxml.find("link[rel='service.categories']:first");
												
													if (categoryLink) {
														self.atomAPIs["service.categories"] = categoryLink.attr("href");
													}
													else {
														self.atomAPIs["service.categories"] = false;
													}
												}
												else {
													self.atomAPIs["service.categories"] = false;
												}
												
												SCRIBEFIRE.setBlogProperty(self.url, self.username, "atomAPIs", self.atomAPIs);
												self.getCategories(params, success, failure);
											}
										};
									
										creq.send(null);
									}
								);
							}
							else {
								self.atomAPIs["service.categories"] = false;
								SCRIBEFIRE.setBlogProperty(self.url, self.username, "atomAPIs", self.atomAPIs);
								self.getCategories(params, success, failure);
							}
						}
					};
				
					req.send(null);
				}
			);
		}
	};
	
	this.addCategory = function (params, success, failure) {
		success({ "id": params.name, "name": params.name });
	};
	
	*/
	
	this.deletePost = function (params, success, failure) {
		var self = this;
		
		this.buildRequest(
			"DELETE",
			params["service.edit"],
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4){
						self.processResponse(req, function (redo) {
							if (redo) {
								self.deletePost(params, success, failure);
							}
							else {
								if (req.status < 300) {
									success(true);
								}
								else {
									failure({ "status": req.status, "msg": req.responseText });
								}
							}
						}, failure);
					}
				};
				
				req.send(null);
			}
		);
	};

	this.buildRequest = function (method, url, callback) {
		var req = new XMLHttpRequest();
		var urlParts = url.split("://");
		url = urlParts[0] + "://" + encodeURIComponent(this.username) + ":" + encodeURIComponent(this.password) + "@" + urlParts[1];
		req.open(method, url, true);
		
		req.setRequestHeader("Content-Type", "application/atom+xml");
		
		callback(req);
	};
};
genericAtomAPI.prototype = new blogAPI();

var bloggerAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;
	
	this.ui.categories = true;
	this.ui.upload = (!!(((platform == 'gecko') || (window.File && window.FileReader && window.FileList && window.Blob)))) && (platform != 'presto');
	this.ui.draft = true;
	
	// this.oauthToken is the complete JSON response, containing access_token, expires_on, refresh_token.
	this.oauthToken = null;
	// this.accessToken gets set to this.oauthToken.access_token
	this.accessToken = null;
	
	this.oauth = {
		clientId : "116375103348.apps.googleusercontent.com",
		clientSecret : "ZV6urYYje-6AaTcjoya3RW7Y",
		redirectUri : "urn:ietf:wg:oauth:2.0:oob",
		endpoints : {
			authorizationUrl : function (metaData) {
				return "https://accounts.google.com/o/oauth2/auth?client_id=" + encodeURIComponent("116375103348.apps.googleusercontent.com") + "&redirect_uri=" + encodeURIComponent("urn:ietf:wg:oauth:2.0:oob") + "&scope=" + encodeURIComponent("https://www.blogger.com/feeds/ http://picasaweb.google.com/data/") + "&response_type=code";
			}
		}
	};
	
	this.postInit = function () {
		/*
		if (this.oauthToken) {
			this.id = null;
			this.username = null;
			this.password = null;
			
			this.ui.oauth = true;
			this.ui.nooauth = false;
			
			this.accessToken = this.oauthToken.access_token;
		}
		*/
	};
	
	this.getAuthToken = function (code, callback) {
		var req = new XMLHttpRequest();
		req.open("POST", "https://accounts.google.com/o/oauth2/token", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				var json = JSON.parse(req.responseText);
				callback(json);
			}
		};
		
		var argString = "client_id=" + encodeURIComponent(this.oauth.clientId) + "&redirect_uri=" + encodeURIComponent(this.oauth.redirectUri) + "&client_secret=" + encodeURIComponent(this.oauth.clientSecret) + "&code=" + encodeURIComponent(code) + "&grant_type=authorization_code";
		
		req.send(argString);
	};
	
	this.refreshAuthToken = function (success, failure) {
		var self = this;
		
		var req = new XMLHttpRequest();
		req.open("POST", "https://accounts.google.com/o/oauth2/token", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status < 300) {
					var json = JSON.parse(req.responseText);
					var blog = SCRIBEFIRE.getBlog();
					blog.oauthToken = json;
					self.oauthToken = json;
					self.accessToken = self.oauthToken.access_token;
					SCRIBEFIRE.setBlog(blog);
				
					success(true);
				}
				else {
					failure({ status : req.status, "msg" : req.responseText });
				}
			}
		};
		
		var codeJson = self.oauthToken;
		var argString = "client_id=" + encodeURIComponent(this.oauth.clientId) + "&client_secret=" + encodeURIComponent(this.oauth.clientSecret) + "&refresh_token=" + encodeURIComponent(codeJson.refresh_token) + "&grant_type=refresh_token";
		req.send(argString);
	};
	
	this.processResponse = function (req, callback, failure) {
		if (!this.accessToken) {
			callback(false);
		}
		else if (req.status != 401) {
			callback(false);
		}
		else {
			this.refreshAuthToken(callback, failure);
		}
	};
	
	this.authToken = null;
	
	this.getCategories = function (params, success, failure) {
		var self = this;
		
		this.getPosts(
			params,
			function (posts) {
				var categories = {};
				
				for (var i = 0; i < posts.length; i++) {
					for (var j = 0; j < posts[i].categories.length; j++) {
						categories[posts[i].categories[j]] = true;
					}
				}
				
				var rv = [];
				
				for (var i in categories) {
					rv.push(i);
				}
				
				rv.sort();
				
				for (var i = 0; i < rv.length; i++) {
					var categoryName = rv[i];
					rv[i] = { "id" : rv[i], "name": rv[i] };
				}
				
				success(rv);
			},
			failure
		);
	};
	
	this.addCategory = function (params, success, failure) {
		success({ "id": params.name, "name": params.name });
	};
	
	this.doAuth = function (callback, params) {
		if (this.authToken) {
			callback(this.authToken);
		}
		else {
			var self = this;
		
			var req = new XMLHttpRequest();
			req.open("POST", "https://www.google.com/accounts/ClientLogin", true);
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			
			var argString = "Email="+encodeURIComponent(this.username)+"&Passwd="+encodeURIComponent(this.password)+"&service=blogger&source=scribefire";
			
			if (params) {
				for (var i in params) {
					argString += "&"+i+"="+encodeURIComponent(params[i]);
				}
			}
			
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					var lines = req.responseText.split("\n");
					
					var returnValues = {};
					
					for (var i = 0; i < lines.length; i++) {
						var parts = lines[i].split("=");
						var key = parts.shift();
						var value = parts.join("=");
						
						returnValues[key] = value;
					}
					
					if (req.status < 300) {
						self.authToken = returnValues["Auth"];
						
						callback(self.authToken);
					}
					else {
						switch (returnValues["Error"]) {
							case 'BadAuthentication':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_authentication"), "BadAuthentication");
								return;
							break;
							case 'NotVerified':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_verify"));
								return;
							break;
							case 'TermsNotAgreed':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_tos"));
								return;
							break;
							case 'AccountDeleted':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_deleted"));
								return;
							break;
							case 'ServiceDisabled':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_disabled"));
								return;
							break;
							case 'ServiceUnavailable':
								SCRIBEFIRE.error(scribefire_string("error_api_blogger_unavailable"));
								return;
							break;
							case 'CaptchaRequired':
								var imgUrl = "https://www.google.com/accounts/" + returnValues["CaptchaUrl"];
								
								var container = $("<div/>");
								
								var header = $("<h4/>");
								header.text(scribefire_string("error_api_blogger_captcha"));
								container.append(header);
								
								var message = $("<p/>");
								container.append(message);
								
								var image = $("<img/>");
								image.attr("src", imgUrl);
								message.append(image);
								
								var textbox = $("<input/>");
								textbox.attr("type", "text");
								textbox.attr("id", "google-captcha");
								container.append(textbox);
								
								var submit = $("<input />");
								submit.attr("type", "submit");
								submit.val(scribefire_string("continue"));
								submit.attr("id", "captcha-continue");
								container.append(submit);
								
								$.facebox(container);
								
								$("#captcha-continue").live("click", function (e) {
									var captcha = $("#google-captcha").val();
									
									$(document).trigger("close.facebox");
									
									if (captcha) {
										self.doAuth(callback, {"logintoken": returnValues["CaptchaToken"], "logincaptcha": captcha });
										return;
									}
								});
								
								return;
							break;
							case 'Unknown':
								returnValues["Error"] = scribefire_string("error_unknown");
							break;
							default:
							break;
						}
					
						SCRIBEFIRE.error(scribefire_string("error_api_blogger_unknown", returnValues["Error"]));
					}
				}
			};
		
			req.send(argString);
		}
	};
	
	this.buildRequest = function (method, url, callback) {
		var self = this;
		
		function build(token) {
			var req = new XMLHttpRequest();
			// encodeURIComponent is used here because otherwise some requests were failing
			// when the password contains special characters like "@"
			req.open(method, url, true, encodeURIComponent(self.username), encodeURIComponent(self.password));
			req.setRequestHeader("Authorization", "GoogleLogin auth=" + token);
			req.setRequestHeader("Content-Type", "application/atom+xml");
			
			return req;
		}
		
		if (this.accessToken) {
			var req = new XMLHttpRequest();
			req.open(method, url, true);
			req.setRequestHeader("Authorization", "Bearer " + this.accessToken);
			req.setRequestHeader("Content-Type", "application/atom+xml");
			
			callback(req);
		}
		else if (this.authToken) {
			var req = build(this.authToken);
			callback(req);
		}
		else {
			this.doAuth(function (token) {
				var req = build(token);
				callback(req);
			});
		}
	};

	this.upload = function (fileName, fileType, fileData, success, failure, file) {
		var self = this;
		var invalidTokens = 0;
		
		if (!(window.File && window.FileReader && window.FileList && window.Blob) && platform == 'gecko') { 
			function doUpload(token, tokenType) {
				if (!tokenType) tokenType = "AuthSub";
				
				var mimeSvc = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
				var theMimeType = mimeSvc.getTypeFromFile(file);
			
				const MULTI = "@mozilla.org/io/multiplex-input-stream;1";
				const FINPUT = "@mozilla.org/network/file-input-stream;1";
				const BUFFERED = "@mozilla.org/network/buffered-input-stream;1";
			
				const nsIMultiplexInputStream = Components.interfaces.nsIMultiplexInputStream;
				const nsIFileInputStream = Components.interfaces.nsIFileInputStream;
				const nsIBufferedInputStream = Components.interfaces.nsIBufferedInputStream;
			
				var buf = null;
				var fin = null;
			
				var fpLocal  = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
				fpLocal.initWithFile(file);
			
				fin = Components.classes[FINPUT].createInstance(nsIFileInputStream);
				fin.init(fpLocal, 1, 0, false); 
			
				buf = Components.classes[BUFFERED].createInstance(nsIBufferedInputStream);
				buf.init(fin, 9000000);
			
				var uploadStream = Components.classes[MULTI].createInstance(nsIMultiplexInputStream);
				uploadStream.appendStream(buf);
			
				var upreq = new XMLHttpRequest();
				upreq.open("POST", "http://picasaweb.google.com/data/feed/api/user/default/albumid/default", true);
				
				if (tokenType == "AuthSub") {
					upreq.setRequestHeader("Authorization","AuthSub token="+token);
				}
				else {
					upreq.setRequestHeader("Authorization","Bearer "+token);
				}
				
				upreq.setRequestHeader("Content-Type", theMimeType);
				upreq.setRequestHeader("Content-Length", (uploadStream.available()));
				upreq.overrideMimeType("text/xml");
			
				upreq.onreadystatechange = function () {
					if (upreq.readyState == 4) {
						self.processResponse(upreq, function (redo) {
							if (redo) {
								self.upload(fileName, fileType, fileData, success, failure, file);
							}
							else {
								if (upreq.status < 300) {
									invalidTokens = 0;
						
									try {
										var imageUrl = $(xmlFromRequest(upreq)).find("content:first").attr("src");
										success( { "url" : imageUrl } );
									} catch (e) {
										failure( { "status" : upreq.status, "msg" : upreq.responseText });
									}
								}
								else {
									if (tokenType == "AuthSub" && upreq.status == 403 && upreq.responseText.match(/Token invalid/)) {
										invalidTokens++;
							
										if (invalidTokens > 1) {
											failure( { "status" : upreq.status, "msg" : scribefire_string("error_api_blogger_authToken") });
										}
										else {
											delete tokens_json[self.username];
								
											SCRIBEFIRE.prefs.setJSONPref("google_tokens", tokens_json);
											SCRIBEFIRE.prefs.setCharPref("google_token", "");
								
											self.upload(fileName, fileType, fileData, success, failure, file);
										}
									}
									else if (upreq.responseText.match(/Must sign terms/i)) {
										// @todo gOpener.parent.getWebBrowser().selectedTab = gOpener.parent.getWebBrowser().addTab("http://picasaweb.google.com/");
										failure( { "status" : upreq.status, "msg" : upreq.responseText });
									}
									else {
										failure( { "status" : upreq.status, "msg" : scribefire_string("error_api_blogger_uploadAPIUnavailable") } );
									}
								}
							}
						}, failure);
					}
				};
			
				upreq.send(uploadStream);
			}
			
			if (self.accessToken) {
				doUpload(self.accessToken, "Bearer");
			}
			else {
				var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch).getBranch("extensions.scribefire.");
				prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
			
				var prefObserver = {
					observe : function (subject, topic, data) {
						if (topic == 'nsPref:changed') {
							if (data == 'google_token') {
								prefs.removeObserver(prefObserver);
							
								var token = SCRIBEFIRE.prefs.getCharPref("google_token");
						
								if (!token) {
									return;
								}
						
								var req = new XMLHttpRequest();
								req.open("GET", "https://www.google.com/accounts/AuthSubSessionToken", true);
								req.setRequestHeader("Authorization","AuthSub token=\""+token+"\"");
						
								req.onreadystatechange = function () {
									if (req.readyState == 4) {
										if (req.status == 200) {
											var lines = req.responseText.split("\n");
											var newTokenLine = lines[0];
											var newToken = newTokenLine.split("=")[1];
									
											var tokens_json = SCRIBEFIRE.prefs.getJSONPref("google_tokens", {});
									
											tokens_json[self.username] = newToken;
											SCRIBEFIRE.prefs.setJSONPref("google_tokens", tokens_json);
									
											doUpload(newToken);
										}
										else {
											failure( { "status" : req.status, "msg" : scribefire_string("error_api_blogger_authToken") } );
										}
									}
								};
						
								req.send(null);
							}
						}
					}
				};
		
				prefs.addObserver("", prefObserver, false);
		
				var tokens_json = SCRIBEFIRE.prefs.getJSONPref("google_tokens", {});
		
				if (self.username in tokens_json) {
					doUpload(tokens_json[self.username]);
				}
				else {
					invalidTokens++;
			
					window.open("https://www.google.com/accounts/AuthSubRequest"
							+ "?scope="+encodeURIComponent('http://picasaweb.google.com/data/')
							+ "&next="+ encodeURIComponent('http://www.scribefire.com/token.php') +"&session=1", 
						"sf-google-token", 
						"height=400,width=600,menubar=no,toolbar=no,location=no,personalbar=no,status=no");
				}
			}
		}
		else {
			function doUpload(token, tokenType) {
				var upreq = new XMLHttpRequest();
				upreq.open("POST", "http://picasaweb.google.com/data/feed/api/user/default/albumid/default", true);
				
				if (tokenType == "AuthSub") {
					upreq.setRequestHeader("Authorization","AuthSub token="+token);
				}
				else {
					upreq.setRequestHeader("Authorization","Bearer "+token);
				}
				
				upreq.setRequestHeader("Content-Type", fileType);
				
				upreq.overrideMimeType("text/xml");
			
				upreq.onreadystatechange = function () {
					if (upreq.readyState == 4) {
						self.processResponse(upreq, function (redo) {
							if (redo) {
								self.upload(fileName, fileType, fileData, success, failure, file);
							}
							else {
								if (upreq.status < 300) {
									invalidTokens = 0;
								
									try {
										var imageUrl = $(xmlFromRequest(upreq)).find("content:first").attr("src");
										success( { "url" : imageUrl } );
									} catch (e) {
										failure( { "status" : upreq.status, "msg" : upreq.responseText });
									}
								}
								else {
									if (tokenType == "AuthSub" && upreq.status == 403 && upreq.responseText.match(/Token invalid/)) {
										invalidTokens++;
							
										if (invalidTokens > 1) {
											failure( { "status" : upreq.status, "msg" : scribefire_string("error_api_blogger_authToken") });
										}
										else {
											delete tokens_json[self.username];
								
											SCRIBEFIRE.prefs.setJSONPref("google_tokens", tokens_json);
											SCRIBEFIRE.prefs.setCharPref("google_token", "");
								
											self.upload(fileName, fileType, fileData, success, failure);
										}
									}
									else if (upreq.responseText.match(/Must sign terms/i)) {
										// @todo gOpener.parent.getWebBrowser().selectedTab = gOpener.parent.getWebBrowser().addTab("http://picasaweb.google.com/");
										failure( { "status" : upreq.status, "msg" : upreq.responseText });
									}
									else {
										failure( { "status" : upreq.status, "msg" : scribefire_string("error_api_blogger_uploadAPIUnavailable") + " " + upreq.responseText } );
									}
								}
							}
						}, failure);
					}
				};
				
				upreq.send(file);
			}
		
			if (self.accessToken) {
				doUpload(self.accessToken, "Bearer");
			}
			else {
				var prefObserver = {
					observe : function (subject, topic, data) {
						if (topic == 'nsPref:changed') {
							if (data == 'google_token') {
								var token = SCRIBEFIRE.prefs.getCharPref("google_token");
					
								if (!token) {
									return;
								}
					
								var req = new XMLHttpRequest();
								req.open("GET", "https://www.google.com/accounts/AuthSubSessionToken", true);
								req.setRequestHeader("Authorization","AuthSub token=\""+token+"\"");
					
								req.onreadystatechange = function () {
									if (req.readyState == 4) {
										if (req.status == 200) {
											var lines = req.responseText.split("\n");
											var newTokenLine = lines[0];
											var newToken = newTokenLine.split("=")[1];
								
											var tokens_json = SCRIBEFIRE.prefs.getJSONPref("google_tokens", {});
								
											tokens_json[self.username] = newToken;
											SCRIBEFIRE.prefs.setJSONPref("google_tokens", tokens_json);
								
											doUpload(newToken);
										}
										else {
											failure( { "status" : req.status, "msg" : scribefire_string("error_api_blogger_authToken") } );
										}
									}
								};
					
								req.send(null);
							}
						}
					}
				};
			
				SCRIBEFIRE.prefs.addObserver(prefObserver);
			
				var tokens_json = SCRIBEFIRE.prefs.getJSONPref("google_tokens", {});
			
				if (self.username in tokens_json) {
					doUpload(tokens_json[self.username]);
				}
				else {
					invalidTokens++;
			
					window.open("https://www.google.com/accounts/AuthSubRequest"
							+ "?scope="+encodeURIComponent('http://picasaweb.google.com/data/')
							+ "&next="+ encodeURIComponent('http://www.scribefire.com/token.php') +"&session=1", 
						"sf-google-token", 
						"height=400,width=600,menubar=no,toolbar=no,location=no,personalbar=no,status=no");
				}
			}
		}
	}
};
bloggerAPI.prototype = new genericAtomAPI();
bloggerAPI.prototype.parent = genericAtomAPI.prototype;

var tumblrAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;
	
	this.ui.categories = false;
	this.ui.timestamp = false;
	this.ui.slug = true;
	this.ui.private = true;
	this.ui.draft = false; // drafts aren't being returned in the /read response
	
	this.postInit = function () {
		this.ui.getPosts = !this.isPrivate;
	};
	
	this.getBlogs = function (params, success, failure) {
		var url = "http://www.tumblr.com/api/authenticate";
		
		var args = {};
		args.email = params.username;
		args.password = params.password;
		
		var argstring = "";
		
		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}
		
		argstring = argstring.substr(0, argstring.length - 1);
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					var xml = xmlFromRequest(req);
					
					var jxml = $(xml);
					
					var blogs = [];
					
					var i = 1;
					
					jxml.find("tumblelog").each(function () {
						var blog = {};
						blog.apiUrl = "http://www.tumblr.com/api";
						blog.type = params.type;
						blog.username = params.username;
						blog.password = params.password;
						blog.isPrivate = ($(this).attr("type") == "private");
						
						if (blog.isPrivate) {
							blog.id = $(this).attr("private-id");
							blog.name = "Private Tumblr Blog #" + blog.id;
							blog.url = "http://www.tumblr.com/#" + blog.id;
						}
						else {
							blog.id = i++;
							blog.name = $(this).attr("title");
							blog.url = $(this).attr("url");
						}
						
						blogs.push(blog);
					});
					
					if (blogs.length > 0) {
						success(blogs);
					}
					else {
						if (failure) {
							failure( {"status" : 200, "msg" : scribefire_string("error_api_cannotConnect")});
						}
					}
				}
				else {
					if (failure) {
						failure({"status": req.status, "msg": req.responseText});
					}
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.getPosts = function (params, success, failure) {
		if (!("limit" in params)) params.limit = 50;
		
		if (this.isPrivate) {
			success([]);
			return;
		}
		else {
			var url = this.url + "api/read";//?start=0&num="+params.limit+"&type=regular";
		}
		
		var args = {};
		args.email = this.username;
		args.password = this.password;
		// @todo-more-posts
		args.start = 0;
		args.num = params.limit;
		args.type = "text";
		
		var argstring = "";
		
		for (var i in args) {
			argstring += "&" + encodeURIComponent(i) + "=" + encodeURIComponent(args[i]);
		}
		
		argstring = argstring.substr(1);
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					var xml = xmlFromRequest(req);
					var jxml = $(xml);
				
					var rv = [];
				
					jxml.find("post").each(function () {
						var post = {};
						post.title = $(this).find("regular-title:first").text();
						post.content = $(this).find("regular-body:first").text();
						post.id = $(this).attr("id");
						post.url = $(this).attr("url");
						post.published = true;
						post.categories = [];
						post.private = false;
						
						if ($(this).attr("private") && $(this).attr("private") == "true") {
							post.private = true;
						}
						
						post.tags = [];
						
						$(this).find("tag").each(function () {
							post.tags.push($(this).text());
						});
						
						post.tags = post.tags.join(", ");
						post.slug = $(this).attr("slug");
						
						rv.push(post);
					});
					
					success(rv);
				}
				else {
					failure({"status": req.status, "msg" : req.responseText});
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.publish = function (params, success, failure) {
		var args = {};
		args.email = this.username;
		args.password = this.password;
		args.generator = "ScribeFire";
		
		if (!this.isPrivate) {
			args.group = this.url.split("//")[1].split("/")[0];
		}
		else {
			args.group = this.id;
		}
		
		args.tags = params.tags;
		args.type = 'regular';
		args.format = 'html';
		args.title = params.title;
		args.body = params.content;
		
		if ("private" in params) {
			args.private = params.private * 1;
		}
		
		if ("draft" in params) {
			args.state = params.draft ? "draft" : "published";
		}
		
		if (("id" in params) && params.id) {
			args["post-id"] = params.id;
		}
		
		if ("slug" in params) {
			args.slug = params.slug;
		}
		
		var argstring = "";
		
		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}
		
		argstring = argstring.substr(0, argstring.length - 1);
		
		var req = new XMLHttpRequest();
		req.open("POST", "http://www.tumblr.com/api/write", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function (event) {
			if (req.readyState == 4) {
				if (req.status < 300) {
					if (("id" in params) && params.id) {
						success({ "id" : params.id });
					}
					else {
						success({ "id": req.responseText });
					}
				}
				else {
					failure({ "status": req.status, "msg": req.responseText });
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.deletePost = function (params, success, failure) {
		var args = {};
		args.email = this.username;
		args.password = this.password;
		args["post-id"] = params.id;
		
		var argstring = "";
		
		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}
		
		argstring = argstring.substr(0, argstring.length - 1);
		
		var req = new XMLHttpRequest();
		req.open("POST", "http://www.tumblr.com/api/delete", true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function (event) {
			if (req.readyState == 4) {
				if (req.status < 300) {
					success(true);
				}
				else {
					failure({ "status": req.status, "msg": req.responseText });
				}
			}
		};
		
		req.send(argstring);
	};
};
tumblrAPI.prototype = new blogAPI();

var posterousAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;
	
	this.ui.categories = false;
	this.ui.timestamp = false; // Scheduling posterous changes the time, but it doesn't delay the publication.
	this.ui.private = true;
	this.ui.upload = (platform == 'gecko');
	
	this.token = "AFEuheynrHoJlBJqwHzoFEngfEkebtEI";
	
	this.getBlogs = function (params, success, failure) {
		var self = this;
		
		var url = "http://posterous.com/api/2/users/me/sites?api_token=" + encodeURIComponent(self.token);
		
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(params.username + ":" + params.password));
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					try {
						var json = JSON.parse(req.responseText);
					} catch (e) {
						failure({"status" : req.status, "msg" : "Invalid response from server: " + req.responseText });
						return;
					}
					
					var blogs = [];
					
					for (var i = 0, _len = json.length; i < _len; i++) {
						var entry = json[i];
						
						var blog = {};
						blog.id = entry.id;
						blog.apiUrl = "http://posterous.com/api";
						blog.type = params.type;
						blog.username = params.username;
						blog.password = params.password;
						blog.name = entry.name;
						blog.url = "http://" + entry.full_hostname;
				
						blogs.push(blog);
					}
			
					if (blogs.length) {	
						success(blogs);
					}
					else {
						if (failure) {
							failure( {"status" : 200, "msg" : scribefire_string("error_api_cannotConnect")});
						}
					}
				}
				else {
					if (failure) {
						failure({"status": req.status, "msg": req.responseText});
					}
				}
			}
		};
		
		req.send(null);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		
		var url = "http://posterous.com/api/2/users/me/sites/" + self.id + "/posts?api_token=" + encodeURIComponent(self.token);
		
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(self.username + ":" + self.password));
	
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					try {
						var json = JSON.parse(req.responseText);
					} catch (e) {
						failure({"status" : req.status, "msg" : "Invalid response from server: " + req.responseText });
						return;
					}
					
					var rv = [];
					
					for (var i = 0, _len = json.length; i < _len; i++) {
						var json_entry = json[i];
						
						var entry = {}
						entry.id = json_entry.id;
						entry.content = json_entry.body_full;
						entry.title = json_entry.title;
						entry.published = true; // @todo Does Posterous support drafts?
						entry.private = json_entry.is_private;
						
						if ("display_date" in json_entry) {
							entry.timestamp = new Date(json_entry.display_date + " -0700");
							/*
							var expectedOffset = parseInt((new Date()).format("Z"), 10);
							var offset = -7 * 60 * 60;
							var delta = expectedOffset - offset;

							if (delta) {
							//	entry.timestamp.setTime(entry.timestamp.getTime() + (delta * 1000));
							}
							*/
						}
						
						var tags = [];
						
						for (var j = 0, _jlen = json_entry.tags.length; j < _jlen; j++) {
							tags.push(json_entry.tags[j].name);
						}
					
						entry.tags = tags.join(", ");
						entry.categories = [];
					
						rv.push(entry);
					}
				
					success(rv);
				}
				else {
					failure({"status": req.status, "msg": req.responseText});
				}
			}
		};
	
		req.send(null);
	};
	
	this.publish = function (params, success, failure) {
		var self = this;
		
		if ("id" in params && params.id) {
			var url = "http://posterous.com/api/2/users/me/sites/" + self.id + "/posts/" + encodeURIComponent(params.id) + "?api_token=" + encodeURIComponent(self.token);
			var method = "PUT";
		}
		else {
			var url = "http://posterous.com/api/2/users/me/sites/" + self.id + "/posts?api_token=" + encodeURIComponent(self.token);
			var method = "POST";
		}
		
		var req = new XMLHttpRequest();
		req.open(method, url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(self.username + ":" + self.password));
		
		var args = {};
		args["post[title]"] = params.title;
		args["post[body]"] = params.content;
		args["post[tags]"] = params.tags;
		args["post[source]"] = "ScribeFire";
		
		if ("timestamp" in params && params.timestamp) {
			// From what I understand, Posterous assumes all dates passed in are in -0700.
			var timestampCopy = new Date(params.timestamp);
			
			var offset = parseInt(timestampCopy.format("Z"), 10);
			var expectedOffset = -7 * 60 * 60;
			var delta = expectedOffset - offset;
			
			if (delta) {
				timestampCopy.setTime(timestampCopy.getTime() + (delta * 1000));
			}
			
			args["post[display_date]"] = timestampCopy.format("Y/m/d H:i:s");
		}
		
		if ("private" in params) {
			args["post[is_private]"] = params.private * 1;
		}
		
		var images = params.content.match(/(<img[^>]+>)/g);
		
		if (self.ui.upload && images) {
			if (images.length > 0) {
				var ios = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService);  
				
				for (var i = 0, _len = images.length; i < _len; i++) {
					var src = images[i].match(/\ssrc=['"]([^'"]+)['"]/i)[1];
					
					var url = ios.newURI(src, null, null);  
					var theFile = url.QueryInterface(Components.interfaces.nsIFileURL).file;
					
					args["media["+i+"]"] = {
						"file" : theFile,
					};
				}
			}
			
			var postRequest = createScribeFirePostRequest(args);
			
			req.setRequestHeader("Content-Length", (postRequest.requestBody.available()));
			req.setRequestHeader("Content-Type","multipart/form-data; boundary="+postRequest.boundary);
			
			var argstring = postRequest.requestBody;
		}
		else {
			var argstring = "";
			
			for (var i in args) {
				argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
			}
			
			argstring = argstring.substr(0, argstring.length - 1);
			
			req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		}
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				
				if (req.status == 200 || req.status == 201) {
					try {
						var json = JSON.parse(req.responseText);
					} catch (e) {
						failure({ "status" : req.status, "msg" : "Invalid response from the blog server: " + req.responseText });
						return;
					}
					
					success({ "id": json.id });
				}
				else {
					failure({"status": req.status, "msg": json.message });
				}
			}
		};

		req.send(argstring);
	};
	
	this.deletePost = function (params, success, failure) {
		var self = this;
		
		var url = "http://posterous.com/api/2/users/me/sites/" + self.id + "/posts/" + params.id + "?api_token=" + encodeURIComponent(self.token);
		
		var req = new XMLHttpRequest();
		req.open("DELETE", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(self.username + ":" + self.password));
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					success(true);
				}
				else {
					if (failure) {
						failure({"status": req.status, "msg": req.responseText});
					}
				}
			}
		};
		
		req.send(null);
	};
	
	this.upload = function (fileName, fileType, fileData, success, failure, file) {
		success( { "url" : "file://" + file.path } );
	}
};
posterousAPI.prototype = new blogAPI();

var performancingAPICalls = {
	//myParams  = [url, appkey, blogid, username, password, content, publish]
	blogger_newPost: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.newPost", myParams);
	},

	//myParams  = [url, appkey, postid, username, password, content, publish]
	blogger_editPost: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.editPost", myParams);
	},

	//myParams  = [url, appkey, postid, username, password, publish]
	blogger_deletePost: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.deletePost", myParams);
	},

	//myParams  = [url, appkey, blogid, username, password, numberOfPosts]
	blogger_getRecentPosts: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.getRecentPosts", myParams);
	},

	//myParams  = [url, appkey, username, password]
	blogger_getUsersBlogs: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.getUsersBlogs", myParams);
	},

	//myParams  = [url, appkey, username, password]
	blogger_getUserInfo: function(myParams) {
		return XMLRPC_LIB.makeXML("blogger.getUserInfo", myParams);
	},

	//myParams  = [url, blogid, username, password, content_t, publish]
	metaWeblog_newPost: function(myParams) {
		return XMLRPC_LIB.makeXML("metaWeblog.newPost", myParams);
	},

	metaWeblog_editPost: function(myParams) {
		return XMLRPC_LIB.makeXML("metaWeblog.editPost", myParams);
	},

	//myParams  = [url, blogid, username, password, numberOfPosts]
	metaWeblog_getRecentPosts: function(myParams) {
		return XMLRPC_LIB.makeXML("metaWeblog.getRecentPosts", myParams);
	},

	//myParams  = [url, blogid, username, password]
	metaWeblog_getCategoryList: function(myParams) {
		return XMLRPC_LIB.makeXML("metaWeblog.getCategories", myParams);
	},

	//myParams  = [url, blogid, username, password, mediaStruct]
	metaWeblog_newMediaObject: function(myParams) {
		return XMLRPC_LIB.makeXML("metaWeblog.newMediaObject", myParams);
	},

	//myParams  = [url, blogid, username, password, numberOfPosts]
	mt_getRecentPostTitles: function(myParams) {
		return XMLRPC_LIB.makeXML("mt.getRecentPostTitles", myParams);
	},

	//myParams  = [url, blogid, username, password]
	mt_getCategoryList: function(myParams) {
		return XMLRPC_LIB.makeXML("mt.getCategoryList", myParams);
	},

	//myParams  = [url, postid, username, password, categories]
	mt_setPostCategories: function(myParams) {
		return XMLRPC_LIB.makeXML("mt.setPostCategories", myParams);
	},

	mt_getPostCategories: function(myParams) {
		return XMLRPC_LIB.makeXML("mt.getPostCategories", myParams);
	},

	//mt_publishPost
	//myParams  = [url, postid, username, password]
	mt_publishPost: function(myParams) {
		return XMLRPC_LIB.makeXML("mt.publishPost", myParams);
	},

	wp_getPage : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getPage", myParams);
	},
	wp_getPages : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getPages", myParams);
	},
	wp_newPage : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.newPage", myParams);
	},
	wp_deletePage : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.deletePage", myParams);
	},
	wp_editPage : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.editPage", myParams);
	},
	wp_getPageList : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getPageList", myParams);
	},
	wp_getAuthors : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getAuthors", myParams);
	},
	wp_newCategory : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.newCategory", myParams);
	},
	wp_suggestCategories : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.suggestCategories", myParams);
	},
	wp_getUsersBlogs : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getUsersBlogs", myParams);
	},
	wp_getMediaLibrary : function (myParams) {
		return XMLRPC_LIB.makeXML("wp.getMediaLibrary", myParams);
	}
};

function createScribeFirePostRequest(args) {
	/**
	 * Generates a POST request body for uploading.
	 *
	 * args is an associative array of the form fields.
	 *
	 * Example:
	 * var args = { "field1": "abc", "field2" : "def", "fileField" : { "file": theFile, "headers" : [ "X-Fake-Header: foo" ] } };
	 * 
	 * theFile is an nsILocalFile; the headers param for the file field is optional.
	 *
	 * This function returns an array like this:
	 * { "requestBody" : uploadStream, "boundary" : BOUNDARY }
	 * 
	 * To upload:
	 *
	 * var postRequest = createPostRequest(args);
	 * var req = new XMLHttpRequest();
	 * req.open("POST", ...);
	 * req.setRequestHeader("Content-Type","multipart/form-data; boundary="+postRequest.boundary);
	 * req.setRequestHeader("Content-Length", (postRequest.requestBody.available()));
	 * req.send(postRequest.requestBody);
	 */
	
	if (platform == 'gecko') {
		function stringToStream(str) {
			function encodeToUtf8(oStr) {
				var utfStr = oStr;
				var uConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				uConv.charset = "UTF-8";
				utfStr = uConv.ConvertFromUnicode(oStr);

				return utfStr;
			}
		
			str = encodeToUtf8(str);
		
			var stream = Components.classes["@mozilla.org/io/string-input-stream;1"].createInstance(Components.interfaces.nsIStringInputStream);
			stream.setData(str, str.length);
		
			return stream;
		}
	
		function fileToStream(file) {
			var fpLocal  = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
			fpLocal.initWithFile(file);

			var finStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);                
			finStream.init(fpLocal, 1, 0, false);

			var bufStream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].createInstance(Components.interfaces.nsIBufferedInputStream);
			bufStream.init(finStream, 9000000);
		
			return bufStream;
		}
	
		var mimeSvc = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
		const BOUNDARY = "---------------------------32191240128944"; 
	
		var streams = [];
	
		for (var i in args) {
			var buffer = "--" + BOUNDARY + "\r\n";
			buffer += "Content-Disposition: form-data; name=\"" + i + "\"";
			streams.push(stringToStream(buffer));
		
			if (typeof args[i] == "object") {
				buffer = "; filename=\"" + args[i].file.leafName + "\"";
			
				if ("headers" in args[i]) {
					if (args[i].headers.length > 0) {
						for (var q = 0; q < args[i].headers.length; q++){
							buffer += "\r\n" + args[i].headers[q];
						}
					}
				}
			
				var theMimeType = mimeSvc.getTypeFromFile(args[i].file);
			
				buffer += "\r\nContent-Type: " + theMimeType;
				buffer += "\r\n\r\n";
			
				streams.push(stringToStream(buffer));
			
				streams.push(fileToStream(args[i].file));
			}
			else {
				buffer = "\r\n\r\n";
				buffer += args[i];
				buffer += "\r\n";
				streams.push(stringToStream(buffer));
			}
		}
	
		var buffer = "--" + BOUNDARY + "--\r\n";
		streams.push(stringToStream(buffer));
	
		var uploadStream = Components.classes["@mozilla.org/io/multiplex-input-stream;1"].createInstance(Components.interfaces.nsIMultiplexInputStream);
	
		for (var i = 0; i < streams.length; i++) {
			uploadStream.appendStream(streams[i]);
		}
	
		return { "requestBody" : uploadStream, "boundary": BOUNDARY };
	}
	else {
		throw new Exception("MethodNotSupported");
	}
}