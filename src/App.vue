<template>
    <div id="app">
        <div class="title-bar" />
        <div class="panels">
            <div class="left-panel">
                <v-tabs v-model="activeShader" />
                <v-editor
                    :active-shader="activeShader"
                    :vertex="codeVertexShader"
                    :fragment="codeFragmentShader"
                    @change="updateShader"
                />
                <div class="toolbar" />
            </div>
            <div class="right-panel">
                <v-renderer
                    :vertex="codeVertexShader"
                    :fragment="codeFragmentShader"
                />
            </div>
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
import sampleCodeVertex from "@/sample_shaders/textures.vert.glsl"
import sampleCodeFragment from "@/sample_shaders/textures.frag.glsl"

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
    user-select: none;
    display: flex;
    flex-direction: column;
}

.title-bar {
    -webkit-app-region: drag;
    user-select: none;
    flex: 0 0 22px;
    background: rgb(60,60,60);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.panels {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex-grow: 1;
}

.left-panel {
    height: auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    flex: 1 1 auto;
    background: rgb(60, 60, 60);
    border-right: 1px solid rgba(255, 255, 255, 0.15);
}

.right-panel {
    height: auto;
    box-sizing: border-box;
    background:  rgb(8, 8, 8);
    flex: 0 0 300px;
    position: relative;
}

.left-panel .toolbar {
    z-index: 1;
    flex: 0 0 25px;
    box-sizing: border-box;
    background: rgb(60, 60, 60);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
}
</style>
