var SF_ZEMANTA = {
	key : "28a6f3wecu85fa9g3svaypsq",
	prefs : null,
	rid : null,
	
	zprefs : null,
	signature : "",
	
	signatureInserted : false,
	
	lastImage : null,
	
	getAPIKey : function (callback) {
		var storedKey = SCRIBEFIRE.prefs.getCharPref("zemanta.key");
		
		if (storedKey == SF_ZEMANTA.key) {
			storedKey = "";
			SCRIBEFIRE.prefs.setCharPref("zemanta.key", "");
		}
		
		if (storedKey) {
			callback(storedKey);
		}
		else {
			var postData = "method=zemanta.get_auth_token";
			postData += "&api_key="+SF_ZEMANTA.key;
			postData += "&partner_id=sf-000014";
			postData += "&format=json";
			
			var req = new XMLHttpRequest();
			req.open("POST", "http://api.zemanta.com/services/rest/0.0/", true);
			
			req.onreadystatechange = function () {
				try {
					if (req.readyState == 4) {
						var json = JSON.parse(req.responseText);
						storedKey = json.api_key;
						SCRIBEFIRE.prefs.setCharPref("zemanta.key", storedKey);
						try {
							callback(storedKey);
						} catch (e) { alert(e); }
					}
				} catch (e) {
					callback(SF_ZEMANTA.key);
				}
			};
			
			req.send(postData);
		}
	},
	
	getZemantaPrefs : function (key, callback) {
		if (SF_ZEMANTA.zprefs) {
			callback(SF_ZEMANTA.zprefs);
			return;
		}
		
		var postData = "method=zemanta.preferences";
		postData += "&api_key="+key;
		postData += "&interface=scribefire";
		postData += "&deployment=" + encodeURIComponent("ScribeFire " + SCRIBEFIRE.prefs.getCharPref("version"));
		postData += "&format=json";
	
		var req = new XMLHttpRequest();
		req.open("POST", "http://api.zemanta.com/services/rest/0.0/", true);
		
		req.onreadystatechange = function () {
			try {
				if (req.readyState == 4) {
					var json = JSON.parse(req.responseText);
					SF_ZEMANTA.zprefs = json;
					
					SCRIBEFIRE.prefs.setCharPref("zemanta.config_url", json.config_url);
					try {
						callback(SF_ZEMANTA.zprefs);
					} catch (e) { 
						console.log(e);
					}
				}
			} catch (e) {
				callback(SF_ZEMANTA.zprefs);
			}
		};
		
		req.send(postData);
	},
	
	getSelectedContent : function () {
		var content = editor.val();
		content = content.replace(/<br\s*\/?>/g, "\n");
		content = content.replace(/<\/?p>/g, "\n");
		content = content.replace(/<[^>]+>/g, " ");
		
		return content;
	},
	
	getRelated : function (type, content) {
		function _getRelated() {
			if (!content) content = SF_ZEMANTA.getSelectedContent();
			
			$.facebox($("#panel-zemanta"));
			
			$("#panel-zemanta .loaded").hide();
			$("#panel-zemanta .no-results").hide();
			$("#panel-zemanta .zemanta-loading").show();
			
			$("#button-zemanta-insert").die("click");
			$("#button-zemanta-insert").live("click", function (e) {
				e.preventDefault();
				
				SF_ZEMANTA.updateArticlesInEditor();
				
				$(document).trigger("close.facebox");
			});
			
			var container = $("#zemanta-articles-container").html("");
			
			$("#panel-zemanta").show();
			
			SF_ZEMANTA.getAPIKey(function (apiKey) {
				SF_ZEMANTA.getZemantaPrefs(apiKey, function (zprefs) {
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
									$("#zemanta-container").show();
									
									var utcMS = new Date().getTime();
									
									var j = 0;
									
									for (var i = 0, _len = articles.length; i < _len; i++) {
										var item = $("#zemanta-article-template").clone();
										item.removeAttr("id");
										item.show();
										
										item.data("reference", articles[i]);

										var cb = item.find("input:first");
										cb.attr("url", articles[i].url);
										cb.attr("title", articles[i].title);
										
										if ("pc" in articles[i] || i < 4) {
											cb.attr("checked", "checked");
										}

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
										
										if ("pc" in articles[i]) {
											dateString += " " + scribefire_string("label_promoted");
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
										});

										container.append(item);
										j++;
									}
								}
								else {
									$("#panel-zemanta .no-results").show();
								}
								
								$("#panel-zemanta .zemanta-loading").hide();
								$("#panel-zemanta .no-results").hide();
								$("#panel-zemanta .loaded").show();
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
				});
			});
		}
		
		if (!SCRIBEFIRE.prefs.getBoolPref("zemanta.tos")) {
			$.facebox($("#panel-zemanta-tos"));
		
			$("#panel-zemanta-tos").show();
			$("#container-zemanta-tos").html('<iframe src="http://www.zemanta.com/tos" style="width: 100%;"/>');
		
			$("#button-zemanta-tos-accept").die("click");
			
			$("#button-zemanta-tos-accept").live("click", function () {
				$("#zemanta_pixie_reminder").hide();
				
				if (!$("#zemanta_pixie_yes").is(":checked") && !$("#zemanta_pixie_no").is(":checked")) {
					$("#zemanta_pixie_reminder").fadeIn();
				}
				else {
					$(document).trigger("close.facebox");
				
					if ($("#zemanta_pixie_yes").is(":checked")) {
						SCRIBEFIRE.prefs.setBoolPref("zemanta.track", true);
					}
					else {
						SCRIBEFIRE.prefs.setBoolPref("zemanta.track", false);
					}
				
					SCRIBEFIRE.prefs.setBoolPref("zemanta.tos", true);
				
					_getRelated();
				}
			});
		}
		else {
			_getRelated();
		}
	},
	
	updateArticlesInEditor : function () {
		var selectedArticles = $("#panel-zemanta").find("input[type='checkbox']:checked");
		
		var val = editor.val();
		val = val.replace(/<div class="zemanta-pixie">[\s\S]*?<\/div>/mig, "");
		val = val.replace(/<div class="zemanta-articles">[\s\S]*?<\/div>/mi, "");
		val = $.trim(val);
		editor.val(val);
		
		if (selectedArticles.length > 0) {
			var html = '<div class="zemanta-articles">'+scribefire_string('zemanta_related_articles')+'<ul class="zemanta-articles">';
			
			selectedArticles.each(function () {
				html += '<li><a href="'+$(this).attr('url')+'">'+$(this).attr("title")+'</a></li>';
			});
			
			html += '</ul>';
			
			function callback(trackerHTML, x) {
				html += trackerHTML;
				html += '</div>';
				
				val += "\n\n" + html;
				
				editor.val(val);
			}
			
			SF_ZEMANTA.getTrackerHTML(callback);
		}
	},
	
	getTrackerHTML : function (callback) {
		if (SCRIBEFIRE.prefs.getBoolPref("zemanta.track")) {
			var pixel = SCRIBEFIRE.prefs.getCharPref("zemanta.pixel");
			
			if (pixel) {
				SF_ZEMANTA.signature = pixel;
				SCRIBEFIRE.prefs.setCharPref("zemanta.pixel", "");
				callback(SF_ZEMANTA.signature, 1);
			}
			else {
				try {
					var zemantaTimeout = null;
					
					SF_ZEMANTA.getAPIKey(function (apiKey) {
						SF_ZEMANTA.getZemantaPrefs(apiKey, function (zprefs) {
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
												callback(SF_ZEMANTA.signature, 2);
											}
										}
									}
								} catch (e) {
									console.log(e);
									callback("", 3);
								}
							};
				
							req.send(postData);
				
							zemantaTimeout = setTimeout(function () {
								zemantaTimout = null;
								req.abort();
								callback("", 4);
							}, 3000);
						});
					});
				} catch (e) { callback("", 5); }
			}
		}
		else {
			callback("", 6);
		}
	}
};