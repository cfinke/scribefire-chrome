if (window.File && window.FileReader && window.FileList && window.Blob) {
	(function($) {
		var defaults;
		
		$.event.fix = (function(originalFix) {
			return function(event) {
				event = originalFix.apply(this, arguments);
				if (event.type.indexOf('copy') === 0 || event.type.indexOf('paste') === 0) {
					event.clipboardData = event.originalEvent.clipboardData;
				}
				return event;
			};
		})($.event.fix);
		
		defaults = {
			callback: $.noop,
			matchType: /image.*/
		};
		
		$.fn.pasteImageReader = function(options) {
			if (typeof options === "function") {
				options = {
					callback: options
				};
			}
			
			options = $.extend({}, defaults, options);
			
			return this.each(function() {
				var $this, element;
				element = this;
				$this = $(this);
				
				$this.bind('paste', function(event) {
					if (SCRIBEFIRE.getAPI().ui.upload) { 
						var clipboardData, found;
						found = false;
						clipboardData = event.clipboardData;
					
						Array.prototype.forEach.call(clipboardData.types, function(type, i) {
							var file, reader;
							if (found) {
								return;
							}
						
							if (!type.match(options.matchType)) {
								return;
							}
						
							file = clipboardData.items[i].getAsFile();
						
							var imageUploadText = scribefire_string("text_uploading_image");
						
							var loadingNotice = $("<p/>");
							loadingNotice.text(imageUploadText);
							var buttonContainer = $("<span/>");
							buttonContainer.addClass("buttons");
							loadingNotice.append(buttonContainer);
						
							$.facebox(loadingNotice);
						
							SCRIBEFIRE_UPLOAD.upload([ file ], SCRIBEFIRE.getAPI(), function (urls) {
								$(document).trigger("close.facebox");
							
								if (urls.length > 0) {
									var container = $("<div/>");
				
									for (var i = 0, _len = urls.length; i < _len; i++) {
										var img = $("<img/>");
										img.attr("src", urls[i]);
										container.append(img);
										container.append("\n\n");
									}
								
									var html = container.html();
								
									editor.insertContent(html);
								}
							}, function (error) {
								$(document).trigger("close.facebox");
							
								alert(error);
							});
						});
					}
				});
			});
		};
	})(jQuery);
}