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
			SCRIBEFIRE.error("It's not your fault, but ScribeFire is looking for an API ("+type+") that doesn't exist.\n\nIf you're an alpha tester, you need to remove this blog and add it again.");
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
	this.ui.tags = true;
	this.ui.draft = true;
	this.ui.deleteEntry = true;	
	this.ui.timestamp = true;
	this.ui.slug = false;
	this.ui.private = false;
	this.ui["text-content_wp_more"] = false;
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
		
		failure({"status": 0, "msg": "Slow down... You need to add your blog before you can publish."});
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
		
		failure({ "status": 0, "msg": "This blog does not support adding categories."});
	},
	
	getPostCategories : function (params, success, failure) {
		success($("#list-entries option[value='"+params.id+"']:first").data("categories"));
	}
};

var genericMetaWeblogAPI = function () {
	this.ui.categories = false;
	this.ui.timestamp = true;
	this.ui.slug = true;
	
	this.getBlogs = function (params, success, failure) {
		// How safe is it to assume that MetaWeblog APIs implement the blogger_ methods?
		
		var args = [params.apiUrl, params.id, params.username, params.password];
		var xml = performancingAPICalls.blogger_getUsersBlogs(args);
		
		XMLRPC_LIB.doCommand(
			params.apiUrl,
			xml,
			function (rv) {
				//console.log("in success");
				//console.log(rv);
				if (success) {
					var blogs = [];
				
					for (var i = 0; i < rv.length; i++) {
						var blog = {};
						blog.url = rv[i].url;
						blog.id = rv[i].blogid;
						blog.name = rv[i].blogName;
						blog.apiUrl = params.apiUrl;
						blog.type = params.type;
						blog.username = params.username;
						blog.password = params.password;
						
						//console.log(blog);
						
						blogs.push(blog);
					}
					
					success(blogs);
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
		if (!("limit" in params)) params.limit = 20;
		
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
};
genericMetaWeblogAPI.prototype = new blogAPI();

var genericMovableTypeAPI = function () {
	this.ui.categories = true;
	
	this.publish = function (params, success, failure) {
		// MovableType is hacky about publishing and categories.
		
		// MT supposedly uses the "draft" setting to determine whether
		// to rebuild static pages, not whether it's actually a draft.

		var trueDraft = params.draft;
		params.draft = false;
		
		var self = this;
		
		this.doPublish(params, 
			function newSuccess(rv) {
				//console.log(rv);
				if (("id" in rv) && rv.id) {
					var postId = rv.id;
				}
				else {
					var postId = rv;
				}
				
				var newParams = {
					"id": postId,
					"categories": params.categories
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
					function categoryFailure(status, msg) {
						failure({"status": status, "msg": msg});
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
					
					success(categories);
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

var wordpressAPI = function () {
	this.ui.categories = true;
	this.ui.slug = true;
	this.ui.private = true;
	this.ui["text-content_wp_more"] = true;

	this.publish = function (params, success, failure) {
		// Some Wordpress plugins apparently rely on linebreaks being \n and not <br />. This is dumb.
		params.content = params.content.replace(/<br\s*\/?>/g, "\n");
		params.content = params.content.replace(/<\/p>\s*<p>/g, "\n\n");
		this.doPublish(params, success, failure);
	}
	
	this.getBlogs = function (params, success, failure) {
		var args = [params.apiUrl, params.username, params.password];
		var xml = performancingAPICalls.wp_getUsersBlogs(args);
		
		XMLRPC_LIB.doCommand(
			params.apiUrl,
			xml,
			function (rv) {
				if (success) {
					var blogs = [];
				
					for (var i = 0; i < rv.length; i++) {
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
};
wordpressAPI.prototype = new genericMetaWeblogAPI();

var genericAtomAPI = function () {
	this.ui.tags = false;
	this.ui.categories = false;
	
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
							var xml = req.responseXML;
							
							if (!xml) {
								//console.log(req.responseText);
								//console.log(req.status);
								
								failure({"status": req.status, "msg": req.responseText});
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
							failure({"status": req.status, "msg": req.responseText});
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
							var xml = req.responseXML;
							
							//console.log(xml);
							
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
							var xml = req.responseXML;
							var jxml = $(xml);
							
							var postId = jxml.find("id:first").text().split(".post-")[1];
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
									var xml = req.responseXML;
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
								var xml = req.responseXML;
								var jxml = $(xml);
								
								var interfaceUrl = jxml.find("entry:first link[rel='self']:first").attr("href");
								
								self.buildRequest(
									"GET",
									interfaceUrl,
									function (creq) {
										creq.onreadystatechange = function () {
											if (creq.readyState == 4) {
												if (creq.status < 300) {
													var cxml = creq.responseXML;
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
		req.open(method, url, true, this.username, this.password);
		req.setRequestHeader("Content-Type", "application/atom+xml");
		
		callback(req);
	};
};
genericAtomAPI.prototype = new blogAPI();

var bloggerAPI = function () {
	this.authToken = null;
	
	this.ui.categories = true;
	
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
								SCRIBEFIRE.error("Blogger says that you entered the wrong username or password.");
								return;
							break;
							case 'NotVerified':
								SCRIBEFIRE.error("Blogger says that you need to verify your account's email address; log into your account directly to handle this.");
								return;
							break;
							case 'TermsNotAgreed':
								SCRIBEFIRE.error("Blogger says that you still need to agree to Google's Terms of Service; log into your account directly to handle this.");
								return;
							break;
							case 'AccountDeleted':
								SCRIBEFIRE.error("Blogger says that the account you're using has been deleted.");
								return;
							break;
							case 'ServiceDisabled':
								SCRIBEFIRE.error("Blogger says that your access to Blogger has been disabled.");
								return;
							break;
							case 'ServiceUnavailable':
								SCRIBEFIRE.error("Blogger says that the Blogger service is temporarily unavailable.");
								return;
							break;
							case 'CaptchaRequired':
								var imgUrl = "https://www.google.com/accounts/" + returnValues["CaptchaUrl"];
								
								$.facebox("<div><h4>Google requires that you complete this CAPTCHA in order to continue:</h4><p><img src='"+imgUrl+"' /><p><input type='text' id='google-captcha' /><input type='submit' value='Continue' id='captcha-continue' /></div>");
								
								$("#captcha-continue").click(function (e) {
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
								returnValues["Error"] = "An unknown error occurred.";
							break;
							default:
							break;
						}
					
						SCRIBEFIRE.error("Blogger isn't playing nicely; it's giving ScribeFire an error:\n\n" + returnValues["Error"]);
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
			req.open(method, url, true, self.username, self.password);
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
};
bloggerAPI.prototype = new genericAtomAPI();

var tumblrAPI = function () {
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
					var xml = req.responseXML;
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
					
					success(blogs);
				}
				else {
					failure({"status": req.status, "msg": req.responseText});
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.getPosts = function (params, success, failure) {
		if (!("limit" in params)) params.limit = 30;
		
		if (this.isPrivate) {
			var url = this.url;
		}
		else {
			var url = this.url + "api/read/xml";//?start=0&num="+params.limit+"&type=regular";
		}
		
		var args = {};
		args.email = this.username;
		args.password = this.password;
		args.start = 0;
		args.num = params.limit;
		args.type = "regular";
		
		var argstring = "";
		
		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}
		
		argstring = argstring.substr(0, argstring.length - 1);
		
		//console.log(argstring);
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					//console.log(req.responseText);
					var xml = req.responseXML;
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
		
		//console.log(argstring);
		
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
	//this.ui.tags = false;
	this.ui.categories = false;
	this.ui.deleteEntry = false;
	this.ui.timestamp = false;
	this.ui.private = true;
	
	this.getBlogs = function (params, success, failure) {
		var url = "http://posterous.com/api/getsites";
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(params.username + ":" + params.password));
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					var xml = req.responseXML;
					var jxml = $(xml);
					
					var blogs = [];
					
					jxml.find("site").each(function () {
						var blog = {};
						blog.id = $(this).find("id:first").text();
						blog.apiUrl = "http://posterous.com/api";
						blog.type = params.type;
						blog.username = params.username;
						blog.password = params.password;
						blog.name = $(this).find("name:first").text();
						blog.url = $(this).find("url:first").text();
						
						blogs.push(blog);
					});
					
					success(blogs);
				}
				else {
					failure({"status": req.status, "msg": req.responseText});
				}
			}
		};
		
		req.send(null);
	};
	
	this.getPosts = function (params, success, failure) {
		var url = "http://posterous.com/api/readposts";
		
		var args = {};
		args.site_id = this.id;
		args.num_posts = 50;
		
		var argstring = "";

		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}

		argstring = argstring.substr(0, argstring.length - 1);
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(this.username + ":" + this.password));
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {

					var xml = req.responseXML;
					
					//console.log(xml);
					var jxml = $(xml);
					
					var rv = [];
					
					jxml.find("post").each(function () {
						var entry = {}
						entry.id = $(this).find("id:first").text();
						entry.content = $(this).find("body:first").text();
						entry.title = $(this).find("title:first").text();
						entry.published = true; // @todo Does Posterous support drafts?
						entry.private = $(this).find("private:first").text() == 'true';
						
						var tags = [];
						
						$(this).find("tag").each(function () {
							tags.push($(this).text());
						});
						
						entry.tags = tags.join(", ");
						entry.categories = [];
						
						rv.push(entry);
					});
					
					success(rv);
				}
				else {
					failure({"status": req.status, "msg": req.responseText});
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.publish = function (params, success, failure) {
		var args = {};
		
		if ("id" in params && params.id) {
			var url = "http://posterous.com/api/updatepost";
			
			args.post_id = params.id;
		}
		else {
			var url = "http://posterous.com/api/newpost";
		}
		
		args.site_id = this.id;
		args.title = params.title;
		args.body = params.content;
		args.tags = params.tags;
		
		if ("private" in params) {
			args.private = params.private * 1;
		}
		
		args.source = "ScribeFire";
		args.sourceLink = "http://www.scribefire.com/";
		
		var argstring = "";

		for (var i in args) {
			argstring += encodeURIComponent(i) + "=" + encodeURIComponent(args[i]) + "&";
		}

		argstring = argstring.substr(0, argstring.length - 1);
		
		var req = new XMLHttpRequest();
		req.open("POST", url, true);
		req.setRequestHeader("Authorization", "Basic " + btoa(this.username + ":" + this.password));
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				var xml = req.responseXML;
				var jxml = $(xml);
				
				if (req.status == 200) {
					success({ "id": jxml.find("id:first").text() });
				}
				else {
					failure({"status": req.status, "msg": jxml.find("err:first").attr("msg")});
				}
			}
		};
		
		req.send(argstring);
	};
	
	this.deletePost = function (params, success, failure) {
		failure({"status": 0, "msg": "Posterous does not support post deletion at this time."});
	};
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