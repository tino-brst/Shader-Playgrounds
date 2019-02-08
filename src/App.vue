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
            <div class="toolbar" />
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
import { ShaderType } from "@/scripts/renderer/_constants"

// ⚠️ pensar cuales van a ser los valores de los shaders por defecto (si van a tener alguno)
import sampleCodeVertex from "@/scripts/renderer/default_shaders/default.vert.glsl"
import sampleCodeFragment from "@/scripts/renderer/default_shaders/default.frag.glsl"

const VERTEX_SHADER_KEY = "1"
const FRAGMENT_SHADER_KEY = "2"

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
    background: rgb( 20, 20, 20 ); /* ⚠️ PARCHE: para evitar el borde blanco en objetos con blur (se podria hacer que el elemento con blur tenga otro atras que sea el color de fondo y sea mas grande que el elemento en si) */
}

body {
    margin: 0;
    height: 100%;
}

#app {
    -webkit-font-smoothing: antialiased;
    font-family: IBM Plex Sans;
    font-size: 13px;
    font-weight: 500;
    color: white;
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
    background:  rgb(8, 8, 8);
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    flex: 0 0 300px;
    position: relative;
}

.renderer-panel .toolbar {
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 23px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba( 30, 30, 30, 0.9 );
    backdrop-filter: saturate(180%) blur(15px);
}

.renderer-panel .toolbar:last-child::after {
    content: "";
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    position: absolute;
    background-color: rgba( 255, 255, 255, 0.08 );
}
</style>
