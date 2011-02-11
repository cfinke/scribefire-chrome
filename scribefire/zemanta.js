var SF_ZEMANTA = {
	key : "28a6f3wecu85fa9g3svaypsq",
	prefs : null,
	rid : null,
	
	zprefs : null,
	signature : "",
	
	signatureInserted : false,
	
	lastImage : null,
	
	getAPIKey : function () {
		var storedKey = SCRIBEFIRE.prefs.getCharPref("zemanta.key");
		
		if (storedKey == SF_ZEMANTA.key) {
		    storedKey = "";
		    SCRIBEFIRE.prefs.setCharPref("zemanta.key", "");
		}
		
		if (!storedKey) {
			var postData = "method=zemanta.get_auth_token";
			postData += "&api_key="+SF_ZEMANTA.key;
			postData += "&partner_id=sf-000014";
			postData += "&format=json";
		    
		    try {
    			var req = new XMLHttpRequest();
    			req.open("POST", "http://api.zemanta.com/services/rest/0.0/", false);
    			req.send(postData);
	        
    			try {
    				var json = JSON.parse(req.responseText);
    				storedKey = json.api_key;
    				SCRIBEFIRE.prefs.setCharPref("zemanta.key", storedKey);
    			} catch (e) {
    			    storedKey = SF_ZEMANTA.key;
alert(e);
    			}

		    } catch (e) {
			alert(e);
		        storedKey = SF_ZEMANTA.key;
	        }
		}
		
		return storedKey;
	},
	
	getZemantaPrefs : function () {
		if (SF_ZEMANTA.zprefs) return SF_ZEMANTA.zprefs;
		
		var key = SF_ZEMANTA.getAPIKey();
		
		var postData = "method=zemanta.preferences";
		postData += "&api_key="+key;
		postData += "&interface=scribefire";
		postData += "&deployment=" + encodeURIComponent("ScribeFire " + SCRIBEFIRE.prefs.getCharPref("version"));
		postData += "&format=json";
	    
	    try {
    		var req = new XMLHttpRequest();
    		req.open("POST", "http://api.zemanta.com/services/rest/0.0/", false);
    		req.send(postData);
    		
			var json = JSON.parse(req.responseText);
			SF_ZEMANTA.zprefs = json;

			SCRIBEFIRE.prefs.setCharPref("zemanta.config_url", json.config_url);
    	} catch (e) {
    	    alert("An error occurred while retrieving your preferences from Zemanta:\n\n" + e);
	    }
		
		return SF_ZEMANTA.zprefs;
	},
	
	getSelectedContent : function () {
		var content = editor.val();
		content = content.replace(/<br\s*\/?>/g, "\n");
		content = content.replace(/<\/?p>/g, "\n");
		content = content.replace(/<[^>]+>/g, " ");
		
		return content;
	},
	
	getRelated : function (type, content) {
		/*
		if (!SF_ZEMANTA.prefs.getBoolPref("zemanta.tos")) {
	        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                    .getService(Components.interfaces.nsIPromptService);
            var check = {value: false};
            var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_OK + 
                prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_CANCEL +
                prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_IS_STRING +
                prompts.BUTTON_POS_0_DEFAULT;

            var button = prompts.confirmEx(window, 
                    performancingUI.getLocaleString("zemanta.tosTitle"),
                    performancingUI.getLocaleString("zemanta.tosAgree"),
                    flags, 
                    "", 
                    "", 
                    performancingUI.getLocaleString("zemanta.viewTos"),
                    null, 
                    check);
            
            if (button == 0) {
                SF_ZEMANTA.prefs.setBoolPref("zemanta.tos", true);
            }
            else if (button == 1) {
    			document.getElementById('zemanta-articles-button').removeAttribute("busy");
    			document.getElementById("image-button").removeAttribute("busy");
    			return;
            }
            else {
                _p.parent.getWebBrowser().selectedTab = _p.parent.getWebBrowser().addTab('http://www.zemanta.com/tos/');
                return;
            }
        }
*/
	    
		// @todo Zemanta prompt TOS
		
		if (!content) content = SF_ZEMANTA.getSelectedContent();
		
		var apiKey = SF_ZEMANTA.getAPIKey();
		var zprefs = SF_ZEMANTA.getZemantaPrefs();
		
		var req = new XMLHttpRequest();
		req.open("POST", "http://api.zemanta.com/services/rest/0.0/", true);
		req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		
		var postData = "pc=1&method=zemanta.suggest&api_key=" + apiKey + "&format=json&text=";
		postData += encodeURIComponent(content);
		
		postData += "&pixie="+encodeURIComponent(zprefs.pixie);
		postData += "&social_timestamp=" + encodeURIComponent(zprefs.social_timestamp);
		postData += "&flickr_user_id=" + encodeURIComponent(zprefs.flickr_user_id);
		postData += "&sourcefeed_ids=" + encodeURIComponent(zprefs.sourcefeed_ids);
		
		if (SF_ZEMANTA.rid) {
		    postData += "&post_rid=" + encodeURIComponent(SF_ZEMANTA.rid);
	    }
		
		switch (type) {
			case 'articles':
				postData += "&return_images=0";
			break;
			case 'images':
    			//var deck = _p.document.getElementById("zemanta-grid-deck");
    			//while (deck.firstChild) deck.removeChild(deck.firstChild);
			break;
		}
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				// Insert the articles.
				var json = JSON.parse(req.responseText);
				
				SF_ZEMANTA.signature = json.signature;
				
				if (type == "articles") {
					var articles = json.articles;
					
					if (articles && articles.length > 0) {
						var container = $("#zemanta-articles-container").html("");
						$("#zemanta-container").show();
						
						var utcMS = new Date().getTime();
						
						var j = 0;
						for (var i = articles.length - 1; i >= 0; i--) {
							var item = $("#zemanta-article-template").clone();
							item.removeAttr("id");
							item.show();
							
							item.data("reference", articles[i]);
							
							var cb = item.find("input:first");
							cb.attr("url", articles[i].url);
							cb.attr("title", articles[i].title);
							
							var desc = item.find("a:first");
							desc.text(articles[i].title);
							desc.attr("href", articles[i].url);
							
							var time = articles[i].published_datetime;
							var date = new Date();
							
							date.setFullYear(time.substr(0,4));
							date.setMonth(parseInt(time.substr(5,2), 10) - 1);
							date.setDate(time.substr(8,2));
							date.setHours(time.substr(11,2));
							date.setMinutes(time.substr(14,2));
							
							var articleMS = date.getTime();
							
							var difference = Math.floor((utcMS - articleMS) / 1000 / 60);
							var dateString = date.toString();
							
							var dateString = "";
							
							if (difference <= 1) {
								dateString += scribefire_string("time_ago_seconds");
							}
							else if (difference < 60) {
								dateString += scribefire_string("time_ago_minutes", difference);
							}
							else if (difference < 60 * 24) {
							    dateString += scribefire_string("time_ago_hours", Math.round(difference / 60));
							}
							else {
							    dateString += scribefire_string("time_ago_days", Math.round(difference /  60 / 24));
							}
							
							item.find("small:first").text(dateString);
							
							if (j < 4) {
								item.attr("active","true");
							}
							else {
								item.attr("active","false");
							}
							
							item.click(function (e) {
								if ($(this).attr("active") == "false") {
									$(this).attr("active", "true");
								}
								else {
									$(this).attr("active", "false");
								}
								
								//SCRIBEFIRE.updateZemantaArticles();
							});
							
							container.append(item);
							j++;
						}
						
						//_p.document.getElementById('zemanta-articles-refresh').removeAttribute("busy");
					//	SCRIBEFIRE.updateZemantaArticles();
					}
					else {
						alert(performancingUI.getLocaleString("zemanta.noArticles"));
					}
				} else if (type == "images") {
					/*
					var images = json.images;
					
					if (images && images.length > 0) {
						var deck = _p.document.getElementById("zemanta-grid-deck");
						var grid = _p.document.getElementById("zemanta-image-grid");
						
						_p.document.getElementById("sidebar-deck").selectedIndex = 1;
						_p.document.getElementById("sidebar-deck").style.width = "320px";
						_p.document.getElementById("sidebar-deck").collapsed = false;
						deck.selectedIndex = 0;
						
						for (var i = 0; i < images.length; i++) {
							if (i % 9 == 0) {
								var currentGrid = grid.cloneNode(true);
								currentGrid.style.display = "block";
								currentGrid.id = "";
								deck.appendChild(currentGrid);
							}
							
							if (i % 3 == 0) {
								var currentRow = _p.document.createElement("row");
								currentGrid.getElementsByTagName("rows")[0].appendChild(currentRow);
							}
							
							var currentImage = _p.document.createElement("image");
							currentImage.setAttribute("src", images[i].url_s);
							currentImage.setAttribute('onclick','var images = document.getElementById("zemanta-grid-deck").getElementsByTagName("image"); for (var i = 0; i < images.length; i++) { images[i].style.borderColor = "transparent"; } this.style.borderColor = "#FF9800"; performancingEditor.insertZemantaImage(this);');
							currentImage.setAttribute("tooltiptext", images[i].license);
							currentImage.reference = images[i];
							currentRow.appendChild(currentImage);
						}
						
						_p.document.getElementById('zemanta-image-pagelabel').value = "1 / " + Math.ceil(images.length / 9);
						_p.document.getElementById('zemanta-image-refresh').removeAttribute("busy");
					}
					else {
						alert(performancingUI.getLocaleString("zemanta.noImages"));
					}
					*/
				}
				
//				document.getElementById('zemanta-articles-button').removeAttribute("busy");
//				document.getElementById("image-button").removeAttribute("busy");
			}
		};
		
		req.send(postData);
	},
	
	updateArticlesInEditor : function () {
		var selectedArticles = $("#panel-zemanta").find("input[type='checkbox']:checked");
		
		var html = "";
		
		if (selectedArticles.length > 0) {
			var html = '<div class="zemanta-articles">'+scribefire_string('zemanta_related_articles')+'<ul class="zemanta-articles">';
			
			selectedArticles.each(function () {
				html += '<li><a href="'+$(this).attr('url')+'">'+$(this).attr("title")+'</a></li>';
			});
			
			html += '</ul></div>';
		}
		
		var val = $.trim(editor.val().replace(/<div class="zemanta-articles">[\s\S]*?<\/div>/mi, ""));
		
		if (html) {
			val += "\n\n" + html;
		}
		
		editor.val(val);
	},
	
	addUniversalTracker : function (callback) {
		var _p = parent;
		
		if (_p.wrappedJSObject) _p = _p.wrappedJSObject;
		
		if (!SF_ZEMANTA.signatureInserted && SCRIBEFIRE.prefs.getBoolPref("zemanta.track")) {
			var pixie = SCRIBEFIRE.prefs.getCharPref("zemanta.pixie");
			
			if (pixie) {
				SF_ZEMANTA.signature = pixie;
				SCRIBEFIRE.prefs.setCharPref("zemanta.pixie", "");
				
				_p.performancingEditor.insertZemantaSignature(callback);
			}
			else {
		        try {
		            var zemantaTimeout = null;
                
	    	        var apiKey = SF_ZEMANTA.getAPIKey();
	        		var zprefs = SF_ZEMANTA.getZemantaPrefs();
    		
	        		var postData = "method=zemanta.get_signature&api_key="+apiKey+"&pixie=301&format=json";
    		    
	        		var req = new XMLHttpRequest();
	        		req.open("POST", "http://api.zemanta.com/services/rest/0.0/", true);
        		
	        		req.onreadystatechange = function () {
	        		    try {
		        		    if (req.readyState == 4) {
		        		        if (req.status == 200) {
									if (zemantaTimeout) {
			        		            clearTimeout(zemantaTimeout);
            		            
		                        		var json = JSON.parse(req.responseText);
		                        		SF_ZEMANTA.signature = json.signature;
		                        		SF_ZEMANTA.rid = json.rid;

		                    		    var p = parent;

		                    		    if (p.wrappedJSObject) p = p.wrappedJSObject;

		                        		p.performancingEditor.insertZemantaSignature(callback);
									}
	            		        }
	        		        }
	        		    } catch (e) {
	        		        callback();
	    		        }
	    		    };
        		
	        		req.send(postData);
        		
	        		zemantaTimeout = setTimeout(function () {
						zemantaTimout = null;
	        		    req.abort();
	        		    callback();
	    		    }, 3000);
	        	} catch (e) {
	        	    callback();
	    	    }
			}
	    }
	    else {
	        callback();
	    }
    },

	fetchPixie : function () {
		if (this.prefs.getBoolPref("zemanta.track") && this.prefs.getCharPref("zemanta.pixie") == "") {
			var apiKey = SF_ZEMANTA.getAPIKey();

			var postData = "method=zemanta.get_signature&api_key="+apiKey+"&pixie=301&format=json";

			var req = new XMLHttpRequest();
			req.open("POST", "http://api.zemanta.com/services/rest/0.0/", true);

			req.onreadystatechange = function () {
				if (req.readyState == 4) {
					if (req.status == 200) {
						var json = JSON.parse(req.responseText);
						SCRIBEFIRE.prefs.setCharPref("zemanta.pixie", json.signature);
					}
				}
			};

			req.send(postData);
		}
	}
};