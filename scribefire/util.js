function pad(n) {
	if (n < 10) { return "0" + (n/1); }
	return n;
}

Array.prototype.unique = function () {
	for (var i = 0; i < this.length; i++) {
		for (var j = 0; j < this.length - 1; j++) {
			if (this[i] == this[i + j + 1]) {
				this.splice(i + j + 1, 1);
				j--;
			}
		}
	}
	
	return this;
};