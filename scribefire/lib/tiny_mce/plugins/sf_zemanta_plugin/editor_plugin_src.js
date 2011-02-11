/**
 * Zemanta plugin for TinyMCE.
 */

(function() {
	var DOM = tinymce.DOM;

	tinymce.create('tinymce.plugins.Zemanta', {
		init : function(ed, url) {
			// Register commands
			ed.addCommand('SF_Zemanta', function() {
				// Do Zemanta things.
				$.facebox($("#panel-zemanta"));
				
				SF_ZEMANTA.getRelated("articles");
				
				$("#button-zemanta-insert").die("click");
				$("#button-zemanta-insert").live("click", function (e) {
					e.preventDefault();
					
					SF_ZEMANTA.updateArticlesInEditor();
					$(document).trigger("close.facebox");
				});
				
				$("#panel-zemanta").show();
			});

			// Register buttons
			ed.addButton('zemanta', {
				title : scribefire_string("action_zemanta_add"),
				image : url + "/img/zemanta.png",
				cmd : 'SF_Zemanta'
			});
		},

		getInfo : function() {
			return {
				longname : 'ScribeFire Zemanta Plugin',
				author : 'ScribeFire',
				authorurl : 'http://scribefire.com',
				infourl : 'http://scribefire.com',
				version : '1.0'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('sf_zemanta_plugin', tinymce.plugins.Zemanta);
})();
