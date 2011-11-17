if (document.location.href.indexOf("http://www.scribefire.com/oauth2") == 0) {
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
	
	safari.self.tab.dispatchMessage("oauth_token", JSON.stringify(message));
}
else if (document.location.href.indexOf("https://accounts.google.com/o/oauth2/approval") == 0) {
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
	
	safari.self.tab.dispatchMessage("oauth_token", JSON.stringify(message));
}

function handleMessage(msgEvent) {
	switch (msgEvent.name) {
		case "blog-this":
			if (msgEvent.message == "meta") {
				var response = document.title + "\t" + document.location.href + "\t";
				
				var selection = window.getSelection();
				var range = selection.getRangeAt(0);
				var newNode = document.createElement("p");
				newNode.appendChild(range.cloneContents());

				selection = newNode.innerHTML;
				
				response += selection;
				
				safari.self.tab.dispatchMessage("blog-this-meta", response);
			}
		break;
	}
}

safari.self.addEventListener("message", handleMessage, false);