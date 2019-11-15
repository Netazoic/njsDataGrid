import njsGrid from "./njsGrid.vue";
import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.config.productionTip = false

const vm = new Vue({
  components: { njsGrid }
})//.$mount('#app')


export { njsGrid }