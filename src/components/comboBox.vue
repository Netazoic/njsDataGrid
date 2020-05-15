<template>
  <v-select :options="options" taggable :value="selected" @input="onChange" />
</template>
<script>
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";

export default {
  props: ["options", "value", "col"],
  components: { vSelect },
  data() {
    return {
      selected: this.value
    };
  },
  mounted() {
    //   console.log(this.options);
  },
  methods: {
    onChange(newVal) {
      //newVal is an object
      this.selected = newVal;
      newVal = newVal.value;
      if (this.flgDebug) {
        // debugger;
      }
      this.$emit("input", newVal);
    }
  }
};
</script>