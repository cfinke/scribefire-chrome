// ==UserScript==
// @include https://accounts.google.com/o/oauth2/approval*
// ==/UserScript==

window.addEventListener('DOMContentLoaded', function() {
	opera.postError("On Google page");
	var oauth_token = "";

	try {
		oauth_token = document.getElementById("code").innerHTML;
	} catch (e) { }

	var error = "";

	if (!oauth_token) {
		try {
			error = document.getElementById("access_denied").innerHTML;
		} catch (e) { }
	}
	
	opera.postError("token: " + oauth_token);
	opera.postError("error: " + error);
	opera.extension.postMessage(JSON.stringify({ subject : "oauth_token", oauth_token : oauth_token, error : error }));
	
	window.close();
}, false);