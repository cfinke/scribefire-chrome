// ==UserScript==
// @include http://www.scribefire.com/token.php*
// ==/UserScript==

window.addEventListener('DOMContentLoaded', function() {
	var token = document.location.href.split("token=")[1];
	
	opera.extension.postMessage(JSON.stringify({ subject : "token", msg : token }));
	
	window.close();
}, false);