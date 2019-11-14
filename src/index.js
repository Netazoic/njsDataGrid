import Vue from 'vue'
import njsGrid from "./njsGrid.vue";

Vue.config.productionTip = false

const vm = new Vue({
  components: { njsGrid }
})//.$mount('#app')


export { njsGrid }