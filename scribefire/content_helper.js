chrome.extension.onRequest.addListener(
	function (request, sender, sendResponse) {
		if (request.greeting == "meta") {
			sendResponse( { url : document.location.href, title : document.title, selectedText : window.getSelection().toString() } );
		}
		else {
			sendResponse({});
		}
	}
);