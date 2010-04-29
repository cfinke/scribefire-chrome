function namedEntitiesToNumericEntities(text) {
	var entities = {
		"nbsp" : "160",
		"iexcl" : "161",
		"cent" : "162",
		"pound" : "163",
		"curren" : "164",
		"yen" : "165",
		"brvbar" : "166",
		"sect" : "167",
		"uml" : "168",
		"copy" : "169",
		"ordf" : "170",
		"laquo" : "171",
		"not" : "172",
		"shy" : "173",
		"reg" : "174",
		"macr" : "175",
		"deg" : "176",
		"plusmn" : "177",
		"sup2" : "178",
		"sup3" : "179",
		"acute" : "180",
		"micro" : "181",
		"para" : "182",
		"middot" : "183",
		"cedil" : "184",
		"sup1" : "185",
		"ordm" : "186",
		"raquo" : "187",
		"frac14" : "188",
		"frac12" : "189",
		"frac34" : "190",
		"iquest" : "191",
		"agrave" : "192",
		"aacute" : "193",
		"acirc" : "194",
		"atilde" : "195",
		"auml" : "196",
		"aring" : "197",
		"aelig" : "198",
		"ccedil" : "199",
		"egrave" : "200",
		"eacute" : "201",
		"ecirc" : "202",
		"euml" : "203",
		"igrave" : "204",
		"iacute" : "205",
		"icirc" : "206",
		"iuml" : "207",
		"eth" : "208",
		"ntilde" : "209",
		"ograve" : "210",
		"oacute" : "211",
		"ocirc" : "212",
		"otilde" : "213",
		"ouml" : "214",
		"times" : "215",
		"oslash" : "216",
		"ugrave" : "217",
		"uacute" : "218",
		"ucirc" : "219",
		"uuml" : "220",
		"yacute" : "221",
		"thorn" : "222",
		"szlig" : "223",
		"agrave" : "224",
		"aacute" : "225",
		"acirc" : "226",
		"atilde" : "227",
		"auml" : "228",
		"aring" : "229",
		"aelig" : "230",
		"ccedil" : "231",
		"egrave" : "232",
		"eacute" : "233",
		"ecirc" : "234",
		"euml" : "235",
		"igrave" : "236",
		"iacute" : "237",
		"icirc" : "238",
		"iuml" : "239",
		"eth" : "240",
		"ntilde" : "241",
		"ograve" : "242",
		"oacute" : "243",
		"ocirc" : "244",
		"otilde" : "245",
		"ouml" : "246",
		"divide" : "247",
		"oslash" : "248",
		"ugrave" : "249",
		"uacute" : "250",
		"ucirc" : "251",
		"uuml" : "252",
		"yacute" : "253",
		"thorn" : "254",
		"yuml" : "255",
		"fnof" : "402",
		"alpha" : "913",
		"beta" : "914",
		"gamma" : "915",
		"delta" : "916",
		"epsilon" : "917",
		"zeta" : "918",
		"eta" : "919",
		"theta" : "920",
		"iota" : "921",
		"kappa" : "922",
		"lambda" : "923",
		"mu" : "924",
		"nu" : "925",
		"xi" : "926",
		"omicron" : "927",
		"pi" : "928",
		"rho" : "929",
		"sigma" : "931",
		"tau" : "932",
		"upsilon" : "933",
		"phi" : "934",
		"chi" : "935",
		"psi" : "936",
		"omega" : "937",
		"alpha" : "945",
		"beta" : "946",
		"gamma" : "947",
		"delta" : "948",
		"epsilon" : "949",
		"zeta" : "950",
		"eta" : "951",
		"theta" : "952",
		"iota" : "953",
		"kappa" : "954",
		"lambda" : "955",
		"mu" : "956",
		"nu" : "957",
		"xi" : "958",
		"omicron" : "959",
		"pi" : "960",
		"rho" : "961",
		"sigmaf" : "962",
		"sigma" : "963",
		"tau" : "964",
		"upsilon" : "965",
		"phi" : "966",
		"chi" : "967",
		"psi" : "968",
		"omega" : "969",
		"thetasym" : "977",
		"upsih" : "978",
		"piv" : "982",
		"bull" : "8226",
		"hellip" : "8230",
		"prime" : "8242",
		"prime" : "8243",
		"oline" : "8254",
		"frasl" : "8260",
		"weierp" : "8472",
		"image" : "8465",
		"real" : "8476",
		"trade" : "8482",
		"alefsym" : "8501",
		"larr" : "8592",
		"uarr" : "8593",
		"rarr" : "8594",
		"darr" : "8595",
		"harr" : "8596",
		"crarr" : "8629",
		"larr" : "8656",
		"uarr" : "8657",
		"rarr" : "8658",
		"darr" : "8659",
		"harr" : "8660",
		"forall" : "8704",
		"part" : "8706",
		"exist" : "8707",
		"empty" : "8709",
		"nabla" : "8711",
		"isin" : "8712",
		"notin" : "8713",
		"ni" : "8715",
		"prod" : "8719",
		"sum" : "8721",
		"minus" : "8722",
		"lowast" : "8727",
		"radic" : "8730",
		"prop" : "8733",
		"infin" : "8734",
		"ang" : "8736",
		"and" : "8743",
		"or" : "8744",
		"cap" : "8745",
		"cup" : "8746",
		"int" : "8747",
		"there4" : "8756",
		"sim" : "8764",
		"cong" : "8773",
		"asymp" : "8776",
		"ne" : "8800",
		"equiv" : "8801",
		"le" : "8804",
		"ge" : "8805",
		"sub" : "8834",
		"sup" : "8835",
		"nsub" : "8836",
		"sube" : "8838",
		"supe" : "8839",
		"oplus" : "8853",
		"otimes" : "8855",
		"perp" : "8869",
		"sdot" : "8901",
		"lceil" : "8968",
		"rceil" : "8969",
		"lfloor" : "8970",
		"rfloor" : "8971",
		"lang" : "9001",
		"rang" : "9002",
		"loz" : "9674",
		"spades" : "9824",
		"clubs" : "9827",
		"hearts" : "9829",
		"diams" : "9830",
		"quot" : "34",
		"amp" : "38",
		"lt" : "60",
		"gt" : "62",
		"oelig" : "338",
		"oelig" : "339",
		"scaron" : "352",
		"scaron" : "353",
		"yuml" : "376",
		"circ" : "710",
		"tilde" : "732",
		"ensp" : "8194",
		"emsp" : "8195",
		"thinsp" : "8201",
		"zwnj" : "8204",
		"zwj" : "8205",
		"lrm" : "8206",
		"rlm" : "8207",
		"ndash" : "8211",
		"mdash" : "8212",
		"lsquo" : "8216",
		"rsquo" : "8217",
		"sbquo" : "8218",
		"ldquo" : "8220",
		"rdquo" : "8221",
		"bdquo" : "8222",
		"dagger" : "8224",
		"dagger" : "8225",
		"permil" : "8240",
		"lsaquo" : "8249",
		"rsaquo" : "8250",
		"euro" : "8364"
	};
	
	for (var i in entities) {
		var re = new RegExp("&" + i + ";", "ig");
		
		text = text.replace(re, "&#" + entities[i] + ";");
	}
	
	return text;
};

