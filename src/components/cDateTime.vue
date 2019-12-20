<template>
    <input type="datetime-local" v-model="parseVal" @change="onChange"/>
</template>
<script>
import moment from "moment";

export default {
  name: "cDateTime",
  props: ["value"], // value is set by the parent v-model
  data() {
    // Following no longer necessary
    // var mmUTC = new moment.utc(this.value, "YYYY-MM-DDThh:mm").format(
    //   "YYYY-MM-DDThh:mm"
    // );
    return {
      parseVal: this.value,
      flgDebug: false
    };
  },
  methods: {
    onChange() {
      if (this.flgDebug) {
        // debugger;
      }
      //this.$emit("change");
      //const newVal = new moment.utc(this.parseVal);
      const newVal = this.parseVal;
      this.$emit("input", newVal);
    }
  }
};
</script>
