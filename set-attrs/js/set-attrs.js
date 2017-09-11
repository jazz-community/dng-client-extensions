/// <reference path="../../RM_API.d.ts" />
/*
 Set Attributes
 Parses description text for attribute directives, and set attribute.

 Created By: Donat Hutter, donat.hutter@siemens.com
*/
"use strict";

// Main Function - this function is run when the document is ready
var logEnabled = true;
var progressDone = 0;
var progressMsg = "";
var itemsSelected = [];
var defaultAttrs = [];

$(function() {
	if (window.RM) {
		// The feature is present in the current context.
		// Execute the extension behavior as normal
		
		defaultAttrs = [RM.Data.Attributes.IDENTIFIER, RM.Data.Attributes.PRIMARY_TEXT, RM.Data.Attributes.ARTIFACT_TYPE];
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
		
		// register click event
		$("#delAttr").on("click", {remove:true}, process);
	} else {
		// The feature is not present, so any calls to the API would result in errors.
		NotAvailable();
	}
});

function process(event) {
	ClearAll();
	logEnabled = NewLog($("#enableLog").prop('checked'));

	var remove = event.data.remove;
	var scope = $('input:radio[name=scope]:checked').val();
	var attr = "attrSel"; // $('input:radio[name=attr]:checked').val();
	//if (attr == "attrAll") {
	//	error("Not implemented.", false);
	//} else {
		attr = $("#attrInput").val();
		if (attr.length == 0) {
			error("Attribute name must be provided.", false);
		} else if (scope == "scopeAll") {
			info("Process all ... please wait", false);
			processAllArtifacts(attr, defaultAttrs, remove);
		} else {
			info("Process selected ... please wait", false);
			processSelectedArtifacts(itemsSelected, attr, defaultAttrs, remove);
		}
		gadgets.window.adjustHeight();
}

function processAllArtifacts(searchAttr, defaultAttrs, remove) {
	var attrObj = attrList(searchAttr);
	// get current module
	RM.Client.getCurrentArtifact(function(artResult) {
		if (artResult.code === RM.OperationResult.OPERATION_OK) {
			var artType = artResult.data.values[RM.Data.Attributes.FORMAT];
			if ((artType === RM.Data.Formats.MODULE) || (artType === RM.Data.Formats.COLLECTION))  {
				var moduleRef = artResult.data.ref;
				// read attribute of all items in module
				RM.Data.getContentsAttributes(moduleRef, defaultAttrs.concat(attrObj.target), function(opResult) {
					if (opResult.code === RM.OperationResult.OPERATION_OK) {
						processAttributes(opResult, attrObj, remove);
					} else {
						error("Error reading attribute '" + attrObj.target + "' (" + opResult.message + ")", true);
					}
				});
			} else {
				error("Function only works on Modules, not on a: " + artResult.data.values[RM.Data.Attributes.FORMAT], true);
			}
		} else {
			error("Unable to determine current artifact (" + artResult.message + ").", true);
		}
	});
}

// refs : RM.ArtifactRef
function processSelectedArtifacts(refs, searchAttr, defaultAttrs, remove) {
	var attrObj = attrList(searchAttr);
	var attrType = {};
	if (refs.length == 0) {
		error("No artifacts selected.", true);
	} else {		
		RM.Data.getAttributes(refs, defaultAttrs.concat(attrObj.target), function(opResult){
			if (opResult.code === RM.OperationResult.OPERATION_OK) {
				processAttributes(opResult, attrObj, remove);
			} else {
				error(opResult.message, true);
			}
		});
	}
}

