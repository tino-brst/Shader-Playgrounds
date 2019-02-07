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
        <div class="renderer-panel">
            <v-renderer
                :vertex="codeVertexShader"
                :fragment="codeFragmentShader"
            />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
// ⚠️ pensar cuales van a ser los valores de los shaders por defecto (si van a tener alguno)
import sampleCodeVertex from "@/scripts/renderer/default_shaders/default.vert.glsl"
import sampleCodeFragment from "@/scripts/renderer/default_shaders/default.frag.glsl"

const VERTEX_SHADER_KEY = "1"
const FRAGMENT_SHADER_KEY = "2"

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
    },
    methods: {
        updateShader( newValue: string ) {
            if ( this.activeShader === ShaderType.Vertex ) {
                this.codeVertexShader = newValue
            } else {
                this.codeFragmentShader = newValue
            }
        },
        handleActiveShaderChange( event: KeyboardEvent ) {
            if ( event.metaKey === true ) {
                if ( event.key === VERTEX_SHADER_KEY ) {
                    this.activeShader = ShaderType.Vertex
                } else if ( event.key === FRAGMENT_SHADER_KEY ) {
                    this.activeShader = ShaderType.Fragment
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
