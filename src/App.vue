<template>
    <div id="app">
        <div class="title-bar" />
        <div class="panels">
            <div class="left-panel">
                <v-tabs v-model="activeShader" />
                <v-editor />
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
import { remote } from "electron"
import Vue from "vue"
import { EventBus } from "@/event-bus"
import { mapGetters, mapActions } from "vuex"
import Tabs from "@/components/Tabs.vue"
import Editor from "@/components/Editor.vue"
import Renderer from "@/components/Renderer.vue"
import { ShaderType } from "@/scripts/renderer/_constants"

const app = remote.app

const VERTEX_SHADER_KEY = "1"
const FRAGMENT_SHADER_KEY = "2"
const COMPILE_AND_RUN_KEY = "t"
const SAVE_KEY = "s"
const OPEN_KEY = "o"

export default Vue.extend( {
    name: "App",
    components: {
        "v-editor": Editor,
        "v-renderer": Renderer,
        "v-tabs": Tabs
    },
    computed: {
        activeShader: {
            get(): string {
                return this.$store.state.activeShader
            },
            set( newValue: string ) {
                this.$store.commit( "setActiveShader", newValue )
            }
        },
        ...mapGetters( [ "appState" ] )
    },
    mounted() {
        // shorcut para cambio de shader activo ( ⚠️ tener en cuenta la plataforma: cmd / ctrl )
        window.addEventListener( "keydown", this.handleActiveShaderChange )
        window.addEventListener( "keydown", this.handleRunKey )
        window.addEventListener( "keydown", this.handleSaveKey )
        window.addEventListener( "keydown", this.handleOpenKey )

        // const desktopPath = app.getPath( "desktop" )
        // const fileName = "test.shdr"

        // const appState = fs.read( desktopPath + "/" + fileName, "json" )
        // // @ts-ignore
        // this.loadAppState( appState )
    },
    methods: {
        // 🤔 se podrian juntar todos con un switch ( cmd + case: [ tecla del shortcut ] )
        handleActiveShaderChange( event: KeyboardEvent ) {
            if ( event.metaKey === true ) {
                if ( event.key === VERTEX_SHADER_KEY ) {
                    this.activeShader = ShaderType.Vertex
                } else if ( event.key === FRAGMENT_SHADER_KEY ) {
                    this.activeShader = ShaderType.Fragment
                }
            }
        },
        handleRunKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === COMPILE_AND_RUN_KEY ) {
                EventBus.$emit( "commitShadersCode" )
                EventBus.$emit( "compileAndRun" )
            }
        },
        handleSaveKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === SAVE_KEY ) {
                EventBus.$emit( "commitShadersCode" )

                const desktopPath = app.getPath( "desktop" )
                const fileName = "test.shdr"
                const appState = ( this as any ).appState

                fs.writeAsync( desktopPath + "/" + fileName, appState ).then( () => {
                    console.log( "saved!" )
                } )
            }
        },
        handleOpenKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === OPEN_KEY ) {
                const desktopPath = app.getPath( "desktop" )
                const fileName = "test.shdr"

                fs.readAsync( desktopPath + "/" + fileName, "json" ).then( ( file ) => {
                    console.log( "opened!" )
                    const appState = file
                    // @ts-ignore
                    this.loadAppState( appState )
                    EventBus.$emit( "compileAndRun" )
                } )
            }
        },
        ...mapActions( [ "loadAppState" ] )
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
