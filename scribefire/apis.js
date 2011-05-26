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
		default:
			SCRIBEFIRE.error(scribefire_string("error_api_invalid", type));
		break;
	}
	
	if (api) {
		blogApis[apiUrl] = api;
		return api;
	}
}

var blogAPI = function () {
	this.ui = {};
	this.ui.categories = true;
	this.ui["add-category"] = true;
	this.ui.tags = true;
	this.ui.draft = true;
	this.ui.deleteEntry = true;	
	this.ui.timestamp = true;
	this.ui.slug = false;
	this.ui.private = false;
	this.ui["text-content_wp_more"] = false;
	this.ui.upload = false;
	this.ui["custom-fields"] = false;
	this.ui.excerpt = false;
	this.ui.pages = false;
};

blogAPI.prototype = {
	init : function (blogObject) {
		for (x in blogObject) {
			this[x] = blogObject[x];
		}
	},
	
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
		
		failure({ "status": 0, "msg": scribefire_string("error_api_noCategorySupport")});
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
	this.ui.slug = true;
	this.ui.upload = !!((platform == 'gecko') || (window.File && window.FileReader && window.FileList && window.Blob));
	
	this.getBlogs = function (params, success, failure) {
		// How safe is it to assume that MetaWeblog APIs implement the blogger_ methods?
		
		if (!params.id || !("id" in params)) {
			params.id = "0";
		}
		
		var args = [params.apiUrl, params.id, params.username, params.password];
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
			}
		);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		
		if (!("limit" in params)) params.limit = 100;
		
		var args = [this.apiUrl, this.id, this.username, this.password, params.limit];
		
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
						
						delete rv[i].postid;
						delete rv[i].mt_keywords;
						delete rv[i].post_status;
						delete rv[i].mt_text_more;
						delete rv[i].description;
						delete rv[i].permaLink;
					}
					
					// success(rv);
					
					if (self.ui.pages) {
						var args = [self.apiUrl, self.id, self.username, self.password, params.limit];
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
							}
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
			}
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
		
		/*
		if ("custom_fields" in params && params.custom_fields.length > 0) {
			contentStruct.custom_fields = custom_fields;
		}
		*/
		
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
			var args = [this.apiUrl, params.id, this.username, this.password, contentStruct, publish];
			var xml = performancingAPICalls.metaWeblog_editPost(args);
		}
		else {
			var args = [this.apiUrl, this.id, this.username, this.password, contentStruct, publish];
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
			}
		);
	};
	
	this.deletePost = function (params, success, failure) {
		this.doDeletePost(params, success, failure);
	};
	
	this.doDeletePost = function (params, success, failure) {
		var args = [this.apiUrl, "0123456789ABCDEF", params.id, this.username, this.password, true];
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
			}
		);
	};

	this.upload = function (fileName, fileType, fileData, success, failure) {
		var bits = btoa(fileData);
		
		var args = [this.apiUrl, this.id, this.username, this.password, { name : fileName, type : fileType, bits : bits } ];
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
			}
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
		var args = [this.apiUrl, this.id, this.username, this.password];
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
		
		var args = [this.apiUrl, params.id, this.username, this.password, categories];
		
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
		var args = [this.apiUrl, params.id, this.username, this.password];
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
		var args = [this.apiUrl, params.id, this.username, this.password];
		
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
	
	this.publish = function (params, success, failure) {
		// Some Wordpress plugins apparently rely on linebreaks being \n and not <br />. This is dumb.
		params.content = params.content.replace(/<br\s*\/?>/g, "\n");
		params.content = params.content.replace(/<\/p>\s*<p>/g, "\n\n");
		
		if (params.type == "posts") {
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
				var args = [this.apiUrl, params.id, this.username, this.password, contentStruct, publish];
				var xml = performancingAPICalls.metaWeblog_editPost(args);
			}
			else {
				var args = [this.apiUrl, this.id, this.username, this.password, contentStruct, publish];
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
				}
			);
		}
	};
	
	this.getBlogs = function (params, success, failure) {
		var args = [params.apiUrl, params.username, params.password];
		var xml = performancingAPICalls.wp_getUsersBlogs(args);
		
		XMLRPC_LIB.doCommand(
			params.apiUrl,
			xml,
			function (rv) {
				if (success) {
					if (rv.length) {
						var blogs = [];
				
						for (var i = 0, _len = rv.length; i < _len; i++) {
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
			}
		);
	};
	
	this.getCategories = function (params, success, failure) {
		var args = [this.apiUrl, this.id, this.username, this.password];
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
	
	this.addCategory = function (params, success, failure) {
		var args = [this.apiUrl, this.id, this.username, this.password, { name : params.name } ];
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
			}
		);
	}
	
	this.deletePost = function (params, success, failure) {
		if (params.type == "posts") {
			this.doDeletePost(params, success, failure);
		}
		else {
			var args = [this.apiUrl, params.id, this.username, this.password, params.id];
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
				}
			);
		}
	}
};
wordpressAPI.prototype = new genericMetaWeblogAPI();

