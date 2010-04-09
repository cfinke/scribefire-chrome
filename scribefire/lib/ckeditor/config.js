/*
Copyright (c) 2003-2010, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function (config) {
	config.baseHref = $("#list-blogs").val();
	
	// This is actually the default value.
	config.toolbar =
		[
			['Source'],
			['Bold','Italic','Underline','Strike'],
			['Subscript','Superscript'],
			['TextColor','BGColor'],
			['Cut','Copy','Paste',],
			['SpellChecker'],
			['Undo','Redo'],
			['Find','Replace'],
			['RemoveFormat'],
			['NumberedList','BulletedList','Outdent','Indent','Blockquote'],
			['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
			['Link','Image','Table','HorizontalRule','SpecialChar'],
			['Format','Font','FontSize'],
		];
	
	config.resize_enabled = false;
	config.removePlugins = 'elementspath';
	// config.enterMode = CKEDITOR.ENTER_BR;
};
