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