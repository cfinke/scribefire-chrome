var SCRIBEFIRE_UPLOAD = {
	upload : function (files, blogAPI, callback, failureCallback) {
		var fileUrls = [];
		var idx = 0;
		
		function uploadNext() {
			if (idx == files.length) {
				callback(fileUrls);
				return;
			}
			
			var f = files[idx++];
			
			var reader = new FileReader();
			
			reader.onload = (function (theFile) {
				return function (e) {
					var binaryData = e.target.result;
					
					var fileType = theFile.type;
					var filename = theFile.name;
					
					if (!filename && !fileType) {
						fileType = "image/jpg";
					}
					
					if (!filename && fileType) {
						var filename = (new Date()).getTime() + "." + fileType.split("/").pop();
					}
					else if (!fileType && filename) {
						fileType = "image/";
						
						var extension = filename.split(".").pop();
						
						if (extension) {
							fileType += extension.toLowerCase();
						}
						else {
							fileType += "jpg";
						}
					}
					
					blogAPI.upload(
						filename,
						fileType,
						binaryData,
						function success (rv) {
							fileUrls.push(rv.url);
							
							uploadNext();
						},
						function (rv) {
							if (failureCallback) failureCallback(rv.msg);
						},
						theFile
					);
				};
			})(f);
			
			reader.readAsBinaryString(f);
		}
		
		uploadNext();
	}
};