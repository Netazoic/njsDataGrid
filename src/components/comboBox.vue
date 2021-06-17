<template>
  <v-select
    :options="opts"
    taggable
    :value="selected"
    @search:blur="blurSearch"
    @input="onChange"
    ref="mySelect"
    :createOption="onCreate"
    v-on:keyup.enter="showOptions"
    :appendToBody="true"
    :calculatePosition="calculatePosition"
    dense
    :tabindex="tabIndex + 0.1"
  />
</template>
<script>
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

export default {
  props: ["options", "value", "col", "tabIndex"],
  components: { vSelect },
  data() {
    return {
      opts: this.options || [],
      selected: this.value,
    };
  },
  mounted() {
    // console.log(this.options);
    this.$nextTick(function () {
      const el = this.$refs.mySelect;
      el.$refs.search.focus();
      // el.open = false;
    });
  },

  methods: {
    blurSearch() {
      // this.$emit("blur");
    },
    /**
     * @param dropdownList {HTMLUListElement}
     * @param component {Vue} current instance of vue select
     * @param width {string} calculated width in pixels of the dropdown menu
     * @param top {string} absolute position top value in pixels relative to the document
     * @param left {string} absolute position left value in pixels relative to the document
     * @return {function|void}
     */
    calculatePosition(dropdownList, component, { width, top, left }) {
      var body = document.body,
        html = document.documentElement;
      var height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      // The 'top' param passed into this function by vue-select seems to be off
      // by about 100px.  I am sure this constant will not hold up across different
      // viewport sizes :\

      let topVal = parseInt(top) - 100;
      let componentTop = Math.min(component.$el.offsetTop, topVal);
      // calc the top of the suggestions window
      let topCalc = componentTop + component.$el.clientHeight;
      // console.log("window.height: " + height);
      // console.log("top of suggestions list in window: " + topCalc);
      // console.log("dropdownList.height: " + dropdownList.clientHeight);

      const modalBottom = topCalc +  dropdownList.clientHeight;

      if(modalBottom > height){
        // move the dropdown list above the input instead of below the input
        topCalc = componentTop - dropdownList.clientHeight;
      }

      dropdownList.style.top = topCalc;
      dropdownList.style.left = left;
      dropdownList.style.width = width;
    },
    onCreate(newVal) {
      this.selected = newVal;
      this.$emit("input", newVal);
    },
    onChange(newSelection) {
      //newVal is an object {label:foo, value:bar}
      this.selected = newSelection;

      let newVal = newSelection ? newSelection.value : "";
      this.$emit("input", newVal);
    },
    showOptions() {
      this.$refs.mySelect.$refs.search.focus();
    },
  },
};
</script>

<style scoped>
ul.vs__dropdown-menu {
  z-index: 999999;
}
</style