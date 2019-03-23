import Vue from "vue"
import Playground from "@/pages/Playground.vue"
import store from "@/store"

Vue.config.productionTip = false

new Vue( {
    store,
    render: h => h( Playground )
} ).$mount( "#playground" )
