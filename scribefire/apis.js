var blogAPI = function () {
	this.ui = {};
	this.ui.categories = true;
	this.ui.tags = true;
	this.ui.draft = true;	
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
		 * success(params) = [ { "id": <int>, "title": <string>, "description": <string>, "published": <bool>, "tags": <string>, "categories": <string>[] } ]
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
	}
};

var wordpressBlogAPI = function () {
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
	
	this.getPosts = function (params, success, failure) {
		if (!("limit" in params)) params.limit = 30;
		
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
						
						delete rv[i].postid;
						delete rv[i].mt_keywords;
						delete rv[i].post_status;
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
		var contentStruct = { };
		
		if (("id" in params) && params.id) {
		}
		
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
		
		/*
		if ("timestamp" in params) {
			contentStruct.dateCreated = new Date(params.timestamp);
		}
		
		if ("custom_fields" in params && params.custom_fields.length > 0) {
			contentStruct.custom_fields = custom_fields;
		}
		
		if ("slug" in params && params.slug) {
			contentStruct.slug = slug;
		}
		*/
		
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
		var args = [this.apiUrl, "ignored", params.id, this.username, this.password, true];
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
wordpressBlogAPI.prototype = new blogAPI();

var tumblrBlogAPI = function () {
	this.ui.categories = false;
	
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
					failure(req.status, req.responseText);
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
			var url = this.url + "api/read/xml?start=0&num="+params.limit+"&type=regular";
		}
		
		var req = new XMLHttpRequest();
		req.open("GET", url, true);
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				if (req.status == 200) {
					console.log(req.responseText);
					
					var xml = req.responseXML;
					var jxml = $(xml);
				
					var rv = [];
				
					jxml.find("post").each(function () {
						var post = {};
						post.title = $(this).find("regular-title:first").text();
						post.description = $(this).find("regular-body:first").text();
						post.dateCreated = $(this).attr("date-gmt");
						post.id = $(this).attr("id");
						post.url = $(this).attr("url");
						post.published = true;
						post.categories = [];
						
						post.tags = [];
						
						$(this).find("tag").each(function () {
							post.tags.push($(this).text());
						});
						
						post.tags = post.tags.join(", ");
						
						rv.push(post);
					});
					
					console.log(rv);
					
					success(rv);
				}
				else {
					failure({"status": req.status, "msg" : req.responseText});
				}
			}
		};
		
		req.send(null);
	};
	
	this.publish = function (params, success, failure) {
		var args = {};
		args.email = this.username;
		args.password = this.password;
		args.generator = "ScribeFire";
		args.group = this.url.split("//")[1].split("/")[0];
		
		/*
		if ("private" in params) {
			args["private"] = params.private * 1;
		}
		*/
		
		/*
		var theDate = new Date(aDateCreated);
		var now = new Date();
		
		if (theDate > now) {
			aDateCreated = now;
		}
		else {
			aDateCreated = theDate;
		}
		
		args.date = aDateCreated.toString();
		*/
		
		args.tags = params.tags;
		args.type = 'regular';
		args.format = 'html';
		args.title = params.title;
		args.body = params.content;
		
		if ("draft" in params) {
			args.state = params.draft ? "draft" : "published";
		}
		
		if (("id" in params) && params.id) {
			args["post-id"] = params.id;
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
tumblrBlogAPI.prototype = new blogAPI();

function getBlogAPI(type) {
	switch (type) {
		case "wordpress":
			return new wordpressBlogAPI();
		break;
		case "tumblr":
			return new tumblrBlogAPI();
		break;
		default:
			alert("Unsupported blog type.");
		break;
	}
}

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
		//	    $blog_id    = $args[0];
		//      $username    = $args[1];
		//      $password    = $args[2];
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