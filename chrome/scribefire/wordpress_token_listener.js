var message = {
	oauth_token : null
};

try {
	message.oauth_token = decodeURIComponent(document.location.href.split("code=")[1].split("&")[0]);
} catch (e) { }

if (!message.oauth_token) {
	try {
		message.error = decodeURIComponent(document.location.href.split("error_description=")[1].split("&")[0]).replace(/\+/g, " ");
	} catch (e) { }
}

chrome.extension.sendRequest( message, function (response) {
	// Nothing to do.
});