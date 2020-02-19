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



