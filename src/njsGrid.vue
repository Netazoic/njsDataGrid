<template>
<div>
    <div id="asyncticator-mount"/>
   <form v-if="flgLocalControls">
      <button @click.prevent.stop="saveGrid">Save</button> 
      <button @click.prevent.stop="addRow">Add Row</button>
      <button @click.prevent.stop="deleteRows">Delete</button>
      <button @click.prevent.stop="resetGrid">Reset</button>
      <button @click.prevent.stop="toggleExcelMenu" title="Export grid data" :disabled="!data.length">
          <i class="fa fas fa-file-excel" 
          :class="{disabled:!data.length}"
          title="export grid data as excel file">&nbsp;Export</i></button>
      <div id="menu-excel" :class="{hidden:!flgExcelMenu, visible:flgExcelMenu}" class="modal">
        <div class="modal-content">
        <span class="close" @click="toggleExcelMenu">&times;</span>
        <button @click.prevent.stop="exportExcelData(false,$event)" ><i class="fas fa-file-export" title="Export columns that are visible in the grid"></i>&nbsp; Filtered</button>
        <button @click.prevent.stop="exportExcelData(true,$event)" title="export grid data as excel file"><i class="fas fa-file-export" title="Export all data"></i>&nbsp; ALL</button>
        </div>
      </div>
      Search <input name="query" v-model="filterKey_DB"/>

  </form>
  <div>
      <select v-model="numDispRows"><option value="10">10</option><option value="50">50</option><option value="100">100</option><option value="-1">All</option></select>
      <span class="disp-row-offset-adjustor">
         <i class="fa fa-caret-left" :class="{disabled: recOffset==0}" @click.stop.prevent="adjustRecordOffset(-1)" ></i>
         <i class="fa fa-caret-right" :class="{disabled: upperDispIdx >= numAllRows}" @click.stop.prevent="adjustRecordOffset(1)"></i>
      </span>
      <span class="disp-row-count-selector">
        {{lowerDispIdx}}-{{ upperDispIdx }} of {{ numAllRows }}
      </span>

  </div>
  <table id='njs-grid'>
    <thead>
      <tr>
        <th @click="toggleSelectAll" style="width:2px;min-width:2px !important;">row</th>
        <th v-for="col in columns" 
          :key="col.colName"
          @click="sortBy(col.colName)"
          :class="{ active: sortKey == col.colName }"

          :style="{width: col.colWidth + 'px'}"
          >

          {{ col.colHdr | capitalize }}
          <span class="arrow" :class="sortOrders[col.colName] > 0 ? 'asc' : 'dsc'">
          </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row,idx) in dispData" :key="row[pk]" 
          class="table-data" 
          :class="{'selected': selectedRows[idx]==true, 'grid-lines':flgGridLines}"
          :ref="'tr-data-' + idx">
        <td @click.exact="toggleSelectRow(idx)" 
            @click.ctrl.exact="toggleSelectRow(idx,true)"
            @click.shift.exact="toggleSelectRow(idx,false,true)"
            style="width:2px;min-width:2px;"
          :tabindex="((idx+1)*100)">{{idx + recOffset + 1}}</td>
        <td v-for="col in columns" :key="col.colName"
          :tabindex=" ((idx+1) *100) + col.colIdx" 
          @focus="setFocus(row,col.colName, idx)"
          ><data-element
            :hasFocus="hasFocus(idx,col.colName)==true"
            @focusx="setFocus(row,col.colName, idx)"
            @blur="clearFocus(idx)"
            @update="noteUpdate(row,col,idx)"
            @change="noteUpdate(row,col,idx)"
            :row="row"
            :field="col.colName"
            :rowIdx="idx"
            :col="col"
            :ref="'data-element-' + idx + '-' + col.colName"
            />

        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="flgDebug"><input type="checkbox" v-model="flgShowData"/>Show Data  
      <span v-if="flgShowData"> 
        <input type="radio" v-model="debugData" value="showData"/>data 
        <input type="radio" v-model="debugData" value="showFilteredData">Filterd
        <input type="radio" v-model="debugData" value="showUpdates"/> updates
        <input type="radio" v-model="debugData" value="showNewrecs"/> new recs
        <input type="radio" v-model="debugData" value="showDeletes"/> deletes
        <input type="radio" v-model="debugData" value="showSelected"/> selected Rows
      </span>
  </div>
  <transition name="fade2">
    <div v-if="flgShowData">

      <transition name="fade2">
      <pre v-if="debugData == 'showData'">{{data}}</pre>
      <pre v-if="debugData == 'showFilteredData'">{{filteredData}}</pre>
      </transition>
      <transition name="fade2">
      <pre v-if="debugData == 'showUpdates'">{{updates}}</pre>
      <pre v-if="debugData == 'showNewrecs'">{{newrecs}}</pre>
      <pre v-if="debugData == 'showDeletes'">{{deletes}}</pre>
      <pre v-if="debugData == 'showSelected'">{{selectedRows}}</pre>
      </transition>
    </div>
  </transition>

