<template>
<div>
  <form v-if="flgLocalControls">
      <button @click.prevent.stop="saveGrid">Save</button> 
      <button @click.prevent.stop="addRow">Add Row</button>
      <button @click.prevent.stop="deleteRows">Delete</button>
      <button @click.prevent.stop="resetGrid">Reset</button>
      Search <input name="query" v-model="filterKey"/>
      Rows:
      <select v-model="numDispRows"><option value="10">10</option><option value="50">50</option><option value="100">100</option><option value="10000000">All</option></select>
  </form>
  <table>
    <thead>
      <tr>
        <th style="width:2px;min-width:2px !important;">row</th>
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
      <tr v-for="(row,idx) in filteredData" :key="row[pk]" 
          class="table-data" 
          :class="{'selected': selectedRows[idx], 'grid-lines':flgGridLines}"
          :ref="'tr-data-' + idx">
        <td @click.exact="toggleSelectRow(idx)" 
            @click.ctrl.exact="toggleSelectRow(idx,true)"
            @click.shift.exact="toggleSelectRow(idx,false,true)"
            style="width:2px;min-width:2px;"
          :tabindex="((idx+1)*100)">{{idx + 1}}</td>
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
import Vue from "vue";
import DataElement from "./components/DataElement.vue";
import as from "./lib/libAsync";
import { stringify } from "querystring";

export default {
  name: "njsGrid",
  props: {
    pFilter: String,
    colDefs: Array,
    dataURL: String,
    dataDef: Array,
    pDispRows: Number
  },
  components: { DataElement },
  data: function() {
    var sortOrders = {};
    this.colDefs.forEach(function(col) {
      sortOrders[col.colName] = 1;
    });
    return {
      columns: this.colDefs,
      data: [],
      updates: {},
      deletes: {},
      newrecs: {},
      i_gridData: [],
      selectedRows: {},
      sortKey: "",
      numDispRows: this.pDispRows || 50,
      xfocusRow: 0,
      flgDebug: 1,
      flgLocalControls: true,
      flgShowData: false,
      flgDirty: false,
      flgGridLines: true,
      filterKey: this.filterKey,
      sortOrders: sortOrders,
      debugData: "showData",
      idxAdd: 0,
      focusRow: 0,
      focusColumn: 0
    };
  },
  created() {
    this.initGrid();
  },
  watch: {
    columns() {},
    pFilter(newVal) {
      this.filterKey = newVal;
    },
    data(newVal) {
      // console.log("data: " + newVal);
    },
    dataURL(newVal) {
      this.getGridData(newVal);
    },
    sortOrders() {
      // console.log("sortOrders:");
      // console.log(this.sortOrders);
    }
  },
  computed: {
    filteredData: function() {
      var sortKey = this.sortKey;
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
        heroes = heroes.slice().sort(function(a, b) {
          a = a[sortKey];
          b = b[sortKey];
          return (a === b ? 0 : a > b ? 1 : -1) * order;
        });
      }
      //this.flgDirty = false;
      heroes = heroes.slice(0, this.numDispRows);
      return heroes;
    },
    pk() {
      return this.colDefs.filter(function(el) {
        return el.pk;
      });
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
      // Get the first record and clone it
      var rec = this.data[0];
      rec = Object.assign({}, rec);
      for (var k in rec) {
        rec[k] = null;
      }
      // insert at top of stack
      this.data.unshift(rec);
      this.noteAdd(rec);
      //Select first element in the row
      //this.tabIndex + "_" + this.col.colName;
      //const refName = 100 + "_" + this.colDefs[0].colName;
      //const refName = "tr-data-0";
      // TODO  select first input not working
      const refName = "data-element-0-" + this.columns[0].colName;
      var el = this.$refs[refName][0];
      if (el.$el) el = el.$el; //vue components
      el.focus();
    },

    clearFocus: function(idx) {
      this.focusRow = null;
      this.focusColumn = null;
    },

    clearSelected: function() {
      this.selectedRows = {};
    },
    deleteRows() {
      const slctdCount = Object.keys(this.selectedRows).length;
      if (slctdCount == 0) return;
      //const flg = confirm("Delete " + slctdCount + " selected rows?");
      const flg = true;
      if (!flg) return;
      var rec;
      const vm = this;
      var currentDeletes = {};
      // Load up the this.deletes collection before we start deleting things
      for (var idx in this.selectedRows) {
        delete this.selectedRows[idx]; // Unselect the row here??
        rec = this.filteredData[idx];
        if (!rec) continue; // Deleted row ??
        rec = Object.assign({}, rec); // Make a clone
        if (rec.pk) Vue.set(this.deletes, rec.pk, rec);
        //Vue.set(vm.data, dataIdx, null);
        currentDeletes[rec.pk] = rec.pk;
      }
      // Delete the original rec out of this.data
      // This will reactively remove the record from this.filteredData;
      for (var pk in currentDeletes) {
        const dataIdx = vm.data.findIndex(function(dataRec, idx) {
          return dataRec.pk == pk;
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
      this.getGridData(this.dataURL, this.dataDef);
    },
    resetGrid() {
      // Reset to original condition on page load
      this.deletes = {};
      this.updates = {};
      this.newrecs = {};
      this.selectedRows = {};
      this.data = this.i_gridData.slice(0);
    },
    saveGrid() {
      var url = "/ds?pAction=poolstartSaveGrid";
      //const diff = this.diffData();
      var fd = new FormData();
      var dataGrid = {};
      dataGrid.data = this.data;
      dataGrid.updates = this.updates;
      dataGrid.deletes = this.deletes;
      dataGrid.newrecs = this.newrecs;

      fd.append("dataGrid", JSON.stringify(dataGrid));
      var fLoad = function(ret) {
        alert("Grid data saved");
      };
      var fErr = null;
      as.xhrSubmit(fd, url, fLoad, fErr).catch(function(err) {
        alert(err);
      });
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
      } else {
        Vue.set(this.selectedRows, idx, newVal);
      }
    },
    noteAdd: function(row, col, idx) {
      Vue.set(this.newrecs, this.idxAdd, row);
      this.idxAdd++;
    },
    noteUpdate: function(row, col, idx) {
      if (this.flgDebug >= 3)
        console.log("updated: " + idx + ": " + col.colName);
      Vue.set(this.updates, row[this.pk], row);
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
</style>
