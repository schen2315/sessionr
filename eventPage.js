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

	{	'unique id' or current: 
		{
			name: 'name',
			windows: [
				{'url', 'url', 'url'},
				{'url', 'url', 'url'}
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
			currentSession: "id" or NULL,
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
 			/* update */
 		});
	});
}
function updateCurrentSession() {
	console.log("time to update temporary session and/or currentSession");
	//if autosave is true then get currentSession, query tabs and save to storage
	chrome.windows.getAll({populate: true}, function(windows) {
		console.log(windows);
	})
}



