$(function () {
    /*cache*/
    //var template = '<div class="grid-stack-item block color_mist" data-gs-x="0" data-gs-y="0" data-gs-width="3" data-gs-height="1"><div class="grid-stack-item-content"></div></div>'
    var ID_LENGTH = 10;
    var template_block = $('#template-block').html();
    var template_url = $('#template-url').html();
    var template_window = $('#template-window').html();
    var block_options = {
        cellHeight: 80,
        disableResize: true,
        width: 3,
        animate: true,
        disableOneColumnMode: true
    }
    var url_options = {
        cellHeight: 30,
        disableResize: true,
        width: 3,
        animate: true,
        disableOneColumnMode: true
    }
    var $divplus = $('div.plus'),
        $divcog = $('div.cog'),
        $divnotes = $('div.notes'),
        $grid = $('#block-view'),
        $urlview = $('#url-view');
    var typeTO;
    var typeTimer = 800;
    var currentSession;
    /*register events*/
    $divplus.on('click', function() { createSession(loadBlockView) });
    $grid.on('click', 'div.block', function(event) {
        /*
            change background based on the block clicked
        */
        event.stopPropagation();
        $el = $(this);
        currentSession = $el.data('id');
        $grid.find('div.block').css('left', '0px');
        $el.animate({left: '20px'}, 5, 'linear');
        chrome.storage.local.get({[currentSession]: {}}, function(result) {
            result = result[currentSession];
            $divnotes.find('textarea').val(result.notes);   
            $divnotes.animate({width: '400px'}, 'fast', function() {
                /*get the el's name here*/
                $divnotes.find('span').text(result.name);
            }); 
            loadUrlView(result, function() {
                 // $urlview.animate({right:'400px'}, "fast");   
            });
        });
    });
    $divnotes.keyup(function() { 
        var obj = {
            id: currentSession,
            property: 'notes',
            val: $divnotes.find('textarea').val()
        }
        hasTypeCompleted(editSession, obj);
    });
    $grid.on('click', 'div.block>div.grid-stack-item-content>div.trash-icon', function(event) {
        /* get id from data-ref */
        event.stopPropagation();
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
    $grid.on('click', 'div.block>div.grid-stack-item-content>div.open-icon', function(event) {
        //open new window
        event.stopPropagation();
        $el = $(this).parent().parent()
        var id = $el.data('id');
        openSession(id, function() {

        });
    });
    $grid.on('click', 'div.block>div.grid-stack-item-content>div.pen-icon', function(event) {
        event.stopPropagation();
    })

    // $grid.on('keyup', 'div.block>div.grid-stack-item-content>div.item>input', hasTypeCompleted);
    // $grid.on('mousedown', 'div.block>div.grid-stack-item-content>div.item', function(event) {
    //     event.stopPropagation();
    // });
    
    /*initialization*/
    /*remove all nodes from grid-stack if there are any*/
    /*get all session objects and load them in*/
    init();

    function loadBlockView(object) {
        var grid = $grid.data('gridstack');
        var $el = $(template_block);
        $grid.append($el);
        grid.makeWidget($el);
        //$el.find("input").focus().val(object.id)
        $el.find("p").text(object.name);
        $el.data("id", object.id);
        //load notes
        //title
        $divnotes.animate({width: '400px'}, 'fast', function() {
            /*get the el's name here*/
            $divnotes.find('span').text(object.name);
            $divnotes.find('textarea').val(object.notes);
            console.log(object.notes);
        });
        /*change stuff in notes section to match*/

    }
    /* also take a session object */
    function loadUrlView(object, callback) {
        var windows = $urlview.find('div.window');
        //first remove all
        console.log(_.isEmpty(windows));
        if(!_.isEmpty(windows)) {
            console.log("clear");
            windows.each(function() {
                var grid = $(this).find('.grid').data('gridstack');
                console.log($(this))
                grid.removeAll();
            });
            $urlview.empty();
        }
        for(var i=0; i < object.windows.length; i++) {
            var $wi = $(template_window);
            $wi.find('span').text("Window " + (i+1));
            $urlview.append($wi);
            $wi.find('.grid').gridstack(url_options);
            var grid = $wi.find('.grid').data('gridstack');
            console.log(object.windows[i].length);
            for(var j=0; j < object.windows[i].length; j++) {
                var $el = $(template_url);
                $el.find('a').text(object.windows[i][j])
                $el.find('a').attr('href', object.windows[i][j]);
                // console.log($el);
                $wi.find('.grid').append($el);
                grid.makeWidget($el);
            }
        }
        callback();
    }
    /*event handlers*/
    /*make sure to update each object in chrome.storage.local*/
    function openSession(id, callback) {
        chrome.storage.local.get({[id]: {}}, function(session) {
            //set current Session in settings
            session = session[id];
            chrome.storage.local.get({settings: {}}, function(result) {
                result = result.settings;
                result.currentSession = id;
                chrome.storage.local.set({settings: result}, function() {
                    //close current tab
                    if(_.isEmpty(session.windows)) chrome.windows.create(callback);
                    else {
                        for(var i=0; i < session.windows.length; i++) {
                            console.log(session.windows[i]);
                            chrome.windows.create({url: session.windows[i]}, function() {});
                        }
                    }
                });
            });
            //console.log(session);
        });
    }
    function createSession(callback) {
        console.log("called createSession");
        // console.log(template_block);
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
                })
            });
        });
    }  
    function deleteSession(id, callback) {
        //use id to delete/ remove item
        chrome.storage.local.get({settings:{}}, function(result) {
            result = result.settings;
            if(result.currentSession == id) result.currentSession = null;
            chrome.storage.local.set({settings:result}, function() {
                /** eventually handle errors */
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
                            if(callback) callback();
                        })
                    });
                });
            });
        })
    }
    /* take an id */
    function editSession(obj) {
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
            console.log(result[id]);
            result = result[id];
            result[property] = val;
            chrome.storage.local.set({[id]: result }, function(){
                console.log(result);
            })
        });
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
        $grid.gridstack(block_options);
        $urlview.gridstack(url_options);
        chrome.storage.local.get({sessionids:[]}, function(result) {
            sessionids = result.sessionids;
            for(var i=0; i < sessionids.length; i++) {
                chrome.storage.local.get({[sessionids[i]]: {}}, function(result) {
                     for (var property in result) {
                        if (result.hasOwnProperty(property)) {
                            //console.log(result[property]);
                            loadBlockView(result[property]);
                        }
                    }
                });
            }
        })
    }
});