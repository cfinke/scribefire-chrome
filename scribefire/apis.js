var JUMP_BREAK_REGEX = /<hr\s*class=['"]jump['"]\s*\/?>/g;

var blogApis = {
};

function getBlogAPI(type, apiUrl) {
	if (apiUrl in blogApis) {
		return blogApis[apiUrl];
	}
	
	var api = null;
	
	switch (type) {
		case "wordpress":
			api = new wordpressBlogAPI();
		break;
		case "blogger_atom":
			api = new bloggerAtomBlogAPI();
		break;
		case "tumblr":
			api = new tumblrBlogAPI();
		break;
		case "metaweblog":
			api = new genericMetaWeblogAPI();
		break;
		default:
			alert("Unsupported blog type.");
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

var genericMetaWeblogAPI = function () {
	this.ui.categories = false;
	
	this.getBlogs = function (params, success, failure) {
		// How safe is it to assume that MetaWeblog APIs implement the blogger_ methods?
		
		var args = [params.apiUrl, params.id, params.username, params.password];
		var xml = performancingAPICalls.blogger_getUsersBlogs(args);
		
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
						blog.apiUrl = params.apiUrl;
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
						rv[i].content = rv[i].description;
						
						if (("mt_text_more" in rv[i]) && rv[i].mt_text_more) {
							rv[i].content += '<hr class="jump" />';
							rv[i].content += rv[i].mt_text_more;
						}
						
						if (!("categories" in rv[i])){
							rv[i].categories = [];
						}
						
						rv[i].permalink = rv[i].permaLink;
						
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
		var contentStruct = { };

		if ("title" in params) {
			contentStruct.title = params.title;
		}

		if ("content" in params) {
			contentStruct.description = params.content.replace(JUMP_BREAK_REGEX, "<!--more-->");;
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

var wordpressBlogAPI = function () {
	this.ui.categories = true;
	
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
wordpressBlogAPI.prototype = new genericMetaWeblogAPI();

var bloggerAtomBlogAPI = function () {
	this.authToken = null;
	
	this.ui.tags = false;
	
	this.getBlogs = function (params, success, failure) {
		this.init(params);
		
		this.buildRequest(
			"GET",
			params.apiUrl,
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						if (req.status < 300) {
							var xml = req.responseXML;
						
							if (!xml) {
								// bloggerIncompleteResponse
								failure({"status": req.status, "msg": "Incomplete response"});
							}
							else {
						
								var jxml = $(xml);
						
								var blogs = [];
						
								var blog = {};
								blog.url = jxml.find("link[rel='alternate']:first").attr("href");
								blog.name = jxml.find("title:first").text();
								blog.id = jxml.find("id:first").text().split(":blog-")[1];
								blog.apiUrl = params.apiUrl;
								blog.type = "blogger_atom";
								blog.username = params.username;
								blog.password = params.password;
						
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
			this.apiUrl,
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						if (req.status < 300) {
							var xml = req.responseXML;
							var jxml = $(xml);
						
							var posts = [];
						
							jxml.find("entry").each(function () {
								var post = {};
								post.content = $(this).find("content:first").text();
							
								// @todo Do this better.
								post.content = post.content.replace('<content type="xhtml">' + "\n  ", "");
								post.content = post.content.replace("\n</content>", "");
							
								// @todo Do this better too.
								var divRegexp = /\<div xmlns\=\'http:\/\/www.w3.org\/1999\/xhtml\'\>|\<div xmlns\=\"http:\/\/www.w3.org\/1999\/xhtml\"\>/;
								var divIndex = post.content.search(divRegexp);

								if (divIndex >= 0 && divIndex < 30){
									// If we have a <div xmlns='http://www.w3.org/1999/xhtml'> at the top
									post.content = post.content.substring(42, post.content.length - 6); // Get rid of the outer div
								}
							
								post.title = $(this).find("title:first").text();
							
								/*
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
							
								post.date = dateutc;
								*/
							
								post.categories = [];
							
								$(this).find("category").each(function () {
									post.categories.push($(this).attr("term"));
								});
							
								post.tags = "";
							
								$(this).find("link").each(function () {
									if ($(this).attr("rel") == "alternate") {
										post.url = $(this).attr("href");
									}
									else if ($(this).attr("rel") == "edit") {
										post.editUrl = $(this).attr("href");
									}
								});
							
								var postUrl = $(this).find("id:first").text();
								post.id = postUrl.match( /(?:\/|post-)(\d{5,})(?!\d*\/)/)[1];
								
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
		var apiUrl = this.apiUrl;
		
		if ("id" in params && params.id) {
			method = "PUT";
			
			if (apiUrl[apiUrl.length - 1] != "/") {
				apiUrl += "/";
			}
			
			apiUrl += params.id;
		}
		
		var body = "";
		body += '<?xml version="1.0" encoding="UTF-8" ?>';
		body += '<entry xmlns="http://www.w3.org/2005/Atom" xmlns:app="http://purl.org/atom/app#">';
		
		var title = params.title.replace(/&amp;/g, '&');
		title = namedEntitiesToNumericEntities(title);
		title = title.replace(/&([^#])/g, "&amp;$1");
		
		for (var i = 0; i < params.categories.length; i++) {
			body += '<category scheme="http://www.blogger.com/atom/ns#" term="'+params.categories[i].replace(/&/g,'&amp;')+'"/>';
		}
		
		body += '<title mode="escaped" type="text">' + title + '</title>';
		
		if ("date" in params && params.date) {
			var date = params.date;
			body += '<issued>' + params.date + '</issued>';
			
			if (date) {
				var validDate = date.substring(0,4) + "-" + date.substring(4,6) + "-" + date.substring(6,8) + "T" + date.substring(9,17) + ".000Z";
				body += '<published>' + validDate + '</published>';
			}
		}
		
		body += '<content type="xhtml">'
		
		var content = params.content;
		content = content.replace(JUMP_BREAK_REGEX, "<!-- more -->");
		
		// Blogger doesn't like named entities.
		content = namedEntitiesToNumericEntities(content);
		
		// I don't think these divs are actually necessary.
		//if (content.indexOf('<div xmlns="http://www.w3.org/1999/xhtml">') != -1){
			body += content.replace(/&([^#])/g, "&amp;$1");
		//}
		//else {
		//	body += '<div xmlns="http://www.w3.org/1999/xhtml">' + content.replace(/&([^#])/g, "&amp;$1") + '</div>';
		//}
		
		body += '</content>';
		
		if (params.draft) {
			body += '<app:control>';
			body += '    <app:draft>yes</app:draft>';
			body += '</app:control>';
		}
		
		body += ' </entry>';
		
		this.buildRequest(
			method,
			apiUrl,
			function (req) {
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
	
	this.deletePost = function (params, success, failure) {
		var apiUrl = this.apiUrl;
		
		if (apiUrl[apiUrl.length - 1] != "/") {
			apiUrl += "/";
		}
		
		apiUrl += params.id;
		
		this.buildRequest(
			"DELETE",
			apiUrl,
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
	
	this.getCategories = function (params, success, failure) {
		this.buildRequest(
			"GET",
			this.apiUrl,
			function (req) {
				req.onreadystatechange = function () {
					if (req.readyState == 4) {
						if (req.status < 300) {
							var xml = req.responseXML;
							var jxml = $(xml);
							
							var categories = {};
						
							jxml.find("category").each(function () {
								var term = $(this).attr("term");
								categories[term] = true;
							});
							
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
						returnValues["Error"] = "CaptchaRequired";
						
						switch (returnValues["Error"]) {
							case 'BadAuthentication':
							break;
							case 'NotVerified':
							break;
							case 'TermsNotAgreed':
							break;
							case 'AccountDeleted':
							break;
							case 'ServiceDisabled':
							break;
							case 'ServiceUnavailable':
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
							default:
							break;
						}
					
						alert("Error: " + returnValues["Error"]);
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
bloggerAtomBlogAPI.prototype = new blogAPI();

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
					var xml = req.responseXML;
					var jxml = $(xml);
				
					var rv = [];
				
					jxml.find("post").each(function () {
						var post = {};
						post.title = $(this).find("regular-title:first").text();
						post.content = $(this).find("regular-body:first").text();
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