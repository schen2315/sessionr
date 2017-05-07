$(function () {
    /*cache*/
    //var template = '<div class="grid-stack-item block color_mist" data-gs-x="0" data-gs-y="0" data-gs-width="3" data-gs-height="1"><div class="grid-stack-item-content"></div></div>'
    var ID_LENGTH = 10;
    var template = $('#template').html();
    var gridstack_options = {
        cellHeight: 80,
        disableResize: true,
        width: 3,
        animate: true,
        disableOneColumnMode: true
    }
    var $divplus = $('div.plus'),
        $divcog = $('div.cog'),
        $divnotes = $('div.notes'),
        $grid = $('.grid-stack');
    var typeTO;
    var typeTimer = 800;
    var currentSession;
    /*register events*/
    $divplus.on('click', createSession);
    $grid.on('click', 'div.block', function() {
        $el = $(this);
        currentSession = $el.data('id');
        $grid.find('div.block').css('left', '0px');
        $el.animate({left: '20px'}, 5, 'linear');
        $divnotes.animate({width: '400px'}, 'fast', function() {
            /*get the el's name here*/
            $divnotes.find('span').text($el.data('id'));
        });
        chrome.storage.local.get({[currentSession]: {}}, function(result) {
            result = result[currentSession];
            $divnotes.find('textarea').val(result.notes);    
        });
    })
    $divnotes.keyup(function() { 
        var obj = {
            property: 'notes',
            val: $divnotes.find('textarea').val()
        }
        hasTypeCompleted(editSession, obj);
    });
    $grid.on('click', 'div.block>div.grid-stack-item-content>div.trash-icon', function() {
        /* get id from data-ref */
        var grid = $grid.data('gridstack');
        $el = $(this).parent().parent()
        var id = $el.data('id');
        console.log(id);
        console.log($el);
        /* remove item from chrome storage*/
        deleteSession(id, function(result) {
            if(result) /*do something about chrome.runtime.lastError*/;
            else {
                /*remove item from view*/
                $el.animate({opacity: 0}, 'fast', function() {
                    grid.removeWidget($el, true);
                });
            }
        });
    });
    /*
        change background based on the block clicked
    */


    // $grid.on('keyup', 'div.block>div.grid-stack-item-content>div.item>input', hasTypeCompleted);
    // $grid.on('mousedown', 'div.block>div.grid-stack-item-content>div.item', function(event) {
    //     event.stopPropagation();
    // });
    
    /*initialization*/
    /*remove all nodes from grid-stack if there are any*/
    /*get all session objects and load them in*/
    init();

    function loadView(object) {
        var grid = $grid.data('gridstack');
        var $el = $(template);
        $grid.append($el);
        grid.makeWidget($el);
        //$el.find("input").focus().val(object.id)
        $el.find("p").text(object.id);
        $el.data("id", object.id);
        //load notes
        //title
        $divnotes.animate({width: '400px'}, 'fast', function() {
            /*get the el's name here*/
            $divnotes.find('span').text($el.data('id'));
            $divnotes.find('textarea').val(object.notes);
            console.log(object.notes);
        });
        /*change stuff in notes section to match*/

    }
    /*event handlers*/
    function createSession() {
        console.log("called createSession");
        // console.log(template);
        var new_id;
        //must be unique id
        makeUniqueId(function(result) {
            new_id = 'a' + result;
            /*handle runtime.lastError*/
            var new_session = {
                id: new_id,
                name: /*$el.find('div.grid-stack-item-content>div.item>input').val()*/ 'Placeholder',
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
                    loadView(new_session);
                })
            });
        });
    }  
    function deleteSession(id, callback) {
        //use id to delete/ remove item
        chrome.storage.local.remove(id, function() {
            chrome.storage.local.get({sessionids: []}, function(result) {
                sessionids = result.sessionids;
                for(var i=0; i < sessionids.length; i++) {
                    if(sessionids[i] == id) {
                        sessionids.splice(i,1);
                        break;
                    }
                }
                chrome.storage.local.set({sessionids: sessionids}, function() {
                    callback(chrome.runtime.lastError);
                })
            });
        })
    }
    /* take an id */
    //
    function editSession(obj) {
        /* things to edit are name, color, dateUpdated, windows, notes */
        /* save these to the chrome local storage */
        var property = obj.property;
        var val = obj.val;
        console.log(currentSession);
        switch(property) {
            case 'notes':
            chrome.storage.local.get({[currentSession]: {}}, function(result) {
                console.log(result[currentSession]);
                result = result[currentSession];
                result.notes = val;
                chrome.storage.local.set({[currentSession]: result }, function(){
                    console.log(result);
                })
            });
            break;
        }
    }
    function removeAllSessions() {
        chrome.storage.local.clear(function() {
            /*reinitialize*/
        })
    }
    /*use this function to automatically update entries*/
    function hasTypeCompleted(callback, vars) {
        if(typeTO != undefined) clearTimeout(typeTO);
        typeTO = setTimeout(function() { callback(vars) }, typeTimer);
    } 
    function _makeid()
    {
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
    function init() {
        $grid.gridstack(gridstack_options);
        chrome.storage.local.get({sessionids:[]}, function(result) {
            sessionids = result.sessionids;
            for(var i=0; i < sessionids.length; i++) {
                chrome.storage.local.get({[sessionids[i]]: {}}, function(result) {
                     for (var property in result) {
                        if (result.hasOwnProperty(property)) {
                            //console.log(result[property]);
                            loadView(result[property]);
                        }
                    }
                });
            }
        })
    }
});