function pad(n) {
	if (n < 10) { return "0" + (n/1); }
	return n;
}

Date.prototype.date = function (format) {
	var timestamp = this;
    // http://kevin.vanzonneveld.net

    var that = this,
        jsdate, f, formatChr = /\\?([a-z])/gi, formatChrCb,
        // Keep this here (works, but for code commented-out
        // below for file size reasons)
        //, tal= [],
        _pad = function (n, c) {
            if ((n = n + "").length < c) {
                return new Array((++c) - n.length).join("0") + n;
            } else {
                return n;
            }
        },
        txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur",
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"],
        txt_ordin = {
            1: "st",
            2: "nd",
            3: "rd",
            21: "st", 
            22: "nd",
            23: "rd",
            31: "st"
        };
    formatChrCb = function (t, s) {
        return f[t] ? f[t]() : s;
    };
    f = {
    // Day
        d: function () { // Day of month w/leading 0; 01..31
            return _pad(f.j(), 2);
        },
        D: function () { // Shorthand day name; Mon...Sun
            return f.l().slice(0, 3);
        },
        j: function () { // Day of month; 1..31
            return jsdate.getDate();
        },
        l: function () { // Full day name; Monday...Sunday
            return txt_words[f.w()] + 'day';
        },
        N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
            return f.w() || 7;
        },
        S: function () { // Ordinal suffix for day of month; st, nd, rd, th
            return txt_ordin[f.j()] || 'th';
        },
        w: function () { // Day of week; 0[Sun]..6[Sat]
            return jsdate.getDay();
        },
        z: function () { // Day of year; 0..365
            var a = new Date(f.Y(), f.n() - 1, f.j()),
                b = new Date(f.Y(), 0, 1);
            return Math.round((a - b) / 864e5) + 1;
        },

    // Week
        W: function () { // ISO-8601 week number
            var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
                b = new Date(a.getFullYear(), 0, 4);
            return 1 + Math.round((a - b) / 864e5 / 7);
        },

    // Month
        F: function () { // Full month name; January...December
            return txt_words[6 + f.n()];
        },
        m: function () { // Month w/leading 0; 01...12
            return _pad(f.n(), 2);
        },
        M: function () { // Shorthand month name; Jan...Dec
            return f.F().slice(0, 3);
        },
        n: function () { // Month; 1...12
            return jsdate.getMonth() + 1;
        },
        t: function () { // Days in month; 28...31
            return (new Date(f.Y(), f.n(), 0)).getDate();
        },

    // Year
        L: function () { // Is leap year?; 0 or 1
            var y = f.Y(), a = y & 3, b = y % 4e2, c = y % 1e2;
            return 0 + (!a && (c || !b));
        },
        o: function () { // ISO-8601 year
            var n = f.n(), W = f.W(), Y = f.Y();
            return Y + (n === 12 && W < 9 ? -1 : n === 1 && W > 9);
        },
        Y: function () { // Full year; e.g. 1980...2010
            return jsdate.getFullYear();
        },
        y: function () { // Last two digits of year; 00...99
            return (f.Y() + "").slice(-2);
        },

    // Time
        a: function () { // am or pm
            return jsdate.getHours() > 11 ? "pm" : "am";
        },
        A: function () { // AM or PM
            return f.a().toUpperCase();
        },
        B: function () { // Swatch Internet time; 000..999
            var H = jsdate.getUTCHours() * 36e2, // Hours
                i = jsdate.getUTCMinutes() * 60, // Minutes
                s = jsdate.getUTCSeconds(); // Seconds
            return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
        },
        g: function () { // 12-Hours; 1..12
            return f.G() % 12 || 12;
        },
        G: function () { // 24-Hours; 0..23
            return jsdate.getHours();
        },
        h: function () { // 12-Hours w/leading 0; 01..12
            return _pad(f.g(), 2);
        },
        H: function () { // 24-Hours w/leading 0; 00..23
            return _pad(f.G(), 2);
        },
        i: function () { // Minutes w/leading 0; 00..59
            return _pad(jsdate.getMinutes(), 2);
        },
        s: function () { // Seconds w/leading 0; 00..59
            return _pad(jsdate.getSeconds(), 2);
        },
        u: function () { // Microseconds; 000000-999000
            return _pad(jsdate.getMilliseconds() * 1000, 6);
        },

    // Timezone
        e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
// The following works, but requires inclusion of the very large
// timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0;
            if (that.php_js && that.php_js.default_timezone) {
                return that.php_js.default_timezone;
            }
            if (!tal.length) {
                tal = that.timezone_abbreviations_list();
            }
            for (abbr in tal) {
                for (i = 0; i < tal[abbr].length; i++) {
                    os = -jsdate.getTimezoneOffset() * 60;
                    if (tal[abbr][i].offset === os) {
                        return tal[abbr][i].timezone_id;
                    }
                }
            }
*/
            return 'UTC';
        },
        I: function () { // DST observed?; 0 or 1
            // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
            // If they are not equal, then DST is observed.
            var a = new Date(f.Y(), 0), // Jan 1
                c = Date.UTC(f.Y(), 0), // Jan 1 UTC
                b = new Date(f.Y(), 6), // Jul 1
                d = Date.UTC(f.Y(), 6); // Jul 1 UTC
            return 0 + ((a - c) !== (b - d));
        },
        O: function () { // Difference to GMT in hour format; e.g. +0200
            var a = jsdate.getTimezoneOffset();
            return (a > 0 ? "-" : "+") + _pad(Math.abs(a / 60 * 100), 4);
        },
        P: function () { // Difference to GMT w/colon; e.g. +02:00
            var O = f.O();
            return (O.substr(0, 3) + ":" + O.substr(3, 2));
        },
        T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
