import njsGrid from "./njsGrid.vue";
import Vue from 'vue';


Vue.config.productionTip = false

const vm = new Vue({
  components: { njsGrid }
})//.$mount('#app')


export { njsGrid }