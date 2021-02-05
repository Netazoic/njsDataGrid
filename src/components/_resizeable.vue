

<script>
import debounce from "lodash/debounce";

export default {
  components: {},
  created() {
    var vm = this;
  },
  data: function () {
    return {
      navigation: {
        height: "auto",
        width: 320,
        top: 0,
        left: 0,
      },
      observer: null,
      positions: {
        clientX: undefined,
        clientY: undefined,
        movementX: 0,
        movementY: 0,
      },
      debouncedResize: debounce(this.onResize, 257),
    };
  },
  computed: {
    ref() {
      return this.$refs[this.refName];
    },
    memKey() {
      if (!this.refName)
        throw new Error("resizeable elements need to define a refName");
      return "mm." + this.refName + ".navigation";
    },
  },
  methods: {
    dragMouseDown: function (event) {
      event.preventDefault();
      // get the mouse cursor position at startup:
      this.positions.clientX = event.clientX;
      this.positions.clientY = event.clientY;
      document.onmousemove = this.elementDrag;
      document.onmouseup = this.closeDragElement;
    },
    elementDrag: function (event) {
      event.preventDefault();
      this.positions.movementX = this.positions.clientX - event.clientX;
      this.positions.movementY = this.positions.clientY - event.clientY;
      this.positions.clientX = event.clientX;
      this.positions.clientY = event.clientY;
      // set the element's new position:
      this.ref.$el.style.top =
        this.ref.$el.offsetTop - this.positions.movementY + "px";
      this.ref.$el.style.left =
        this.ref.$el.offsetLeft - this.positions.movementX + "px";
    },
    closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    },
    onResize() {
      const toolbox = this.ref.$el;
      const vm = this;
      let { width, height, top, left } = toolbox.style;

      this.navigation.width = width;
      this.navigation.height = height;
      this.navigation.top = top;
      this.navigation.left = left;
      const key = this.memKey;
      localStorage.setItem(key, JSON.stringify(this.navigation));
    },
    initObserver() {
      const config = {
        attributes: true,
        attributeFilter: ["style", "height", "width"],
        attributeOldValue: true,
        subtree: true,
      };
      if (this.observer) return; // Don't double init
      const vm = this;
      let ref = vm.ref;
      if (!ref) ref = vm.$refs[vm.refName]; // Sometimes hard to get the ref to update when an html div goes from display none to display
      if (!ref) return; // Don't bother initializing if we don't have a ref;

      // create the observer
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          // check if the mutation is attributes and
          // update the width and height data if it is.
          if (mutation.type === "attributes") {
            // call resize handler on mutation
            // console.log(mutation);
            vm.onResize();
          }
        });
      });
      // observe element's specified mutations
      this.$nextTick(function () {
        const node = ref.$el ? ref.$el : ref; // if ref points to a vue component, use the $el. Otherwise, just the ref
        observer.observe(node, config);
      });
      // add the observer to data so we can disconnect it later
      this.observer = observer;
    },
  },
  created() {
    // Restore window position
    const key = this.memKey;
    const memNavigation = localStorage.getItem(key);
    if (memNavigation != null) {
      this.navigation = JSON.parse(memNavigation);
      this.navigation.height = "auto";
    }
  },
  mounted() {
    this.initObserver();
  },
  beforeDestroy() {
    if (this.observer) this.observer.disconnect();
  },
};
</script>
