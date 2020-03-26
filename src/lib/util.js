const util = {
    debounce: debounce,
    hideToolTip: hideToolTip,
    showToolTip: showToolTip
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

var validateRows = function(colDefs, mi, recs) {
    var flgValid = true;
    var alertMsg = "";
    var errorCells = [];
    var miKeys = Object.keys(mi);
    if (!Object.keys(mi).length) return true; //No modified items, notthing to validate
    var pkCol = colDefs.find(function(col, idx) {
        return (col.pk == true);
    });
    var pkIdx = pkCol.colIdx;
    // Limit validation to just updated rows
    var pkIDs = [];
    mi.each(function(rec, idx) {
        pkIDs.push(rec[pkCol.colName]);
    });
    var $rows = $("div.dojoxGrid-master-view").find("table.dojoxGrid-row-table");
    $rows = recs.filter(function(rec, idx) {
        // Check if this row is in the mi collection
        var atID = atIDs[idx];
        return (atID in mi);
    });
    // convert collection of tables to collection of rows
    var convRows = [];
    $rows.each(function(idx, row) {
        convRows[idx] = row.rows[0];
    });
    $rows = convRows;
    //Make a field required
    for (idx in colDefs) {
        var col = colDefs[idx];
        var colHdr = col.name.replace(/<i.*<\/i>/, "");
        var $cells = new Array();
        var $allCells = $("td[idx=" + idx + "]");  // Used for unique pk checking
        $rows.forEach(function(row, rdx) {
            var cell = row.cells[idx];
            cell = $(cell);
            $cells.push(cell);
        });
        var cellVals = [], allCellVals = [];
        $cells.forEach(function(cell, cdx) {
            cellVals[cdx] = cell.text();
            // cell.innerText || cell.textContent;
        });
        $allCells.each(function(rdx, cell) {
            allCellVals[rdx] = cell.innerText || cell.textContent;
        });
        if (col.required) {
            var emptyCells = $cells.filter(function(cell, idx) {
                return cell.text() == '';
            });
            if (emptyCells.length) {
                flgValid = false;
                errorCells.push(...emptyCells);
                alertMsg += ("Please set a value for " + colHdr + "\n");
            }
        }
        if (col.type == 'numeric') {
            var min = col.min;
            var max = col.max;
            //			var $cells = $("td[idx=" + idx +"]");
            //			var cellVals =[];
            var overMax = [], underMin = [];
            var nonNumbers = $cells.filter(function(cell, idx) {
                return isNaN(cell.text());
            });
            if (nonNumbers.length) {
                flgValid = false;
                errorCells.push(...nonNumbers);
                alertMsg += ("The value for  " + colHdr + " must be a number.\n");
            }
            if (max) {
                overMax = $cells.filter(function(cell, idx) {
                    return cell.text() > max;
                });
            }
            if (min != null) {
                underMin = $cells.filter(function(cell, idx) {
                    return cell.text() < min;
                });
            }

            if (overMax.length) {
                flgValid = false;
                errorCells.push(...overMax);
                alertMsg += ("The value for " + colHdr + " can be a maximum of " + max + "\n");
            }
            if (underMin.length) {
                flgValid = false;
                errorCells.push(...underMin);
                alertMsg += ("The value for " + colHdr + " cannot be less than " + min + "\n");
            }
        }
        if (col.unique) {
            const dups = $allCells.filter((i, c) => {
                //Find cells that have multiple matches in cellVals
                const cellVal = c.textContent;
                if (!cellVal || cellVal === '') return false;   //blanks are allowed in some unique value fields
                return allCellVals.indexOf(cellVal) !== allCellVals.lastIndexOf(cellVal);
            });
            //console.info(Array.from(dups)) // using Array.from so it can be logged
            if (dups.length) {
                flgValid = false;
                errorCells.push(...dups);
                alertMsg += ("Please use unique values for " + colHdr + "\n");
            }
        }

    }
    if (!flgValid) {
        errorCells = $(errorCells);
        errorCells.each(function(idx) {
            $(this).addClass("error");
        });
        errorCells[0].focus();
        var leftPos = $(errorCells[0]).scrollLeft();
        alert(alertMsg);
    }
    return flgValid;
}


