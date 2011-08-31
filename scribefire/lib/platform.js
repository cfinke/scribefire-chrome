if (typeof opera != "undefined") {
	var platform = "presto";
	var browser = "opera";
}
else if (typeof Components != 'undefined') {
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

var bodies = document.getElementsByTagName("body");
var heads = document.getElementsByTagName("head");

if (bodies.length > 0 && heads.length > 0) {
	var body = bodies[0];
	var head = heads[0];
	var level = body.getAttribute("level") || "./";
	
	var style = document.createElement("link");
	style.setAttribute("rel", "stylesheet");
	style.setAttribute("type", "text/css");
	style.setAttribute("href", level + "skin/platform." + platform + ".css");
	head.appendChild(style);
	
	$("*[platform-only][platform-only!='" + platform + "']").hide();
	$("*[browser-only][browser-only!='" + browser + "']").hide();
}