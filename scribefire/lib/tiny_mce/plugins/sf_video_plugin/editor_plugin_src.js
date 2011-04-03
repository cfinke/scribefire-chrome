/**
 * Video plugin for TinyMCE, taken from Wordpress, under the GPL license.
 */

(function() {
	var DOM = tinymce.DOM;

	tinymce.create('tinymce.plugins.ScribeFireVideo', {
		init : function(ed, url) {
			// Register commands
			ed.addCommand('SF_Video', function() {
				$.facebox($("#panel-video-insert"));
				
				// Reset the state of the panel.
				$("#textarea-video-insert").val("");
				$("#text-video-insert-url").val("");
				$("#error-video-insert").hide().text("");
				$("#button-video-insert").die("click").live("click", function (e) {
					e.preventDefault();
					
					$("#error-video-insert").hide().text("");
					
					if ($("#textarea-video-insert").val()) {
						ed.execCommand('mceInsertContent', 0, $("#textarea-video-insert").val());
						
						$(document).trigger("close.facebox");
					}
					else {
						$("#button-video-insert").addClass("busy");
						
						var url = $("#text-video-insert-url").val();
						
						if (url.indexOf("http://") == -1 && url.indexOf("https://") == -1) {
							url = "http://" + url;
						}
						
						$(document).oembed(url, {}, function (a, b) { 
							$("#button-video-insert").removeClass("busy");
							
							if (b) {
								ed.execCommand('mceInsertContent', 0, b.code);
								$(document).trigger("close.facebox");
							}
							else {
								$("#error-video-insert").text(scribefire_string("error_video_noEmbed")).show();
							}
						});
					}
				});
				
				$("#panel-video-insert").show();
				$("#text-video-insert-url").focus();
			});

			// Register buttons
			ed.addButton('video', {
				title : scribefire_string("action_video_add"),
				image : url + "/img/video.png",
				cmd : 'SF_Video'
			});
		},

		getInfo : function() {
			return {
				longname : 'ScribeFire Video Plugin',
				author : 'ScribeFire',
				authorurl : 'http://scribefire.com',
				infourl : 'http://scribefire.com',
				version : '1.0'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('sf_video_plugin', tinymce.plugins.ScribeFireVideo);
})();
