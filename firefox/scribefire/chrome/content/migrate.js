var SCRIBEFIRE_MIGRATION = {
	oldPrefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch).getBranch("performancing."),
	
	migrate : function () {
		if (SCRIBEFIRE.prefs.getBoolPref("migratedFinal")) {
			return;
		}
		
		SCRIBEFIRE.prefs.setBoolPref("migratedFinal", true);
		
		// Migrate preferences.
		try {
			SCRIBEFIRE.prefs.setCharPref("blogThisTemplate", SCRIBEFIRE_MIGRATION.oldPrefs.getComplexValue("blogThisTemplate", Components.interfaces.nsISupportsString).data);
		} catch (e) {
		}
		
		try {
			SCRIBEFIRE.prefs.setBoolPref("rtl", SCRIBEFIRE_MIGRATION.oldPrefs.getBoolPref("display.enablertl"));
		} catch (e) {
		}
		
		var blogs = [];
		var notes = [];
		
		var db = SCRIBEFIRE_MIGRATION.getDB();
		
		if (db) {
			if (db.tableExists("blogs_v1")) {
				var select = db.createStatement("SELECT `name`, `url`, `username`, `blogId` FROM `blogs_v1`");
				
				try {
					while (select.executeStep()) {
						var metadata = {
							"name" : select.getUTF8String(0),
							"url" : select.getUTF8String(1),
							"username" : select.getUTF8String(2),
							"password" : null,
							"blog_id" : select.getUTF8String(3) 
						};
						
						var passwordManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
						var logins = passwordManager.findLogins({}, "performancing:" + metadata.url, "chrome://scribefire", null);
						
						for (var i = 0; i < logins.length; i++) {
							if (logins[i].username == metadata.username) {
								metadata.password = logins[i].password;
							}
						}
						
						blogs.push(metadata);
					}
				} catch (e) {
					// alert(e);
				} finally {
					select.reset();
					select.finalize();
				}
			} 
			
			if (db.tableExists("notes_v1")) {
				var select = db.createStatement("SELECT `title`, `content`, `modified` FROM `notes_v1`");
				
				try {
					while (select.executeStep()) {
						var metadata = {
							"title" : select.getUTF8String(0),
							"content" : select.getUTF8String(1),
							"modified" : select.getInt64(2)
						};
						
						notes.push(metadata);
					}
				} catch (e) {
					// alert(e);
				} finally {
					select.reset();
					select.finalize();
				}
			}
			
			if (db.tableExists("state_v1")) {
				var select = db.createStatement("SELECT type,entryId,title,tags,categories,originalDateCreated,isDraft,content FROM state_v1");
				var noteId = 1;
				
				try {
					while (select.executeStep()) {
						var metadata = {
							"title" : select.getUTF8String(2),
							"content" : select.getUTF8String(7),
							"modified" : noteId++
						};
						
						notes.push(metadata);
					}
				} catch (e) {
				} finally {
					select.reset();
					select.finalize();
				}
			}
			
			SCRIBEFIRE_MIGRATION.closeDB(db);
		}
		
		SCRIBEFIRE.migrate(blogs, notes);
	},
	
	getDB : function () {
		var storageService = Components.classes["@mozilla.org/storage/service;1"]
		                        .getService(Components.interfaces.mozIStorageService);
		var dbFile = Components.classes["@mozilla.org/file/directory_service;1"]
			                     .getService(Components.interfaces.nsIProperties)
			                     .get("ProfD", Components.interfaces.nsIFile);
		dbFile.append("scribefire.sqlite");
		
		try {
			return storageService.openDatabase(dbFile);
		} catch (e) {
			// Corrupt or non-SQLite file.
			alert(e);
			return false;
		}
	},
	
	closeDB : function (db) {
		try { db.close(); } catch (e) { /* alert(e); */ }
	}
};

$(window).load(SCRIBEFIRE_MIGRATION.migrate);