var SCRIBEFIRE_BROWSER = {
	prefs : {
		_prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.scribefire."),
		
		getCharPref : function (prefName) {
			try {
				return SCRIBEFIRE_BROWSER.prefs._prefs.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
			} catch (e) {
				return "";
			}
		},
		
		setCharPref : function (prefName, prefVal) {
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = prefVal;
			SCRIBEFIRE_BROWSER.prefs._prefs.setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
		}
	},
	
	getScribefireObject : function () {
		var win = SCRIBEFIRE_BROWSER.getScribefireWindow();
		
		if (win) {
			if ("SCRIBEFIRE" in win) {
				return win.SCRIBEFIRE;
			}
			else {
				return win.ownerDocument.getElementById("scribefire-split-screen-iframe").contentWindow.SCRIBEFIRE;
			}
		}
		
		return false;
	},
	
	getScribefireWindow : function () {
		var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var enumerator = windowMediator.getEnumerator("");

		while (enumerator.hasMoreElements()) {
			var win = enumerator.getNext();

			if (win.location == "chrome://scribefire-next/content/scribefire.html") {
				win.focus();
				return win;
			}
			else {
				var splitScreen = win.document.getElementById("scribefire-split-screen-iframe");

				if (splitScreen && splitScreen.getAttribute("src") == 'chrome://scribefire-next/content/scribefire.html') {
					var splitScreenContainer = win.document.getElementById("scribefire-split-screen-frame");

					if (splitScreenContainer.getAttribute("collapsed") != "true") {
						splitScreen.contentWindow.focus();
						return splitScreenContainer;
					}
				}
			}
		}
		
		var browserEnumerator = windowMediator.getEnumerator("navigator:browser");
		
		// Check all of the tabs for ScribeFire
		while (browserEnumerator.hasMoreElements()) {
			var browserInstance = browserEnumerator.getNext().gBrowser;
			
			// Check each tab of this browser instance
			var numTabs = browserInstance.tabContainer.childNodes.length;

			for(var index = 0; index < numTabs; index++) {
				if (browserInstance.getBrowserAtIndex) {
					var currentBrowser = browserInstance.getBrowserAtIndex(index);
					if (currentBrowser.currentURI.spec == 'chrome://scribefire-next/content/scribefire.html') {
						browserInstance.selectedTab = browserInstance.tabContainer.childNodes[index];

						if (currentBrowser.contentWindow.wrappedJSObject) {
							return currentBrowser.contentWindow.wrappedJSObject;
						}

						return currentBrowser.contentWindow;
					}
				}
			}
		}
		
		return false;
	},
	
	openTab : function () {
		if (SCRIBEFIRE_BROWSER.getScribefireWindow()) {
			SCRIBEFIRE_BROWSER.toggle();
		}
		
		gBrowser.selectedTab = gBrowser.addTab("chrome://scribefire-next/content/scribefire.html");
		
		if ("pinTab" in gBrowser) {
			// If no timeout is used, there is some strange overlap between the pinned tab and the first tab.
			setTimeout(function () { gBrowser.pinTab(gBrowser.selectedTab); }, 0);
		}
		
		SCRIBEFIRE_BROWSER.prefs.setCharPref("mode", "tab");
	},
	
	openWindow : function () {
		if (SCRIBEFIRE_BROWSER.getScribefireWindow()) {
			SCRIBEFIRE_BROWSER.toggle();
		}
		
		window.open("chrome://scribefire-next/content/scribefire.html", '_blank', 'chrome,centerscreen,resizable=yes,titlebar=yes,dependent=no');
		
		SCRIBEFIRE_BROWSER.prefs.setCharPref("mode", "window");
	},
	
	openSplitScreen : function () {
		if (SCRIBEFIRE_BROWSER.getScribefireWindow()) {
			SCRIBEFIRE_BROWSER.toggle();
		}
		
		var frame = document.getElementById("scribefire-split-screen-frame");
		var splitter = document.getElementById("scribefire-splitter");
		
		var appContent = document.getElementById("appcontent");
		appContent.appendChild(splitter);
		appContent.appendChild(frame);
		
		frame.setAttribute("collapsed", false);
		splitter.setAttribute("collapsed", false);
		
		document.getElementById("scribefire-split-screen-iframe").setAttribute("src", "chrome://scribefire-next/content/scribefire.html");
		
		SCRIBEFIRE_BROWSER.prefs.setCharPref("mode", "split-screen");
	},
	
	closeSplitScreen : function () {
		var frame = document.getElementById("scribefire-split-screen-frame");
		var splitter = document.getElementById("scribefire-splitter");
		
		frame.setAttribute("collapsed", true);
		splitter.setAttribute("collapsed", true);
		
		document.getElementById("scribefire-split-screen-iframe").setAttribute("src", "about:blank");
	},
	
	toggle : function () {
		var scribefire_view;
		
		if (scribefire_view = SCRIBEFIRE_BROWSER.getScribefireWindow()) {
			try {
				scribefire_view.close();
			} catch (splitScreen) {
				scribefire_view.ownerDocument.defaultView.SCRIBEFIRE_BROWSER.closeSplitScreen();
			}
		}
		else {
			var mode = SCRIBEFIRE_BROWSER.prefs.getCharPref("mode");
			
			if (mode == "tab") {
				SCRIBEFIRE_BROWSER.openTab();
			}
			else if (mode == "window") {
				SCRIBEFIRE_BROWSER.openWindow();
			}
			else {
				SCRIBEFIRE_BROWSER.openSplitScreen();
			}
		}
	},
	
	blogThis : function (event) {
		var blogThisData = {
			url : content.document.location.href,
			title : content.document.title,
			selection : ""
		};
		
		var menu = new nsContextMenu(document.getElementById("contentAreaContextMenu"), gBrowser);
		
		if (menu.isContentSelected) {
			blogThisData.selection = document.commandDispatcher.focusedWindow.getSelection();
			
			var range = blogThisData.selection.getRangeAt(0);
			var newNode = content.document.createElement("p");
			newNode.appendChild(range.cloneContents());
			
			blogThisData.selection = newNode.innerHTML;
		}
		else if (menu.onImage) {
			blogThisData.selection = '<img src="' + menu.target.wrappedJSObject.getAttribute("src") + '" />';
		}
		else if (menu.onLink) {
			blogThisData.selection = '<a href="' + menu.link + '">' + menu.target.wrappedJSObject.innerHTML + '</a>';
		}
		
		var scribefire_object;
		
		if (!(scribefire_object = SCRIBEFIRE_BROWSER.getScribefireObject())) {
			SCRIBEFIRE_BROWSER.prefs.setCharPref("blogThis", JSON.stringify(blogThisData));
			
			var mode = SCRIBEFIRE_BROWSER.prefs.getCharPref("mode");
			
			if (mode == "tab") {
				SCRIBEFIRE_BROWSER.openTab();
			}
			else if (mode == "window") {
				SCRIBEFIRE_BROWSER.openWindow();
			}
			else {
				SCRIBEFIRE_BROWSER.openSplitScreen();
			}
		}
		else {
			scribefire_object.blogThis(blogThisData.url, blogThisData.title, blogThisData.selection);
		}
	}
};