<template>
<div 
    draggable="true"
    :key="refName"
    class="debug-window"
    v-if="flgShowView" 
    ref="debug-window"
    style="border-radius: 4px; resize: both;"
    :style="{ top: navigation.top, left: navigation.left, height:navigation.height,
        width:navigation.width }">
    <div >
        <i
          class="fa fa-close close-image title-button"
          @click.stop.prevent="_closeWindow"
        />
      <div class="controls">
        <input type="checkbox" v-model="flgShowPK" @click="togglePK" />
        <label>Show PK?</label>
      </div>
      <div class="controls">
        <input type="checkbox" v-model="flgShowData" />
        <label>Show Data</label>
        <span v-if="flgShowData">
          <input type="radio" v-model="debugData" value="showData" />data
          <input
            type="radio"
            v-model="debugData"
            value="showFilteredData"
          />Filtered
          <input type="radio" v-model="debugData" value="showUpdates" /> updates
          <input type="radio" v-model="debugData" value="showNewrecs" /> new
          recs
          <input type="radio" v-model="debugData" value="showDeletes" /> deletes
          <input type="radio" v-model="debugData" value="showSelected" />
          selected Rows
          <input type="radio" v-model="debugData" value="showActives" /> Actives
        </span>
      </div>
    </div>
    <transition name="fade2">
      <div v-if="flgShowData" style="height:600px; max-height:600px; overflow:auto;">
        <transition name="fade2">
          <pre v-if="debugData == 'showData'">{{ data }}</pre>
          <pre v-if="debugData == 'showFilteredData'">{{ heroes }}</pre>
        </transition>
        <transition name="fade2">
          <pre v-if="debugData == 'showUpdates'">{{ updates }}</pre>
          <pre v-if="debugData == 'showNewrecs'">{{ newrecs }}</pre>
          <pre v-if="debugData == 'showDeletes'">{{ deletes }}</pre>
          <pre v-if="debugData == 'showSelected'">{{ selectedRows }}</pre>
          <pre v-if="debugData === 'showActives'">{{ actives }}</pre>
        </transition>
      </div>
    </transition>
</div>
</template>
<script>
import _resizeable from "./_resizeable.vue";

export default {
  name: "debug-window",
  mixins: [_resizeable],
  components: {},
  props: [
    "flgShow",
    "file",
    "data",
    "heroes",
    "updates",
    "newrecs",
    "deletes",
    "selectedRows",
    "actives",
  ],
  data() {
    return {
      flgLargeView: false,
      flgShowView: this.flgShow,
      flgShowData: false,
      flgShowPK: false,
      refName: "debug-window",
      debugData: "showData",
      /* override */
      navigation: {
        height: "auto",
        width: 500,
        top: 100,
        left: 0,
      },
    };
  },
  watch: {
    flgShow(newVal) {
      this.flgShowView = newVal;
      if (newVal) {
        this.$nextTick(function () {
          if(!this.observer) this.initObserver();
          // console.debug(this.ref);
          // console.debug(this.$refs);
          
        });
        window.addEventListener("keyup", this.keyPress);
      } else {
        window.removeEventListener("keyup", this.keyPress);
      }
    },
    file(newVal) {
      //  console.log(newVal);
    },
  },
  methods: {
    _closeWindow() {
      this.flgShowView = false;
      this.flgLargeView = false;
      window.removeEventListener("keyup", this.keyPress);
      this.$emit("close");
    },
    keyPress(e) {
      const vm = this;
      if (e.key === "Escape") {
        vm._closeWindow();
      }
    },
    pickFile(f) {
      this.$emit("pick-file", f);
    },
    toggleView() {
      this.flgShowView = !this.flgShowView;
    },
    startEditor() {
      this.$emit("editResource");
      this._closeWindow();
    },
    togglePK() {
      // this.flgShowPK = !this.flgShowPK;  -- controlled by v-model
      this.$emit("togglePK", this.flgShowPK);
    },
  },
  mounted() {
    this.$nextTick(function () {
      this.initObserver();
    });
  },
  destroyed() {
    window.removeEventListener("keyup", this.keyPress);
  },
};
</script>

<style scoped>
div.debug-window {
  /* position: absolute; */
  position: fixed;
  min-width: 40vw;
  width: 40vw;
  max-width: 75vw;
  border: 1px solid black;
  max-height:80vh;
  height:80vh;
  top: 40%;
  left: 50%;
  margin-top: 0px;
  margin-left: 400px;
  /* top: 50%;
  left: 50%;
  margin-top: -263px;
  margin-left: 100px; */
  background-color: white;
  z-index: 2;
  padding: 5px;
}

.close-image {
  right: 10px;
  top: 10px;
}
.toggle-image {
  right: 10px;
  bottom: 3px;
}

aside.debug-window > * > div > img,
div.debug-window > * > img {
  width: 100%;
}
</style>