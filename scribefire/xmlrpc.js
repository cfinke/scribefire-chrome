var XMLRPC_LIB = {
	doCommand : function (apiUrl, xml, callback, callbackFailure) {
		var req = new XMLHttpRequest();
		req.open("POST", apiUrl, true);
		req.setRequestHeader("Content-Type", "text/xml");
		req.overrideMimeType("text/xml");
		
		req.onreadystatechange = function () {
			if (req.readyState == 4) {
				//console.log("Receiving: " + req.status + " " + req.responseText);
				//console.log(req.responseXML);
				
				var xml = xmlFromRequest(req);
				
				if (!xml) {
					var text = req.responseText.replace(/<\?xml[^>]+>/, "").replace(/^\s+/g, "");
					xml = $(text);
				}
				
				if (!xml) {
					// Improper encoding or some other server-side problem results in no XML response.
					if (req.responseText) {
						if (req.responseText.indexOf("faultString") != -1) {
							var faultCode = -1;
							
							if (req.responseText.indexOf("faultCode") != -1) {
								var start = req.responseText.indexOf("<int>", req.responseText.indexOf("faultCode")) + 5;
								faultCode = req.responseText.substr(start, req.responseText.indexOf("<", start) - start);
							}
							
							var start = req.responseText.indexOf("<string>", req.responseText.indexOf("faultString")) + 8;
							var faultString = req.responseText.substr(start, req.responseText.indexOf("<", start) - start);
							callbackFailure(faultCode, faultString);
							
							return;
						}
					}
					
					callbackFailure(req.status, "The blog returned an invalid XML response.");
				}
				else {
					var jDoc = $(xml);
					
					if (req.status < 300 && (jDoc.find("fault").length == 0)) {
						var returnValue = jDoc.find("value:first > *:first");
					
						if (returnValue.length == 0) {
							// Instead of <value><string>data</string></value>, it's
							// <value>data</value>
						
							returnValueText = jDoc.find("value:first").text();
							returnValue = $("<string />");
							returnValue.html(returnValueText);
						}
						
						var parsedObject = XMLRPC_LIB.XMLToObject(returnValue);
					
						callback(parsedObject);
					}
					else {
						if (!jDoc.find("fault:first > value:first > *")[0]) {
							if (callbackFailure) {
								switch (req.status) {
									case 412:
										var error = scribefire_string("error_api_code412");
									break;
									default:
										var error = scribefire_string("error_api_noMessage", req.status);
									break;
								}
							
								callbackFailure(req.status, error);
							}
						}
						else {
							var parsedObject = XMLRPC_LIB.XMLToObject(jDoc.find("fault:first > value:first > *:first"));
							
							if (callbackFailure) {
								callbackFailure(parsedObject.faultCode, parsedObject.faultString);
							}
						}
					}
				}
			}
		};
		
		//console.log("Sending: " + xml);
		
		req.send(xml);
	},
	
	makeXML : function(method, myParams, isAtom) {
		if (!isAtom) {
			var xml = '<methodCall>';
			xml += '<methodName><![CDATA['+method+']]></methodName>';
			xml += '<params>';
			
			// i->0 is the URL
			for (var i = 1; i < myParams.length; i++){
				xml += '<param><value>'+XMLRPC_LIB.convertToXML(myParams[i])+'</value></param>';
			}
			
			xml += '</params>';
			xml += '</methodCall>';
			
			var theBlogCharType = "UTF-8";
			return '<?xml version="1.0" encoding="' + theBlogCharType + '" ?>' + "\n" +  xml;
		}
		
		return 0;
	},
	
	convertToXML : function (myParams) {
		try {
			var paramType = myParams.constructor.name;
		} catch (e) {
			//console.log(myParams);
			throw e;
		}
		
		var paramTemp = null;
		
		switch (paramType) {
			case "Number":
				if (myParams == parseInt(myParams)) {
					paramTemp = "<int>" + myParams + "</int>";
				}
				else {
					paramTemp = "<double>" + myParams + "</double>";
				}
			break;
			case "String":
				if (myParams.toString() == 'bool1') {
					paramTemp = "<boolean>1</boolean>";
				}
				else if (myParams.toString() == 'bool0'){
					paramTemp = "<boolean>0</boolean>";
				}
				else {
					paramTemp = "<string><![CDATA[" + myParams + "]]></string>";
				}
			break;
			case "Boolean"://0,1, true, false
				paramTemp = "<boolean>" + myParams + "</boolean>";
			break;
			case "Date":
				var theDate = XMLRPC_LIB.iso8601Format(myParams).toString();
				var theErrorString = "NaNNaNNaNTNaN:NaN:NaN";
				if (theDate != theErrorString) {
					paramTemp = "<dateTime.iso8601>" + theDate + "Z</dateTime.iso8601>";
				}
				else {
					paramTemp = "<dateTime.iso8601></dateTime.iso8601>";
				}
			break;
			case "Array":
				var tempVal = "<array><data>";
				
				for (var i = 0; i < myParams.length; i++) {
					tempVal += "<value>" + XMLRPC_LIB.convertToXML(myParams[i]) + "</value>";
				}
				
				tempVal += "</data></array>";
				paramTemp = tempVal;
			break;
			case "Object":
				var tempVal = "<struct>";
				
				for (x in myParams) {
					if (typeof myParams[x] != 'undefined') {
						if (myParams[x].constructor.name == 'String') {
							if (x == "bits") {
								tempVal += "<member><name>" + x + "</name><value><base64>" +myParams[x] + "</base64></value></member>";
							}
							else{
								tempVal += "<member><name>" + x + "</name><value>" +XMLRPC_LIB.convertToXML(myParams[x]) + "</value></member>";
							}
						}
						else if (myParams[x].constructor.name == 'Date') {
							var theDate = XMLRPC_LIB.iso8601Format(myParams[x]).toString();
							var theErrorString = "NaNNaNNaNTNaN:NaN:NaN";
							if (theDate != theErrorString) {
								tempVal += "<member><name>" + x + "</name><value><dateTime.iso8601>" + theDate + "Z</dateTime.iso8601></value></member>";
							}
							else {
								tempVal += "<member><name>" + x + "</name><value><dateTime.iso8601></dateTime.iso8601></value></member>";
							}
						}
						else if (myParams[x].constructor.name == 'Number') {
							if (myParams[x] == parseInt(myParams[x])) {
								tempVal += "<member><name>" + x + "</name><value><int>"  +XMLRPC_LIB.convertToXML(myParams[x]) + "</int></value></member>";
							}
							else {
								tempVal += "<member><name>" + x + "</name><value><double>" + XMLRPC_LIB.convertToXML(myParams[x]) + "</double></value></member>";
							}
						}
						else {
							tempVal += "<member><name>" + x + "</name><value>" +XMLRPC_LIB.convertToXML(myParams[x]) + "</value></member>";
						}
					}
				}
				
				tempVal += "</struct>";
				paramTemp = tempVal;
			break;
			default:
				paramTemp = "<![CDATA[" + myParams + "]]>";
			break;
		}
		
		return paramTemp;
	},
	
	XMLToObject : function (node, nodeName) {
		var jNode = $(node);
		var node = jNode.get(0);
		
		switch (node.nodeName.toString().toLowerCase()) {
			case 'int':
			case 'i4':
				return parseInt(jNode.text());
			break;
			case 'boolean':
				return (parseInt(jNode.text()) == 1);
			break;
			case 'string':
				return (jNode.text());
			break;
			case 'double':
				return parseFloat(jNode.text());
			break;
			case 'datetime.iso8601':
				var val = jNode.text().replace(/^\s+|\s+$/g, "");
				
				if (val.match(/z/i) || (nodeName && (nodeName == 'date_created_gmt' || nodeName == 'dateCreated'))) {
					val = val.replace(/\-/gi, "");
					val = val.replace(/\z/gi, "");
					var dateutc = Date.UTC(val.slice(0, 4), val.slice(4, 6) - 1, 
					val.slice(6, 8), val.slice(9, 11), val.slice(12, 14), 
					val.slice(15,17));
					return new Date(dateutc);
				}
				else {
					// Check for a timezone offset
					var possibleOffset = val.substr(-6);
					var hasTimezone = false;
					var minutes = null;
					
					if (possibleOffset.charAt(0) == "-" || possibleOffset.charAt(0) == "+") {
						var hours = parseInt(possibleOffset.substr(1,2), 10);
						var minutes = (hours * 60) + parseInt(possibleOffset.substr(4,2), 10);
						
						if (possibleOffset.charAt(0) == "+") {
							minutes *= -1;
						}
						
						hasTimezone = true;
					}
					
					val = val.replace(/\-/gi, "");
					
					var dateutc =  Date.UTC(
						val.slice(0, 4), 
						val.slice(4, 6) - 1, 
						val.slice(6, 8), 
						val.slice(9, 11), 
						val.slice(12, 14), 
						val.slice(15,17));
						
					dateutc = new Date(dateutc);
					
					if (!hasTimezone) {
						minutes = new Date(dateutc).getTimezoneOffset();
					}
					
					var offsetDate = dateutc.getTime();
					offsetDate += (1000 * 60 * minutes);
					dateutc.setTime(offsetDate);
					return dateutc;
				}
			break;
			case 'array':
				var arr = new Array();
				
				jNode.find("data:first > value").children().each(function () {
					arr.push(XMLRPC_LIB.XMLToObject($(this)));
				});
				
				return arr;
			break;
			case 'struct':
				var struct = new Object();
				
				jNode.children().each(function () {
					var keyName = $(this).find("name:first").text();
					var nodeValue = $(this).find("value:first > *:first");
					
					if (nodeValue.length == 0) {
						// Instead of <value><string>data</string></value>, it's
						// <value>data</value>
						
						nodeText = $(this).find("value:first").text();
						nodeValue = $("<string />");
						nodeValue.html(nodeText);
					}
					
					struct[ keyName ] = 
						XMLRPC_LIB.XMLToObject(
							nodeValue,
							keyName
						);
				});
				
				return struct;
			break;
			case 'base64':
				return (atob(jNode.text()));
			break;
			default:
				//console.log("Error parsing XML: " + node.nodeName.toString());
			break;
		}
	},
	
	iso8601Format : function (date) {
		var datetime = date.getUTCFullYear();
		var month = String(date.getUTCMonth() + 1);
		datetime += (month.length == 1 ?  '0' + month : month);
		
		var day = date.getUTCDate();
		datetime += (day < 10 ? '0' + day : day);
		
		datetime += 'T';
		
		var hour = date.getUTCHours();
		datetime += (hour < 10 ? '0' + hour : hour) + ':';
		var minutes = date.getUTCMinutes();
		datetime += (minutes < 10 ? '0' + minutes : minutes) + ':';
		var seconds = date.getUTCSeconds();
		datetime += (seconds < 10 ? '0' + seconds : seconds);
		
		return datetime;
	},
	
	makePingXML : function (theMethodName, theBlogName, theBlogURL) {
		var thePingXML = '<methodCall><methodName><![CDATA['+theMethodName+']]></methodName><params><param><value><![CDATA['+theBlogName+']]></value></param><param><value><![CDATA['+theBlogURL+']]></value></param></params></methodCall>';
		return '<?xml version="1.0"?>' + "\n" + thePingXML;
	}
};