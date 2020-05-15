<template>
  <v-select :options="options" taggable :value="selected" @input="onChange" :createOption="onCreate" />
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
    onCreate(newVal){
        this.selected = newVal;
        this.$emit("input",newVal);
    },
    onChange(newSelection) {
      //newVal is an object {label:foo, value:bar}
      this.selected = newSelection;
      let newVal = newSelection.value;
      this.$emit("input", newVal);
    }
  }
};
</script>