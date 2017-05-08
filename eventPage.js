/*
	Events:
	-on opening new webpage
	-on new window
	-on closing a webpage
	-on closing a window
	-on save session
*/

/*
	storage json format: 
	Eventually account save previous versions/ states of a session

	{	'unique id' or : provisionary
		{
			name: 'name',
			windows: [
				['url', 'url', 'url'],
				['url', 'url', 'url']
			],
			notes: 'text',
			color: 'hex color',
			created: 'date object',
			lastUpdate: 'date object'
		}
	}

	{ sessionids : ['id1', 'id2', 'id3']}

	{ 
		settings: {
			currentSession: "id" or NULL, -> NULL refers to no session currently open
			autoSave: true or false 
		}
	}
*/


/* 
	listen for:
	sessionCreate,
	sessionUpdate,
	sessionRemove -> make sure current Session is not the removed session or set to NULL
*/

/*
 	make event listening more sophisticated soon ...
 	such as update if a new url is present ...
*/
chrome.tabs.onCreated.addListener(updateCurrentSessionOnEvent);
chrome.tabs.onUpdated.addListener(updateCurrentSessionOnEvent);
chrome.tabs.onMoved.addListener(updateCurrentSessionOnEvent);
chrome.tabs.onAttached.addListener(updateCurrentSessionOnEvent);
chrome.tabs.onRemoved.addListener(updateCurrentSessionOnEvent);

chrome.windows.onRemoved.addListener(updateCurrentSessionOnEvent);
chrome.windows.onCreated.addListener(updateCurrentSessionOnEvent);

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);

function updateCurrentSessionOnEvent() {
	updateCurrentSession();
}
/*
	listen for:
	runtime.onSuspend
	onReset Settings
*/
/* init should also run onInstalled as well */
function init() {
	var settings = {
		currentSession : null,
		autoSave : false
	}
	chrome.storage.local.set({settings: settings}, function() {
		if(chrome.runtime.lastError) console.log(chrome.runtime.lastError);
 		chrome.storage.local.get({settings: {}}, function(result) {
 			result = result.settings;
 			console.log(result);
 			console.log("Initialized!");
 			//create provisionary
 			var provisionary = {
 				name: "provisionary",
 				windows: [],
 				notes: '',
 				color: "#90AFC5",
 				created: new Date(),
 				lastUpdate: new Date()
 			}
 			chrome.storage.local.set({provisionary: provisionary}, function() {
 				/* update current session entry in chrome.storage */
 				updateCurrentSession(false, function(session) {
 					console.log(session);
 				});
 			})
 		});
	});
}
/* 
	manual is boolean value telling function to bypass autoSave
	this should occur when a user saves their session using the popup
*/
function updateCurrentSession(manual = false, callback = undefined) {
	console.log("time to update temporary session and/or currentSession");
	//if autosave is true then get currentSession, query tabs and save to storage
	chrome.windows.getAll({populate: true}, function(result) {

		var windows = [];
		for(var i=0; i < result.length; i++) {
			windows.push(new Array());
			for(var j=0; j < result[i].tabs.length; j++) {
				if(result[i].tabs[j].url)  windows[i].push(result[i].tabs[j].url);
			}
		}
		/* update provisionary and/or currentSession */
		chrome.storage.local.get({provisionary: {}, settings: {}}, function(result) {
			var provisionary = result.provisionary;
			var settings = result.settings;
			var currentDate = new Date();
			/* if autoSave is true or manual & currentSession is not null */
			provisionary.windows = windows;
			provisionary.lastUpdate = currentDate;
			if((settings.autoSave || manual) && settings.currentSession !== null) {
				//update both provisionary and current
				chrome.storage.local.get({[settings.currentSession]: {}}, function(result) {
					result = result[settings.currentSession];
					result.windows = windows;
					result.lastUpdate = currentDate;
					chrome.storage.local.set({[settings.currentSession]: result, provisionary: provisionary}, function() {
						if(chrome.runtime.lastError) console.log(chrome.runtime.lastError);
						console.log("updated both provisionary and current session");
						if(callback) callback(result);
					})
				});
			} else {
				chrome.storage.local.set({provisionary: provisionary}, function() {
					if(chrome.runtime.lastError) console.log(chrome.runtime.lastError);
					console.log("updated provisionary");
					if(callback) callback(provisionary);
				})
			}

		});
	})
}



