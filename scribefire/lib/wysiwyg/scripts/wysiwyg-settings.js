var wysiwyg_scribefire = new WYSIWYG.Settings();
wysiwyg_scribefire.ImagesDir = "lib/wysiwyg/images/";
wysiwyg_scribefire.PopupsDir = "lib/wysiwyg/popups/";
wysiwyg_scribefire.CSSFile = "lib/wysiwyg/styles/wysiwyg.css";
wysiwyg_scribefire.Width = "100%"; 
wysiwyg_scribefire.Height = "200px";

wysiwyg_scribefire.Toolbar[0] = [
		"viewSource", /* "preview", */
	"seperator", 
		"headings",
		"bold", "italic", "underline", "strikethrough", "subscript", "superscript", "forecolor", 
	"seperator", 
		"createlink", "insertimage", "inserttable",
	"seperator",
		"justifyleft", "justifycenter", "justifyright", 
	"seperator", 
		"unorderedlist", "orderedlist",
	"seperator",
		"outdent", "indent"
		 /*, "maximize" */
	 ];
wysiwyg_scribefire.Toolbar[1] = [];
wysiwyg_scribefire.Toolbar[2] = [];
wysiwyg_scribefire.StatusBarEnabled = false;
wysiwyg_scribefire.ReplaceLineBreaks = true;