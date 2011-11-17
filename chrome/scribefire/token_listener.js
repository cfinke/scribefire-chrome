var token = decodeURIComponent(document.location.href.split("token=")[1]);

chrome.extension.sendRequest( { token : token }, function (response) {
	// Nothing to do.
});