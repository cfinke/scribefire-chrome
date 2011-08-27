var ADBULL = {
	load : function () {
		$(".ui-adbull").show();
		
		$("#button-blog-adbull").live("click", function (e) {
			e.preventDefault();

			ADBULL.addSite(SCRIBEFIRE.getBlog());
		});
		
		var style = $("<link/>");
		style.attr("rel", "stylesheet").attr("type", "text/css").attr("href", "skin/adbull.css");
		$("head:first").append(style);
	},
	
	api : {
		request : function (method, argString, callback) {
			var req = new XMLHttpRequest();
			
			var fullUrl = "http://www.chrisfinke.com/adbull/";
			
			if (method === "GET" && argString) {
				fullUrl += "?" + argString;
			}
			
			req.open(method, fullUrl, true);
			
			if (method === "POST") {
				req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			}

			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					var text = req.responseText;
					
					try {
						var json = JSON.parse(text);
					} catch (invalidJSON) {
						alert(scribefire_string("error_adbull", [ text ]));
						return;
					}

					callback(json, req.status);
				}
			};
			
			if (method === "POST" && argString) {
				req.send(argString);
			}
			else {
				req.send(null);
			}
		}
	},
	
	showCode : function (code) {
		$(document).trigger("close.facebox");
		
		$("#panel-adbull-code .adbull_code").text(code);
		$.facebox($("#panel-adbull-code"));
	},
	
	addSite : function (site) {
		var blog = SCRIBEFIRE.getBlog();
		
		if (blog.url === site.url && "adbull_code" in blog) {
			ADBULL.showCode(blog.adbull_code);
			return;
		}
		
		if (SCRIBEFIRE.prefs.getCharPref("adbull.username") && SCRIBEFIRE.prefs.getCharPref("adbull.password")) {
			var panel = $("#panel-adbull-add");
			
			var form = $("#form-adbull-add");
			form.find("input[name='url']").val(site.url);
			
			form.die("submit").live("submit", function (e) { e.preventDefault(); });
			
			$("#button-adbull-add-continue").die("click").live("click", function (e) {
				e.preventDefault();
				
				form.find("p").removeClass("error");
				form.find(".error-message").hide();
				
				$("#button-adbull-add-continue").addClass("busy");
				
				var args = form.serialize();
				args += "&username=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.username"));
				args += "&password=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.password"));
				
				ADBULL.api.request("POST", args, function (data, status) {
					if (!data.status) {
						$("#button-adbull-add-continue").removeClass("busy");
						
						$(form.find(".error-message")).text(data.msg).show();
						
						if (data.field) {
							form.find("input[name='" + data.field + "']").closest("p").addClass("error");
						}
					}
					else {
						var url = form.find("input[name='url']:first").val();
						
						var argString = "a=code";
						argString += "&username=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.username"));
						argString += "&password=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.password"));
						argString += "&url=" + encodeURIComponent(url);
						
						// Get the embed code for this website.
						ADBULL.api.request("POST", argString, function (data, status) {
							if (data.status) {
								$("#button-adbull-add-continue").removeClass("busy");

								var blog = SCRIBEFIRE.getBlog();

								if (blog.url === url) {
									blog.adbull_code = data.data;
									SCRIBEFIRE.setBlog(blog);
								}

								ADBULL.showCode(data.data);
							}
							else {
								alert(data.msg);
							}
						});
					}
				});
			});

			$.facebox(panel);
		}
		else {
			ADBULL.register(site);
		}
	},
	
	register : function (site) {
		var panel = $("#panel-adbull-register");
		
		var form = $("#form-adbull-register");
		
		if (site) {
			form.find("input[name='url']").val(site.url);
		}
		
		form.die("submit").live("submit", function (e) { e.preventDefault(); });
		
		$("#button-adbull-register-continue").die("click").live("click", function (e) {
			e.preventDefault();
			
			form.find("p").removeClass("error");
			form.find(".error-message").hide();
			
			$("#button-adbull-register-continue").addClass("busy");
			
			ADBULL.api.request("POST", form.serialize(), function (data, status) {
				if (!data.status) {
					$("#button-adbull-register-continue").removeClass("busy");

					form.find(".error-message").text(data.msg).show();
					
					if (data.field) {
						form.find("input[name='" + data.field + "']").closest("p").addClass("error");
					}
				}
				else {
					SCRIBEFIRE.prefs.setCharPref("adbull.username", form.find("input[name='username']").val());
					SCRIBEFIRE.prefs.setCharPref("adbull.password", form.find("input[name='password']").val());
					
					var argString = "a=code";
					argString += "&username=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.username"));
					argString += "&password=" + encodeURIComponent(SCRIBEFIRE.prefs.getCharPref("adbull.password"));
					argString += "&url=" + encodeURIComponent(form.find("input[name='url']:first").val());
					
					// Get the embed code for this website.
					ADBULL.api.request("POST", argString, function (data, status) {
						$("#button-adbull-register-continue").removeClass("busy");
						
						ADBULL.showCode(data.data);
					});
				}
			});
		});
		
		$.facebox(panel);
	}
};

$(document).ready(ADBULL.load);	