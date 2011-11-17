jQuery.fn.persist = function (property) {
	return this.each(function () {
		var id = $(this).attr("id");
		
		if (id) {
			if (platform == 'gecko') {
				// @see https://bugzilla.mozilla.org/show_bug.cgi?id=495747
				var persistence = SCRIBEFIRE.prefs.getJSONPref("persist", {});
			
				if (!(id in persistence)) {
					persistence[id] = {};
				}
			
				persistence[id][property] = $(this).attr(property);
			
				SCRIBEFIRE.prefs.setJSONPref("persist", persistence);
			
				return;
			}
			
			var url = document.location.href;
		
			var persistenceString = localStorage["persist"];

			var persistence = {};

			if (persistenceString) {
				try {
					persistence = JSON.parse(persistenceString);
				} catch (e) {
					persistence = {};
				}
			}
	
			if (!(id in persistence)) {
				persistence[id] = {};
			}
	
			persistence[id][property] = $(this).attr(property);
	
			localStorage["persist"] = JSON.stringify(persistence);
		}
	});
};

jQuery(document).ready(function () {
	if (platform == 'gecko') {
		// @see https://bugzilla.mozilla.org/show_bug.cgi?id=495747
		
		var persistence = SCRIBEFIRE.prefs.getJSONPref("persist", {});
		
		for (var id in persistence) {
			for (var property in persistence[id]) {
				try {
					$("#" + id).attr(property, persistence[id][property]);
				} catch (e) {
					//console.log(e);
				}
			}
		}
		
		return;
	}
	
	var url = document.location.href;
	
	var persistenceString = localStorage["persist"];
	
	var persistence = {};
	
	if (persistenceString) {
		try {
			persistence = JSON.parse(persistenceString);
		} catch (e) {
			persistence = {};
		}
	}
	
	//console.log(persistence);
	
	for (var id in persistence) {
		if (id) {
			for (var property in persistence[id]) {
				try {
					$("#" + id).attr(property, persistence[id][property]);
				} catch (e) {
					//console.log(e);
				}
			}
		}
	}
});