</div>
</template>
<script>
import DataElement from "./components/DataElement.vue";
import as from "./lib/libAsync";
import axios from "axios";
import { stringify } from "querystring";
import uuid from "uuid/v1";
import Vue from "vue";
import moment from "moment";
import util from "./lib/util";

export default {
  name: "njsGrid",
  props: {
    pFilter: String,
    colDefs: Array,
    dataURL: String,
    dataDef: Array,
    pDispRows: Number,
    pDefaultRec: Object,
    urlSaveGrid: String
  },
  components: {
    DataElement
  },
  data: function() {
    var sortOrders = {};
    this.colDefs.forEach(function(col) {
      sortOrders[col.colName] = 1;
    });
    return {
      data: [],
      updates: {},
      deletes: {},
      newrecs: {},
      defaultRec: this.pDefaultRec || {},
      i_gridData: [],
      selectedRows: {},
      sortKey: "",
      numDispRows: this.pDispRows || 10,
      xfocusRow: 0,
      flgDebug: 1,
      flgLocalControls: true,
      flgShowData: false,
      flgDirty: false,
      flgGridLines: true,
      flgExcelMenu: false,
      filterKey: this.filterKey,
      recOffset: 0,
      sortOrders: sortOrders,
      debugData: "showData",
      idxAdd: 0,
      focusRow: 0,
      focusColumn: 0
    };
  },
  created() {
    as.setupAxiosIndicators(this.$http);
    this.initGrid();
    this.initDefaultRec();
  },
  watch: {
    pFilter(newVal) {
      this.filterKey = newVal;
    },
    filterKey(newVal) {
      this.recOffset = 0;
      return newVal;
    },
    dataURL(newVal) {
      this.initGrid();
    }
  },
  computed: {
    filterKey_DB: {
      //De-bounced filterKey
      get() {
        return this.filterKey;
      },
      set: util.debounce(function(newVal) {
        this.filterKey = newVal;
      }, 250)
    },
    columns() {
      const cols = this.colDefs.filter(function(col, idx) {
        return col.hidden !== true && col.visible !== false;
      });
      return cols;
    },
    filteredData: function() {
      var sortKey = this.sortKey;
      var keyLookup = null;
      var filterKey = this.filterKey && this.filterKey.toLowerCase();
      var flgDirty = this.flgDirty;
      var order = this.sortOrders[sortKey] || 1;
      var heroes = this.data;
      if (filterKey) {
        heroes = heroes.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return (
              String(row[key])
                .toLowerCase()
                .indexOf(filterKey) > -1
            );
          });
        });
      }
      if (sortKey) {
        // heroes = heroes.slice().sort(function(a, b) {
        //   a = a[sortKey];
        //   b = b[sortKey];
        //   return (a === b ? 0 : a > b ? 1 : -1) * order;
        // });
        const col = this.colDefs.find(function(el) {
          return el.colName == sortKey;
        });
        if (col.type === "select") {
          //ruh roh
          keyLookup = col.options;
        }
        // DEBUG
        keyLookup = null; // Testing performance difference
        heroes = heroes
          .slice()
          .sort(this.compareValues(sortKey, order, keyLookup));
      }
      //this.flgDirty = false;
      return heroes;
    },

    dispData() {
      let dispRecs, upperSliceIdx;
      if (!this.filteredData || !this.filteredData.length) {
        return [];
      }
      if (this.numDispRows == -1) {
        //Display all
        this.resetRecordOffset(0);
        dispRecs = this.filteredData;
      } else {
        upperSliceIdx = this.recOffset + new Number(this.numDispRows);
        dispRecs = this.filteredData.slice(this.recOffset, upperSliceIdx);
      }
      // console.log("dispData:numDispRows: " + this.numDispRows);
      // console.log("dispRecs length: " + dispRecs.length);
      // console.log("upperSliceIdx: " + upperSliceIdx);
      return dispRecs;
    },

    debounce(func, wait, immediate) {
      var timeout;
      return function() {
        debugger;
        var context = this,
          args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },
    pk() {
      const col = this.colDefs.find(function(el) {
        return el.pk;
      });
      if (col) return col.colName;
      else return null;
    },
    numAllRows() {
      const numAll = Object.keys(this.filteredData).length;
      return numAll;
    },
    lowerDispIdx() {
      return this.recOffset + 1;
    },
    upperDispIdx() {
      let upper;
      if (this.numDispRows == -1) {
        // if (isNaN(this.numDispRows)) {
        upper = this.numAllRows;
      } else {
        upper = this.recOffset - 0 + (this.numDispRows - 0);
      }
      if (upper > this.numAllRows) upper = this.numAllRows;
      return upper;
    }
  },
  filters: {
    capitalize: function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  },
  methods: {
    addRow: function() {
      this.clearSelected();
      let rec = Object.assign({}, this.defaultRec);
      // Set the pk to a uuid
      const colDefs = this.colDefs;
      const pkCol = colDefs.find(function(col) {
        return col.pk === true;
      });
      if (pkCol) {
        rec[pkCol.colName] = uuid();
      }
      // insert at top of stack
      this.data.unshift(rec);
      this.noteAdd(rec);
      //Select first element in the row
      //this.tabIndex + "_" + this.col.colName;
      //const refName = 100 + "_" + this.colDefs[0].colName;
      //const refName = "tr-data-0";
      // TODO  select first input not working
      // find first visible column
      let col = this.columns.find(col => {
        return col.hidden !== true;
      });
      //TODO figure out how to focus on new row
      // const refName = "data-element-0-" + col.colName;
      // var ref = this.$refs[refName];
      // if (ref) {
      //   var el = ref[0] ? ref[0] : ref;
      //   if (!el) {
      //     debugger;
      //   }
      //   if (el.$el) el = el.$el; //vue components
      //   el.focus();
      // }
    },

    clearFocus: function(idx) {
      this.focusRow = null;
      this.focusColumn = null;
    },

    clearSelected: function() {
      this.selectedRows = {};
    },
    // function for dynamic sorting
    compareValues(key, order = 1, keyLookup) {
      return function(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
          // property doesn't exist on either object
          return 0;
        }

        let varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
        let varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];
        if (varA == null) varA = "ZZZZZZZZZ";
        if (varB == null) varB = "ZZZZZZZZZ";
        if (keyLookup) {
          //Look up display values in an options list
          if (varA == "" || varB == "") {
            //Don't work so hard
          } else {
            const optA = keyLookup.find(function(opt) {
              return opt.value == varA;
            });
            const optB = keyLookup.find(function(opt) {
              return opt.value == varB;
            });
            varA = optA ? optA.label : varA;
            varB = optB ? optB.label : varB;
          }
        }

        const comparison = varA === varB ? 0 : varA > varB ? 1 : -1;
        return comparison * order;
      };
    },
    deleteRows() {
      const slctdCount = Object.keys(this.selectedRows).length;
      if (slctdCount == 0) return;
      //const flg = confirm("Delete " + slctdCount + " selected rows?");
      const flg = true;
      if (!flg) return;
      var rec;
      const vm = this;
      const pka = this.pk;
      var currentDeletes = {};
      // Load up the this.deletes collection before we start deleting things
      for (var idx in this.selectedRows) {
        delete this.selectedRows[idx]; // Unselect the row here??
        rec = this.filteredData[idx];
        if (!rec) continue; // Deleted row ??
        rec = Object.assign({}, rec); // Make a clone
        if (rec[pka]) Vue.set(this.deletes, rec[pka], rec);
        //Vue.set(vm.data, dataIdx, null);
        currentDeletes[rec[pka]] = rec[pka];
      }
      // Delete the original rec out of this.data
      // This will reactively remove the record from this.filteredData;
      for (var pk in currentDeletes) {
        const dataIdx = vm.data.findIndex(function(dataRec, idx) {
          return dataRec[pka] == pk;
        });
        vm.data.splice(dataIdx, 1);
      }
    },
    diffData() {
      // Does not work -- only a shallow compare
      let intersection = this.data.filter(x => {
        this.i_gridData.includes(x);
      });
      let difference = this.data.filter(x => !this.i_gridData.includes(x));
      return difference;
    },
    exportExcelData(flgAll) {
      const exportData = flgAll ? this.data : this.filteredData;
      if (!exportData || !exportData.length) {
        this.toggleExcelMenu();
        return;
      }
      var colsExport = [];
      for (var colIdx in this.colDefs) {
        col = this.colDefs[colIdx];
        if (col.hidden) continue;
        colsExport.push(col);
      }
      var tab_text = "<table border='2px'><tr bgcolor='#87AFC6'>\n";
      var textRange;
      var j = 0;
      var tab = document.getElementById("njs-grid"); // id of table
      var sa;
      var row, col, fldVal;
      tab_text += "<tr>";
      for (var colIdx in colsExport) {
        col = colsExport[colIdx];
        tab_text += "<th>" + col.colHdr + "</th>";
      }
      tab_text += "</tr>";
      for (j = 0; j < exportData.length; j++) {
        row = exportData[j];
        tab_text += "<tr>";
        for (var colIdx in colsExport) {
          col = colsExport[colIdx];
          fldVal = row[col.colName];
          if (fldVal === null) fldVal = "";
          tab_text += "<td>" + fldVal + "</td>";
        }
        tab_text += "</tr>\n";
      }
      tab_text = tab_text + "</table>";
      tab_text = tab_text.replace(/<A[^>]*>|<\/A>/g, ""); //remove if u want links in your table
      tab_text = tab_text.replace(/<img[^>]*>/gi, ""); // remove if u want images in your table
      tab_text = tab_text.replace(/<input[^>]*>|<\/input>/gi, ""); // reomves input params
      sa = window.open(
        "data:application/vnd.ms-excel," + encodeURIComponent(tab_text)
      );
      this.toggleExcelMenu();
      return sa;
    },

    getGridData(gridDataURL, dataDef) {
      if (dataDef) {
        this.gridData = dataDef;
        this._gridData = dataDef;
      } else {
        if (gridDataURL == null) return; // throw new Error("No data url specified");
        const vm = this;
        this.$http.get(gridDataURL).then(response => {
          var recs =
            response.data && response.data.items
              ? response.data.items
              : response.data;
          vm.data = recs;
          // vm.i_gridData = JSON.parse(JSON.stringify(vm.data)); //Save a copy
          vm.i_gridData = vm.data.slice(0);
        });
      }
    },
    hasFocus: function(idx, colName) {
      return this.focusRow == idx && this.focusColumn == colName;
    },
    initGrid() {
      // this.setGridColumns(this.colDefs);
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.getGridData(this.dataURL, this.dataDef);
    },
    initDefaultRec() {
      if (Object.keys(this.defaultRec).size) return; //Already set
      let col;
      for (let idx in this.colDefs) {
        col = this.colDefs[idx];
        let defaultVal;
        if (col.default) defaultVal = col.default;
        else if (col.type == "date") {
          var d = new Date(new Date().setHours(0, 0, 0.0));
          defaultVal = new moment.utc(d).format("YYYY-MM-DD");
        } else if (col.type == "timestamp") {
          let d = new Date(new Date().setHours(0, 0, 0, 0));
          defaultVal = new moment.utc(d).format("YYYY-MM-DDThh:mm:ss.SSS");
        }
        //  else if (col.type == "timestamp") defaultVal = moment.utc().valueOf();
        this.defaultRec[col.colName] = defaultVal;
      }
    },
    resetGrid() {
      // Reset to original condition on page load
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.selectedRows = {};
      this.sortKey = "";
      this.sortOrders = {};
      this.data = this.i_gridData.slice(0);
    },
    saveGrid() {
      var url = this.urlSaveGrid;
      //const diff = this.diffData();
      var dataGrid = {};
      //dataGrid.data = this.data;
      dataGrid.updates = this.updates;
      dataGrid.deletes = this.deletes;
      dataGrid.newrecs = this.newrecs;
      if (!url) {
        this.$emit("saveGrid", dataGrid);
      } else {
        var fd = new FormData();
        fd.append("dataGrid", JSON.stringify(dataGrid));
        var fLoad = function(ret) {
          alert("Grid updates saved");
        };
        var fErr = null;
        as.xhrSubmit(fd, url, fLoad, fErr).catch(function(err) {
          alert(err);
        });
      }
    },

    setFocus: function(row, colName, idx) {
      if (this.flgDebug >= 4)
        console.log(
          "setFocus: " + idx + ":" + colName + ":: " + this.xfocusRow
        );
      if (this.xfocusRow != idx) {
        this.clearFocus();
      }
      this.xfocusRow = idx;
      this.focusRow = idx;
      this.focusColumn = colName;
      //ref="'data-element-' + idx + '-' + col.colName"
      const myHasFocus = this.hasFocus(idx, colName);
    },
    resetRecordOffset(idx) {
      this.recOffset = idx;
    },
    adjustRecordOffset: function(direction) {
      // direction is 1 or -1
      let offset = this.recOffset + this.numDispRows * direction;
      offset = offset < 0 ? 0 : offset;
      this.recOffset = offset;
    },
    sortBy: function(key) {
      this.sortKey = key;
      var sortKey = key;
      let currVal = this.sortOrders[key];
      const newVal = this.sortOrders[key] * -1;
      this.sortOrders[key] = newVal;
      this.flgDirty = !this.flgDirty; // Trigger the filter/sort function.  For some reason setting new value into sortOrders not working to do this.
      //Vue.set(this.sortOrders, key, newVal);
      if (this.flgDebug > 3) {
        console.log(this.sortOrders);
      }
    },
    toggleExcelMenu() {
      this.flgExcelMenu = !this.flgExcelMenu;
    },

    toggleSelectAll() {
      if (Object.keys(this.selectedRows).length) {
        this.selectedRows = {};
        return false;
      } else {
        const vm = this;
        this.filteredData.forEach(function(el, idx) {
          Vue.set(vm.selectedRows, idx, true);
        });
        return true;
      }
    },
    toggleSelectRow(idx, flgCtrl, flgShift) {
      if (this.flgDebug >= 2) console.log(idx);
      const newVal = !this.selectedRows[idx];
      // Clear existing unless flgCtrl, flgShift
      if (!flgCtrl && !flgShift) this.selectedRows = {}; // re-init
      if (flgShift) {
        const lastIdx = Object.keys(this.selectedRows)[
          Object.keys(this.selectedRows).length - 1
        ];
        for (var idxS = lastIdx; idxS <= idx; idxS++) {
          Vue.set(this.selectedRows, idxS, newVal);
        }
      } else if (flgCtrl) {
        // Toggle this row in the selected set
        // TODO not working?
        // debugger;
        Vue.set(this.selectedRows, idx, newVal);
      } else {
        Vue.set(this.selectedRows, idx, newVal);
      }
    },
    noteAdd: function(row, col, idx) {
      Vue.set(this.newrecs, this.idxAdd, row);
      this.idxAdd++;
    },
    noteUpdate: function(row, col, idx) {
      if (this.flgDebug >= 3) {
        console.log("updated: " + idx + ": " + col.colName);
      }
      //this.updates.push(row);   // If we are using an array
      const pk = row[this.pk];
      Vue.set(this.updates, pk, row); // Only use with an object. Do this with an array if you want an array with a million null entries
    }
  }
};
</script>

