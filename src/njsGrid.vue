<template>
  <div id="njs-wrapper">
    <div id="asyncticator-mount" />
    <div id="div-controls-container">
      <div id="div-local-controls">
        <form v-if="flgLocalControls">
          <div id="div-edit-controls" v-if="!flgReadOnly">
            <button
              :class="btnClasses"
              @click.prevent.stop="saveGrid"
              type="button"
              title="Save table"
            >
              <i
                class="fa fa-save"
                :class="{ 'alert-el': flgDirty }"
              />Save
            </button>
            <button
              :class="btnClasses"
              @click.prevent.stop="addRow"
              type="button"
              title="Add Row"
            >
              <i
                class="fa fa-plus"               
              />Add Row
            </button>
            <button
              :class="btnClasses"
              @click.prevent.stop="deleteRows"
              type="button"
              title="Delete current row or selected rows"
            >
              <i
                class="fa fa-trash"
              />Delete Row
            </button>
            <button
              v-if="flgReset"
              :class="btnClasses"
              @click.prevent.stop="resetGrid"
              type="button"
              title="Revert current unsaved edits and deletes"
            >
              <i
                class="fa fa-redo"
             />Reset
            </button>
            <!-- Custom buttons from the parent component go here -->
            <slot name="other-buttons"></slot>
          </div>

          <!-- /#flgLocalControls -->
          <button
            @click.prevent.stop="toggleExcelMenu"
            title="Export grid data"
            :disabled="!data.length"
            v-if="flgExportEnabled"
          >
            <i
              class="fa fas fa-file-excel"
              :class="{ disabled: !data.length }"
              title="export grid data as excel file"
              >&nbsp;Export</i
            >
          </button>
          <div
            id="menu-excel"
            :class="{ hidden: !flgExcelMenu, visible: flgExcelMenu }"
            class="modal"
          >
            <div class="modal-content">
              <span class="close" @click="toggleExcelMenu">&times;</span>
              <button @click.prevent.stop="exportExcelData(false, $event)">
                <i
                  class="fas fa-file-export"
                  title="Export columns that are visible in the grid"
                ></i
                >&nbsp; Filtered
              </button>
              <button
                @click.prevent.stop="exportExcelData(true, $event)"
                title="export grid data as excel file"
              >
                <i class="fas fa-file-export" title="Export all data"></i>&nbsp;
                ALL
              </button>
            </div>
          </div>
        </form>
        <div id="div-filter-controls">
          <span @click.ctrl.alt.shift.stop.prevent="toggleDebug">Search</span>
          <div style="border:1px solid black; width:170px; display:inline; padding:2px;">
          <input
            name="query"
            v-model="filterKey_DB"
            @keydown.enter.prevent="nullOp"
            autocomplete="off"
            class="filter-input"
            style="border:none !important; "
          />
          <i class="fa fa-times" @click="clearFilter"/>
          </div>
          <select class="num-rows-select" v-model="numDispRows">
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="-1">All</option>
          </select>
          <span class="disp-row-offset-adjustor">
            <i
              class="fa fa-caret-left"
              :class="{ disabled: recOffset == 0 }"
              @click.stop.prevent="adjustRecordOffset(-1)"
            ></i>
            <i
              class="fa fa-caret-right"
              :class="{ disabled: upperDispIdx >= numAllRows }"
              @click.stop.prevent="adjustRecordOffset(1)"
            ></i>
          </span>
          <span class="disp-row-count-selector"
            >{{ lowerDispIdx }}-{{ upperDispIdx }} of
            {{ filteredData.length }}</span
          >
        </div>
      </div>
    </div>
    <div id="table-wrapper">
      <table id="njs-grid">
        <thead class="table-header">
          <tr>
            <th
              @click="toggleSelectAll"
              style="width: 55px; min-width: 55px !important"
            >
              row
              <i
                class="fa fa-info-circle"
                @click.stop="showHelp(helpSelect, $event)"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.colName"
              :data-column-name="col.colName"
              @mouseout="hideHelp"
              class="njs-th"
              :class="headerClasses(col.colName, col.headerClasses)"
              :style="{ width: col.width, 'min-width': col.width }"
            >
              <span @click.stop.prevent.exact="sortBy(col.colName)">
                <span v-html="col.header"></span>
              </span>
              <span v-if="col.help"
                >&nbsp;
                <i
                  v-if="col.help"
                  class="fa fa-info-circle"
                  @click.stop="showHelp(col.help, $event)"
                />
              </span>
              <span
                class="arrow"
                :class="sortOrders[col.colName] > 0 ? 'asc' : 'dsc'"
                @click.stop.prevent.exact="sortBy(col.colName)"
              ></span>
            </th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr
            v-for="(row, idx) in dispData"
            :key="idx"
            class="table-data"
            :class="{
              selected: selectedRows[idx] == true,
              'grid-lines': flgGridLines,
            }"
            :ref="'tr-data-' + idx"
          >
            <td
              :class="{ 'grid-lines': flgGridLines, error: row.hasError }"
              style="width: 2px; min-width: 2px"
              :tabindex="(idx + 1) * 100"
            >
            <input type="radio" 
                class="row-select-radio"
                :id="'active-' + idx"
                @click.exact="toggleSelectRow(idx,true)"
                @click.ctrl.exact="toggleSelectRow(idx, true)"
                @click.shift.exact="toggleSelectRow(idx, false, true)"
                :value=true
                v-model="actives[idx]"
             />
              <span class="row-number">
              {{ idx + recOffset + 1 }}
              </span>
            </td>
            <TD_Element
              v-for="col in columns"
              :key="col.colName"
              :class="{ 'grid-lines': flgGridLines, error: col.hasError }"
              :tabindex="(idx + 1) * 100 + col.colIdx"
              :hasFocus="hasFocus(idx, col.colIdx)"
              :error="hasError(idx, col.colName, row[pk])"
              @focusEl="setFocus(idx, col.colIdx)"
              @keyup.shift.tab="handleBackTab(row, col, idx, $event)"
              @keyup.ctrl.down="handleDownArrow(row, col, idx)"
              @backtab="handleBackTab(row, col, idx)"
              @ctrldown="handleArrow('down')"
              @ctrlup="handleArrow('up')"
              @click.exact.stop="setFocus(idx, col.colIdx)"
              @blur="clearFocus(idx)"
              @update="noteUpdate(row, col, idx)"
              @change="noteUpdate(row, col, idx)"
              :row="row"
              :field="col.colName"
              :rowIdx="idx"
              :col="col"
              :ref="'data-element-' + idx + '-' + col.colName"
            />
          </tr>
        </tbody>
      </table>
    </div>
    <div id="ttPopUp" style="position: absolute"></div>
    <debug-window :flgShow="flgDebug" :data="data" :newrecs="newrecs" 
        :updates="updates" :deletes="deletes" 
        :selectedRows="selectedRows"
        :filteredData="filteredData"
        :actives="actives"
        @togglePK="togglePK"
        />
  </div>
