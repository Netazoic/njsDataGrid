const util = {
    debounce: debounce,
    hideToolTip: hideToolTip,
    showToolTip: showToolTip,
    validateRecord: validateRecord
}

export default util;

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// Taken from David Walsh blog who got it from underscore
export function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function getPos(obj) {
    var rtn = [obj.offsetLeft, obj.offsetTop];
    while (obj.offsetParent != null) {
        var objp = obj.offsetParent;
        var objpName = objp.nodeName;
        if (objpName != 'BODY') { //ie @#$@#
            rtn[0] += objp.offsetLeft - objp.scrollLeft;
            rtn[1] += objp.offsetTop - objp.scrollTop;
        }
        obj = objp;
    }
    //rtn[1] += objp.offsetHeight;
    return rtn;
}

function hideToolTip(e) {
    var div = document.getElementById('ttPopUp');
    //div.style.display="none";
    $(div).hide(400);
}

function showToolTip(msg, evt) {
    var div = document.getElementById('ttPopUp');
    var $div = $(div);
    //toggle
    if ($div.is(":visible")) {
        $(div).hide(200);
        return;
    }
    if (!msg) return;
    var len = msg.length;
    var height = len / 2.5;
    var width = 300;
    if (height < 50) height = 50;
    var left = evt.pageX;
    //do a little centering
    if (left > 150) left = left - width / 2.5;
    var top = evt.pageY;
    var pos = getPos(evt.target);
    if (!msg) return;
    div.innerHTML = msg;
    div.style.position = "absolute";
    div.style.left = left + "px";
    div.style.top = top + "px";
    div.style.backgroundColor = "white";
    div.style.border = "1px solid black";
    div.style.width = width + "px";
    div.style.margin = "15px";
    div.style.padding = "15px";
    //div.style.height= height + 15 + "px";
    //div.style.display="block";
    $div.show(200);
}



function validateRecord(record, gridColumns, gridData, existingValsMap) {
    if (isBlank(record)) return false;
    let errMap = new Array();
    let recValid = false;
    let idxPKField, idxKeyField;

    idxPKField = Object.keys(gridColumns).find(k => {
        let col = gridColumns[k];
        return col.pk;
    });
    if (idxPKField == undefined) {
        idxKeyField = Object.keys(gridColumns).find(k => {
            let col = gridColumns[k];
            return col.unique && col.required;
        });
        idxPKField = idxKeyField;
    }
    if (idxPKField == undefined) throw new Error("Could not find PK for this grid. Check grid definition setup");
    const colKeyField = gridColumns[idxPKField];
    const keyField = colKeyField.colName;
    const keyFieldVal = record[keyField];
    // recordID may or may not be a true "PK", but a unique identifier for this record in the grid.
    let recordID = keyFieldVal;

    let idx = 0;
    let intVal = null;
    let gc;
    let recVal, colIdx;
    try {
        Object.keys(gridColumns).forEach(function(k, idx) {
            gc = gridColumns[k];
            colIdx = idx;
            recVal = record[gc.colName];
            if (recVal != null && recVal == "null") recVal = null;
            let errPrefix = recordID + ": " + colIdx + ": " + gc.colName + ": " + gc.header + ":";
            // required
            if(gc.required){
                if ((recVal == null || recVal.trim() == "")) {
                errMap.push(errPrefix + recVal + ": Required field missing.");
                return;
                }
            }

            if (gc.unique) {
                if (recVal == null && gc.required) {
                    errMap.push(errPrefix + recVal +
                        ": null value found for a required unique field");
                }
                else if (recVal != null  && recVal != '') try {
                    let isUnique = checkUnique(recVal, gc, gridData, existingValsMap);
                    if (!isUnique) {
                        if (gc.colName == colKeyField.colName) {
                            errMap.push(errPrefix + recVal + ": More than one grid row with same value for key field");
                        }
                        else errMap.push(errPrefix + recVal + ": Non-unique value found for a column that must have unique values");
                    }

                } catch (ex) {
                    throw (ex);
                }
            }
            if (gc.type == 'numeric') {
                if (recVal != null && isNaN(recVal)) {
                    errMap.push(errPrefix + recVal + ": Value must be a number.");
                }
            }
            if (gc.min != null || gc.max != null) {
                try {
                    intVal = new Number(recVal);
                    if (gc.max != null && intVal > gc.max) {
                        errMap.push(errPrefix + recVal + ": Value exceeds max value -- " + gc.max);
                    }
                    if (gc.min != null && intVal < gc.min) {
                        errMap.push(errPrefix + recVal + ": Value less than min value -- " + gc.min);
                    }
                } catch (ex) {
                    if (gc.required)
                        errMap.push(errPrefix + recVal + ": Non-numeric value found for required column with min/max");
                }

            }
            if (gc.maxLen != null && gc.maxLen > 0 && recVal != null) {
                let intLen = recVal.length;
                if (gc.maxLen < intLen) {
                    errMap.push(errPrefix + recVal
                        + ": Value longer than maximum length for this column -- " + gc.maxLen);
                }

            }
        });
        // recValid = true;
        return errMap;
    } catch (ex) {
        throw new Error(ex);
    }
}

function isBlank(record) {
    let keys = Object.keys(record);
    for (let idx = 0; idx < keys.length; idx++) {
        let k = keys[idx]
        if (record[k] != null && !record[k] !== ("")) {
            return false;
        }
    }
    return true;
}

function checkUnique(recVal, gc, gridData, existingValsMap) {
    // Check a value that should be unique against a runtime generated map of unique vals saved by column name
    // This is used to make sure that unique values are not entered twice in the same grid
    let flgUnique = true;
    if (recVal == null) return true;  // Why are you wasting my time?
    // Get the existing uniqueVals collection for this column if not already generated
    if (!existingValsMap) throw new Error("Must define an existingValsMap to use as param 4");
    let existingVals = existingValsMap[gc.colName];
    if (!existingVals) {
        existingVals = "";
        Object.keys(gridData).forEach(function(k, idx) {
            let val = gridData[k][gc.colName];
            if(!val) return;
            existingVals += ":" + val.toUpperCase();
        });
        existingValsMap[gc.colName] = existingVals;

    }
    const checkVal = recVal.toUpperCase();
    if (existingVals != null && existingVals.indexOf(checkVal) >= 0) {
        let idx1 = existingVals.indexOf(checkVal);
        let idx2 = existingVals.indexOf(checkVal, idx1 + 1);
        if (idx2 >= 0) flgUnique = false;
    }
    return flgUnique;
}



