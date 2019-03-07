<template>
    <div id="main">
        <v-titlebar :file-name="fileName" :edited="documentHasUnsavedChanges" />
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
import path from "path"
import { remote, ipcRenderer as ipc, Event } from "electron"
import Vue from "vue"
import { EventBus } from "@/event-bus"
import { mapGetters, mapState } from "vuex"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
import TitleBar from "@/components/TitleBar.vue"
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
        "v-titlebar": TitleBar,
        "v-editor": Editor,
        "v-renderer": Renderer,
        "v-tabs": Tabs
    },
    data: () => ( {
        activeShader: ShaderType.Vertex,
        filePath: "",
        fileName: "",
        window: remote.getCurrentWindow()
    } ),
    computed: {
        windowTitle(): string {
            // @ts-ignore
            return ( this.fileName + ( this.documentHasUnsavedChanges ? " - Edited" : "" ) )
        },
        ...mapState( [ "editorState", "rendererState" ] ),
        ...mapGetters( [ "documentHasUnsavedChanges" ] )
    },
    watch: {
        documentHasUnsavedChanges() {
            // @ts-ignore
            this.window.setDocumentEdited( this.documentHasUnsavedChanges )
        },
        windowTitle() {
            this.window.setTitle( this.windowTitle )
        }
    },
    mounted() {
        ipc.once( "open", this.onOpen )
        ipc.on( "save", this.onSave )
        ipc.on( "shader", this.setActiveShader )
        ipc.on( "compileAndRun", this.compileAndRun )
    },
    methods: {
        compileAndRun() {
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
        onSave() {
            this.saveAppStateToFile( this.filePath )
        },
        loadAppStateFromFile( filePath: string ) {
            this.filePath = filePath
            this.fileName = path.basename( filePath )

            const appState: AppState = fs.read( filePath, "json" )

            this.$store.commit( "updateEditorState", appState.editor )
            this.$store.commit( "updateRendererState", appState.renderer )

            this.activeShader = this.$store.getters.activeShader

            EventBus.$emit( "loadState" )

            this.compileAndRun()
        },
        saveAppStateToFile( filePath: string ) {
            EventBus.$emit( "commitState" )

            const appState: AppState = {
                // @ts-ignore
                editor: this.editorState,
                // @ts-ignore
                renderer: this.rendererState
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