</template>
<script>
import TD_Element from "./components/TD_Element.vue";
import as from "./lib/libAsync";
import axios from "axios";
import { stringify } from "querystring";
import uuid from "uuid/v1";
import Vue from "vue";
import moment, { min } from "moment";
import util from "./lib/util";
import * as resize from "./lib/resize";
// Font Awesome
import "@fortawesome/fontawesome-free/css/all.min.css";
import DebugWindow from "./components/DebugWindow.vue";

export default {
  name: "njsGrid",
  props: {
    gridCode: String,
    gridID: String,
    pFilter: String,
    colDefs: Array,
    dataURL: String,
    dataDef: Array,
    readOnly: Boolean,
    pDispRows: Number,
    pDefaultRec: Object,
    urlSaveGrid: String,
    pSendOrigGridOnSave: String,
    flgReset: Boolean,
    btnClasses: String,
  },
  components: {
    TD_Element,
    DebugWindow,
  },
  data: function () {
    var sortOrders = {};
    this.colDefs.forEach(function (col) {
      sortOrders[col.colName] = 1;
    });
    return {
      data: [],
      updates: {},
      deletes: {},
      newrecs: {},
      actives: {},
      errors: [],
      defaultRec: this.pDefaultRec || {},
      i_gridData: [], //Saved version of original grid data, for reset. //TODO only working at shallow-clone level
      selectedRows: {},
      sortKey: "",
      numDispRows: this.pDispRows || 100,
      numAllRecs: 0, // Total # of recs retrieved from the database
      numMaxRecs: 10000, // Maximum number of recs to retrieve from database at any one time
                        //TODO enforce this limit on DB queries
      xfocusRow: 0,
      flgDebug: 0,
      flgExportEnabled: false,
      flgLocalControls: true,
      flgReadOnly: this.readOnly || false,

      flgGridLines: true,
      flgExcelMenu: false,
      flgSendOrigGridOnSave: this.pSendOrigGridOnSave || false,
      filterKey: this.filterKey,
      recOffset: 0,
      sortOrders: sortOrders,

      idxAdd: 0,
      focusRow: undefined,
      focusCol: undefined,
      recLIMIT: 1000,
      helpSelect:
        "Select radio button to choose row. Selected rows can be saved for re-loading, or deleted as a batch.",
    };
  },
  created() {
    as.setupAxiosIndicators(this.$http);
    this.initGrid();
    this.initDefaultRec();
  },
  mounted() {
    const vm = this;
    document.addEventListener("ctrl-down", this.handleDownArrow);
    this.setFixedHeader();
  },
  watch: {
    colDefs(newVal) {
      if (!newVal || !newVal.length) return;
      const vm = this;
      newVal.forEach(function (col) {
        vm.sortOrders[col.colName] = 1;
      });
      // set the column resize handles after a colDef change
      // need to wait for a nextTick to allow th elements to be mounted

      this.$nextTick(function () {
        resize.init(vm, "table-header");
      });
    },
    pDefaultRec(newVal) {
      this.defaultRec = newVal;
      this.initDefaultRec();
    },
    pFilter(newVal) {
      this.filterKey = newVal;
    },
    filterKey(newVal) {
      this.recOffset = 0;
      if (this.focusRow !== undefined) this.clearFocus();
      if(this.numAllRecs === this.numMaxRecs){
        // Query the DB
        this.getGridData(this.dataURL_Comp, this.dataDef);
      }
      return newVal;
    },
    dataURL(newVal) {
      // this.initGrid();
      // console.log(newVal);
    },
    dataURL_Comp() {
      
    },
  },
  computed: {
    dataURL_Comp() {
      let url = this.dataURL;
      // if(this.numAllRecs >= this.recLIMIT){
      if (this.filterKey && this.filterKey.length >= 2) {
        url += "&filterKey=" + this.filterKey;
      }
      // }
      return url;
    },
    filterKey_DB: {
      //De-bounced filterKey
      get() {
        return this.filterKey;
      },
      set: util.debounce(function (newVal) {
        this.filterKey = newVal;
      }, 250),
    },
    flgDirty: {
      get() {
        let flg = true;
        if (
          !Object.keys(this.actives).length &&
          !Object.keys(this.updates).length &&
          !Object.keys(this.newrecs).length &&
          !Object.keys(this.deletes).length
        )
          flg = false;
        return flg;
      },
      set(newVal) {
        return newVal;
      },
    },
    columns() {
      const vm = this;
      const cols = this.colDefs.filter(function (col, idx) {
        return col.hidden !== true && col.visible !== false;
      });
      //Make sure we have column idxs
      for (let idx = 0; idx < cols.length; idx++) {
        cols[idx]["colIdx"] = idx;
      }
      this.$nextTick(function () {
        resize.init(vm, "table-header");
      });
      return cols;
    },
    filteredData: function () {
      var filterKey = this.filterKey && this.filterKey.toLowerCase();
      var flgDirty = this.flgDirty;
      var heroes = this.data;
      if (filterKey) {
        heroes = heroes.filter(function (row) {
          return Object.keys(row).some(function (key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1;
          });
        });
      }

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

    pk() {
      const col = this.colDefs.find(function (el) {
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
    },
  },
  filters: {
    capitalize: function (str) {
      try {
        if (str == null) return null;
        return str.charAt(0).toUpperCase() + str.slice(1);
      } catch (err) {
        // column has no value for header
      }
    },
  },
  methods: {
    nullOp: function (evt) {
      // console.log(evt);
      //nada
    },
    addRow: function () {
      this.clearFocus();
      let rec = Object.assign({}, this.defaultRec);
      let pk;

      const colDefs = this.colDefs;
      const pkCol = colDefs.find(function (col) {
        return col.pk === true;
      });
      if (pkCol) {
        // Set the pk to a uuid
        pk = uuid();
        rec[pkCol.colName] = pk;
      }
      // insert at top of stack
      this.data.unshift(rec);
      this.noteAdd(rec, pk);
      // this.flgDirty = true;
      this.incrementSelected();
      //Select first element in the row
      const vm = this;
      this.$nextTick(() => {
        vm.setFocus(0, 0);
        //force a recompute
        const myHasFocus = this.hasFocus();
      });
    },
    clearFilter(){
      this.filterKey_DB = "";
    },
    clearFocus: function (idx) {
      this.focusRow = undefined;
      this.focusColumn = undefined;
    },

    clearSelected: function () {
      this.selectedRows = {};
    },

    // function for dynamic sorting
    compareValues(key, order = 1, keyLookup, col) {
      return function (a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
          // property doesn't exist on either object
          return 0;
        }
        let varA, varB;
        if (col.type === "string") {
          varA = a[key].toUpperCase();
          varB = b[key].toUpperCase();
        } else if (col.type === "integer") {
          varA = parseInt(a[key], 10);
          if (isNaN(varA)) varA = -999999;
          varB = parseInt(b[key], 10);
          if (isNaN(varB)) varB = -999999;
        } else {
          varA = a[key];
          varB = b[key];
        }
        // let varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
        // let varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];
        if (varA == null) varA = "ZZZZZZZZZ";
        if (varB == null) varB = "ZZZZZZZZZ";

        if (keyLookup) {
          //Look up display values in an options list
          if (varA == "" || varB == "") {
            //Don't work so hard
          } else {
            const optA = keyLookup.find(function (opt) {
              return opt.value == varA;
            });
            const optB = keyLookup.find(function (opt) {
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
      //Clear negative selected rows
      const vm = this;
      let slctdCount = Object.keys(this.selectedRows).length;
      if (slctdCount == 0) {
        // push the current focusRow into selectedRows
        // focusRow is the idx of the currentently focused row
        vm.$set(this.selectedRows, this.focusRow, true);
      }
      if (slctdCount) {
        Object.keys(this.selectedRows).forEach(function (key, idx) {
          if (!vm.selectedRows[key]) {
            delete vm.selectedRows[key];
            slctdCount--;
          }
        });
        if (slctdCount == 0) return;
      }
      //const flg = confirm("Delete " + slctdCount + " selected rows?");
      const flg = true;
      if (!flg) return;
      var rec;

      const pka = this.pk;
      var currentDeletes = {};
      // Delete in reverse order
      let reversedIdx = Object.keys(this.selectedRows).reverse();
      for (var idx in reversedIdx) {
        let key = reversedIdx[idx];
        vm.$delete(this.selectedRows, key);
        vm.$delete(this.actives, key);
        rec = this.filteredData[key];
        if (!rec) continue; // Deleted row ??
        let rec2 = Object.assign({}, rec); // Make a clone
        let pk = rec2[pka];
        vm.$set(this.deletes, pk, rec2);
        //vm.$set(vm.data, dataIdx, null);
        currentDeletes[pk] = rec2;
        //Delete the record from filteredData
        key = key - 0; //convert key to a number
        this.filteredData.splice(key, 1);

        // Delete the record from updates if included in that collections
        vm.$delete(this.updates, pk);
      }
      //Don't bother sending deletes for new records -- they aren't in the database anyway
      for (var pk in currentDeletes) {
        if (this.newrecs[pk]) {
          vm.$delete(vm.newrecs, pk); // for reactive changes
          vm.$delete(vm.deletes, pk); // for reactive changes
        }
      }
      this.$emit("noteDelete");
      vm.$forceUpdate();
      // this.flgDirty = true;
    },
    diffData() {
      // Does not work -- only a shallow compare
      let intersection = this.data.filter((x) => {
        this.i_gridData.includes(x);
      });
      let difference = this.data.filter((x) => !this.i_gridData.includes(x));
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
        tab_text += "<th>" + col.header + "</th>";
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

        this.$http.get(gridDataURL).then((response) => {
          var recs =
            response.data && response.data.items
              ? response.data.items
              : response.data;
          vm.data = recs;
          if (response.data && response.data.items) {
            //rsObj
            vm.numAllRecs = response.data.numRows;
          } else {
            vm.numAllRecs = vm.data.length;
          }

          // vm.i_gridData = JSON.parse(JSON.stringify(vm.data)); //Save a copy
          vm.i_gridData = vm.data.slice(0);
        });
      }
    },
    handleArrow: function (direction) {
      let focusRow = this.focusRow;
      if (direction == "down") focusRow++;
      else focusRow--;
      this.setFocus(focusRow, this.focusCol);
    },
    handleBackTab: function (row, col, rowIdx, $event) {
      let newColIdx = col.colIdx - 1;
      if (newColIdx < 0) newColIdx = 0;
      // //Set focus to previous column
      this.setFocus(rowIdx, newColIdx);
      if (this.flgDebug >= 4)
        console.log("handleBackTab: focus on " + newColIdx);
    },
    hasError: function (idx, colName, rowID) {
      const err = this.errors.find((err) => {
        return err.rowID == rowID && err.colName == colName;
      });
      return err;
    },
    hasFocus: function (idx, colIdx) {
      if (this.focusRow === idx && this.focusCol === colIdx) {
        return true;
      } else return false;
      return;
      // return false;
    },
    headerClasses(colName, colClassStr) {
      let classArr;
      if (colClassStr) classArr = colClassStr.split(" ");
      else classArr = new Array();
      if (this.sortKey == colName) {
        classArr.push("active");
      }
      return classArr.join(" ");
    },
    hideHelp() {
      util.hideToolTip();
    },
    incrementSelected() {
      if (Object.keys(this.selectedRows).length == 0) return;
      let newSelected = {};
      const vm = this;
      Object.keys(this.selectedRows).forEach((rowIdx) => {
        let newIdx = rowIdx - 0 + 1;
        newSelected[newIdx] = vm.selectedRows[rowIdx];
      });
      this.selectedRows = newSelected;
      this.actives = this.selectedRows;
    },
    initGrid() {
      // this.setGridColumns(this.colDefs);
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.getGridData(this.dataURL_Comp, this.dataDef);
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
    isActive: function (row) {
      if (!this.pk) return false;
      const pk = row[this.pk];
      const isActive = this.actives[pk] != null;
      // console.log(pk + " active: " + isActive);
      return isActive;
    },
    resetGrid() {
      // Reset to original condition on page load
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.selectedRows = {};
      this.sortKey = "";
      this.sortOrders = {};
      // this.flgDirty = false;
      this.data = this.i_gridData.slice(0);
      this.$emit("reset");
    },
    saveGrid() {
      if (!this.flgDirty) {
        this.$emit("noSave");
        return false;
      }
      var url = this.urlSaveGrid;
      //const diff = this.diffData();
      var dataGrid = {};
      //dataGrid.data = this.data;
      // push all active rows into updates if not already there
      const vm = this;
      Object.keys(this.actives).forEach((rowIdx) => {
        const row = vm.filteredData[rowIdx];
        const pk = row[vm.pk];
        if (!vm.updates[pk]) {
          vm.updates[pk] = row;
        } else {
          delete vm.actives[rowIdx];
        }
      });

      dataGrid.gridID = this.gridID;
      dataGrid.updates = this.updates;
      dataGrid.deletes = this.deletes;
      dataGrid.newrecs = this.newrecs;
      // validate grid before save
      let gridErrors = this.validateGrid(dataGrid);
      if (gridErrors.length !== 0) {
        // remove the updates added by active records collection
        Object.keys(this.actives).forEach((rowIdx) => {
          const row = vm.filteredData[rowIdx];
          const pk = row[vm.pk];
          delete vm.updates[pk];
        });
        return false;
      }

      //remove newrecs from updates collection
      for (let key in dataGrid.newrecs) {
        delete dataGrid.updates[key];
      }
      if (this.flgSendOrigGridOnSave) {
        dataGrid.origGrid = this.i_gridData;
      }
      if (!url) {
        this.$emit("saveGrid", dataGrid);
      } else {
        var fd = new FormData();
        fd.append("dataGrid", JSON.stringify(dataGrid));
        var fLoad = function (ret) {
          // nada
        };
        var fErr = null;
        const vm = this;
        as.xhrSubmit(fd, url, fLoad, fErr)
          .then(function (ret) {
            // Clear the collections on a successful save
            vm.deletes = {};
            vm.updates = {};
            vm.newrecs = {};
            vm.actives = {};
            vm.selectedRows = {};
            // vm.flgDirty = false;
            // alert("Grid updates saved");
            vm.$nextTick(function () {
              vm.$emit("saveGrid"); //For tracking flgDirty in parent container
            });
          })
          .catch(function (err) {
            alert(err);
          });
      }
    },
    setFixedHeader() {
      document
        .getElementById("table-wrapper")
        .addEventListener("scroll", function () {
          var translate = "translate(0," + this.scrollTop + "px)";
          this.querySelector("thead").style.transform = translate;
        });
    },

    setFocus: function (rowIdx, colIdx) {
      if (this.xfocusRow != rowIdx) {
        this.clearFocus();
      }
      this.xfocusRow = rowIdx;
      this.focusRow = rowIdx;
      this.focusCol = colIdx;
      //ref="'data-element-' + rowIdx + '-' + col.colName"
      const myHasFocus = this.hasFocus(rowIdx, colIdx);
      if (this.flgDebug >= 5)
        console.log(
          "setFocus: " + rowIdx + ":" + colIdx + ":: " + this.xfocusRow
        );
    },

    showHelp(helpText, evt) {
      const tgt = evt.target;
      util.showToolTip(helpText, evt);
      //alert(helpText);
    },
    sortData(sortKey) {
      let keyLookup;
      const order = this.sortOrders[sortKey] || 1;
      const col = this.colDefs.find(function (el) {
        return el.colName == sortKey;
      });
      if (col.type === "select") {
        //ruh roh
        keyLookup = col.options;
      }
      // DEBUG
      keyLookup = null; // Testing performance difference
      const sortedData = this.data
        .slice()
        .sort(this.compareValues(sortKey, order, keyLookup, col));
      this.data = sortedData;
    },
    resetRecordOffset(idx) {
      this.recOffset = idx;
    },
    adjustRecordOffset: function (direction) {
      // direction is 1 or -1
      let offset = this.recOffset + this.numDispRows * direction;
      offset = offset < 0 ? 0 : offset;
      this.recOffset = offset;
    },
    sortBy: function (key) {
      this.clearFocus();
      this.sortKey = key;
      var sortKey = key;
      let currVal = this.sortOrders[key];
      const newVal = this.sortOrders[key] * -1;
      this.sortOrders[key] = newVal;
      // this.flgDirty = !this.flgDirty; // Trigger the filter/sort function.  For some reason setting new value into sortOrders not working to do this.
      //vm.$set(this.sortOrders, key, newVal);
      if (this.flgDebug > 3) {
        console.log(this.sortOrders);
      }
      this.sortData(sortKey);
    },
    toggleActive: function (row, idx) {
      // Add a row to the 'actives' collection.
      const vm = this;
      if (!this.actives[idx]) {
        vm.$set(this.actives, idx, true);
        // this.flgDirty = true;
      } else {
        vm.$set(this.actives, idx, false);
        delete this.actives[idx];
      }
    },
    toggleDebug() {
      if (this.flgDebug) this.flgDebug--;
      else this.flgDebug++;
    },
    toggleExcelMenu() {
      this.flgExcelMenu = !this.flgExcelMenu;
    },
    togglePK(flgShowPK) {
      // this.flgShowPK = !this.flgShowPK;  -- controlled by v-model
      const pkCol = this.colDefs.find(function (col, idx) {
        return col.pk == true;
      });
      pkCol.hidden = flgShowPK;
    },
    toggleSelectAll() {
      if (Object.keys(this.selectedRows).length) {
        this.selectedRows = {};
        this.actives = {};
        return false;
      } else {
        const vm = this;
        this.filteredData.forEach(function (el, idx) {
          vm.$set(vm.selectedRows, idx, true);
        });
        this.actives = this.selectedRows;
        return true;
      }
    },
    toggleSelectRow(idx, flgCtrl, flgShift) {
      if (this.flgDebug >= 2) console.log(idx);
      const vm = this;
      const newVal = !this.selectedRows[idx];
      // if (!newVal) {
      //   vm.$set(this.selectedRows, idx, null);
      //   return;
      // }
      // Clear existing unless flgCtrl, flgShift
      if (!flgCtrl && !flgShift) this.selectedRows = {}; // re-init
      if (flgShift) {
        const lastIdx = Object.keys(this.selectedRows)[
          Object.keys(this.selectedRows).length - 1
        ];
        for (var idxS = lastIdx; idxS <= idx; idxS++) {
          vm.$set(this.selectedRows, idxS, newVal);
        }
      } else if (flgCtrl) {
        // Toggle this row in the selected set
        if (!newVal) {
          vm.$set(this.selectedRows, idx, false);
          delete this.selectedRows[idx];
        } else vm.$set(this.selectedRows, idx, newVal);
      } else {
        vm.$set(this.selectedRows, idx, newVal);
      }
      // Add all selected rows into the active collection
      this.actives = {};
      Object.keys(this.selectedRows).forEach((rowIdx) => {
        vm.$set(vm.actives, rowIdx, true);
      });
    },
    validateGrid: function (dataGrid) {
      // validate before save
      const vm = this;
      try {
        let uniqueValsMap = {};
        let combinedErrMap = [];
        this.errors = [];
        const checkRecs = Object.assign(dataGrid.updates, dataGrid.newrecs);
        Object.keys(checkRecs).forEach(function (k, idx) {
          let rec = checkRecs[k];
          let recErrMap = util.validateRecord(
            rec,
            vm.colDefs,
            vm.data,
            uniqueValsMap
          );
          if (recErrMap.length) {
            let errRec = { rowID: k, rowIdx: idx, errMap: recErrMap };
            combinedErrMap.push(errRec);
          }
        });
        if (combinedErrMap.length) {
          // recreate the errors collection.
          // Each error rec looks like { rowIdx, colIdx, errMsg}
          for (let idx = 0; idx < combinedErrMap.length; idx++) {
            let errRecM = combinedErrMap[idx];
            let rowIdx = errRecM.rowIdx;
            let rowID = errRecM.rowID;
            let errMap = errRecM.errMap;
            for (let j = 0; j < errMap.length; j++) {
              let map = errMap[j];
              map = map.split(":");
              let errRec = {};
              errRec.rowID = rowID;
              errRec.rowIdx = rowIdx;
              errRec.colIdx = map[1].trim() - 0;
              errRec.errMsg = map[5].trim();
              errRec.colName = map[2].trim();
              this.errors.push(errRec);
            }
          }
          // Sort the errors by row number
          this.errors = this.errors.reverse();

          let errMsg = "";
          for (let idx = 0; idx < this.errors.length; idx++) {
            let err = this.errors[idx];
            // Find the grid row number in current grid data
            let rowNum = vm.filteredData.findIndex((rec, idx) => {
              return rec[vm.pk] == err.rowID;
            });
            rowNum = rowNum + 1; // zero-based
            errMsg +=
              "Row " + rowNum + ": " + err.colName + " - " + err.errMsg + "\n";
          }
          errMsg =
            "Errors found while saving this grid. Please see highlighted cells.\r\n\r\n" +
            errMsg;
          alert(errMsg);
        }
        return combinedErrMap;
      } catch (err) {
        alert(err);
        return false;
      }
    },
    noteAdd: function (row, pk) {
      const vm = this;
      if (!pk) {
        vm.$set(this.newrecs, this.idxAdd, row);
        this.idxAdd++;
      } else vm.$set(this.newrecs, pk, row);
      this.$emit("noteAdd");
    },
    noteUpdate: function (row, col, idx) {
      const vm = this;
      if (this.flgDebug >= 3) {
        console.log("updated: " + idx + ": " + col.colName);
      }
      //this.updates.push(row);   // If we are using an array
      if (col.onUpdate) {
        this.$emit("update", row, col, idx);
      }
      const pk = row[this.pk];
      vm.$set(this.updates, pk, row); // Only use with an object. Do this with an array if you want an array with a million null entries
      this.$emit("noteUpdate");
      // this.flgDirty = true;
    },
  },
  beforeDestroy() {
    const vm = this;
    resize.tearDown(vm);
  },
};
</script>

<style scoped>
body {
  font-family: Helvetica Neue, Arial, sans-serif;
  font-size: 14px;
  color: #444;
}

table {
  border: 1px solid rgba(0, 0, 0, 0.54);
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
  padding: 4px 8px;
}
tr.grid-lines {
  border-bottom: 1px solid grey;
}

td {
  background-color: #f9f9f9;
}
td.grid-lines {
  border: 1px solid grey;
}

th,
td {
  min-width: 20px;
  /* padding: 4px 8px; */
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

i.alert-el {
  color: red;
}

.required > .arrow.asc {
  border-bottom: 4px solid rgba(255, 255, 255, 0.78);
}

.required > .arrow.dsc {
  border-bottom: 4px solid rgba(255, 255, 255, 1);
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
  margin: 0 10px;
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
.num-rows-select {
  margin-left: 5px;
}
div#div-controls-container {
  display: flex;
  align-items: flex-start;
}
div#div-local-controls {
  display: flex;
  flex: 1 1 auto;
  padding-top: 5px;
}
div#div-filter-controls {
  flex: 1 1 auto;
  margin-left: 10px;
  padding-bottom: 5px;
}
div#div-local-controls button {
  margin: 0 5px;
}

button > i {
  font-size: 16px;
  margin-right: 5px;
}

input.row-select-radio {
  margin: 2px;
}
input.filter-input:active, input.filter-input:focus {
  outline:none;
}
span.row-number {
  padding-left: 2px;
}
</style>
