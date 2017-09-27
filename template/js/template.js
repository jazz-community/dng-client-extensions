/// <reference path="../../RM_API.d.ts" />
/*
 * description of this gadget.
 *
 * Created by Donat Hutter, donat.hutter@siemens.com, Siemens Schweiz AG
 * © Copyright Siemens AG 2017
 */

"use strict";
var RM;
var logEnabled = true;
var progressMax = 0;
var progressDone = 0;
var progressTime = 0;
var progressMsg = "";
var countLink = 0;
var countErr = 0;

var get = function (id) { return document.getElementById(id); };
var sourceType = "";
var targetType = "";
var itemsSelected = [];

// Main Function -   this function is run when the document is ready
$(function () {
    if (window.RM) {
        // The feature is present to address in the current context - Execute the extension behavior as normal
        setInfo("Define link types to be changed.");
        gadgets.window.adjustHeight();

        // Options
        $("#enableLog").prop('checked', logEnabled); // inital setting

        // .. look up the element with the id "enableLog"
        $("#enableLog").click(function () {
            logEnabled = $("#enableLog").prop('checked');
            newLog(logEnabled);
        });

        // register for selected items
        RM.Event.subscribe(RM.Event.ARTIFACT_SELECTED, function (selected) {
            itemsSelected = selected;
        });

        // register clear click events for buttons
        $("#changeClear").click(function () {
            location.reload(true); // reload the widget
        });

        $("#changeRun").click(function () {
            process();
        });
    } else {
        // The feature is not present, so any calls to the API would result in errors.
        notAvailable();
    }
});

function process() {
    var ok = false;
    sourceType = $('#sourceType').val();
    targetType = $('#targetType').val();
    if (sourceType.length == 0) {
        alert("Link types required.");
    } else if (sourceType == targetType) {
        alert("Nothing to change.");
    } else if (targetType.length == 0) {
        ok = confirm("Are you sure to delete '" + sourceType + "' links?");
    } else {
        ok = true;
    }
    if (ok) {
        newLog(logEnabled);
        var scope = $('input:radio[name=scope]:checked').val();
        if (scope == "scopeAll") {
            processAllArtifacts();
        } else {
            processSelectedArtifacts(itemsSelected);
        }
    }
    // dynamic widget size
    gadgets.window.adjustHeight();
}

function processAllArtifacts() {
    // get current module or collection
    RM.Client.getCurrentArtifact(function (opResultModule) {
        if (opResultModule.code === RM.OperationResult.OPERATION_OK) {
            var form = opResultModule.data.values[RM.Data.Attributes.FORMAT];
            if ((form === RM.Data.Formats.MODULE) || (form === RM.Data.Formats.COLLECTION)) {
                // read identifiers of all items in module or collection
                RM.Data.getContentsAttributes(opResultModule.data.ref, RM.Data.Attributes.IDENTIFIER, function (opResult) {
                    if (opResult.code === RM.OperationResult.OPERATION_OK) {
                        processAttributes(opResult.data);
                    } else {
                        error(errMsg("Error reading artifact", opResult));
                    }
                });
            } else {
                error("Function only works on modules, not on a: " + form);
            }
        } else {
            error(errMsg("Unable to determine current artifact", opResultModule));
        }
    });
}

// refs : RM.ArtifactRef[]
function processSelectedArtifacts(refs) {
    if (refs.length == 0) {
        error("No artifacts selected.");
    } else {
        // get identifier of selected artifact
        RM.Data.getAttributes(refs, RM.Data.Attributes.IDENTIFIER, function (opResult) {
            if (opResult.code === RM.OperationResult.OPERATION_OK) {
                processAttributes(opResult.data);
            } else {
                error(errMsg("Error reading artifact", opResult));
            }
        });
    }
}

