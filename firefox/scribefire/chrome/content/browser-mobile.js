var SCRIBEFIRE_BROWSER = {
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.scribefire."),
	
	load : function () {
		messageManager.addMessageListener("ScribeFire:GoogleToken", SCRIBEFIRE_BROWSER.googleToken);
		messageManager.addMessageListener("ScribeFire:OAuthToken", SCRIBEFIRE_BROWSER.oauthToken);
		
		messageManager.loadFrameScript("chrome://scribefire-next/content/content_script.js", true);
	},
	
	googleToken : function (message) {
		var token = message.json.token;
		
		SCRIBEFIRE_BROWSER.prefs.setCharPref("google_token", token);
		
		// Close the token window.
		var tabs = Browser.tabs;
		
		for (var i = 0; i < tabs.length; i++) {
			var t = tabs[i];
			
			if (t.browser.currentURI.spec.indexOf("scribefire.com/token.php") != -1) {
				Browser.closeTab(t);
				break;
			}
		}
	},
	
	oauthToken : function (message) {
		var token = message.json.oauth_token;
		var error = message.json.error;
		
		SCRIBEFIRE_BROWSER.prefs.setCharPref("oauth_token_error", error);
		SCRIBEFIRE_BROWSER.prefs.setCharPref("oauth_token", token);
		
		// Close the token window.
		var tabs = Browser.tabs;
		
		for (var i = 0; i < tabs.length; i++) {
			var t = tabs[i];
			
			if (t.browser.currentURI.spec.indexOf(message.target.src) != -1) {
				Browser.closeTab(t);
				break;
			}
		}
	},
	
	getScribefireWindow : function () {
		var tabs = Browser.tabs;
		
		for (var i = 0; i < tabs.length; i++) {
			var t = tabs[i];
			
			if (t.browser.currentURI.spec == 'chrome://scribefire-next/content/scribefire.html') {
				return t;
			}
		}
		
		return false;
	},
	
	getScribefireObject : function () {
		var sfwindow = SCRIBEFIRE_BROWSER.getScribefireWindow();
		return sfwindow.browser.contentWindow.wrappedJSObject.SCRIBEFIRE;
	},
	
	open : function () {
		var sfwindow = SCRIBEFIRE_BROWSER.getScribefireWindow();
		
		if (!sfwindow) {
			// ScribeFire isn't open; let's open it.
			Browser.addTab("chrome://scribefire-next/content/scribefire.html", true);
		}
		else {
			Browser.selectedTab = sfwindow;
		}
		
		Browser.hideSidebars();
		Browser.hideTitlebar();
	},
	
	log : function (msg) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage(msg);
	}
};

addEventListener("load", SCRIBEFIRE_BROWSER.load, false);