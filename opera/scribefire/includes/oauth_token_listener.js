// ==UserScript==
// @include http://www.scribefire.com/oauth2*
// ==/UserScript==

window.addEventListener('DOMContentLoaded', function() {
	var oauth_token = "";

	try {
		oauth_token = decodeURIComponent(document.location.href.split("code=")[1].split("&")[0]);
	} catch (e) { }

	var error = "";

	if (!oauth_token) {
		try {
			error = decodeURIComponent(document.location.href.split("error_description=")[1].split("&")[0]).replace(/\+/g, " ");
		} catch (e) { }
	}
	
	opera.extension.postMessage(JSON.stringify({ subject : "oauth_token", oauth_token : oauth_token, error : error }));
	
	window.close();
}, false);