<template>
  <div id="njs-wrapper">
    <div id="asyncticator-mount" />
    <div id="div-controls-container">
      <div id="div-local-controls">
        <form v-if="flgLocalControls">
          <div id="div-edit-controls" v-if="!flgReadOnly">
            <button
              class="mdl-button mdl mdl-js-button mdl-button--primary mdl-button--raised"
              @click.prevent.stop="saveGrid"
              type="button"
              title="Save table"
            >
              <i class="material-icons" style="font-size: 16px; margin-right: 5px;">save</i>Save
            </button>
            <button
              class="mdl-button mdl mdl-js-button mdl-button--primary mdl-button--raised"
              @click.prevent.stop="addRow"
              type="button"
              title="Add Row"
            >
              <i class="material-icons" style="font-size: 16px; margin-right: 5px;">add</i>Add Row
            </button>
            <button
              class="mdl-button mdl mdl-js-button mdl-button--primary mdl-button--raised"
              @click.prevent.stop="deleteRows"
              type="button"
            >
              <i class="material-icons" style="font-size: 16px; margin-right: 5px;">delete</i>Delete Row
            </button>
            <button
              class="mdl-button mdl mdl-js-button mdl-button--primary mdl-button--raised"
              @click.prevent.stop="resetGrid"
              type="button"
            >
              <i class="material-icons" style="font-size: 16px; margin-right: 5px;">undo</i>Reset
            </button>
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
              :class="{disabled:!data.length}"
              title="export grid data as excel file"
            >&nbsp;Export</i>
          </button>
          <div id="menu-excel" :class="{hidden:!flgExcelMenu, visible:flgExcelMenu}" class="modal">
            <div class="modal-content">
              <span class="close" @click="toggleExcelMenu">&times;</span>
              <button @click.prevent.stop="exportExcelData(false,$event)">
                <i class="fas fa-file-export" title="Export columns that are visible in the grid"></i>&nbsp; Filtered
              </button>
              <button
                @click.prevent.stop="exportExcelData(true,$event)"
                title="export grid data as excel file"
              >
                <i class="fas fa-file-export" title="Export all data"></i>&nbsp; ALL
              </button>
            </div>
          </div>
        </form>
        <div id="div-filter-controls">
          <span @click.ctrl.alt.shift.stop.prevent="toggleDebug">Search</span>
          <input name="query" v-model="filterKey_DB" @keydown.enter.prevent="nullOp" />
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
              :class="{disabled: recOffset==0}"
              @click.stop.prevent="adjustRecordOffset(-1)"
            ></i>
            <i
              class="fa fa-caret-right"
              :class="{disabled: upperDispIdx >= numAllRows}"
              @click.stop.prevent="adjustRecordOffset(1)"
            ></i>
          </span>
          <span
            class="disp-row-count-selector"
          >{{lowerDispIdx}}-{{ upperDispIdx }} of {{ numAllRecs }}</span>
        </div>
      </div>
    </div>
    <div id="table-wrapper">
      <table id="njs-grid">
        <thead class="table-header">
          <tr>
            <th @click="toggleSelectAll" style="width:2px;min-width:2px !important;">row</th>
            <th
              v-for="col in columns"
              :key="col.colName"
              :data-column-name="col.colName"
              @click.exact.stop.prevent="sortBy(col.colName)"
              @mouseout="hideHelp"
              :class="headerClasses(col.colName,col.headerClasses)"
              :style="{'width': col.width, 'min-width': col.width}"
            >
              {{ col.header | capitalize }}
              <i
                v-if="col.help"
                class="fa fa-info-circle"
                @click.stop="showHelp(col.help,$event)"
              />
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
            v-for="(row,idx) in dispData"
            :key="row[pk]"
            class="table-data"
            :class="{'selected': selectedRows[idx]==true, 'grid-lines':flgGridLines}"
            :ref="'tr-data-' + idx"
          >
            <td
              @click.exact="toggleSelectRow(idx)"
              @click.ctrl.exact="toggleSelectRow(idx,true)"
              @click.shift.exact="toggleSelectRow(idx,false,true)"
              style="width:2px;min-width:2px;"
              :tabindex="((idx+1)*100)"
            >{{idx + recOffset + 1}}</td>
            <TD_Element
              v-for="col in columns"
              :key="col.colName"
              :class="{'grid-lines': flgGridLines, 'error': col.hasError}"
              :tabindex=" ((idx+1) *100) + col.colIdx"
              :hasFocus="hasFocus(idx,col.colIdx)"
              @focusEl="setFocus(idx,col.colIdx)"
              @keyup.shift.tab="handleBackTab(row,col,idx,$event)"
              @keyup.ctrl.down="handleDownArrow(row,col,idx)"
              @backtab="handleBackTab(row,col,idx)"
              @ctrldown="handleArrow('down')"
              @ctrlup="handleArrow('up')"
              @click.exact.stop="setFocus(idx,col.colIdx)"
              @blur="clearFocus(idx)"
              @update="noteUpdate(row,col,idx)"
              @change="noteUpdate(row,col,idx)"
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
    <div id="ttPopUp" style="position:absolute;"></div>
    <div v-if="flgDebug">
      <div class="controls">
        <input type="checkbox" v-model="flgShowPK" @click="togglePK" />
        <label>Show PK?</label>
      </div>
      <div class="controls">
        <input type="checkbox" v-model="flgShowData" />
        <label>Show Data</label>
        <span v-if="flgShowData">
          <input type="radio" v-model="debugData" value="showData" />data
          <input type="radio" v-model="debugData" value="showFilteredData" />Filterd
          <input type="radio" v-model="debugData" value="showUpdates" /> updates
          <input type="radio" v-model="debugData" value="showNewrecs" /> new recs
          <input type="radio" v-model="debugData" value="showDeletes" /> deletes
          <input type="radio" v-model="debugData" value="showSelected" /> selected Rows
        </span>
      </div>
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
import TD_Element from "./components/TD_Element.vue";
import as from "./lib/libAsync";
import axios from "axios";
import { stringify } from "querystring";
import uuid from "uuid/v1";
import Vue from "vue";
import moment, { min } from "moment";
import util from "./lib/util";
import * as resize from "./lib/resize";

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
    pSendOrigGridOnSave: String
  },
  components: {
    TD_Element
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
      i_gridData: [], //Saved version of original grid data, for reset. //TODO only working at shallow-clone level
      selectedRows: {},
      sortKey: "",
      numDispRows: this.pDispRows || 100,
      numAllRecs: 0, // Total # of recs in the database
      xfocusRow: 0,
      flgDebug: 0,
      flgExportEnabled: false,
      flgLocalControls: true,
      flgReadOnly: this.readOnly || false,
      flgShowData: false,
      flgShowPK: false,
      flgDirty: false,
      flgGridLines: true,
      flgExcelMenu: false,
      flgSendOrigGridOnSave: this.pSendOrigGridOnSave || false,
      filterKey: this.filterKey,
      recOffset: 0,
      sortOrders: sortOrders,
      debugData: "showData",
      idxAdd: 0,
      focusRow: undefined,
      focusCol: undefined,
      recLIMIT: 1000
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
      newVal.forEach(function(col) {
        vm.sortOrders[col.colName] = 1;
      });
      // set the column resize handles after a colDef change
      // need to wait for a nextTick to allow th elements to be mounted

      this.$nextTick(function() {
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
      return newVal;
    },
    dataURL(newVal) {
      // this.initGrid();
      console.log(newVal);
    },
    dataURL_Comp() {
      this.initGrid();
    }
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
      set: util.debounce(function(newVal) {
        this.filterKey = newVal;
      }, 250)
    },
    columns() {
      const vm = this;
      const cols = this.colDefs.filter(function(col, idx) {
        return col.hidden !== true && col.visible !== false;
      });
      //Make sure we have column idxs
      for (let idx = 0; idx < cols.length; idx++) {
        cols[idx]["colIdx"] = idx;
      }
      this.$nextTick(function() {
        resize.init(vm, "table-header");
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
      // Add in any 'new' records, clearing any already in the heroes collection
      // so we don't get a pk violation.  This keeps new records at the top of the editor.
      const vm = this;
      Object.keys(this.newrecs).forEach(function(recIdx, idx) {
        const newRec = vm.newrecs[recIdx];
        const foundRec = heroes.find(function(rec, idx) {
          if (rec.pk === newRec.pk) {
            heroes.splice(idx, 1); // Clear the rec from heroes
            return true;
          }
        });
        heroes.unshift(newRec);
      });
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
          .sort(this.compareValues(sortKey, order, keyLookup, col));
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
      try {
        if (str == null) return null;
        return str.charAt(0).toUpperCase() + str.slice(1);
      } catch (err) {
        // column has no value for header
      }
    }
  },
  methods: {
    nullOp: function(evt) {
      // console.log(evt);
      //nada
    },
    addRow: function() {
      this.clearFocus();
      this.clearSelected();
      let rec = Object.assign({}, this.defaultRec);
      let pk;

      const colDefs = this.colDefs;
      const pkCol = colDefs.find(function(col) {
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
      //Select first element in the row
      const vm = this;
      this.$nextTick(() => {
        vm.setFocus(0, 0);
        //force a recompute
        const myHasFocus = this.hasFocus();
      });
    },

    clearFocus: function(idx) {
      this.focusRow = undefined;
      this.focusColumn = undefined;
    },

    clearSelected: function() {
      this.selectedRows = {};
    },
    // function for dynamic sorting
    compareValues(key, order = 1, keyLookup, col) {
      return function(a, b) {
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
          varB = parseInt(b[key], 10);
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
      //Clear negative selected rows
      let slctdCount = Object.keys(this.selectedRows).length;
      const vm = this;
      Object.keys(this.selectedRows).forEach(function(key, idx) {
        if (!vm.selectedRows[key]) {
          delete vm.selectedRows[key];
          slctdCount--;
        }
      });
      if (slctdCount == 0) return;
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
        delete this.selectedRows[key]; // Unselect the row here??
        rec = this.filteredData[key];
        if (!rec) continue; // Deleted row ??
        let rec2 = Object.assign({}, rec); // Make a clone
        let pk = rec[pka];
        Vue.set(this.deletes, pk, rec2);
        //Vue.set(vm.data, dataIdx, null);
        currentDeletes[pk] = rec2;
        //Delete the record from filteredData
        key = key - 0; //convert key to a number
        this.filteredData.splice(key, 1);
      }
      //Don't bother sending deletes for new records -- they aren't in the database anyway
      for (var pk in currentDeletes) {
        if (this.newrecs[pk]) {
          delete vm.newrecs[pk];
          delete vm.deletes[pk];
        }
      }
      this.$emit("noteDelete");
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

        this.$http.get(gridDataURL).then(response => {
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
    handleArrow: function(direction) {
      let focusRow = this.focusRow;
      if (direction == "down") focusRow++;
      else focusRow--;
      this.setFocus(focusRow, this.focusCol);
    },
    handleBackTab: function(row, col, rowIdx, $event) {
      let newColIdx = col.colIdx - 1;
      if (newColIdx < 0) newColIdx = 0;
      //Set focus to previous column
      this.setFocus(rowIdx, newColIdx);
      if (this.flgDebug >= 4)
        console.log("handleBackTab: focus on " + newColIdx);
    },
    hasFocus: function(idx, colIdx) {
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
    resetGrid() {
      // Reset to original condition on page load
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.selectedRows = {};
      this.sortKey = "";
      this.sortOrders = {};
      this.data = this.i_gridData.slice(0);
      this.$emit("reset");
    },
    saveGrid() {
      var url = this.urlSaveGrid;
      //const diff = this.diffData();
      var dataGrid = {};
      //dataGrid.data = this.data;
      dataGrid.gridID = this.gridID;
      dataGrid.updates = this.updates;
      dataGrid.deletes = this.deletes;
      dataGrid.newrecs = this.newrecs;
      // validate grid before save
      if (!this.validateGrid(dataGrid)) {
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
        var fLoad = function(ret) {
          // nada
        };
        var fErr = null;
        const vm = this;
        as.xhrSubmit(fd, url, fLoad, fErr)
          .then(function(ret) {
            // Clear the collections on a successful save
            vm.deletes = {};
            vm.updates = {};
            vm.newrecs = {};
            alert("Grid updates saved");
            vm.$emit("saveGrid"); //For tracking flgDirty in parent container
          })
          .catch(function(err) {
            alert(err);
          });
      }
    },
    setFixedHeader() {
      document
        .getElementById("table-wrapper")
        .addEventListener("scroll", function() {
          var translate = "translate(0," + this.scrollTop + "px)";
          this.querySelector("thead").style.transform = translate;
        });
    },

    setFocus: function(rowIdx, colIdx) {
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
      this.clearFocus();
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
    toggleDebug() {
      if (this.flgDebug) this.flgDebug--;
      else this.flgDebug++;
    },
    toggleExcelMenu() {
      this.flgExcelMenu = !this.flgExcelMenu;
    },
    togglePK() {
      // this.flgShowPK = !this.flgShowPK;  -- controlled by v-model
      const pkCol = this.colDefs.find(function(col, idx) {
        return col.pk == true;
      });
      pkCol.hidden = this.flgShowPK;
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
      // if (!newVal) {
      //   Vue.set(this.selectedRows, idx, null);
      //   return;
      // }
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
        if (!newVal) {
          Vue.set(this.selectedRows, idx, false);
          delete this.selectedRows[idx];
        } else Vue.set(this.selectedRows, idx, newVal);
      } else {
        Vue.set(this.selectedRows, idx, newVal);
      }
    },
    validateGrid: function(dataGrid) {
      // validate before save
      const vm = this;
      try {
        let uniqueValsMap = {};
        let combinedErrMap = [];
        Object.keys(dataGrid.updates).forEach(function(k, idx) {
          let rec = dataGrid.updates[k];
          let recErrMap = util.validateRecord(
            rec,
            vm.colDefs,
            vm.data,
            uniqueValsMap
          );
          if (recErrMap) Array.prototype.push.apply(combinedErrMap, recErrMap);
        });
        if (combinedErrMap.length) {
          const errMsg = combinedErrMap.join("\n");
          alert(errMsg);
          return false;
        }
        else return true;  // Validated successfully
      } catch (err) {
        alert(err);
        return false;
      }
    },
    noteAdd: function(row, pk) {
      if (!pk) {
        Vue.set(this.newrecs, this.idxAdd, row);
        this.idxAdd++;
      } else Vue.set(this.newrecs, pk, row);
      this.$emit("noteAdd");
    },
    noteUpdate: function(row, col, idx) {
      if (this.flgDebug >= 3) {
        console.log("updated: " + idx + ": " + col.colName);
      }
      //this.updates.push(row);   // If we are using an array
      if (col.onUpdate) {
        this.$emit("update", row, col, idx);
      }
      const pk = row[this.pk];
      Vue.set(this.updates, pk, row); // Only use with an object. Do this with an array if you want an array with a million null entries
      this.$emit("noteUpdate");
    }
  },
  beforeDestroy() {
    const vm = this;
    resize.tearDown(vm);
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
</style>