/*RM.ArtifactAttributes[]*/
function processAttributes(refs) {
    countErr = 0;
    countLink = 0;
    progressDone = 0;
    progressMax = refs.length;
    info("Process " + progressMax + " artifacts ...");
    progressBarInit("Wait until finished ...");

    // iterate through all artifacts
    // item : RM.ArtifactAttributes
    refs.forEach(function (item) {
        var id = item.values[RM.Data.Attributes.IDENTIFIER];

        // get links of desired type
        RM.Data.getLinkedArtifacts(item.ref, sourceType, function (opResult) {
            if (opResult.code === RM.OperationResult.OPERATION_OK) {
                var linkset = opResult.data.artifactLinks;
                if (linkset.length > 0) {
                    changeLinks(id, opResult.data.artifactLinks); // process internal linkset only
                } else {
                    progressDone++; // no links for this id
                }
            } else {
                progressDone++;
                countErr++;
                error(errMsg(id + ": Get links failed", opResult));
            }
        });
    });
}

function changeLinks(id, linkset) {
	linkset.forEach(function(linkDefinition) {
		// RM.LinkDefinition<T>
		info(id + ": " + linkDefinition.targets.length + " link(s)");
		progressDone -= 2 * linkDefinition.targets.length; // delete + create
		progressDone++;

		var source = linkDefinition.art; // RM.ArtifactRef to source for all links described by this object
		var type = linkDefinition.linktype; // type of all the links, e.g. 'Satisfied By' or RM.Data.LinkTypes.LINK_TO
		linkDefinition.targets.forEach(function(target) {
			// delete existing link and create with new type
			RM.Data.deleteLink(source, type, target, function(opResult) {
				if (opResult.code === RM.OperationResult.OPERATION_OK) {
					// successfully deleted ... create new link
					progressDone++;
					RM.Data.createLink(source, targetType, target, function(opResult) {
						progressDone++;
						if (opResult.code === RM.OperationResult.OPERATION_OK) {
							// ... successfully created
							countLink++;
						} else {
							countErr++;
							error(errMsg(".. create error", opResult));
						}
					});
				} else {
					progressDone += 2; // delete + create
					countErr++;
					error(errMsg(".. delete error", opResult));
				}
			});
		});
	});
}

function progressBarInit(msg) {
    progressMsg = "";
    progressDone = 0;
    progressTime = 0;
    // make visible
    $("#progress").css('display', 'block');
    var bar = document.getElementById('progressbar');
    bar.max = (progressMax < 10) ? 10 : progressMax;
    var finalMessage = document.getElementById('result');
    finalMessage.innerHTML = msg;
    finalMessage.className = "";
    // start
    progressBarShow(0);
}

function progressBarShow(v) {
    var bar = document.getElementById('progressbar');
    var status = document.getElementById('status');
    status.innerHTML = progressTime + " sec";
    progressTime++;
    if (v > bar.max) {
        v = 1;
    } else {
        v++;
    }
    bar.value = v;
    var sim = setTimeout("progressBarShow(" + v + ")", 1000);
    if (progressDone >= progressMax) {
        bar.value = bar.max;
        clearTimeout(sim);
        var finalMessage = document.getElementById('result');
		if (countErr > 0) {
			finalMessage.innerHTML = countLink + " links created ... check log for errors.";
		} else {
			finalMessage.innerHTML = countLink + " links successfully created.";
		}
        finalMessage.className = (countErr > 0) ? "error important" : "success important";
        gadgets.window.adjustHeight();
    }
}

// ----- message functions
function errMsg(msg, err) {
    return msg + " (" + err.code + " = " + err.message + ")";
}

function newLog(enabled) {
    if (enabled) {
        $("#log").html("<p class='section-head'>Log</p>");
        $("#log").css('display', 'block');
    } else {
        $("#log").empty();
        $("#log").css('display', 'none');
    }
    gadgets.window.adjustHeight();
    return enabled;
}
function log(msg, style, append) {
    if (window.console && console.log) {
        console.log(msg); //for firebug
    }
    if (logEnabled) {
        var p = document.createElement("p");
        p.className = style;
        p.innerHTML = msg;
        if (!append) newLog(true);
        $(p).appendTo("#log");
        //gadgets.window.adjustHeight();
    }
}
function info(msg) {
    log(msg, "info", true);
}
function success(msg) {
    log(msg, "success", true);
}
function error(msg) {
    log(msg, "error", true);
}

function notAvailable() {
    $("#options").hide();
    $("#content").empty();

    $("#info").html("<p class='error important'>Only available in RM.</p>");
    gadgets.window.adjustHeight(40);
}

function setInfo(msg) {
    $("#info").html(msg);
}
