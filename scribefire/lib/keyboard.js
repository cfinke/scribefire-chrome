$(document).ready(function () {
	// Pressing "Enter" in a field with accept="abc" attribute
	// is the same as clicking <button id="abc" />
	$("input[accept]").keydown(function (e) {
		if (e.keyCode == 13) {
			$("#" + $(this).attr("accept")).click();
		}
	});
	
	// Pressing "Escape" in a field with cancel="abc" attribute
	// is the same as clicking <button id="abc" />
	$("input[cancel]").keydown(function (e) {
		if (e.keyCode == 27) {
			$("#" + $(this).attr("cancel")).click();
		}
	});
});

// Enable multi-selection of checkboxes using the shift key
(function () {
	var checkboxStack = [null, null];

	$(document).ready(function () {
		$("input[type=checkbox]").live("click", function (e) {
			checkboxStack[1] = checkboxStack[0];
		
			$(this).attr("shiftClickIndex", "1");
		
			$("input[type=checkbox]").each(function (idx) {
				if ($(this).attr("shiftClickIndex")) {
					checkboxStack[0] = idx;
					$(this).removeAttr("shiftClickIndex");
				}
			});
		
			if (checkboxStack[1] !== null && e.shiftKey) {
				var start = checkboxStack[1];
				var end = checkboxStack[0];
			
				if (start > end) {
					end = start;
					start = checkboxStack[0];
				}
			
				var checked = this.checked;
			
				$("input[type=checkbox]").slice(start, end + 1).each(function () {
					this.checked = checked;
				});
			}
		});
	});
})();