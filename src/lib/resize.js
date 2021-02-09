
import Vue from 'vue';

export function init(vm, headerClass, bodyClass) {
    vm.header = vm.$el.getElementsByClassName(headerClass)[0];
    vm.body = vm.$el.getElementsByClassName(bodyClass)[0];
    setResizeGrips(vm);
    vm.resizeStorageKey = vm.gridCode + "_columns_sizes";
    const savedWidths = localStorage.getItem(vm.resizeStorageKey);
    if (savedWidths) {
        const colWidths = savedWidths.split(",");
        syncColumnWidths(vm, colWidths);
    }
}

function debounce(func, wait, immediate) {
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

export function setResizeGrips(vm) {

    const headerCols = Array.from(vm.header.getElementsByTagName("th"));
    vm.grips = [];
    headerCols.forEach(th => {
        th.style.position = "relative";
        const grip = document.createElement("div");
        grip.className = "grip";
        grip.innerHTML = "&nbsp";
        grip.style.top = 0;
        grip.style.right = 0;
        grip.style.bottom = 0;
        grip.style.width = "5px";
        grip.style.position = "absolute";
        grip.style.cursor = "col-resize";
        grip.addEventListener("mousedown", onMouseDown.bind(vm));
        grip.addEventListener("click", onClick.bind(vm));
        th.appendChild(grip);
        vm.grips.push(grip);
    });
}

export function syncColumnWidths(vm, widthsOverride) {
    let widths;
    if (widthsOverride) widths = widthsOverride;
    else {
        widths = getColumnWidths(vm);
    }
    vm.columns.forEach((cd, i) => {
        Vue.set(cd, "width", widths[i]);
    });
    // FOLLOWING DEPRECATED
    // May want to bring it back if we go back to a two-table header/body setup.
    // The two-table setup would allow for a fixed header row.
    // ----------------------------------------
    // Sync body column widths with header column widths:
    // NOT NECESSARY since table headers and td elements all part of same table
    // let bodyCols = Array.from(
    //   vm.body.querySelectorAll("tr:first-child>td")
    // );
    // bodyCols = bodyCols.slice(1);  // Don't adjust the row index column
    // bodyCols.forEach((c, i) => {
    //   c.width = widths[i] + "px";
    // });
}

export function tearDown(vm) {
    vm.grips.forEach(grip => {
        grip.removeEventListener("mousedown", onMouseDown);
        grip.removeEventListener("click", onClick);
    });
    // document.removeEventListener("mousemove", onMouseMove);
    // document.removeEventListener("mouseup", onMouseUp);
}

//  --------------------  End of exported functions

function getColumnWidths(vm) {
    const headerCols = Array.from(vm.header.getElementsByTagName("th"));
    let widths = headerCols.map(col => {
        return col.width
            ? col.width + "px"
            : col.style.width
                ? col.style.width
                : col.clientWidth + "px";
    });
    widths = widths.slice(1); // don't use the row counter column
    return widths;
}

function onClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
}

function onMouseDown(e) {
    const vm = this;
    // if(!vm.body) vm.body = vm.$el.getElementsByClassName("table-body")[0];
    e.preventDefault();
    e.stopPropagation();
    const elm = e.target.parentNode;
    vm.thElm = elm;
    vm.startOffset = vm.thElm.offsetWidth - e.pageX;
    document.addEventListener("mousemove", onMouseMove.bind(vm));
    document.addEventListener("mouseup", onMouseUp.bind(vm));
}

function onMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();
    //console.log("mouseMove: " + e);
    const vm = this;
    if (vm.thElm) {
        const width = vm.startOffset + e.pageX;
        const colName = vm.thElm.dataset.columnName;
        if (greaterThanMinWidth(colName, width)) {
            vm.thElm.width = width; // + "px";
            syncColumnWidths(vm);
        }
    }
}
function onMouseUp(e) {
    const vm = this;
    e.preventDefault();
    e.stopPropagation();
    const elm = e.target.parentNode;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    const widths = getColumnWidths(vm);
    localStorage.setItem(vm.resizeStorageKey, widths);
    vm.thElm = undefined;
    syncColumnWidths(vm);
}

function greaterThanMinWidth(colName, width) {
    //TODO
    const minWidth = 1;
    if (width > minWidth) return true;
    else return false;
    // return width > minWidth;
}