<template>
  <v-select :options="opts" taggable :value="selected"
    @search:blur="blurSearch" 
    @input="onChange" ref="mySelect" :createOption="onCreate"
    v-on:keyup.enter="showOptions"
    :tabindex="tabIndex + .1" />
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
      selected: this.value
    };
  },
  mounted() {
    // console.log(this.options);
    this.$nextTick(function() {
      const el = this.$refs.mySelect;
      el.$refs.search.focus();
      // el.open = false;
    });
  },

  methods: {
    blurSearch() {
      // this.$emit("blur");
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
    }
  }
};
</script>