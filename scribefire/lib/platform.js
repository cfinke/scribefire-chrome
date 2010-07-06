if (typeof Components != 'undefined') {
	var platform = "firefox";
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

document.documentElement.setAttribute("platform", platform);