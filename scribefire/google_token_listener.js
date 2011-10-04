var message = {
	oauth_token : null
};

try {
	message.oauth_token = document.getElementById("code").innerHTML;
} catch (e) { }

if (!message.oauth_token) {
	try {
		message.error = document.getElementById("access_denied").innerHTML;
	} catch (e) { }
}

chrome.extension.sendRequest( message, function (response) {
	// Nothing to do.
});