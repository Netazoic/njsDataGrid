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
    return function () {
        var context = this, args = arguments;
        var later = function () {
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

    let idxKeyField = Object.keys(gridColumns).find(k => {
        let col = gridColumns[k];
        return col.unique && col.required;
    })
    const colKeyField = gridColumns[idxKeyField];
    const keyField = colKeyField.colName;
    const keyFieldVal = record[keyField];
    if (keyFieldVal == null || keyFieldVal === "") throw new ImportException("KeyField for row is blank ... skipping");
    // recordID is not a true "PK", but a unique identifier for this record in the grid.
    let recordID = keyFieldVal;

    let idx = 0;
    let intVal = null;
    let gc;
    let recVal;
    try {
        Object.keys(gridColumns).forEach(function (k, idx) {
            gc = gridColumns[k];
            recVal = record[gc.colName];
            if(recVal!=null && recVal == "null") recVal = null;
            // required
            if (gc.required && (recVal == null || recVal == "")) {
                errMap.push(recordID + ": " + gc.header + ":: "
                    + " -- Required field missing.");
                return;
            }
            if (gc.unique) {
                if (recVal == null && gc.required) {
                    errMap.push(recordID + ": " + gc.header + ":: " + recVal +
                        " -- null value found for a required unique field");
                }
                else if (recVal != null) try {
                    let isUnique = checkUnique(recVal, gc, gridData, existingValsMap);
                    if (!isUnique) {
                        if (gc.colName == colKeyField.colName) {
                            errMap.push(recordID + ": " + gc.header + ":: " + recVal + " -- More than one grid row with same value for key field");
                        }
                        else errMap.push(recordID + ": " + gc.header + ":: " + recVal
                            + " -- Non-unique value found for field with unique index");
                    }

                } catch (ex) {
                    throw (ex);
                }
            }
            if (gc.min != null || gc.max != null) {
                try {
                    intVal = new Number(recVal);
                    if (gc.max != null && intVal > gc.max) {
                        errMap.push(recordID + ": " + gc.header + ":: " + recVal + " -- Value exceeds max value: " + gc.max);
                    }
                    if (gc.min != null && intVal < gc.min) {
                        errMap.push(recordID + ": " + gc.header + ":: " + recVal + " -- Value less than min value: " + gc.min);
                    }
                } catch (ex) {
                    if (gc.required)
                        errMap.push(recordID + ": " + gc.header + ":: " + recVal + " -- Non-numeric value found for required column with min/max");
                }

            }
        });
        if (errMap.length > 0) {
            // old jQuery code still needs to be translated over
            // if (!flgValid) {
            //     errorCells = $(errorCells);
            //     errorCells.each(function (idx) {
            //         $(this).addClass("error");
            //     });
            //     errorCells[0].focus();
            //     var leftPos = $(errorCells[0]).scrollLeft();
            //     alert(alertMsg);
            // }
        }
        // recValid = true;
        return errMap;
    } catch (ex) {
        throw new Exception(ex);
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
        Object.keys(gridData).forEach(function (k, idx) {
            let val = gridData[k][gc.colName];
            existingVals += ":" + val;
        });
        existingValsMap[gc.colName] = existingVals;

    }
    if (existingVals != null && existingVals.indexOf(recVal) >= 0) {
        let idx1 = existingVals.indexOf(recVal);
        let idx2 = existingVals.indexOf( recVal, idx1+1);
        if (idx2 >= 0) flgUnique = false;
    }
    return flgUnique;
}

