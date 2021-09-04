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
      v-if="flgEdit && colEditor=='timestamp'"
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
      v-if="flgEdit && colEditor=='combo'"
      :options="col.options"
      :col="col"
      :ref="refName"
      v-model="row[col.colName]"
      @change="$emit('change')"
      @input="$emit('change')"
      @blur="onBlur"
      @close="onBlur"
      :tabIndex="tabIndex"
      class="data-element-input"
    />
    <textarea
      v-if="flgEdit && (colEditor =='textarea' )"
      :col="col"
      :ref="refName"
      v-model="row[col.colName]"
      @change="$emit('change')"
      @input="$emit('change')"
      @mouseup="$emit('resize')"
      :tabindex="tabIndex"
      :maxlength="col.maxLen"
      class="data-element-input"></textarea>

    <input
      v-if="flgEdit && ((colEditor == 'text'))"
      :type="colType"
      v-model="row[col.colName]"
      @change="$emit('change');"
      :tabindex="tabIndex"
      :ref="refName"
      class="data-element-input"
      :maxlength="col.maxLen"
    />

    <select
      v-if="flgEdit && colEditor == 'select'"
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
    <span class="no-wrap data-element-input" :style="styleObj" v-if="!flgEdit">{{displayVal}}</span>
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
        width: colWidth,
        display: "inline-block"
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
    colEditor() {
      let editor = this.col.editor;
      if (!editor) {
        editor = "text";
      }
      if (editor == "text" && this.col.maxLen > 40) editor = "textarea";
      return editor;
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
      switch (this.col.editor) {
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
            // if (!slctdOpt) dispVal = "value not found";
            if(!slctdOpt) dispVal = baseVal;
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
    onTab($evt) {
      this.$emit("tab");
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
  padding:4px 8px;
}
.error {
  border: 1px solid red !important;
}
.no-wrap {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>