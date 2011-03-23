$(document).ready(function () {
	var acceptButton = $(".accept-button:first");
	
	if (acceptButton.length > 0) {
		$("input").keydown(function (e) {
			if (e.which == 13) {
				e.preventDefault();
				e.stopPropagation();
				
				acceptButton.click();
			}
		});
	}
});