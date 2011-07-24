/**
 * Plugin to toggle the table controls.
 */

(function() {
	var DOM = tinymce.DOM;

	tinymce.create('tinymce.plugins.TableToggle', {
		init : function(ed, url) {
			// Register commands
			function do_table_toggle() {
				if ($("#text-content_toolbar2").is(":visible")) {
					$("#text-content_toolbar2").hide();
					$("#text-content_tabletoggle").removeClass("mceButtonActive");
				}
				else {
					$("#text-content_toolbar2").show();
					$("#text-content_tabletoggle").addClass("mceButtonActive");
				}
			}
			
			ed.addCommand('Table_Toggle', do_table_toggle);

			// Register buttons
			ed.addButton('tabletoggle', {
				title : "Show/Hide Table Controls",
				image : url + "/img/tabletoggle.png",
				cmd : 'Table_Toggle'
			});
		},

		getInfo : function() {
			return {
				longname : 'Table Toggle Plugin',
				author : 'ScribeFire',
				authorurl : 'http://scribefire.com',
				infourl : 'http://scribefire.com',
				version : '1.0'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('tabletoggle', tinymce.plugins.TableToggle);
})();
