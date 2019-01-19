<template>
    <div id="app">
        <v-editor v-model="code" :log="log" :uniforms-editors="uniformsEditors"></v-editor>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Editor, { LogEntry, UniformEditor } from "./components/editor/Editor.vue"
import sampleCode from "./sample-code"

export default Vue.extend( {
    name: "app",
    components: {
        "v-editor": Editor
    },
    data: () => ( {
        code: sampleCode,
        log: [] as LogEntry[],
        uniformsEditors: [] as UniformEditor[]
    } ),
    mounted() {
        // 📝 el log va a tener entradas tanto para el shader de vertices como de fragmentos
        this.log = [
            { type: "error", line: 4, description: "'foo' - syntax error" },
            { type: "error", line: 4, description: "'bar' - undeclared identifier" },
            { type: "error", line: 9, description: "'foobar' - undeclared identifier" },
            { type: "error", line: 19, description: "'bar' - super danger!" },
            { type: "warning", line: 15, description: "'foofoo' - just be careful" },
            { type: "warning", line: 15, description: "'barbar' - just be careful okay?" },
            { type: "warning", line: 8, description: "'foobar' - just be careful okay?" }
        ]

        setTimeout( () => {
            this.log = [
                { type: "error", line: 16, description: "'foo' - syntax error" },
                { type: "error", line: 16, description: "'bar' - undeclared identifier" }
            ]
        }, 1000 )

        setTimeout( () => {
            this.log = [
                { type: "warning", line: 10, description: "'foofoo' - just be careful" },
                { type: "warning", line: 10, description: "'barbar' - just be careful okay?" }
            ]
        }, 2000 )

        this.uniformsEditors = [
            { type: "mat4", target: "viewMatrix", locked: false },
            { type: "int", target: "light.position", locked: false },
            { type: "vec3", target: "light.color", locked: false },
            { type: "vec3", target: "surface.ambient", locked: false },
            { type: "vec3", target: "surface.diffuse", locked: false },
            { type: "vec3", target: "surface.specular", locked: false },
            { type: "float", target: "surface.shininess", locked: false }
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
