function pad(n) {
	if (n < 10) { return "0" + (n/1); }
	return n;
}

Array.prototype.unique = function () {
	for (var i = 0; i < this.length; i++) {
		for (var j = 0; j < this.length - 1; j++) {
			if (this[i] == this[i + j + 1]) {
				this.splice(i + j + 1, 1);
				j--;
			}
		}
	}
	
	return this;
};

function resolveHref(path, href) {
	if (href.indexOf("://") != -1) {
		return href;
	}
	else if (href.indexOf("//") === 0) {
		return path.split("//")[0] + href;
	}
	else if (href.indexOf("/") === 0) {
		return path.substring(0, path.indexOf("/", path.indexOf("://") + 3)) + href;
	}
	else {
		if (path.indexOf("/", path.indexOf("://") + 3) === -1) {
			return path + "/" + href;
		}
		else {
			return path.substring(0, path.lastIndexOf("/") + 1) + href;
		}
	}
}

function xmlFromRequest(req) {
	if (req.responseXML) {
		return req.responseXML;
	}
	else {
		var text = $.trim(req.responseText);
		
		if (typeof DOMParser != 'undefined') {
			var parser = new DOMParser();
			var xml = parser.parseFromString(text, "text/xml");
			return xml;
		}
		else {
			return false;
		}
	}
}

function supports_input_placeholder() {
	var i = document.createElement('input');
	return 'placeholder' in i;
}