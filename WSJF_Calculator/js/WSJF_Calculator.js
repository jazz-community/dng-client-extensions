/*
 Set Attributes  Cost of Delay as (User/Business Value+Time criticality+RROE)
 and WSJF as Cost of Delay / Job Size

 erwin.kunz@siemens.com
 � Copyright Siemens AG 2017
*/
"use strict";

// Main Function -   this function is run when the document is ready
var logEnabled = true;
var progressDone = 0;
var progressMsg = "";
var itemsSelected = [];
var defaultAttrs = [];
var RM;

$(function() {
	if (window.RM) {
		// The feature is present to address in the current context.
		// Execute the extension behavior as normal
		
		defaultAttrs = [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.ARTIFACT_TYPE,'RROE','Job Size','User/Business Value','Time criticality','WSJF','Cost of Delay'];
		
		// look up the element with the id "enableLog"
		$("#enableLog").on("click", function() {
			logEnabled = NewLog($("#enableLog").prop('checked'));
		});

		// register for selected items
		RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, function(selected) {
			itemsSelected = selected;
		});
		
		gadgets.window.adjustHeight();
		
		// register click event
		$("#setAttr").on("click", {remove:false}, process);
		
	} else {
		// The feature is not present, so any calls to the API would result in errors.
		NotAvailable();
	}
});

function process(event) {
	ClearAll();
	logEnabled = NewLog($("#enableLog").prop('checked'));

	var scope = $('input:radio[name=scope]:checked').val();

	if (scope == "scopeAll") {
			info("Process all ... please wait", false);
			processAllArtifacts(defaultAttrs);
	} else {
			info("Process selected ... please wait", false);
			processSelectedArtifacts(itemsSelected, defaultAttrs);
	}
	gadgets.window.adjustHeight();
}

function processAllArtifacts(defaultAttrs) {
	// get current module
	RM.Client.getCurrentArtifact(function(artResult) {
		if (artResult.code === RM.OperationResult.OPERATION_OK) {
			var artType = artResult.data.values[RM.Data.Attributes.FORMAT];
			if ((artType === RM.Data.Formats.MODULE) || (artType === RM.Data.Formats.COLLECTION))  {
				var moduleRef = artResult.data.ref;
				// read attribute of all items in module
				RM.Data.getContentsAttributes(moduleRef, defaultAttrs, function(opResult) {
					if (opResult.code === RM.OperationResult.OPERATION_OK) {
						processAttributes(opResult);
					} else {
						error("Error reading attribute (" + opResult.message + ")", true);
					}
				});
			} else {
				error("Function only works on Modules/Collections, not on a: " + artResult.data.values[RM.Data.Attributes.FORMAT], true);
			}
		} else {
			error("All works only for Modules/Collections (" + artResult.message + ").", true);
		}
	});
};

// refs : RM.ArtifactRef
function processSelectedArtifacts(refs, defaultAttrs) {
	var attrType = {};
	if (refs.length == 0) {
		error("No artifacts selected.", true);
	} else {		
		RM.Data.getAttributes(refs, defaultAttrs, function(opResult){
			if (opResult.code === RM.OperationResult.OPERATION_OK) {
				processAttributes(opResult);
			} else {
				error(opResult.message, true);
			}
		});
	}
};

