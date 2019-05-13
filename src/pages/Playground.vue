<template>
    <div id="playground" :class="[ platform, { 'cursor-col-resize': rightPanelResizing } ]">
        <v-titlebar v-if="platform === 'darwin'" :file-name="fileName" :edited="documentHasUnsavedChanges" />
        <div class="panels">
            <div class="left-panel">
                <div class="toolbar" @mousedown.prevent>
                    <v-tabs />
                    <div class="tools">
                        <button
                            class="compile-and-run"
                            tabindex="-1"
                            @mousedown.prevent
                            @click="compileAndRun()"
                        />
                    </div>
                </div>
                <v-editor ref="editor" />
                <div class="status-bar" @mousedown.prevent>
                    <div class="log-counts">
                        <div class="errors" :class="{ visible: errorsCount }">
                            {{ errorsCount }}
                        </div>
                        <div class="warnings" :class="{ visible: warningsCount }">
                            {{ warningsCount }}
                        </div>
                    </div>
                    <div class="space-flex" />
                    <v-language-version-select dropup autohide>
                        GLSL ES:
                    </v-language-version-select>
                    <v-checkbox v-model="rightPanelVisible">
                        <template slot="icon">
                            <v-sidebar />
                        </template>
                    </v-checkbox>
                </div>
            </div>
            <div class="right-panel" ref="rightPanel" :style="rightPanelStyle">
                <div class="resizer" @mousedown.prevent="resizerMoveStart" />
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
import LanguageVersionSelect from "@/components/LanguageVersionSelect.vue"
import Checkbox from "@/components/Checkbox.vue"
import { ShaderType } from "@/scripts/renderer/_constants"
import { StateSaveInfo } from "@/store"
import { FILE_EXTENSION, NEW_FILE_NAME } from "@/constants"
const { SidebarIcon } = require( "vue-feather-icons" )

const { app, dialog } = remote

