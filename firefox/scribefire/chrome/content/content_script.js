function watchForScribeFireGoogleToken(event) {
	var page = event.target;

	if (page.location.href.indexOf('http://www.scribefire.com/token.php') === 0) {
		sendAsyncMessage("ScribeFire:GoogleToken", { "token" : decodeURIComponent(page.location.href.split("token=")[1]) });
	}
}

addEventListener("DOMContentLoaded", watchForScribeFireGoogleToken, true);

function watchForScribeFireWordPressToken(event) {
	var page = event.target;

	if (page.location.href.indexOf('http://www.scribefire.com/oauth2') === 0) {
		var oauth_token = "";
		
		try {
			oauth_token = decodeURIComponent(page.location.href.split("code=")[1].split("&")[0]);
		} catch (e) { }
		
		var error = "";
		
		if (!oauth_token) {
			try {
				error = decodeURIComponent(page.location.href.split("error_description=")[1].split("&")[0]).replace(/\+/g, " ");
			} catch (e) { }
		}
		
		sendAsyncMessage("ScribeFire:OAuthToken", { "oauth_token" : oauth_token, "error" : error });
	}
}

addEventListener("DOMContentLoaded", watchForScribeFireWordPressToken, true);

function watchForScribeFireGoogleOAuthToken(event) {
	var page = event.target;

	if (page.location.href.indexOf('https://accounts.google.com/o/oauth2/approval') === 0) {
		var oauth_token = "";
		
		try {
			oauth_token = page.getElementById("code").innerHTML;
		} catch (e) { }
		
		var error = "";
		
		if (!oauth_token) {
			try {
				error = page.getElementById("access_denied").innerHTML;
			} catch (e) { }
		}
		
		sendAsyncMessage("ScribeFire:OAuthToken", { "oauth_token" : oauth_token, "error" : error });
	}
}

addEventListener("DOMContentLoaded", watchForScribeFireGoogleOAuthToken, true);