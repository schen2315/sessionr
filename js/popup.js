$(function() {
	var $save_existing = $("div.save-existing"),
	$save_new = $('div.save-new'),
	$new_name = $('div.new-name'),
	$new_nameSubmit = $new_name.find("div.input-group > span");
	$new_nameInput = $new_name.find("div.input-group");
	newSessionName = '';	/* use this variable when creating a new session */
	currentSession = null;

	init();
	$save_existing.on('click', function() {
		console.log("closing existing session");
		/*get newSessionName */
		closeSession(currentSession, function() {});
	})
	$save_new.on('click', function() {
		$save_new.css('display', 'none');
		$new_name.css('display', 'block').find('input').focus();
	});
	$new_nameSubmit.on('click', submitNewName);
	$new_nameInput.keyup(function(e) {
		 var code = e.keyCode || e.which;
		 if(code == 13) { //Enter keycode
		 	submitNewName();
		 }
	})
	function init() {
		chrome.storage.local.get({settings: {}}, function(result) {
			console.log(result);
			var settings = result.settings;
			console.log(settings);
			console.log(settings.currentSession);
			if(settings.currentSession === null) {
				$save_existing.css('display', 'none');
			} else {
				currentSession = settings.currentSession;
				chrome.storage.local.get({[settings.currentSession]: {}}, function(result) {
					result = result[settings.currentSession];
					$save_existing.find("p").text(result.name);
				});
			}
		});
	}
	/*eventually handle callback*/
	function closeSession(id, callback) {
		/* call updateCurrentSession from eventPage */
		console.log(background);
		var background = chrome.extension.getBackgroundPage();
		if(id === null) {
			//create new Session w/ newSessionName
			//set this session as current session
			//update current Session
			//set current session to null
			background.createSession(function(session) {
				background.setSession(session.id, function(result) {
					if(result) {
						background.editSession({id: session.id, property: 'name', val: newSessionName}, function(result) {
							if(result) _closeSession();	
						});
					}
					/* handle error */
				});
			});
		} else {
			_closeSession();
		}
		
	}
	/* closeSession helper function */
	function _closeSession() {
		var background = chrome.extension.getBackgroundPage();
		background.updateCurrentSession(true, function() {
			//set currentSession to null
			chrome.storage.local.get({settings: {}}, function(result) {
				console.log(result);
				result = result.settings;
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
	function submitNewName() {
		newSessionName = $new_name.find('input').val();
		if(newSessionName != '') closeSession(null, function() {});
	}
});



