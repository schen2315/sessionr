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
chrome.tabs.onCreated.addListener(updateCurrentSession);
chrome.tabs.onUpdated.addListener(updateCurrentSession);
chrome.tabs.onMoved.addListener(updateCurrentSession);
chrome.tabs.onAttached.addListener(updateCurrentSession);
chrome.tabs.onRemoved.addListener(updateCurrentSession);

chrome.windows.onRemoved.addListener(updateCurrentSession);
chrome.windows.onCreated.addListener(updateCurrentSession);

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
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
 				updateCurrentSession();
 			})
 		});
	});
}
/* 
	manual is boolean value telling function to bypass autoSave
	this should occur when a user saves their session using the popup
*/
function updateCurrentSession(manual) {
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
			/* if autoSave is true & currentSession is not null */
		});
	})
}



