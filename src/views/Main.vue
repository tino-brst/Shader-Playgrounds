<template>
    <div id="main">
        <!-- <div class="title-bar" /> -->
        <div class="panels">
            <div class="left-panel">
                <v-tabs v-model="activeShader" />
                <v-editor :active-shader="activeShader" />
                <div class="toolbar" />
            </div>
            <div class="right-panel">
                <v-renderer />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import fs from "fs-jetpack"
import { remote, ipcRenderer as ipc, Event } from "electron"
import Vue from "vue"
import { EventBus } from "@/event-bus"
import { mapGetters, mapActions } from "vuex"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
import { ShaderType } from "@/scripts/renderer/_constants"
import { RendererState, EditorState } from "@/store"

const app = remote.app

interface AppState {
    renderer: RendererState,
    editor: EditorState
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
        filePath: "",
        window: remote.getCurrentWindow()
    } ),
    mounted() {
        ipc.once( "open", this.onOpen )
        ipc.on( "save", this.onSave )
        ipc.on( "shader", this.setActiveShader )
        ipc.on( "compileAndRun", this.compileAndRun )
    },
    methods: {
        compileAndRun( event: Event ) {
            EventBus.$emit( "commitShadersCode" )
            EventBus.$emit( "compileAndRun" )
        },
        setActiveShader( event: Event, shader: ShaderType ) {
            this.activeShader = shader
        },
        onOpen( event: Event, filePath: string ) {
            this.loadAppStateFromFile( filePath )
            this.window.show()
        },
        onSave( event: Event ) {
            this.saveAppStateToFile( this.filePath )
        },
        loadAppStateFromFile( filePath: string ) {
            this.filePath = filePath

            const appState: AppState = fs.read( filePath, "json" )

            this.$store.commit( "updateEditorState", appState.editor )
            this.$store.commit( "updateRendererState", appState.renderer )

            this.activeShader = this.$store.getters.activeShader

            EventBus.$emit( "loadState" )
            EventBus.$emit( "compileAndRun" )
        },
        saveAppStateToFile( filePath: string ) {
            EventBus.$emit( "commitState" )

            const appState: AppState = {
                renderer: this.$store.state.renderer,
                editor: this.$store.state.editor
            }

            fs.write( filePath, appState )
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

#main {
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
