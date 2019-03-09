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
const dialog = remote.dialog

interface AppState {
    renderer: RendererState,
    editor: EditorState
}

export default Vue.extend( {
    name: "Main",
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
        ipc.on( "close", this.onClose )
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
            this.showWindow()
        },
        onSave() {
            this.saveAppState()
        },
        onClose() {
            // @ts-ignore
            if ( this.documentHasUnsavedChanges ) {
                this.displayUnsavedChangesWarning()
            } else {
                this.closeWindow()
            }
        },
        displayUnsavedChangesWarning() {
            enum options {
                save,
                cancel,
                dontSave
            }
            const optionsLabels = [
                "Save",
                "Cancel",
                "Don't Save"
            ]

            const selectedOption = dialog.showMessageBox( {
                title: "Unsaved Changes",
                message: `Do you want to save the changes you made to ${ this.fileName }?`,
                detail: "Your changes will be lost if you don't save them.",
                type: "warning",
                buttons: optionsLabels,
                defaultId: options.save,
                cancelId: options.cancel
            } )

            if ( selectedOption === options.dontSave ) {
                this.closeWindow()
            } else if ( selectedOption === options.save ) {
                this.saveAppState()
                this.closeWindow()
            }
        },
        showWindow() {
            this.window.show()
            this.$store.commit( "setWindowReady" )
        },
        closeWindow() {
            this.window.destroy()
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
        saveAppState() {
            EventBus.$emit( "commitState" )

            const appState: AppState = {
                // @ts-ignore
                editor: this.editorState,
                // @ts-ignore
                renderer: this.rendererState
            }

            fs.write( this.filePath, appState )
        }
    }
} )
</script>

<style>
#main {
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
