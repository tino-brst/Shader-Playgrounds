<template>
    <div id="app">
        <div class="editor-panel">
            <v-tabs v-model="activeShader" />
            <v-editor
                :active-shader="activeShader"
                :vertex="codeVertexShader"
                :fragment="codeFragmentShader"
                @change="updateShader"
            />
        </div>
        <div class="renderer-panel" style="display: none">
            <v-renderer />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
// ⚠️ pensar cuales van a ser los valores de los shaders por defecto (si van a tener alguno)
import sampleCodeVertex from "@/scripts/editor/sample-code-vertex"
import sampleCodeFragment from "@/scripts/editor/sample-code-fragment"

export enum ShaderType {
    Vertex = "vertex",
    Fragment = "fragment"
}
export enum LogEntryType {
    Error = "error",
    Warning = "warning"
}
export interface LogEntry {
    shader: ShaderType,
    type: LogEntryType,
    line: number,
    description: string
}
export interface UniformEditor {
    target: string
    type: "int" | "float" | "mat4" | "vec3"
    locked: boolean
    // setValue: ( value: any ) => void
}

const RUN_KEY = "t"
// ⚠️ para testing
let cleanState = true

export default Vue.extend( {
    name: "App",
    components: {
        "v-editor": Editor,
        "v-renderer": Renderer,
        "v-tabs": Tabs
    },
    data: () => ( {
        activeShader: ShaderType.Vertex,
        codeVertexShader: sampleCodeVertex,
        codeFragmentShader: sampleCodeFragment
    } ),
    mounted() {
        // shorcut para cambio de shader activo ( ⚠️ tener en cuenta la plataforma: cmd / ctrl )
        window.addEventListener( "keydown", this.handleActiveShaderChange )
        window.addEventListener( "keydown", this.handleRunKey )
    },
    methods: {
        updateShader( newValue: string ) {
            if ( this.activeShader === ShaderType.Vertex ) {
                this.codeVertexShader = newValue
            } else {
                this.codeFragmentShader = newValue
            }
        },
        updateLog( newEntries: LogEntry[] ) { // 📝 esto lo deberia hacer el renderer cada vez que se compilan los shaders, se cambia de modelo, etc
            this.$store.commit( "updateLog", newEntries )
        },
        updateUniformsEditors( newEditors: UniformEditor[] ) { // 📝 esto lo deberia hacer el renderer cada vez que se compilan los shaders, se cambia de modelo, etc
            this.$store.commit( "updateUniformsEditors", newEditors )
        },
        handleActiveShaderChange( event: KeyboardEvent ) {
            if ( event.metaKey === true ) {
                if ( event.key === "1" ) {
                    this.activeShader = ShaderType.Vertex
                } else if ( event.key === "2" ) {
                    this.activeShader = ShaderType.Fragment
                }
            }
        },
        handleRunKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === RUN_KEY ) {
                if ( cleanState ) {
                    cleanState = false
                    this.updateLog( [
                        { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 5, description: "'foofoo' - just be careful" },
                        { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 8, description: "'foofoo' - just be careful" },
                        { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 8, description: "'barbar' - just be careful okay?" },
                        { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 8, description: "'barbar' - just be careful okay?" },
                        { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 11, description: "'barbar' - just be careful okay?" },
                        { shader: ShaderType.Fragment, type: LogEntryType.Error, line: 8, description: "'barbar' - just be careful okay?" },
                        { shader: ShaderType.Fragment, type: LogEntryType.Error, line: 8, description: "'foobar' - just be careful okay?" }
                    ] )
                    this.updateUniformsEditors( [
                        { type: "mat4", target: "viewMatrix", locked: false },
                        { type: "mat4", target: "modelViewProjectionMatrix", locked: false },
                        { type: "mat4", target: "modelViewMatrix", locked: false },
                        { type: "mat4", target: "normalMatrix", locked: false },
                        { type: "int", target: "light.position", locked: false },
                        { type: "vec3", target: "light.color", locked: false },
                        { type: "vec3", target: "surface.ambient", locked: false },
                        { type: "vec3", target: "surface.diffuse", locked: false },
                        { type: "vec3", target: "surface.specular", locked: false },
                        { type: "float", target: "surface.shininess", locked: false }
                    ] )
                } else {
                    cleanState = true
                    this.updateLog( [] )
                    this.updateUniformsEditors( [] )
                }
            }
        }
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
    -webkit-font-smoothing: antialiased;
    height: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
}

.editor-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    flex: 1 1 auto;
}

.renderer-panel {
    height: 100%;
    box-sizing: border-box;
    background:  rgb(10, 10, 10);
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    flex: 0 0 300px;
}
</style>
