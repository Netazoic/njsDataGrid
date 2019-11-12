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
        />
    <input v-if="flgEdit && (inputType == 'text' || inputType == 'date')" 
            :type="inputType"
            v-model="row[col.colName]"
            @blur="onBlur"
            @focus="onFocus"
            @change="$emit('change');"
            :tabindex="tabIndex"
            :ref="refName"
            />
 
    <select v-if="flgEdit && inputType == 'select'" 
          v-model="row[col.colName]" 
          @change="$emit('change')"
          :tabIndex="tabIndex"
          :ref="refName"
          >
      <option v-for="opt in col.options" :value="opt.value" :key="opt.value">{{opt.label}}</option>
    </select>
    <span v-if="!flgEdit">{{displayVal}}</span>
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
    return {};
  },
  computed: {
    flgEdit() {
      let editable = this.col.editable;
      if (editable == null || editable == undefined) editable = true;
      return this.flgFocus && editable;
    },
    flgFocus() {
      const flg = this.hasFocus;
      if (flg) {
        this.$nextTick(() => {
          let el = this.$refs[this.refName];
          if (el) {
            if (el.$el) el = el.$el; //vue components
            el.focus();
          }
        });
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
            var d = new Date(baseVal);
            dispVal = new moment.utc(d).format("MMM D, YYYY, h:mm A");
          }
          break;
        case "date":
          //var d = new Date(baseVal);
          if (baseVal == null) {
            dispVal = null;
          } else {
            var d = new moment.utc(baseVal);
            dispVal = d.format("MM/DD/YYYY");
          }
          break;
        default:
          dispVal = baseVal;
      }
      return dispVal;
    }
  },
  methods: {
    onBlur() {
      this.$emit("blur");
    },
    onFocus() {
      this.$emit("focus");
    }
  }
};
</script>