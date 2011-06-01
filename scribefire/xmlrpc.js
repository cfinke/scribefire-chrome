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
	
	/**
	 * Generates an XML-RPC request body.
	 * 
	 * @param {String} method The XML-RPC method name.
	 * @param {Array} [myParams] An array of parameters.
	 * @returns {String} A string describing the XML request body.
	 */
	makeXML : function(method, myParams) {
		var xml = '<methodCall>';
		xml += '<methodName><![CDATA['+method+']]></methodName>';
		
		if (myParams) {
			xml += '<params>';
			
			for (var i = 0, _len = myParams.length; i < _len; i++) {
				xml += '<param><value>'+XMLRPC_LIB.convertToXML(myParams[i])+'</value></param>';
			}
			
			xml += '</params>';
		}
		
		xml += '</methodCall>';
		
		return '<?xml version="1.0" encoding="UTF-8" ?>' + "\n" +  xml;
	},
	
	/**
	 * Converts a piece of data to an XML-RPC format XML node.
	 *
	 * @see http://en.wikipedia.org/wiki/XML-RPC
	 * @param {Mixed} myParams Some data.
	 * @returns {String} A string representation of the XML for sending myParams as an XML-RPC member.
	 */
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
				if (myParams == parseInt(myParams, 10)) {
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
			case "Boolean":
				paramTemp = "<boolean>" + myParams + "</boolean>";
			break;
			case "Date":
				var theDate = XMLRPC_LIB.iso8601Format(myParams).toString();
				
				var theErrorString = "NaNNaNNaNTNaN:NaN:NaNZ";
				
				if (theDate != theErrorString) {
					paramTemp = "<dateTime.iso8601>" + theDate + "</dateTime.iso8601>";
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
						tempVal += "<member><name><![CDATA[" + x + "]]></name><value>";
						
						if (myParams[x].constructor.name == 'String' && x === "bits") {
							tempVal += "<base64>" + myParams[x] + "</base64>";
						}
						else {
							tempVal += XMLRPC_LIB.convertToXML(myParams[x]);
						}
						
						tempVal += "</value></member>";
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
	
	/**
	 * Converts an XML-RPC response into a JavaScript object.
	 * 
	 * @param {Element} node The root element.
	 * @param {String} nodeName the name of the node, for when it's not available via node.
	 * @returns {Mixed} The Javascript object representation of the node.
	 */
	
	XMLToObject : function (node, nodeName) {
		var jNode = $(node);
		var node = jNode.get(0);
		
		switch (node.nodeName.toString().toLowerCase()) {
			case 'int':
			case 'i4':
				return parseInt(jNode.text(), 10);
			break;
			case 'boolean':
				return (parseInt(jNode.text(), 10) == 1);
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
	
	/**
	 * Converts a date object to an ISO 8601 format string.
	 * 
	 * @param {Date} date A date object.
	 * @returns {String} The string representation of date.
	 */
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
		
		datetime += "Z";
		
		return datetime;
	}
};