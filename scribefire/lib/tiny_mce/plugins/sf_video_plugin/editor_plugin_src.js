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
				$("#video-insert-button").removeClass("busy");
				$("#button-video-insert").unbind("click");
				
				$("#button-video-insert").live("click", function (e) {
					e.preventDefault();
					
					$("#error-video-insert").hide().text("");
					
					if ($("#textarea-video-insert").val()) {
						ed.execCommand('mceInsertContent', 0, $("#textarea-video-insert").val());
						
						$(document).trigger("close.facebox");
					}
					else {
						$("#button-video-insert").addClass("busy");
						
						$(document).oembed($("#text-video-insert-url").val(), {}, function (a, b) { 
							if (b) {
								ed.execCommand('mceInsertContent', 0, b.code);
								$(document).trigger("close.facebox");
							}
							else {
								$("#button-video-insert").removeClass("busy");
								$("#error-video-insert").text("ScribeFire could not generate an embed code for this video URL. Please check the URL, or manually paste the embed code in the bottom box.").show();
							}
						});
					}
				});
				
				$("#panel-video-insert").show();
				$("#text-video-insert-url").focus();
			});

			// Register buttons
			ed.addButton('video', {
				title : 'Insert a video',
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