/*RM.ArtifactAttributes[]*/
function processAttributes(refs) {
	var totalItems = refs.data.length;
	var toSave = []; 
	info("Process " + totalItems + " artifacts ...", false);

	// iterate through all artifacts
	// item : RM.ArtifactAttributes
	var countItem = 0;
	refs.data.forEach(function(item){		
		var id = item.values[RM.Data.Attributes.IDENTIFIER];
		var valRROE = parseInt(item.values['RROE']);
		var valUserVal = parseInt(item.values['User/Business Value']);
		var valTimeC = parseInt(item.values['Time criticality']);
		var valJobS = parseInt(item.values['Job Size']);
		
		//calculate CostOfDelay value
		var actCoD = parseInt(item.values['Cost of Delay']);
		var valCoD = (valRROE+valUserVal+valTimeC);
		
		//calculate WSJF value
		var actWSJF = item.values['WSJF']
		var valWSJF;
		
		if (valJobS>0){
			valWSJF = (valRROE+valUserVal+valTimeC)/valJobS;
		} else{
			valWSJF=actWSJF;
		}

		// check if WSJF or CoD Value has changed
		if (( valWSJF != actWSJF ) || ( valCoD != actCoD )){
			// push to save list
			if (valWSJF != actWSJF ) item.values['WSJF'] = valWSJF;
			if (valCoD != actCoD ) item.values['Cost of Delay'] = valCoD;
			toSave.push(item);
			info("+ " + id, true);
			countItem += 1;
		} else{
			info("- " + id, true);
			countItem += 1;			
		}

	});

	// Perform a bulk save for all changed attributes
	//document.body.style.cursor = "wait";
	var totalItemsToSave=toSave.length;
	if (totalItemsToSave == 0) {
		progressBarInit(1, "");
		progressMsg = "Done (no changes).";
		progressDone = 1; // enforce end
		progressBarDone();
	} else {
		progressBarInit(countItem * 2, "Save ... " + countItem + " artifacts");
		progressBarShow(0);
		//info("Saving ... " + countItem + " artifacts", true);
		RM.Data.setAttributes(toSave, function(opResult){
			if (opResult.code === RM.OperationResult.OPERATION_OK) {
				progressMsg = "Done (" + countItem + " of " + totalItems + " saved).";
				progressDone = 1; // enforce end
				//success("Done (" + countItem + " saved).", true);
			} else {
				progressMsg = "Error (" + opResult.code + ").";
				progressDone = -1; // enforce end
				//error("Error (" + opResult.code + ").", true);
				var i = 0;
				opResult.data.forEach(function(itemResult){
					if (itemResult.code !== RM.OperationResult.OPERATION_OK) {
						info(++i + ": " + itemResult.code + " (" + itemResult.message + ")", true);
					}
				});
			}
			progressBarDone();
		});
	}
	gadgets.window.adjustHeight();
	//document.body.style.cursor = "default";
}

function progressBarInit(max, msg) {
	$("#progress").css('display','block');
	var bar = document.getElementById('progressbar');
	bar.max = max;
	
	var status = document.getElementById('status');
	status.innerHTML = "";
	
	progressDone = 0;
}

function progressBarShow(v) {
	if (progressDone == 2) return;
	
	var bar = document.getElementById('progressbar');
	var status = document.getElementById('status');
	status.innerHTML = v + " sec";
	v++;
	bar.value = bar.max % v;

	var sim = setTimeout("progressBarShow(" + v + ")", 1000);

	if (progressDone != 0) {
		//bar.value = bar.max;
		clearTimeout(sim);
		//var finalMessage = document.getElementById('result');
		//finalMessage.innerHTML = progressMsg;
		//finalMessage.className = (progressDone > 0) ? "msg-ok" : "msg-error";
	}
}

function progressBarDone() {
	var bar = document.getElementById('progressbar');
	bar.value = bar.max;
	var finalMessage = document.getElementById('result');
	finalMessage.innerHTML = progressMsg;
	finalMessage.className = (progressDone > 0) ? "msg-ok" : "msg-error";
	
	progressDone = 2; // enforce progressBarShow(v) exit
}

// logging functions
function success(msg, append){
	log(msg, "msg-ok", append);
}
function error(msg, append){
	log(msg, "msg-error", append);
}
function info(msg, append){
	log(msg, "msg-entry", append);
}
function log(msg, style, append){
	if (window.console && console.log) {
		console.log(msg); //for firebug
	}
	if (logEnabled) {
		var p = document.createElement("p");
		p.className = style;
		p.innerHTML = msg;
		if (!append) NewLog(true);
		$(p).appendTo("#log");
		//gadgets.window.adjustHeight();
	}
}
function NewLog (enabled) {
	if (enabled) {
		$("#log").html("<p class='msg-head'>Log</p>");
		$("#log").css('display','block');
	} else {
		$("#log").empty();
		$("#log").css('display','none');
	}
	gadgets.window.adjustHeight();
	return enabled;
}

function NotAvailable() {
    $("#options").empty();
    $("#content").empty();
	$("#info").html("<p class='msg-error' style='margin-right:35px;'>Only available in RM.</p>");
	gadgets.window.adjustHeight(25);
}

function ClearAll() {
	$("#info").empty();
	$("#result").empty();
	$("#log").empty();
}