<style scoped>
body {
  font-family: Helvetica Neue, Arial, sans-serif;
  font-size: 14px;
  color: #444;
}

table {
  border: 2px solid #7a8d84;
  border-radius: 3px;
  background-color: #fff;
}

th {
  background-color: #7a8d84;
  color: rgba(255, 255, 255, 0.66);
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
tr.grid-lines {
  border-bottom: 1px solid grey;
}

td {
  background-color: #f9f9f9;
}

th,
td {
  min-width: 120px;
  padding: 4px 8px;
}

th.active {
  color: #fff;
}

th.active .arrow {
  opacity: 1;
}

tr.selected {
  background-color: #2f7040 !important;
  color: rgb(33, 32, 37);
  vertical-align: middle;
  padding: 1.5em;
}

tr.selected td {
  background-color: #c8ccca !important;
}
.arrow {
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  margin-left: 5px;
  opacity: 0.66;
}

.arrow.asc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid #fff;
}

.arrow.dsc {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #fff;
}

/*Modal menu*/
/* The Modal (background) */
.modal {
  display: block; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
}

/* Modal Content/Box */
.modal-content {
  background-color: #fefefe;
  margin: 15% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  width: 100px; /* Could be more or less, depending on screen size */
}

/* The Close Button */
.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
.disp-row-count-selector {
  min-width: 500px;
}
.disp-row-offset-adjustor {
  font-size: 24px;
  margin-left: 2px;
}
.disp-row-offset-adjustor > i {
  margin: 10px;
}
.fa.disabled,
.fa[disabled],
.disabled > .fa,
[disabled] > .fa {
  opacity: 0.5;
  /*optional*/
  cursor: not-allowed;
  /*optional*/
  pointer-events: none;
}
.hidden {
  display: none;
}
.visible {
  display: block;
}
</style>
