if ((typeof hqWidgets !== 'undefined')) {
    jQuery.extend(true, dui.binds, {
        hqWidgetsExt: {
            version: "0.1.2",
            inited:  false,
            hqIgnoreNextUpdate: null, // id of controlled element
            hqTimerDetectMoving: null,
            hqMapping: {},
            hqSaveTimer : null,
            hqDelete: function (id) {
                hqWidgets.Delete (id);
            },
            // Check if template belongs to hqWidgets
            hqCheck: function (tpl) {
                return (tpl != null && tpl != "" && tpl.length > 5 && tpl.substring(0,5) == "tplHq");
            },
            hqStopDrag: function () {
                var btn = hqWidgets.Get (dui.activeWidget);
                if (btn) {
                    var pos = btn.intern._jelement.position();
                    btn.SetPosition (pos.left, pos.top);
                }
            },
            hqInit: function () {
                if (homematic === undefined || homematic.uiState === undefined || homematic.uiState.bind === undefined )
                    return;
                    
                if (dui.binds.hqWidgetsExt.inited)
                    return;
                
                dui.binds.hqWidgetsExt.inited = true;
                
                // Init hqWidgets engine
                hqWidgets.Init ({gPictDir: "widgets/hqWidgets/img/"});
                if (hqWidgets.version != dui.binds.hqWidgetsExt.version)
                    window.alert ("The versions of hqWidgets.js and hqWidgets.html are different. Expected version of hqWidgets.js is " +dui.binds.hqWidgetsExt.version);
                homematic.uiState.bind("change", function( e, attr, how, newVal, oldVal ) {
                    if (how != "set") 
                        return;
                    
                    if (newVal.certain !== undefined && newVal.certain === false)
                        return;
                        
                    // extract name
                    if ((''+attr).indexOf("__") !== -1) {
                        attr = attr.replace(/__d__/g, ".");
                        attr = attr.replace(/__c__/g, ":");
                    }
                    attr = attr.substring (1);
                    attr = attr.replace(".Value", "");
                    var isTimestamp = false;
                    if (attr.indexOf (".Timestamp") != -1) {
                        isTimestamp = true;
                        attr = attr.replace(".Timestamp", "");
                    }
                        
                    dui.binds.hqWidgetsExt.hqMonitor (attr, newVal, isTimestamp);
                });
            },
            hqDetectMoving: function () {
                if (dui.activeWidget != "" && dui.activeWidget != null) {
                    if (dui.views[dui.activeView].widgets[dui.activeWidget] !== undefined) {     
                        var btn = hqWidgets.Get (dui.activeWidget);
                        if (btn) {
                            if (document.getElementById (btn.advSettings.elemName)) {
                                var pos = btn.intern._jelement.position();
                                pos.top  = Math.round (pos.top);
                                pos.left = Math.round (pos.left);
                                // If position changed
                                if (pos.top != btn.settings.y || pos.left != btn.settings.x) {
                                    btn.SetPosition (pos.left, pos.top);
                                }
                            }
                            else {
                                hqWidgets.Delete (btn);
                                dui.activeWidget = null;
                            }
                        }
                    }
                    else {
                        var btn = hqWidgets.Get (dui.activeWidget);
                        if (btn) {
                            if (!document.getElementById (btn.advSettings.elemName)) {
                                hqWidgets.Delete (btn);
                                dui.activeWidget = null;
                            }
                        }
                    }
                }
            
                dui.binds.hqWidgetsExt.hqTimerDetectMoving = setTimeout (function () { 
                    dui.binds.hqWidgetsExt.hqDetectMoving (); 
                 }, 1000);
            },            
            hqSave: function () {
                if (dui.binds.hqWidgetsExt.hqSaveTimer != null) {
                    clearTimeout(dui.binds.hqWidgetsExt.hqSaveTimer);
                }
                    
                dui.binds.hqWidgetsExt.hqSaveTimer = setTimeout (function () { 
                    dui.saveLocal (); 
                    console.log ("Saved!"); 
                    dui.binds.hqWidgetsExt.hqSaveTimer = null;
                }, 2000);
            },
            hqButtonExt: function (el, options, wtype, view) {
                var opt = (options != undefined && options != null) ? $.parseJSON(options) : {x:50, y: 50};
                var hm_ids = new Array ();
                // Define store settings function
                var adv = {store: function (obj, opt) {
                    var newOpt = JSON.stringify (opt);
                    var duiWidget = dui.views[dui.activeView].widgets[obj.advSettings.elemName];
                    if (duiWidget === undefined) {
                        for (var view in dui.views) {
                            if (dui.views[view].widgets[obj.advSettings.elemName]) {
                                duiWidget = dui.views[view].widgets[obj.advSettings.elemName];
                                break;
                            }
                        }
                    }
                    
                    if (duiWidget) {
                        duiWidget.data.hqoptions = newOpt;
                        //$('#inspect_hqoptions').val(newOpt);
                        obj.intern._jelement.attr ('hqoptions', newOpt);
                        console.log ("Stored: " + newOpt);
                        dui.binds.hqWidgetsExt.hqSave ();
                    }
                    else
                        console.log ("Cannot find " + duiWidget.advSettings.elemName + " in any view");
                }};
                
                // If first creation
                if (wtype !== undefined) {
                    // Set default settings
                    if (wtype == 'tplHqButton') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeButton, 
                                              iconName: 'Lamp.png', 
                                              zindex: 2, 
                                              hm_id: '',
                                              });
                    }
                    else
                    if (wtype == 'tplHqInfo') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeInfo, 
                                              zindex: 2,
                                              hm_id: '',
                                              });
                    }
                    else
                    if (wtype == 'tplHqDimmer') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeDimmer, 
                                              iconName: 'Lamp.png', 
                                              zindex: 3,
                                              hm_id: '',
                                              hoursLastAction:-1,
                                              dimmerRampTime: 0.5,
                                              dimmerOnTime: 0,
                                              });
                    }
                    else
                    if (wtype == 'tplHqShutter') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeBlind, 
                                              windowConfig: hqWidgets.gSwingType.gSwingLeft, 
                                              zindex: 3,
                                              hm_id: '',
                                              newVersion: true,
                                              });
                    }
                    else
                    if (wtype == 'tplHqInTemp') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeInTemp, 
                                              iconName: 'Temperature.png', 
                                              zindex: 2,
                                              hm_id: '',
                                              hm_idV:'',
                                              hoursLastAction:-1,
                                              });
                    }
                    else
                    if (wtype == 'tplHqOutTemp') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeOutTemp, 
                                              iconName: 'Temperature.png', 
                                              zindex: 2,
                                              hm_id: '',
                                              hoursLastAction:-1,
                                              });
                    }
                    else
                    if (wtype == 'tplHqDoor') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeDoor, 
                                              zindex: 3,
                                              hm_id: '',
                                              });
                    }
                    else
                    if (wtype == 'tplHqLock') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeLock, 
                                              iconName: 'unlocked.png', 
                                              iconOn: 'locked.png', 
                                              zindex: 21,
                                              hm_id: '',
                                              });
                    }
                    else
                    if (wtype == 'tplHqText') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeText, 
                                              radius: 0, 
                                              zindex: 2, 
                                              hoursLastAction:-1});
                    }
                    else
                    if (wtype == 'tplHqImage') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeImage, 
                                              iconName:'eg_trans.png', 
                                              radius: 0});
                    }
                    else
                    if (wtype == 'tplHqCam') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeCam,  
                                              hm_id: '', 
                                              radius: 2, 
                                              width:100, 
                                              height:60, 
                                              zindex: 2, 
                                              popUpDelay: 10000, 
                                              openDoorBttn: false});
                    }
                    else
                    if (wtype == 'tplHqGong') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeGong,  
                                              hm_id: '', 
                                              hm_idL:'',
                                              zindex: 2, 
                                              iconName: 'ringing-bell.png', 
                                              popUpDelay: 10000});
                    }                
                    else
                    if (wtype == 'tplHqGauge') {
                        opt = $.extend (opt, {buttonType: hqWidgets.gButtonType.gTypeGauge,  
                                              hm_id: '', 
                                              zindex: 2, 
                                              radius: 2,
                                              valueMin: 0,
                                              valueMax: 100,
                                              });
                    }                
                 }
                else {
                    // non-edit mode => define event handlers
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeDimmer) {
                        adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            var time_id = hm_id;
                            if (hm_id != null && hm_id != "") {
                                if (hm_id.indexOf(".LEVEL") == -1)
                                    hm_id += ".LEVEL";
                                else 
                                    time_id = null;
                                
                                dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                if (what == 'state') {
                                    // Send on time to dimmer
                                    if (state != hqWidgets.gState.gStateOn) {                                            
                                        if (time_id != null) {
                                            if (time_id.indexOf(".LEVEL") == -1) {
                                                time_id += ".ON_TIME";
                                                var on_time = obj.GetSettings ('dimmerOnTime');
                                                if (on_time !== undefined && on_time != null && on_time != "")
                                                    $.homematic("setState", time_id, on_time);
                                            }
                                        }
                                            
                                        obj.SetStates ({percentState: 100, state: hqWidgets.gState.gStateOn, isRefresh: true});
                                        // Send command to HM
                                                                
                                        $.homematic("setState", hm_id, 1);                        
                                    }
                                    else {
                                        // Send ramp time settings to dimmer
                                        if (time_id != null) {
                                            if (time_id.indexOf(".LEVEL") == -1) {
                                                time_id += ".RAMP_TIME";
                                                var on_time = obj.GetSettings ('dimmerRampTime');
                                                if (on_time !== undefined && on_time != null && on_time != "")
                                                    $.homematic("setState", time_id, on_time);
                                            }
                                        }

                                        obj.SetStates ({percentState: 0, state: hqWidgets.gState.gStateOff, isRefresh: true});
                                        // Send command to HM
                                        $.homematic("setState", hm_id, 0);                        
                                    }
                                }
                                else {
                                    if (state != 0) {
                                        obj.SetStates ({state: hqWidgets.gState.gStateOn});
                                    }
                                    else {
                                        obj.SetStates ({state: hqWidgets.gState.gStateOff});
                                    }
                                    console.log ("SetState: "+ hm_id + " = " + (state / 100));
                                    // Send command to HM
                                    $.homematic("setState", hm_id, state / 100);                                  
                                }  
                            }                                
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt.hm_id != null && opt.hm_id != "") {
                            if (opt.hm_id.indexOf(".LEVEL") == -1) {
                                hm_ids[t++] = {hm_id: opt.hm_id + ".LEVEL",    option: 'percentState'}; // First is always main element
                                hm_ids[t++] = {hm_id: opt.hm_id + ".WORKING",  option: 'isWorking'};
                                hm_ids[t++] = {hm_id: opt.hm_id + ".RAMP_TIME",option: 'dimmerRampTime'}; 
                                hm_ids[t++] = {hm_id: opt.hm_id + ".ON_TIME",  option: 'dimmerOnTime'}; 
                            }
                            else {
                                hm_ids[t++] = {hm_id: opt.hm_id, option: 'percentState'};
                            }
                        }                        
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeButton) {
                        adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            if (hm_id != null && hm_id != "") {
                                if (hm_id.indexOf(".STATE") == -1)
                                    hm_id += ".STATE";
                                if (state != hqWidgets.gState.gStateOn) {
                                    state = hqWidgets.gState.gStateOn;
                                }
                                else {
                                    state = hqWidgets.gState.gStateOff;
                                }
                                dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                obj.SetStates ({state: state, isRefresh: true, isRefresh: true});
                                // Send command to HM
                                $.homematic("setState", hm_id, (state == hqWidgets.gState.gStateOn)); 
                            }                                
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt.hm_id != null && opt.hm_id != "") {
                            if (opt.hm_id.indexOf(".STATE") == -1) {
                                hm_ids[t++] = {hm_id: opt.hm_id + ".STATE", option: 'state'};
                            }
                            else {
                                hm_ids[t++] = {hm_id: opt.hm_id, option: 'state'};
                            }
                        }
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeBlind) {
                        adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            if (hm_id != null && hm_id != "") {
                                if (hm_id.indexOf(".LEVEL") == -1)
                                    hm_id += ".LEVEL";
                                obj.SetStates ({isRefresh: true});
                                dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                // Send command to HM
                                $.homematic("setState", hm_id, (100 - state) / 100);  
                            }                                
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt.hm_id != null && opt.hm_id != "") {
                            if (opt.hm_id.indexOf(".LEVEL") == -1) {
                                hm_ids[t++] = {hm_id: opt.hm_id + ".LEVEL",   option: 'percentState'}; // First is always main element
                                hm_ids[t++] = {hm_id: opt.hm_id + ".WORKING", option: 'isWorking'};
                                for (var i = 0; i < 4; i++) {
                                    if (opt['hm_id'+i] != undefined) {
                                        if (opt['hm_id'+i] != null && opt['hm_id'+i] != "")
                                            hm_ids[t++] = {hm_id: opt['hm_id'+i] + ".STATE", option: 'windowState', index:i};   
                                    }
                                    if (opt['hm_id_hnd'+i] != undefined) {
                                        if (opt['hm_id_hnd'+i] != null && opt['hm_id_hnd'+i] != "")
                                            hm_ids[t++] = {hm_id: opt['hm_id_hnd'+i] + ".STATE", option: 'handleState', index:i};   
                                    }
                                }
                            }
                            else {
                                hm_ids[t++] = {hm_id: opt.hm_id, option: 'percentState'};
                            }
                        }                        
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeInTemp) {
                        adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            if (hm_id != null && hm_id != "") {
                                if (hm_id.indexOf(":1.TEMPERATURE") == -1) {
                                    hm_id += ":2.SETPOINT";
                                }
                                dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                console.log ("SetTemp: "+ hm_id + " = " + state);
                                // Send command to HM
                                $.homematic("setState", hm_id, state);                                  
                            }                                
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt.hm_id != null && opt.hm_id != "") {
                            if (opt.hm_id.indexOf(":1.TEMPERATURE") == -1) {
                                hm_ids[t++] = {hm_id: opt.hm_id + ":2.SETPOINT",    option: 'valueSet'}; // First is always control element
                                hm_ids[t++] = {hm_id: opt.hm_id + ":1.TEMPERATURE", option: 'temperature'}; 
                                hm_ids[t++] = {hm_id: opt.hm_id + ":1.HUMIDITY",    option: 'humidity'};
                            }
                            else {
                                hm_ids[t++] = {hm_id: opt.hm_id, option: 'temperature'};
                            }
                            if (opt.hm_idV) {
                                if (opt.hm_id.indexOf(".VALVE_STATE") == -1)
                                    hm_ids[t++] = {hm_id: opt.hm_idV + ".VALVE_STATE", option: 'valve'};
                                else
                                    hm_ids[t++] = {hm_id: opt.hm_idV, option: 'valve'};
                                adv = $.extend (adv, {'hideValve': false});
                            }
                            else {
                                adv = $.extend (adv, {'hideValve': true});
                            }
                        }  
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeOutTemp) {
                        /*adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            if (hm_id != null && hm_id != "") {
                                if (hm_id.indexOf(".LEVEL") == -1)
                                    hm_id += ".LEVEL";
                                obj.SetStates ({isRefresh: true});
                                // Send command to HM
                                $.homematic("setState", hm_id, (100 - state) / 100);  
                            }                                
                        }});*/
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            if (opt['hm_id'].indexOf(".TEMPERATURE") == -1) {
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".TEMPERATURE", option: 'temperature'}; 
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".HUMIDITY",    option: 'humidity'};
                            }
                            else {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'temperature'};
                            }
                        }  
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeDoor) {
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            if (opt['hm_id'].indexOf(".STATE") == -1) {
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".STATE", option: 'state'}; 
                            }
                            else {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'state'};
                            }
                        }  
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeLock) {
                       adv = $.extend (adv, {action: function (obj, what, state) {
                            var hm_id = obj.GetSettings ('hm_id');
                            if (hm_id != null && hm_id != "") {
                                dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                obj.SetStates ({isRefresh: true});
                                if (state == hqWidgets.gLockType.gLockClose ||
                                    state == hqWidgets.gLockType.gLockOpen)
                                {
                                    if (hm_id.indexOf(".STATE") == -1)
                                        hm_id += ".STATE";
                                    // Send command to HM
                                    $.homematic("setState", hm_id, (state == hqWidgets.gLockType.gLockClose) ? "false" : "true");
                                }
                                else { // Open door
                                    if (hm_id.indexOf(".OPEN") == -1)
                                        hm_id += ".OPEN";
                                    // Send command to HM
                                    $.homematic("setState", hm_id, "true");
                                }
                            }                            
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            if (opt['hm_id'].indexOf(".STATE") == -1) {
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".STATE",   option: 'state'}; 
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".OPEN",    option: 'open'}; 
                                //hm_ids[t++] = {'hm_id': opt['hm_id'] + ".WORKING", option: 'isWorking'};
                            }
                            else {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'state'};
                            }
                        }  
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeInfo) {
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'infoText'};
                        }  
                    }                
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeCam) {
                        if (dui.urlParams["edit"] === undefined) {
                            adv = $.extend (adv, {state: hqWidgets.gState.gStateOff, isWorking: false,
                                action: function (obj, what, state) {                                    
                                    var hm_id = obj.GetSettings ('hm_id');
                                    if (hm_id != null && hm_id != "") {
                                        dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                        if (hm_id.indexOf(".OPEN") == -1 && hm_id.indexOf(".STATE") == -1)
                                            hm_id += ".STATE";
                                        // Send command to HM
                                        $.homematic("setState", hm_id, "true");
                                    }                            
                                }});
                        }                    
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            if (opt['hm_id'].indexOf(".OPEN") == -1 && opt['hm_id'].indexOf(".STATE") == -1) {
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".STATE", option: 'open'}; 
                            }
                            else {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'open'};
                            }
                        }  
                    }   
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeGong) {
                        adv = $.extend (adv, {action: function (obj, what, state) {
                            if (dui.urlParams["edit"] === undefined) {
                                // Open the door
                                if (what == 'open') {
                                    var hm_id = obj.GetSettings ('hm_idL');
                                    if (hm_id != null && hm_id != "") {
                                        dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                        if (hm_id.indexOf(".OPEN") == -1 && hm_id.indexOf(".STATE") == -1)
                                            hm_id += ".OPEN";
                                        // Send command to HM
                                        $.homematic("setState", hm_id, "true");
                                    }   
                                }
                                else { // Play melody or blink with LED
                                    var hm_id = obj.GetSettings ('hm_id');
                                    if (hm_id != null && hm_id != "") {
                                        dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = hm_id;
                                        if (hm_id.indexOf(".STATE") == -1)
                                            hm_id += ".STATE";
                                        // Send command to HM
                                        $.homematic("setState", hm_id, "true");
                                        // Switch of in 2 seconds
                                        setTimeout (function (id) { $.homematic("setState", id, "false");}, 2000, hm_id);
                                    }                            
                                }  
                            }                                
                        }});
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            if (opt['hm_id'].indexOf(".STATE") == -1) {
                                hm_ids[t++] = {'hm_id': opt['hm_id'] + ".STATE", option: 'state'}; 
                            }
                            else {
                                hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'state'};
                            }
                        }  
                        if (opt['hm_idL']) {
                            if (opt['hm_idL'].indexOf(".OPEN") == -1 && opt['hm_idL'].indexOf(".STATE") == -1)
                                hm_ids[t++] = {hm_id: opt['hm_idL'] + ".STATE", option: 'open'};
                            else
                                hm_ids[t++] = {hm_id: opt['hm_idL'], option: 'open'};
                        }
                    }   
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeImage) {
                        if (opt.width === 0 || opt.width === "0")
                            opt.width = undefined;
                        if (opt.height === 0 || opt.height === "0")
                            opt.height = undefined;
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeGauge) {
                        // Fill up the required IDs
                        var t = 0;
                        if (opt['hm_id'] != null && opt['hm_id'] != "") {
                            hm_ids[t++] = {'hm_id': opt['hm_id'], option: 'valueSet'}; 
                        }  
                    }
                }
                
                var btn = hqWidgets.Create (opt, {elemName: el, parent: $("#duiview_"+view)});//dui.activeView)});
                
                // Enable edit mode
                if (dui.urlParams["edit"] === "") {
                    btn.SetEditMode (true);
                    // install timer to detect moving
                    clearTimeout (dui.binds.hqWidgetsExt.hqTimerDetectMoving);
                    dui.binds.hqWidgetsExt.hqDetectMoving ();
                } 
                else {
                    for (var i = 0; i < hm_ids.length; i++) {
                         // Register hm_id to detect changes
                        $.homematic("addUiState", hm_ids[i].hm_id);
                        // Store mapping
                        var j = 0;
                        while (dui.binds.hqWidgetsExt.hqMapping[hm_ids[i].hm_id+'_'+j])
                            j++;
                            
                        dui.binds.hqWidgetsExt.hqMapping[hm_ids[i].hm_id+'_'+j] = {button: btn, option: hm_ids[i].option, index: hm_ids[i].index};
                        if (i > 0) {
                            btn.intern._jelement.append ("<div id='"+el+"helper_"+i+"' data-hm-id='"+hm_ids[i].hm_id +"' style='display: none' />");
                        } 
                        else {
                            btn.intern._jelement.attr('data-hm-id', hm_ids[0].hm_id);
                        }                        
                    }
                }
                 
                btn.SetStates (adv);
                btn.intern._jelement.addClass("dashui-widget");
                
                // Store options
                var newOpt = JSON.stringify (btn.GetSettings ());
                $('#'+el).attr ('hqoptions', newOpt);
                
                // Create signal translators
                if (wtype == undefined) {
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeButton) {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            return (value == "true") ? hqWidgets.gState.gStateOn : hqWidgets.gState.gStateOff;
                        }});
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeDimmer) {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            if (options == "percentState")
                                return Math.floor (value * 100);
                            else // working
                                return (value == "true") ? true : false;
                        }});
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeBlind) {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            if (options == "percentState")
                                return Math.floor (100 - (value * 100));
							else
							if (options == "handleState")
								return value;
                            else // working
                                return (value == "true") ? true : false;
                        }});
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeInTemp ||
                        opt.buttonType == hqWidgets.gButtonType.gTypeOutTemp) {
                        // remove "--"
                        btn.SetStates ({temperature: 0, valve: 0, humidity: 0, valueSet: 0});
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            if (options == "valueSet")
                                return (value == 0) ? dui.translate ("Off") : ((value == 100) ? dui.Tramslate ("On") : value);
                            else // temperature, humidity, valve
                                return value;
                        }});                        
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeLock) {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            return (value == "false") ? hqWidgets.gState.gStateOn : hqWidgets.gState.gStateOff;
                        }});
                    }
                    else
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeInfo ||
                        opt.buttonType == hqWidgets.gButtonType.gTypeGauge) {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            return value;
                        }});
                    }
                    else {
                        btn = $.extend (btn, {translateSignal: function (options, value) {
                            return (value == "true") ? hqWidgets.gState.gStateOn : hqWidgets.gState.gStateOff;
                        }});
                     }
                }
            },
            hqMonitor: function (wid, newState, isTimestamp){
                
                // Ignore state change extactly after control event, because the state is not from CCU
                if (!isTimestamp && 
                    dui.binds.hqWidgetsExt.hqIgnoreNextUpdate != null && 
                    dui.binds.hqWidgetsExt.hqIgnoreNextUpdate == wid) {
                    dui.binds.hqWidgetsExt.hqIgnoreNextUpdate = null;
                    return;
                }
                
                console.log(wid+"="+newState);
                var i = 0;
                while (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i]) {
                
                    var change = {};
                    if (!isTimestamp) {
                        change[dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].option] = dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.translateSignal (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].option, newState);
                        change['isRefresh'] = false;
                        
                        // If new percent state
                        if (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].option == 'percentState') {
                            var type = dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.GetSettings('buttonType');
                            // Remove unknown state of the button and if dimmer select valid state
                            if (type == hqWidgets.gButtonType.gTypeDimmer)
                                change['state'] = (newState > 0) ? hqWidgets.gState.gStateOn : hqWidgets.gState.gStateOff;
                            else
                                change['state'] = hqWidgets.gState.gStateOff; // Remove unknown state
                        }
                        else
                        if (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].option == 'windowState') {
                            change['state'] = hqWidgets.gState.gStateOff; // Remove unknown state
                            dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.SetWindowState (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].index, (newState == "true") ? hqWidgets.gWindowState.gWindowOpened : hqWidgets.gWindowState.gWindowClosed);
                            i++;
                            continue;
                        }
                        else
                        if (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].option == 'handleState') {
                            // 0. CLOSED, 1. TILTED, 2.OPEN ab  V1.6 ???
                            // 0. Closed, 1. tilted, 2.open bis V1.6
                            var wndState = undefined;
                            var opt    = dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.GetSettings('hm_id'+dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].index);
                            // Get sensor version
                            var newVer = dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.GetSettings('newVersion');
                            if (newVer === undefined || newVer === null)
                                newVer = false;
                            var nState = newState;
                                
                            if ((!newVer && newState == "2") || (newVer && newState == "2")) {
                                wndState = hqWidgets.gWindowState.gWindowOpened;
                                nState = hqWidgets.gHandlePos.gPosOpened;
                            }
                            else
                            if ((!newVer && newState == "1") || (newVer && newState == "1")) {
                                wndState = hqWidgets.gWindowState.gWindowTilted;
                                nState = hqWidgets.gHandlePos.gPosTilted;
                            }
                            else {
                                wndState = hqWidgets.gWindowState.gWindowClosed;
                                nState = hqWidgets.gHandlePos.gPosClosed;
                            }
                            
                            // If contact sensor => set the valid position from sensor
                            if (opt !== undefined && opt != null && opt != "") 
                                wndState = undefined;
                                
                            dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.SetWindowState (dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].index, wndState, nState);
                            i++;
                            continue;
                        }
                    }
                    else {
                        // Just update state
                        change['state'] = null;
                    }
                        
                    dui.binds.hqWidgetsExt.hqMapping[wid+'_'+i].button.SetStates (change);
                    i++;
                }
            },    
            hqEditButton: function (obj, parent, devFilter, hqEditElem) {
                // install timer to detect moving
                clearTimeout (dui.binds.hqWidgetsExt.hqTimerDetectMoving);
                dui.binds.hqWidgetsExt.hqDetectMoving ();

                var opt = obj.GetSettings ();
                var devFilters = (devFilter) ? devFilter.split (';') : [null, null];
                if (opt.buttonType == hqWidgets.gButtonType.gTypeDimmer) {
                    // Add ramp_time and on_time
                    var sTextAdv  = "<tr id='idAdv"+(hqEditElem.e_internal.iAdvCount++)+"' style='display:none'><td>"+ dui.translate("ramp_time:") +"</td><td><input style='width: "+hqEditElem.e_settings.width+"px' id='"+hqEditElem.e_settings.elemName+"_dimmerRampTime'  type='text' value='"+hqEditElem.e_internal.attr.dimmerRampTime+"'></td></tr>";
                        sTextAdv += "<tr id='idAdv"+(hqEditElem.e_internal.iAdvCount++)+"' style='display:none'><td>"+ dui.translate("on_time:")   +"</td><td><input style='width: "+hqEditElem.e_settings.width+"px' id='"+hqEditElem.e_settings.elemName+"_dimmerOnTime'    type='text' value='"+hqEditElem.e_internal.attr.dimmerOnTime
                        +"'></td></tr>";
                    parent.append (sTextAdv);
                    hqEditElem._EditTextHandler ('dimmerRampTime');
                    hqEditElem._EditTextHandler ('dimmerOnTime');
                }
                
                if (opt.hm_id != undefined) {
                    var attr = 'hm_id';
                    parent.append('<tr id="option_'+attr+'" class="dashui-add-option"><td>'+dui.translate(attr)+'</td><td><input type="text" id="inspect_'+attr+'" size="44" value="'+opt.hm_id+'" style="width:90%"><input type="button" id="inspect_'+attr+'_btn" value="..."  style="width:8%"></td></tr>');
                    document.getElementById ("inspect_"+attr+"_btn").jControl  = attr;
                    document.getElementById ("inspect_"+attr+"_btn").devFilter = devFilters[0];
                    // Select Homematic ID Dialog
                    $("#inspect_"+attr+"_btn").click ( function () {
                        hmSelect.value = $("#inspect_"+this.jControl).val();
                        hmSelect.show (homematic.ccu, this.jControl, function (obj, value, valueObj) {
                            $("#inspect_"+obj).val(value).trigger("change");
                            if (valueObj) {
                                var btn = hqWidgets.Get (dui.activeWidget);
                                if (btn) {
                                    var settings = btn.GetSettings ();
                                    btn.SetSettings ({room: valueObj.room});
                                    if (settings.title == undefined || settings.title == null || settings.title == "") {
                                        var title = hmSelect._convertName(valueObj.Name);                                        
                                        // Remove ROOM from device name
                                        if (title.length > valueObj.room.length && title.substring(0, valueObj.room.length) == valueObj.room)
                                            title = title.substring(valueObj.room.length);
                                        // Remove the leading dot
                                        if (title.length > 0 && title[0] == '.')
                                            title = title.substring(1);
                                        $('#inspect_title').val (title);
                                        $('#inspect_title').trigger ('change');
                                    }
                                }
                            }
                        }, null, this.devFilter);
                    });
                    $("#inspect_"+attr).change(function (el) {
                        var btn = hqWidgets.Get (dui.activeWidget);
                        if (btn) {
                            btn.SetSettings ({hm_id: $(this).val()}, true);
                        }
                    });
                    $("#inspect_"+attr).keyup (function () {
                        if (hqWidgets.e_internal.timer) 
                            clearTimeout (hqWidgets.e_internal.timer);
                                
                        hqWidgets.e_internal.timer = setTimeout (function(elem) {
                            elem.trigger("change");
                        }, hqWidgets.e_settings.timeout, $(this));
                    });
                }
                if (opt.buttonType == hqWidgets.gButtonType.gTypeBlind) {
                    var wnd = opt.windowConfig;
                    var a = wnd.split(',');
                    for (var i = 0; i < a.length; i++) {
                        var attr = 'hm_id'+i;
                        parent.append('<tr id="option_'+attr+'" class="dashui-add-option"><td>'+dui.translate(attr)+'</td><td><input type="text" id="inspect_'+attr+'" size="44" value="'+((opt[attr] != undefined) ? opt[attr] : "")+'" style="width:90%"><input type="button" id="inspect_'+attr+'_btn" value="..."  style="width:8%"></td></tr>');
                        document.getElementById ("inspect_"+attr+"_btn").jControl  = attr;
                        document.getElementById ("inspect_"+attr).jControl = attr;
                        document.getElementById ("inspect_"+attr+"_btn").devFilter = (devFilters.length > 1) ? devFilters[1] : devFilters[0];
                        // Select Homematic ID Dialog
                        $("#inspect_"+attr+"_btn").click ( function () {
                            hmSelect.value = $("#inspect_"+this.jControl).val();
                            hmSelect.show (homematic.ccu, this.jControl, function (obj, value, valueObj) {
                                $("#inspect_"+obj).val(value).trigger("change");
                            }, null, this.devFilter);
                        });
                        $("#inspect_"+attr).change(function (el) {
                            var btn = hqWidgets.Get (dui.activeWidget);
                            
                            var wnd = btn.GetSettings ('windowConfig');
                            var a = wnd.split(',');
                            
                            if (btn) {
                                var option = {};
                                option[this.jControl] = $(this).val();
                                for (var j = a.length; j < 4; j++)
                                    option['hm_id'+j] = null;
                                btn.SetSettings (option, true);
                            }
                        });
                        $("#inspect_"+attr).keyup (function () {
                            if (hqWidgets.e_internal.timer) 
                                clearTimeout (hqWidgets.e_internal.timer);
                                    
                            hqWidgets.e_internal.timer = setTimeout (function(elem) {
                                elem.trigger("change");
                            }, hqWidgets.e_settings.timeout, $(this));
                        });      

                        //--------------- handler ------------------------
                        attr = 'hm_id_hnd'+i;
                        parent.append('<tr id="option_'+attr+'" class="dashui-add-option"><td>'+dui.translate(attr)+'</td><td><input type="text" id="inspect_'+attr+'" size="44" value="'+((opt[attr] != undefined) ? opt[attr] : "")+'" style="width:90%"><input type="button" id="inspect_'+attr+'_btn" value="..."  style="width:8%"></td></tr>');
                        document.getElementById ("inspect_"+attr+"_btn").jControl  = attr;
                        document.getElementById ("inspect_"+attr).jControl = attr;
                        document.getElementById ("inspect_"+attr+"_btn").devFilter = (devFilters.length > 2) ? devFilters[2] : devFilters[0];
                        // Select Homematic ID Dialog
                        $("#inspect_"+attr+"_btn").click ( function () {
                            hmSelect.value = $("#inspect_"+this.jControl).val();
                            hmSelect.show (homematic.ccu, this.jControl, function (obj, value, valueObj) {
                                $("#inspect_"+obj).val(value).trigger("change");
                            }, null, this.devFilter);
                        });
                        $("#inspect_"+attr).change(function (el) {
                            var btn = hqWidgets.Get (dui.activeWidget);
                            
                            var wnd = btn.GetSettings ('windowConfig');
                            var a = wnd.split(',');
                            
                            if (btn) {
                                var option = {};
                                option[this.jControl] = $(this).val();
                                for (var j = a.length; j < 4; j++)
                                    option['hm_id_hnd'+j] = null;
                                btn.SetSettings (option, true);
                            }
                        });
                        $("#inspect_"+attr).keyup (function () {
                            if (hqWidgets.e_internal.timer) 
                                clearTimeout (hqWidgets.e_internal.timer);
                                    
                            hqWidgets.e_internal.timer = setTimeout (function(elem) {
                                elem.trigger("change");
                            }, hqWidgets.e_settings.timeout, $(this));
                        }); 
                    }
					//--------------- handler version ------------------------
					/*var attr = 'newVersion';
					parent.append('<tr id="option_'+attr+'" class="dashui-add-option"><td>'+dui.translate(attr)+'</td><td><input type="checkbox" id="inspect_'+attr+'" '+((opt[attr] != undefined && opt[attr]) ? "checked" : "")+' ></td></tr>');
					document.getElementById ("inspect_"+attr).jControl = attr;
					$("#inspect_"+attr).change(function (el) {
						var btn = hqWidgets.Get (dui.activeWidget);
						if (btn) {
							var option = {};
							option[this.jControl] = $(this).prop('checked');
							btn.SetSettings (option, true);
						}
					});*/
                }
                else
                if (opt.buttonType == hqWidgets.gButtonType.gTypeInTemp || opt.buttonType == hqWidgets.gButtonType.gTypeGong) {
                    var attr = 'hm_idV';
                    if (opt.buttonType == hqWidgets.gButtonType.gTypeGong)
                        attr = 'hm_idL';
                    var text = '<tr id="option_'+attr+'" class="dashui-add-option"><td>'+dui.translate(attr)+'</td>';
                    text += '<td><input type="text" id="inspect_'+attr+'" size="44" value="'+((opt[attr] != undefined) ? opt[attr] : "")+'" style="width:90%">';
                    text += '<input type="button" id="inspect_'+attr+'_btn" value="..."  style="width:8%"></td></tr>';
                    parent.append(text);
                    document.getElementById ("inspect_"+attr+"_btn").jControl  = attr;
                    document.getElementById ("inspect_"+attr).jControl = attr;
                    document.getElementById ("inspect_"+attr+"_btn").devFilter = (devFilters.length > i + 1) ? devFilters[i+1] : devFilters[devFilters.length -1];
                    // Select Homematic ID Dialog
                    $("#inspect_"+attr+"_btn").click ( function () {
                        hmSelect.value = $("#inspect_"+this.jControl).val();
                        hmSelect.show (homematic.ccu, this.jControl, function (obj, value, valueObj) {
                            $("#inspect_"+obj).val(value).trigger("change");
                        }, null, this.devFilter);
                    });
                    $("#inspect_"+attr).change(function (el) {
                        var btn = hqWidgets.Get (dui.activeWidget);
                        if (btn) {
                            var option = {};
                            option[this.jControl] = $(this).val();
                            btn.SetSettings (option, true);
                        }
                    });
                    $("#inspect_"+attr).keyup (function () {
                        if (hqWidgets.e_internal.timer) 
                            clearTimeout (hqWidgets.e_internal.timer);
                                
                        hqWidgets.e_internal.timer = setTimeout (function(elem) {
                            elem.trigger("change");
                        }, hqWidgets.e_settings.timeout, $(this));
                    });                        
                }
            },      
        }
    });

    dui.binds.hqWidgetsExt.hqInit ();
}