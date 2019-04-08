import Vue from "vue"
import Welcome from "@/pages/Welcome.vue"

Vue.config.productionTip = false

new Vue( {
    render: h => h( Welcome )
} ).$mount( "#welcome" )
