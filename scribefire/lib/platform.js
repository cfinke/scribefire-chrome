if (typeof Components != 'undefined') {
	var platform = "gecko";
	var browser = 'firefox';
}
else {
	var platform = "webkit";

	if (typeof chrome != 'undefined') {
		var browser = 'chrome';
	}
	else {
		var browser = 'safari';
	}
}

if (platform == 'gecko' && typeof console == 'undefined') {
	var console = {
		log : function (msg) {
			var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
			consoleService.logStringMessage(msg);
		}
	};
}

document.documentElement.setAttribute("platform", platform);