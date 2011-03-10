var ADBULL = {
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
						alert("AdBull returned an unexpected response: " + text);
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
	
	addSite : function (site) {
		if (SCRIBEFIRE.prefs.getBoolPref("adbull.username")) {
			var panel = $("#panel-adbull-add");
			
			var form = $("#form-adbull-add");
			form.find("input[name='url']").val(site.url);
			
			form.die("submit").live("submit", function (e) { e.preventDefault(); });
			
			$("#button-adbull-register-continue").die("click").live("click", function (e) {
				e.preventDefault();
				
				form.find("p").removeClass("error");
				form.find(".error-message").hide();
				
				$("#button-adbull-register-continue").addClass("busy");
				
				var args = form.serializeArray();
				args.push({ "name" : "username", "value": SCRIBEFIRE.prefs.getBoolPref("adbull.username") });
				args.push({ "name" : "password", "value": SCRIBEFIRE.prefs.getBoolPref("adbull.password") });
				
				ADBULL.api.request("POST", args, function (data, status) {
					$("#button-adbull-register-continue").removeClass("busy");

					if (!data.status) {
						form.find(".error-message").text(data.msg).show();

						if (data.field) {
							form.find("input[name='" + data.field + "']").closest("p").addClass("error");
						}
					}
					else {
						alert(data.msg);

						SCRIBEFIRE.prefs.setCharPref("adbull.username", form.find("input[name='username']").val());
						SCRIBEFIRE.prefs.setCharPref("adbull.password", form.find("input[name='password']").val());
					}
				});
			});

			$.facebox(panel);
			panel.show();
			
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
				$("#button-adbull-register-continue").removeClass("busy");
				
				if (!data.status) {
					form.find(".error-message").text(data.msg).show();
					
					if (data.field) {
						form.find("input[name='" + data.field + "']").closest("p").addClass("error");
					}
				}
				else {
					SCRIBEFIRE.prefs.setCharPref("adbull.username", form.find("input[name='username']").val());
					SCRIBEFIRE.prefs.setCharPref("adbull.password", form.find("input[name='password']").val());
					
					// Get the embed code for this website.
				}
			});
		});
		
		$.facebox(panel);
		panel.show();
	}
};

$(document).ready(function () {
	$("#button-blog-adbull").live("click", function (e) {
		e.preventDefault();
		
		ADBULL.addSite(SCRIBEFIRE.getBlog());
	});
});