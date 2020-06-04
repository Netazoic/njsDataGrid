<template>
  <td
    @focus="onFocus($event)"
    @keyup.ctrl.up="onCtrlUp"
    @keyup.ctrl.down="onCtrlDown"
    @keyup.shift.tab="onBackTab"
    :ref="refName+ '_td'"
    :class="{error:flgError}"
    :title="title"
  >
    <span v-if="flgDebug>=5">hasFocus: {{hasFocus}} {{rowIdx}} {{col.colIdx}}</span>
    <cDateTime
      v-if="flgEdit && inputType=='timestamp'"
      v-model="row[col.colName]"
      @close="onBlur"
      zone="UTC"
      :ref="refName"
      @change="$emit('change');"
      @input="$emit('change');"
      :tabindex="tabIndex"
      class="data-element-input"
    />
    <comboBox
      v-if="flgEdit && inputType=='combo'"
      :options="col.options"
      :col="col"
      :ref="refName"
      v-model="row[col.colName]"
      @change="$emit('change')"
      @input="$emit('change')"
      @close="onBlur"
      :tabindex="tabIndex"
      class="data-element-input"
    />
    <textarea
      v-if="flgEdit && (inputType=='textarea' )"
      :col="col"
      :ref="refName"
      v-model="row[col.colName]"
      @change="$emit('change')"
      @input="$emit('change')"
      :tabindex="tabIndex"
      class="data-element-input"></textarea>

    <input
      v-if="flgEdit && ((inputType == 'text') || inputType == 'date')"
      :type="inputType"
      v-model="row[col.colName]"
      @change="$emit('change');"
      :tabindex="tabIndex"
      :ref="refName"
      class="data-element-input"
    />

    <select
      v-if="flgEdit && inputType == 'select'"
      v-model="row[col.colName]"
      @change="$emit('change')"
      :tabIndex="tabIndex"
      @blur="onBlur"
      :ref="refName"
      class="data-element-input"
    >
      <option value="null">-- select --</option>
      <option v-for="(opt,idx) in col.options" :value="opt.value" :key="idx">{{opt.label}}</option>
    </select>
    <span class="no-wrap" :style="styleObj" v-if="!flgEdit">{{displayVal}}</span>
  </td>
</template>
<script>
import moment from "moment";
import cDateTime from "./cDateTime.vue";
import comboBox from "./comboBox.vue";
const STD_INPUTS = "text|date";

export default {
  name: "td-element",
  props: ["row", "col", "rowIdx", "hasFocus", "error"],
  components: { cDateTime, comboBox },
  data: function() {
    return {
      flgDebug: 0,
      focusLevel: 0,
      flgError: false,
      flgFocus: false
    };
  },
  watch: {
    // flgFocus(newVal) {
    //    console.log("flgFocus : " + this.col.colName + " : " + newVal);
    // },
    error(newVal) {
      const flg = newVal != null;
      if (flg) {
        this.flgError = true;
      } else {
        this.flgError = false;
      }
    },
    hasFocus(newVal) {
      let colName = this.col ? this.col.colName : "unknown";
      if (newVal) {
        this.flgFocus = true;
        this.focusMe();
      } else {
        this.flgFocus = false;
      }
      if (this.flgDebug >= 2)
        console.log("hasFocus: " + newVal + "; " + colName);
    }
  },
  computed: {
    flgEdit: {
      get: function() {
        if (!this.flgFocus) return false;
        let editable = this.col.editable;
        let editor = false;
        if ("editor" in this.col) {
          editor = this.col.editor;
        }
        if (editable == null || editable == undefined) editable = true;
        if (editor === false || (editor !== undefined && editor !== null))
          editor = true;
        let flgEdit = editable && editor;
        return flgEdit;
      },
      set: function(newVal) {
        return newVal;
      }
    },
    styleObj() {
      let colWidth = this.col.width || "100px";
      if (colWidth == "0px") colWidth = "100px";
      return {
        width: colWidth
      };
    },
    tabIndex() {
      return (this.rowIdx + 1) * 100 + this.col.colIdx;
    },
    title() {
      let title = this.error ? this.error.errMsg : "";
      return title;
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
        case "combo":
          type = "combo";
          break;
        default:
          type = "text";
          break;
      }
      if (type == "text" && this.col.maxLength > 40) type = "textarea";
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
      // Now working withbacktab function
      this.$nextTick(() => {
        let el = this.$refs[this.refName];
        if (!el) el = this.$refs[this.refName + "_td"];
        if (el.$el) el = el.$el; //vue components
        if (el && document.activeElement == el) return;
        el.focus();
        if (this.flgDebug >= 2)
          console.log("focusMe: focusLevel: " + this.refName);
      });
    },
    onBlur() {
      this.flgFocus = false;
    },
    onFocus($evt) {
      if (!this.flgFocus) {
        this.flgFocus = true;
        this.focusMe();
      }
      this.$emit("focusEl");
    },
    onBackTab() {
      if (this.flgDebug >= 2) console.log("DataElement.handleBackTab");
      this.flgEdit = false;
      this.flgFocus = false;
      this.$emit("backtab");
    },
    onCtrlDown() {
      this.flgFocus = false;
      this.$emit("ctrldown");
    },
    onCtrlUp() {
      this.flgFocus = false;
      this.$emit("ctrlup");
    }
  }
};
</script>

<style scoped>
.data-element-input {
  width: 95%;
}
.error {
  border: 1px solid red !important;
}
.no-wrap {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: inline-block;
}
</style>