<template>
    <div id="app">
        <v-titlebar :file-name="fileName" :edited="documentHasUnsavedChanges" />
        <div class="panels">
            <div class="left-panel">
                <div class="toolbar">
                    <v-tabs v-model="activeShader" />
                    <div class="tools">
                        <button class="compile-and-run" @mousedown.prevent @click="compileAndRun()" />
                    </div>
                </div>
                <v-editor :active-shader="activeShader" />
                <div class="status-bar">
                    <div class="log-counts">
                        <div class="errors" :class="{ visible: errorsCount }">
                            {{ errorsCount }}
                        </div>
                        <div class="warnings" :class="{ visible: warningsCount }">
                            {{ warningsCount }}
                        </div>
                    </div>
                    <div class="glsl-version">
                        GLSL ES 1.0
                    </div>
                </div>
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
        ...mapState( [
            "editorState",
            "rendererState"
        ] ),
        ...mapGetters( [
            "documentHasUnsavedChanges",
            "errorsCount",
            "warningsCount"
        ] )
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
@import "styles/fonts.css";

html {
    height: 100%;
}

body {
    margin: 0;
    height: 100%;
    -webkit-font-smoothing: antialiased;
    font-family: IBM Plex Sans;
    font-size: 13px;
    font-weight: 500;
    color: white;
}

/* macOS window outline - if not used: delete unnecessary bottom padding on renderer-toolbar & statusbar */
body::after {
    content: "";
    display: block;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    box-sizing: border-box;
    border-radius: 5px;
    box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 100;
}

#app {
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
    border-right: 1px solid rgb(80, 80, 80);
}

.right-panel {
    height: auto;
    flex: 0 0 300px;
    position: relative;
}

.left-panel .toolbar {
    user-select: none;
    z-index: 4;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 0 0 34px;
    box-sizing: border-box;
    border-bottom: 1px solid rgb(80, 80, 80);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
}

.left-panel .toolbar .tools  {
    height: 100%;
    flex: 0 0 75px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid rgb(80, 80, 80)
}

.left-panel .toolbar .tools button.compile-and-run {
    display: inline-block;
    width: 26px;
    height: 26px;
    padding: 0;
    appearance: none;
    box-shadow: none;
    outline: none;
    border: none;
    cursor: pointer;
    background: none;
}
.left-panel .toolbar .tools button.compile-and-run::after {
    content: "";
    display: inline-block;
    width: 100%;
    height: 100%;
    mask: url("/assets/icons/play.svg");
    mask-size: cover;
    background: white;
    opacity: 0.8;
    transition: opacity 0.2s;
}
.left-panel .toolbar .tools button.compile-and-run:hover::after {
    opacity: 1;
}
.left-panel .toolbar .tools button.compile-and-run:active::after {
    filter: brightness(0.8);
}

.status-bar {
    z-index: 1;
    flex: 0 0 25px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-left: 8px;
    padding-right: 8px;
    box-sizing: border-box;
    background: rgb(60, 60, 60);
    border-top: 1px solid rgb(80, 80, 80);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
    padding-bottom: 1px;
}

.status-bar .glsl-version {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
}

.status-bar .log-counts {
    display: flex;
    flex-direction: row;
    align-items: center;
}
.status-bar .log-counts .errors,
.status-bar .log-counts .warnings {
    opacity: 0.2;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    margin-right: 8px;
}
.status-bar .log-counts .errors.visible,
.status-bar .log-counts .warnings.visible {
    opacity: 0.5;
}

.status-bar .log-counts .errors::before {
    display: inline-block;
    margin-right: 6px;
    width: 13px;
    height: 13px;
    content: "";
    mask: url("/assets/icons/error.svg");
    mask-size: cover;
    background: white;
}
.status-bar .log-counts .warnings::before {
    display: inline-block;
    margin-right: 5px;
    width: 14px;
    height: 13px;
    content: "";
    mask: url("/assets/icons/warning.svg");
    mask-size: contain;
    background: white;
}
</style>
