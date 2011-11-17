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
 * @todo Write tests.
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

/**
 * Checks whether placeholder="" support exists here.
 * 
 * @todo Write tests.
 * @returns {Boolean}
 */
function supports_input_placeholder() {
	var i = document.createElement('input');
	return 'placeholder' in i;
}

/**
 * @see http://jacwright.com/projects/javascript/date_format/
 */
// Simulates PHP's date function
Date.prototype.format = function(format) {
    var returnStr = '';
    var replace = Date.replaceChars;
    for (var i = 0; i < format.length; i++) {       var curChar = format.charAt(i);         if (i - 1 >= 0 && format.charAt(i - 1) == "\\") {
            returnStr += curChar;
        }
        else if (replace[curChar]) {
            returnStr += replace[curChar].call(this);
        } else if (curChar != "\\"){
            returnStr += curChar;
        }
    }
    return returnStr;
};

Date.replaceChars = {
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Day
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    D: function() { return Date.replaceChars.shortDays[this.getDay()]; },
    j: function() { return this.getDate(); },
    l: function() { return Date.replaceChars.longDays[this.getDay()]; },
    N: function() { return this.getDay() + 1; },
    S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
    w: function() { return this.getDay(); },
    z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
    // Week
    W: function() { var d = new Date(this.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
    // Month
    F: function() { return Date.replaceChars.longMonths[this.getMonth()]; },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    M: function() { return Date.replaceChars.shortMonths[this.getMonth()]; },
    n: function() { return this.getMonth() + 1; },
    t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate() }, // Fixed now, gets #days of date
    // Year
    L: function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
    o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    // Time
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
    g: function() { return this.getHours() % 12 || 12; },
    G: function() { return this.getHours(); },
    h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
'0' : '')) + m; },
    // Timezone
    e: function() { return "Not Yet Supported"; },
    I: function() { return "Not Yet Supported"; },
    O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
    P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
    T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
    Z: function() { return -this.getTimezoneOffset() * 60; },
    // Full Date/Time
    c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
    r: function() { return this.toString(); },
    U: function() { return this.getTime() / 1000; }
};