export default Vue.extend( {
    name: "Playground",
    components: {
        "v-titlebar": TitleBar,
        "v-editor": Editor,
        "v-renderer": Renderer,
        "v-tabs": Tabs,
        "v-language-version-select": LanguageVersionSelect,
        "v-checkbox": Checkbox,
        "v-sidebar": SidebarIcon
    },
    data: () => ( {
        filePath: "",
        window: remote.getCurrentWindow(),
        rightPanelResizing: false,
        rightPanelVisible: true,
        rightPanelWidth: 300
    } ),
    computed: {
        newFile(): boolean {
            return ! this.filePath
        },
        fileName(): string {
            return this.filePath ? path.basename( this.filePath, "." + FILE_EXTENSION ) : NEW_FILE_NAME
        },
        windowTitle(): string {
            // @ts-ignore
            return ( this.fileName + ( this.documentHasUnsavedChanges ? " - edited" : "" ) )
        },
        rightPanelStyle(): any {
            return {
                display: this.rightPanelVisible ? "unset" : "none",
                flexBasis: `${ this.rightPanelWidth }px`
            }
        },
        ...mapGetters( [
            "documentHasUnsavedChanges",
            "errorsCount",
            "warningsCount",
            "saveInfo"
        ] ),
        ...mapState( [
            "platform"
        ] )
    },
    watch: {
        documentHasUnsavedChanges() {
            // @ts-ignore
            this.window.setDocumentEdited( this.documentHasUnsavedChanges )
        },
        windowTitle() {
            this.window.setTitle( this.windowTitle )
        },
        rightPanelVisible() {
            setTimeout( () => {
                // @ts-ignore
                ( this.$refs.editor as Vue ).refresh()
            }, 0 )
        }
    },
    mounted() {
        ipc.once( "open", this.onOpen )
        ipc.once( "new", this.onNew )
        ipc.on( "save", this.onSave )
        ipc.on( "close", this.onClose )
        ipc.on( "set-active-shader", this.setActiveShader )
        ipc.on( "compile-and-run", this.compileAndRun )
        ipc.on( "toggle-scene-view", () => { this.rightPanelVisible = ! this.rightPanelVisible } )

        // @ts-ignore
        this.window.setDocumentEdited( this.documentHasUnsavedChanges )
        this.window.setTitle( this.windowTitle )

        // handling window resize events
        let resizeTimeout: any
        this.window.on( "resize", () => {
            clearTimeout( resizeTimeout )
            resizeTimeout = setTimeout( this.onWindowResizeEnd, 300 )
        } )
    },
    methods: {
        resizerMoveStart( event: MouseEvent ) {
            window.addEventListener( "mousemove", this.resizerMove )
            window.addEventListener( "mouseup", this.resizerMoveEnd )
            this.rightPanelResizing = true
        },
        resizerMoveEnd( event: MouseEvent ) {
            window.removeEventListener( "mousemove", this.resizerMove )
            window.removeEventListener( "mouseup", this.resizerMoveEnd )
            this.rightPanelResizing = false
            this.adjustRightPanelWidth();
            // @ts-ignore - update scrollbars size
            ( this.$refs.editor as Vue ).refresh()
        },
        resizerMove( event: MouseEvent ) {
            this.rightPanelWidth = window.innerWidth - event.clientX
        },
        onWindowResizeEnd() {
            this.adjustRightPanelWidth()
        },
        adjustRightPanelWidth() {
            // during resize, the right panel may have reached its max/min width, adjust width value to that min/max
            const rightPanelElement = this.$refs.rightPanel as HTMLElement
            this.rightPanelWidth = rightPanelElement.offsetWidth // offsetWidth: includes border width
        },
        compileAndRun() {
            EventBus.$emit( "saveShadersCode" )
            EventBus.$emit( "compileAndRun" )
        },
        setActiveShader( event: Event, value: ShaderType ) {
            this.$store.commit( "SET_ACTIVE_SHADER", value )
        },
        onOpen( event: Event, filePath: string ) {
            this.filePath = filePath
            this.loadFile()
            this.showWindow()
        },
        onNew() {
            this.showWindow()
        },
        onSave() {
            this.saveFile()
        },
        onClose() {
            // @ts-ignore
            if ( this.documentHasUnsavedChanges ) {
                this.showUnsavedChangesWarning()
            } else {
                this.closeWindow( true )
            }
        },
        showUnsavedChangesWarning() {
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

            dialog.showMessageBox( this.window, {
                title: "Unsaved Changes",
                message: `Do you want to save the changes you made to ${ this.filePath ? path.basename( this.filePath ) : NEW_FILE_NAME }?`,
                detail: "Your changes will be lost if you don't save them.",
                type: "warning",
                buttons: optionsLabels,
                defaultId: options.save,
                cancelId: options.cancel
            }, ( selectedOption ) => {
                if ( selectedOption === options.dontSave ) {
                    this.closeWindow( true )
                } else if ( selectedOption === options.save ) {
                    // if the file save is cancelled, stop window from closing
                    this.closeWindow( this.saveFile() )
                } else {
                    this.closeWindow( false )
                }
            } )
        },
        showSaveDialog() {
            const filePath = dialog.showSaveDialog( this.window, {
                defaultPath: this.fileName,
                filters: [
                    { name: "Shader Playgrounds File", extensions: [ FILE_EXTENSION ] }
                ]
            } )

            return filePath
        },
        showWindow() {
            this.window.show()
            this.$store.commit( "SET_WINDOW_READY", true )
        },
        closeWindow( proceed: boolean ) {
            ipc.send( "close-window", proceed, this.filePath )
        },
        loadFile() {
            const savedState: StateSaveInfo = fs.read( this.filePath, "json" )

            if ( savedState ) {
                this.$store.dispatch( "restoreState", savedState )
                EventBus.$emit( "loadState" )
                this.compileAndRun()
                this.registerWorkingFile()
            } else {
                this.window.destroy()
            }
        },
        saveFile(): boolean {
            let fileSaved = true

            if ( this.newFile ) {
                // ask for a location to save it
                const newFilePath = this.showSaveDialog()

                if ( newFilePath ) {
                    // update the store and save it
                    EventBus.$emit( "saveState" )
                    // @ts-ignore
                    fs.write( newFilePath, this.saveInfo )

                    // update filePath and register the file to recents, etc
                    this.filePath = newFilePath
                    this.registerWorkingFile()
                } else {
                    fileSaved = false
                }
            } else {
                // working on an existing file, just save it
                EventBus.$emit( "saveState" )
                // @ts-ignore
                fs.write( this.filePath, this.saveInfo )
            }

            return fileSaved
        },
        registerWorkingFile() {
            if ( this.filePath ) {
                this.window.setRepresentedFilename( this.filePath )
                ipc.send( "opened-file", this.filePath )
            }
        }
    }
} )
</script>

<style>
@import "../styles/fonts.css";

html {
    height: 100%;
}

body {
    margin: 0;
    height: 100%;
}

#playground {  /* global variables */
    --font-weight: 400;
    --border-radius: 0px;
}
#playground.darwin {
    --font-weight: 500;
    --border-radius: 6px;
}

#playground {
    height: 100%;
    user-select: none;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    font-family: system-ui;
    font-size: 13px;
    font-weight: var(--font-weight);
    color: white;
    overflow: hidden;
}
#playground::after { /* window outline - if not used: delete bottom padding on renderer-toolbar & statusbar */
    content: "";
    display: block;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    box-sizing: border-box;
    box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 100;
}
#playground.darwin::after {
    border-radius: 5px;
}

#playground.cursor-col-resize * {
    cursor: col-resize;
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
    flex: 1 1 auto;
    min-width: 450px;
    flex-direction: column;
    flex-wrap: nowrap;
}
.right-panel {
    height: auto;
    flex-grow: 0;
    flex-shrink: 1;
    min-width: 250px;
    position: relative;
    box-sizing: border-box;
    border-left: 1px solid rgb(80, 80, 80);
}
.right-panel .resizer {
    z-index: 2;
    position: absolute;
    height: 100%;
    width: 4px;
    cursor: col-resize;
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
    z-index: 7;
    flex: 0 0 25px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 8px;
    padding-right: 8px;
    padding-bottom: 1px;
    box-sizing: border-box;
    background: rgb(60, 60, 60);
    border-top: 1px solid rgb(80, 80, 80);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
}

.status-bar .space-flex {
    flex-grow: 1;
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

.status-bar .checkbox {
    margin-left: 10px;
}
.status-bar .checkbox .icon {
    transform: rotate(180deg) translateY(-1px);
}
</style>