// The following works, but requires inclusion of the very
// large timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0, default = 0;
            if (!tal.length) {
                tal = that.timezone_abbreviations_list();
            }
            if (that.php_js && that.php_js.default_timezone) {
                default = that.php_js.default_timezone;
                for (abbr in tal) {
                    for (i=0; i < tal[abbr].length; i++) {
                        if (tal[abbr][i].timezone_id === default) {
                            return abbr.toUpperCase();
                        }
                    }
                }
            }
            for (abbr in tal) {
                for (i = 0; i < tal[abbr].length; i++) {
                    os = -jsdate.getTimezoneOffset() * 60;
                    if (tal[abbr][i].offset === os) {
                        return abbr.toUpperCase();
                    }
                }
            }
*/
            return 'UTC';
        },
        Z: function () { // Timezone offset in seconds (-43200...50400)
            return -jsdate.getTimezoneOffset() * 60;
        },

    // Full Date/Time
        c: function () { // ISO-8601 date.
            return 'Y-m-d\\Th:i:sP'.replace(formatChr, formatChrCb);
        },
        r: function () { // RFC 2822
            return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
        },
        U: function () { // Seconds since UNIX epoch
            return Math.round(jsdate.getTime() / 1000);
        }
    };
    this.date = function (format, timestamp) {
        that = this;
        jsdate = (
            (typeof timestamp === 'undefined') ? new Date() : // Not provided
            (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
            new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
        );
        return format.replace(formatChr, formatChrCb);
    };
    return this.date(format, timestamp);
}