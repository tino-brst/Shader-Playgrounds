<template>
    <div id="app">
        <div class="editor-panel">
            <v-tabs v-model="activeShader" />
            <v-editor
                :active-shader="activeShader"
                :vertex="codeVertexShader"
                :fragment="codeFragmentShader"
                :uniforms-editors="uniformsEditors"
                @change="updateShader"
            />
        </div>
        <!-- <div class="renderer-panel" /> -->
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tabs from "./components/tabs/Tabs.vue"
import Editor from "./components/editor/Editor.vue"
import sampleCodeVertex from "./sample-code-vertex"
import sampleCodeFragment from "./sample-code-fragment"

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
export interface Log {
    vertex: ShaderLog,
    fragment: ShaderLog
}
export interface ShaderLog {
    errors: Array <[ number, string[] ]>,
    warnings: Array <[ number, string[] ]>
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
        "v-tabs": Tabs
    },
    data: () => ( {
        activeShader: ShaderType.Vertex,
        codeVertexShader: sampleCodeVertex,
        codeFragmentShader: sampleCodeFragment,
        uniformsEditors: [] as UniformEditor[]
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
        updateLog( newEntries: LogEntry[] ) {
            // 📝 esto lo hace el renderer cada vez que se compilan los shaders
            this.$store.commit( "updateLog", newEntries )
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
                    this.uniformsEditors = [
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
                    ]
                } else {
                    cleanState = true
                    this.updateLog( [] )
                    this.uniformsEditors = []
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
    flex: 0 0 200px;
}
</style>
