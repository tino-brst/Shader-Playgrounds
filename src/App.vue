<template>
    <div id="app">
        <v-editor v-model="code" :log="log"></v-editor>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Editor, { LogEntry } from "./components/editor/Editor.vue"
import sampleCode from "./sample-code"

export default Vue.extend( {
    name: "app",
    components: {
        "v-editor": Editor
    },
    data: () => ( {
        code: sampleCode,
        log: [] as LogEntry[]
    } ),
    mounted() {
        // 📝 el log va a tener entradas tanto para el shader de vertices como de fragmentos
        this.log = [
            { type: "error", line: 4, description: "danger! danger!" },
            { type: "error", line: 9, description: "danger! danger!" },
            { type: "error", line: 19, description: "danger! danger!" },
            { type: "warning", line: 15, description: "just be careful" }
        ]
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
