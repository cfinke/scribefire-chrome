var blogAPI = function () {
};

blogAPI.prototype = {
	init : function (blogObject) {
		for (x in blogObject) {
			this[x] = blogObject[x];
		}
	},
	
	login : function (username, password) { },
	
	getRecentPosts : function (params, success, failure) {
		/**
		 * params = { "limit": <int> }
		 */
		
		// Parameter to success is an array of posts, with the "id" and "title" parameters defined.
	},
	
	publish : function (params, success, failure) {
		/**
		 * params = { "title": <string>, "content": <string>, 
		 *            "categories": <int>[], "tags": <string>, 
		 *            "draft": <bool>, "id": <int> }
		 */
	}
};

var wordpressBlogAPI = function () {
	this.login = function (username, password) {
		var args = [this.xmlrpc, username, password];
		return performancingAPICalls.wp_getUsersBlogs(args);
	};
	
	this.getRecentPosts = function (params, success, failure) {
		if (!("limit" in params)) params.limit = 30;
		
		var args = [this.xmlrpc, this.blogid, this.username, this.password, params.limit];
		var xml = performancingAPICalls.metaWeblog_getRecentPosts(args);
		
		XMLRPC_LIB.doCommand(
			this.xmlrpc,
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
			var args = [this.xmlrpc, params.id, this.username, this.password, contentStruct, publish];
			var xml = performancingAPICalls.metaWeblog_editPost(args);
		}
		else {
			var args = [this.xmlrpc, this.blogid, this.username, this.password, contentStruct, publish];
			var xml = performancingAPICalls.metaWeblog_newPost(args);
		}
		
		XMLRPC_LIB.doCommand(
			this.xmlrpc,
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
	
	this.newPost = function (params) {
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
		
		if ("timestamp" in params) {
			contentStruct.dateCreated = new Date(params.timestamp);
		}
		
		if ("custom_fields" in params && params.custom_fields.length > 0) {
			contentStruct.custom_fields = custom_fields;
		}
		
		if ("slug" in params && params.slug) {
			contentStruct.slug = slug;
		}
		
		if ("draft" in params) {
			var publish = params.draft ? "bool0" : "bool1";
		}
		else {
			var publish = "bool1";
		}
		
		var args = [this.xmlrpc, this.blogid, this.username, this.password, contentStruct, publish];
		return performancingAPICalls.metaWeblog_newPost(args);
	};
	
	this.getCategoryList = function () {
		var args = [this.xmlrpc, this.blogid, this.username, this.password];
		return performancingAPICalls.mt_getCategoryList(args);
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