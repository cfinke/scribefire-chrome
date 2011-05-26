/**
 * Takes a number and returns a padded string.
 *
 * @param {Number} n The number to pad.
 * @return {String} n padded with a zero, if necessary.
 */
function pad(n) {
	// Remove any existing leading zeroes.
	n = n / 1;
	
	if (n <= 0) {
		return "00";
	}
	else if (n < 10) {
		return "0" + n;
	}
	else {
		return n.toString();
	}
}

/**
 * Removes any duplicate (strict) items in an array.
 * 
 * @return {Array} Returns itself, but also modifies the array directly.
 */
Array.prototype.unique = function () {
	for (var i = 0; i < this.length; i++) {
		for (var j = 0; j < this.length - 1; j++) {
			if (this[i] === this[i + j + 1]) {
				this.splice(i + j + 1, 1);
				j--;
			}
		}
	}
	
	return this;
};

/**
 * Resolves a relative path to an absolute path.
 *
 * @param {String} path The base path of the URL.
 * @param {String} href The path to resolve
 * @returns {String} The normalized path.
 */ 
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

/**
 * Tries to get XML from an XMLHttpRequest response via multiple methods.
 *
 * @todo Write tests.
 * @param {XMLHttpRequest} req A completed XMLHttpRequest.
 * @returns {Object|Boolean} Either an XMLDocument or false, if no 
 *          document could be found.
 */
function xmlFromRequest(req) {
	if (req.responseXML) {
		return req.responseXML;
	}
	else {
		if ("responseText" in req) {
			var text = $.trim(req.responseText);
		
			if (typeof DOMParser != 'undefined') {
				var parser = new DOMParser();
				var xml = parser.parseFromString(text, "text/xml");
				return xml;
			}
		}
	}
	
	return false;
}

/**
 * Returns the class name of the argument or undefined if it's not a valid JavaScript object.
 * 
 * @param {Object} An object.
 * @returns {String} The class name of the object.
 */
function getObjectClass(obj) {
	if (obj && obj.constructor && obj.constructor.toString) {
		var arr = obj.constructor.toString().match(/function\s*(\w+)/);
		
		if (arr && arr.length == 2) {
			return arr[1];
		}
	}

	return undefined;
}

function supports_input_placeholder() {
	var i = document.createElement('input');
	return 'placeholder' in i;
}