<template>
    <div id="app">
        <v-editor></v-editor>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Editor from "./components/editor/Editor.vue"

export default Vue.extend( {
    name: "app",
    components: {
        "v-editor": Editor
    }
} )
</script>

<style>
html {
    height: 100%;
}

body {
    margin: 0;
    height: 100%;
}

#app {
    height: 100%;
}
</style>