var genericAtomAPI = function () {
	var newUi = {};
	for (var x in this.ui) newUi[x] = this.ui[x];
	this.ui = newUi;

	this.ui.tags = false;
	this.ui.categories = false;
	this.ui.draft = false;
	
	this.getBlogs = function (params, success, failure) {
		this.init(params);
		
		var self = this;
		
		this.buildRequest(
			"GET",
			this.apiUrl,
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
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
				};
				
				req.send(null);
			}
		);
	};
	
	this.getPosts = function (params, success, failure) {
		this.buildRequest(
			"GET",
			this.atomAPIs["service.feed"],
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						if (req.status < 300) {
							var xml = xmlFromRequest(req);
							
							var jxml = $(xml);
						
							var posts = [];
						
							jxml.find("entry").each(function () {
								var post = {};
								
								post.content = $(this).find("content:first").text();
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
								
								post.tags = "";
								
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
								
								$(this).find("draft").each(function () {
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
				};
				
				req.send(null);
			}
		);
	};
		
	this.publish = function (params, success, failure) {
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
		
		var title = params.title;
		
		body += '<title><![CDATA[' + title + ']]></title>';
		
		for (var i = 0; i < params.categories.length; i++) {
			// Not all Atom APIs will respect this.
			body += '<category scheme="http://www.blogger.com/atom/ns#" term="'+params.categories[i].replace(/&/g,'&amp;')+'"/>';
		}
		
		if ("timestamp" in params && params.timestamp) {
			var date = params.timestamp;
			
			body += '<published>' + date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate()) + "T" + pad(date.getUTCHours()) + ":" + pad(date.getUTCMinutes()) + ":00.000Z" + '</published>';
		}
		
		body += '<content type="html"><![CDATA['
		
		var content = params.content;
		
		body += content;
		body += ']]></content>';
		
		if (params.draft) {
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
						if (req.status < 300) {
							var xml = xmlFromRequest(req);
							var jxml = $(xml);
							
							var postId = jxml.find("id:first").text();//.split(".post-")[1];
							success({ "id": postId });
						}
						else {
							failure({ "status": req.status, "msg": req.responseText });
						}
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
		this.buildRequest(
			"DELETE",
			params["service.edit"],
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4){
						if (req.status < 300) {
							success(true);
						}
						else {
							failure({ "status": req.status, "msg": req.responseText });
						}
					}
				};
				
				req.send(null);
			}
		);
	};

	this.buildRequest = function (method, url, callback) {
		var req = new XMLHttpRequest();
		
		if (platform === 'presto') {
			req.open(method, url, true);
			req.setRequestHeader("Authorization", "Basic " + btoa(this.username + ":" + this.password));
		}
		else {
			// encodeURIComponent is used here because otherwise some requests were failing
			// when the password contains special characters like "@"
			req.open(method, url, true, encodeURIComponent(this.username), encodeURIComponent(this.password));
		}
		
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
	this.ui.upload = !!((platform == 'gecko') || (window.File && window.FileReader && window.FileList && window.Blob));
	this.ui.draft = true;
	
	this.authToken = null;
	
	this.getCategories = function (params, success, failure) {
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
		var token = this.authToken;
		
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
		
		if (token) {
			var req = build(token);
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
		if (platform == 'gecko') { 
			var self = this;
		
			var invalidTokens = 0;
		
			function doUpload(token) {
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
				upreq.setRequestHeader("Authorization","AuthSub token="+token);
				upreq.setRequestHeader("Content-Type", theMimeType);
				upreq.setRequestHeader("Content-Length", (uploadStream.available()));
				upreq.overrideMimeType("text/xml");
			
				upreq.onreadystatechange = function () {
					if (upreq.readyState == 4) {
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
							if (upreq.status == 403 && upreq.responseText.match(/Token invalid/)) {
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
				};
			
				upreq.send(uploadStream);
			}
		
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch).getBranch("extensions.scribefire.");
			prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		
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
		else {
			var self = this;
		
			var invalidTokens = 0;
		
			function doUpload(token) {
				var upreq = new XMLHttpRequest();
				upreq.open("POST", "http://picasaweb.google.com/data/feed/api/user/default/albumid/default", true);
				upreq.setRequestHeader("Authorization","AuthSub token="+token);
				upreq.setRequestHeader("Content-Type", fileType);
				upreq.overrideMimeType("text/xml");
			
				upreq.onreadystatechange = function () {
					if (upreq.readyState == 4) {
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
							if (upreq.status == 403 && upreq.responseText.match(/Token invalid/)) {
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
								failure( { "status" : upreq.status, "msg" : scribefire_string("error_api_blogger_uploadAPIUnavailable") } );
							}
						}
					}
				};
			
				upreq.send(file);
			}
		
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
			var url = this.url;
		}
		else {
			var url = this.url + "api/read/xml";//?start=0&num="+params.limit+"&type=regular";
		}
		
		var args = {};
		args.email = this.username;
		args.password = this.password;
		// @todo-more-posts
		args.start = 0;
		args.num = params.limit;
		args.type = "regular";
		
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
				
					var rv = [];
				
					jxml.find("post").each(function () {
						var post = {};
						post.title = $(this).find("regular-title:first").text();
						post.content = $(this).find("regular-body:first").text();
						post.id = $(this).attr("id");
						post.url = $(this).attr("url");
						post.published = true;
						post.categories = [];
						post.private = $(this).attr("private") && ($(this).attr("private") == "true");
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
		args.group = this.url.split("//")[1].split("/")[0];
		
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
	
	//this.ui.tags = false;
	this.ui.categories = false;
	this.ui.deleteEntry = true;
	this.ui.timestamp = false;
	this.ui.private = false; // until posterous fixes their bug
	this.ui.upload = (platform == 'gecko');
	this.ui.draft = false;
	
	this.getToken = function (params, success, failure) {
		var url = "http://posterous.com/api/2/auth/token";
		
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(params.username + ":" + params.password));
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					var json = JSON.parse(req.responseText);
					
					var token = json.api_token;
					
					success(token);
				}
				else {
					failure({"status": req.status, "msg": req.responseText});
				}
			}
		};
		
		req.send(null);
	};
	
	this.getBlogs = function (params, success, failure) {
		var self = this;
		
		this.getToken(params, function (token) {
			var url = "http://posterous.com/api/2/users/me/sites?api_token=" + encodeURIComponent(token);
			
			var req = new XMLHttpRequest();
			req.open("GET", url, true);
			req.setRequestHeader("Authorization", "Basic " + btoa(params.username + ":" + params.password));
			
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					if (req.status == 200) {
						var text = req.responseText;
						var json = JSON.parse(text);
						
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
		}, failure);
	};
	
	this.getPosts = function (params, success, failure) {
		var self = this;
		
		this.getToken(self, function (token) {
			var url = "http://posterous.com/api/2/users/me/sites/" + self.id + "/posts?api_token=" + encodeURIComponent(token);
			
			var req = new XMLHttpRequest();
			req.open("GET", url, true);
			req.setRequestHeader("Authorization", "Basic " + btoa(self.username + ":" + self.password));
		
			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					if (req.status == 200) {
						var text = req.responseText;
						var json = JSON.parse(text);
						
						var rv = [];
						
						for (var i = 0, _len = json.length; i < _len; i++) {
							var json_entry = json[i];
							
							var entry = {}
							entry.id = json_entry.id;
							entry.content = json_entry.body_full;
							entry.title = json_entry.title;
							entry.published = true; // @todo Does Posterous support drafts?
							entry.private = json_entry.is_private;
							
							var tags = [];
							
							for (var j = 0, _jlen = json_entry.tags.length; j < _jlen; j++) {
								tags.push(json_entry.tags[j].tag);
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
		}, failure);
	};
	
	this.publish = function (params, success, failure) {
		var self = this;
		
		this.getToken(self, function (token) {
			if ("id" in params && params.id) {
				var url = "http://posterous.com/api/2/users/me/sites/primary/posts/" + encodeURIComponent(params.id) + "?api_token=" + encodeURIComponent(token);
				var method = "PUT";
			}
			else {
				var url = "http://posterous.com/api/2/users/me/sites/primary/posts?api_token=" + encodeURIComponent(token);
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
					var json = JSON.parse(req.responseText);
					
					if (req.status == 200 || req.status == 201) {
						success({ "id": json.id });
					}
					else {
						failure({"status": req.status, "msg": json.message });
					}
				}
			};

			req.send(argstring);
		}, failure);
	};
	
	this.deletePost = function (params, success, failure) {
		var self = this;
		
		this.getToken(self, function (token) {
			var url = "http://posterous.com/api/2/users/me/sites/primary/posts/" + params.id + "?api_token=" + encodeURIComponent(token);
			
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
		}, failure);
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