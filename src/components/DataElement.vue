<template>
<span>
    <cDateTime v-if="flgEdit && inputType=='timestamp'"
        v-model="row[col.colName]"
        @close="onBlur"
        zone="UTC"
        :ref="refName"
        @change="$emit('change');"
        @input="$emit('change');"
        :tabindex="tabIndex"
        class="data-element-input"
        />
    <input v-if="flgEdit && (inputType == 'text' || inputType == 'date')" 
            :type="inputType"
            v-model="row[col.colName]"
            @blur="onBlur"
            @focus="onFocus"
            @change="$emit('change');"
            :tabindex="tabIndex"
            :ref="refName"
            class="data-element-input"
            />
 
    <select v-if="flgEdit && inputType == 'select'" 
          v-model="row[col.colName]" 
          @change="$emit('change')"
          :tabIndex="tabIndex"
          :ref="refName"
          class="data-element-input"
          >
      <option value=null>-- select --</option>
      <option v-for="(opt,idx) in col.options" :value="opt.value" :key="idx">{{opt.label}}</option>
    </select>
    <span @focus="onFocus" v-if="!flgEdit">{{displayVal}}</span>
</span>
</template>
<script>
import moment from "moment";
import cDateTime from "./cDateTime.vue";
const STD_INPUTS = "text|date";

export default {
  name: "DataElement",
  props: ["row", "col", "rowIdx", "hasFocus"],
  components: { cDateTime },
  data: function() {
    return {
      flgDebug: 1
    };
  },
  watch: {
    col: function(newVal) {
      if (col.options) {
        for (opt in col.options) {
          console.log(opt);
        }
      }
    }
  },
  computed: {
    flgEdit() {
      let editable = this.col.editable;
      if (editable == null || editable == undefined) editable = true;
      return this.flgFocus && editable;
    },
    flgFocus() {
      const flg = this.hasFocus;
      if (this.flgDebug >= 2) console.log(this.refName + " has focus: " + flg);
      if (flg) {
        this.focusMe();
      }
      return flg;
    },
    tabIndex() {
      return (this.rowIdx + 1) * 100 + this.col.colIdx;
    },
    colType() {
      return this.col.type || "text";
    },
    inputType() {
      var type;
      switch (this.colType) {
        case "text":
          type = "text";
          break;
        case "timestamp":
          type = "timestamp";
          break;
        case "date":
          type = "date";
          break;
        case "select":
          type = "select";
          break;
        default:
          type = "text";
          break;
      }
      return type;
    },
    refName() {
      return this.tabIndex + "_" + this.col.colName;
    },
    displayVal() {
      const displayField = this.col.displayField
        ? this.col.displayField
        : this.col.colName;
      const baseVal = this.row[displayField];
      let dispVal;
      switch (this.col.type) {
        case "idx":
          dispVal = this.rowIdx;
          break;
        case "timestamp":
          if (baseVal == null) {
            dispVal = null;
          } else {
            var d = new moment(baseVal, "YYYY-MM-DDThh:mm");
            dispVal = d.format("MMM D, YYYY, h:mm A");
          }
          break;
        case "date":
          if (baseVal == null) {
            dispVal = null;
          } else {
            var d = new moment(baseVal, "YYYY-MM-DDThh:mm");
            dispVal = d.format("MM/DD/YYYY");
          }
          break;
        case "select":
          if (baseVal == null) dispVal = baseVal;
          else if (this.col.options) {
            const slctdOpt = this.col.options.find(function(el) {
              return el.value == baseVal;
            });
            if (!slctdOpt) dispVal = "value not found";
            else dispVal = slctdOpt.label;
          }
          break;
        default:
          dispVal = baseVal;
      }
      return dispVal;
    }
  },
  methods: {
    focusMe() {
      // TODO kills the backtab function
      this.$nextTick(() => {
        let el = this.$refs[this.refName];
        if (el) {
          if (el.$el) el = el.$el; //vue components
          el.focus();
        }
      });
    },
    onBlur() {
      this.$emit("blur");
    },
    onFocus() {
      this.$emit("focus");
      // console.log("onFocus: " + this.refName);
    }
  }
};
</script>

<style scoped>
.data-element-input {
  width: 90%;
}
</style>