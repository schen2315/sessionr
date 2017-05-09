$(function() {
	var $save_existing = $("div.save-existing"),
	$save_new = $('div.save-new'),
	currentSession = null;

	init();
	$save_existing.on('click', function() {
		console.log("closing existing session");
		closeSession(currentSession, function() {});
	})
	$save_new.on('click', function() {
		closeSession(currentSession, function() {});
	});
	function init() {
		chrome.storage.local.get({settings: {}}, function(result) {
			var settings = result.settings;
			console.log(settings);
			console.log(settings.currentSession);
			if(settings.currentSession === null) {
				$save_existing.css('display', 'none');
			} else {
				currentSession = settings.currentSession;
				$save_existing.find("p").text(settings.currentSession);
			}
		});
	}

	function closeSession(id, callback) {
		/* call updateCurrentSession from eventPage */
		if(id === null) {
			//create new Session
			//set this session as current session
		}
		//update current Session
		//set current session to null
		var background = chrome.extension.getBackgroundPage();
		console.log(background);
		background.updateCurrentSession(true, function() {

			//set currentSession to null
			chrome.storage.local.get({settings: {}}, function(result) {
				console.log(result);
				resutlt = result.settings;
				result.currentSession = null;
				chrome.storage.local.set({settings: result}, function() {
					console.log("closing all windows");
					chrome.windows.getAll(function(result) {
					console.log(result);
						for(var i=0; i < result.length; i++) {
							chrome.windows.remove(result[i].id);
						}
					});
					chrome.windows.create();
				});
			});
		});
	}
});


