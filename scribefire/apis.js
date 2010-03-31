var blogAPI = function () {
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
		 * success(params) = [ { "id": 1, "title": "Post Title", ... }, ... ]
		 */
	},
	
	getCategories : function (params, success, failure) {
		/**
		 * params = { }
		 */
		
		/**
		 * success(params) = [ { "id": 1, "name": "Category 1" }, ... ]
		 */
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
};
wordpressBlogAPI.prototype = new blogAPI();

function getBlogAPI(type) {
	switch (type) {
		case "wordpress":
			return new wordpressBlogAPI();
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