/*RM.ArtifactAttributes[]*/
function processAttributes(refs, attrObj, remove) {
	var totalItems = refs.data.length;
	info("Process " + totalItems + " artifacts ...", false);

	var toSave = []; // RM.ArtifactAttributes[]
	var regexAttrs = [];
	if (attrObj.search.length == 0) {
		// Regex [%any_attr=value]
		var regexAttr = /\[%([\w-\s]+)=([\w\s\/\."?@&:,;-]+)\]/ig;
		regexAttrs.push(regexAttr);
	} else {
		// Regex [%attr=value]
		for (var i = 0; i < attrObj.search.length; i++) { 
			regexAttrs.push(new RegExp('\\[%\\s*(' + attrObj.search[i] + ')\\s*=([\\w\\s\\/\\.\\"?@&:,;-]+)\\]',"ig"));
		}
	}

	// iterate through all artifacts
	// item : RM.ArtifactAttributes
	var countItem = 0;
	refs.data.forEach(function(item){		
		var id = item.values[RM.Data.Attributes.IDENTIFIER];
		var input = item.values[RM.Data.Attributes.PRIMARY_TEXT];

		//iterate through all attributes/regex
		var countChanges = 0;
		for (var i = 0; i < regexAttrs.length; i++) {
			var matchArray;
			if (remove) {
				while ((matchArray = regexAttrs[i].exec(input)) !== null)
				{
					countChanges += 1;
					input = input.replace(regexAttrs[i], "");
				}
				if (countChanges > 0) {
					item.values[RM.Data.Attributes.PRIMARY_TEXT] = input;
				}
            } else {
				while ((matchArray = regexAttrs[i].exec(input)) !== null)
				{
					countChanges += 1;
					var attr = attrObj.target[i]; // matchArray[1].trim();
					var value = matchArray[2].trim();
					// special attributes
					switch (attr.toLowerCase()) {
						case "business priority":
							attr = "Business Priority"
							value = parsePrio(value);
							break;
						case "status":
							attr = "Status";
							value = parseStatus(value);
							break;
						case "tags":
							break;
						case "rank":
							value = parseInt(value);
							break;
					};
					item.values[attr] = value;
				}
			}
		}
		// push to save list, but only if parser found a attribute
		if (countChanges > 0) {
			toSave.push(item);
			countItem += 1;
			info("+ " + id, true);
		} else {
			info("- " + id, true);
		}
	});

	// Perform a bulk save for all changed attributes
	//document.body.style.cursor = "wait";
	if (countItem == 0) {
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

function parsePrio(v) {
	if (v.indexOf("0") >= 0) return "0 - Mandatory";
	if (v.indexOf("1") >= 0) return "1 - Key";
	if (v.indexOf("2") >= 0) return "2 - Normal";
	if (v.indexOf("3") >= 0) return "3 - Optional";
	return "2 - Normal";
}

function parseStatus(v) {
	var valid = "New,Ready for PM Review,Ready for RD Review,Reviewed,Ready for Acceptance,Released,PM Rework,Rejected,Obsolete,Duplicated";
	var i = valid.toLowerCase().indexOf(v.toLowerCase());
	if (i >= 0) {
		return valid.substr(i, v.length);
	} else {
		return v;
	}
}

function parseEnum(req, attr, v) {
	var attrs = [].concat(attr.split(","));
	var valid = "";
	RM.Data.getValueRange(req, attrs, function (opResult) {
		if (opResult.code === RM.OperationResult.OPERATION_OK) {
			opResult.data.forEach(function (valueRange) {
				var vType = valueRange.valueType;
				switch(vType) {
					case RM.Data.ValueTypes.ENUMERATION:
						valid = valueRange.possibleValues.join("|");
						break;
					case RM.Data.ValueTypes.DATE:
						
						break;
					default:
						//showNoEditorAvailable(type);
				}
			});
		} else {
			error("EnumError:" + opResult.message, true);
		}
	});
	return valid;
}

function attrList(attrString) {
	var re1 = /\s*,\s*/;
	var re2 = /\s*:\s*/;
	var search = attrString.split(re1);
	var len = search.length;
	var target = [];
	for (var i = 0; i < len; i++) {
		var tmp = (search[i] + ":").split(re2);
		search[i] = tmp[0];
		target.push((tmp[1].length == 0) ? tmp[0] : tmp[1]);
	}
	return {search:search, target:target};
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
