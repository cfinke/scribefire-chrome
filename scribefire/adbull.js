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
	
	register : function () {
		var registerPanel = $("#panel-adbull-register");
		
		var registerForm = $("#form-adbull-register");
		
		registerForm.die("submit").live("submit", function (e) { e.preventDefault(); });
		
		$("#button-adbull-register-continue").die("click").live("click", function (e) {
			e.preventDefault();
			
			$("#form-adbull-register p").removeClass("error");
			registerForm.find(".error-message").hide();
			
			ADBULL.api.request("POST", $("#form-adbull-register").serialize(), function (data, status) {
				if (!data.status) {
					registerForm.find(".error-message").text(data.msg).show();
					
					if (data.field) {
						$("#form-adbull-register input[name='" + data.field + "']").closest("p").addClass("error");
					}
				}
				else {
				}
			});
		});
		
		$.facebox(registerPanel);
		registerPanel.show();
	}
};

setTimeout(ADBULL.register, 2000);