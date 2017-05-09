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
/* set current session */
function setSession(id, callback) {
	chrome.storage.local.get({[id]: {}}, function(session) {
		session = session[id];
		if(_.isEmpty(session)) {
			if(callback) callback(false);
			return;
		}
		chrome.storage.local.get({settings: {}}, function(result) {
			result = result.settings;
			result.currentSession = id;
			console.log(result);
			chrome.storage.local.set({settings: result}, function() {
				if(callback) callback(true);
			})
		});
	});
}
function getSettings(callback) {
	chrome.storage.local.get({settings: {}}, function(result) {
		result = result.settings;
		callback(result);
	})
}
/*
	callback true if successful
*/
function editSession(obj, callback) {
    /* things to edit are name, color, dateUpdated, windows, notes */
    /* save these to the chrome local storage */
    var id = obj.id
    var property = obj.property;
    var val = obj.val;
    console.log(id);
    // switch(property) {
    //     case 'notes':
    //     chrome.storage.local.get({[id]: {}}, function(result) {
    //         console.log(result[id]);
    //         result = result[id];
    //         result.notes = val;
    //         chrome.storage.local.set({[id]: result }, function(){
    //             console.log(result);
    //         })
    //     });
    //     case 'name':
    //     chrome.storage.local.get({[id]: {}}, function(result) {
    //         console.log(result[id]);
    //         result = result[id];
    //         result.name = val;
    //         chrome.storage.local.set({[id]: result }, function(){
    //             console.log(result);
    //         })
    //     });
    //     break;
    // }
    chrome.storage.local.get({[id]: {}}, function(result) {
        result = result[id];
        result[property] = val;
        console.log(result)
        chrome.storage.local.set({[id]: result }, function(){
            console.log(result);
            callback(true);
        })
    });
}
/* remove copy of this function from frontend */
function createSession(callback) {
    console.log("called createSession");
    // console.log(template);
    var new_id;
    //must be unique id
    makeUniqueId(function(result) {
        new_id = 'a' + result;
        /*handle runtime.lastError*/
        var new_session = {
            id: new_id,
            name: /*$el.find('div.grid-stack-item-content>div.item>input').val()*/ 'New Session',
            windows: [],
            notes: 'type stuff here ...',
            color: 'color_mist',
            created: new Date(),
            lastUpdate: new Date()
        }
        var obj = {
            [new_id]: new_session
        }
        chrome.storage.local.get({sessionids: []}, function(result) {
            sessionids = result.sessionids;
            sessionids.push(new_id);
            chrome.storage.local.set({sessionids: sessionids}, function() {
                chrome.storage.local.get({sessionids: []}, function(result) {
                    console.log(result.sessionids);
                });
            });
        })
        chrome.storage.local.set(obj, function() {
            if(chrome.runtime.lastError) console.log(chrome.runtime.lastError);
            // {new_id: {}} is wrong, you want {[new_id]: {}}
            chrome.storage.local.get({[new_id]: {}}, function(result) {
                //console.log(result[new_id]);
                //call callback with new_session parameter
                callback(new_session);
            });
        });
    });
} 
function _makeid() {
	var ID_LENGTH = 10;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var unique = false;
    for( var i=0; i < ID_LENGTH; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text
}
function makeUniqueId(callback) {
    var id = _makeid();
    chrome.storage.local.get({[id]: {}}, function(result) {
        console.log(_.isEmpty(result[id]));
        if(_.isEmpty(result[id])) {
            callback(id);
        } else makeUniqueId(callback);
    })
}
