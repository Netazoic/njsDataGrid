<template>
  <div id="app">
      <njs-grid :gridCode="gridCode"
        :colDefs="colDefs"
        :dataURL="dataURL"
        :dataDef="dataDef"
        :p-filter="searchQuery">
      </njs-grid>
  </div>
</template>

<script>
import Vue from "vue";
import njsGrid from "./njsGrid.vue";

export default {
  name: "njs-sample-app",
  components: {
    njsGrid
  },
  props: ["pGridCode"],
  data: function() {
    return {
      searchQuery: "",
      colDefs: [],
      dataDef: [],
      dataURL: "",
      message: "msg",
      gridCode: this.pGridCode,
      flgDebug: true
    };
  },
  created() {
    this.initGrid();
  },
  methods: {
    initGrid() {
      let gridDef = require("@/coldefs/" + this.gridCode);
      const dataURL = gridDef.dataURL;
      const dataDef = gridDef.dataDef;
      const colDefs = gridDef.colDefs;
      this.colDefs = colDefs;
      this.dataURL = dataURL;
      this.dataDef = dataDef;
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  margin-top: 60px;
  margin-left: 30px;
}
</style>
