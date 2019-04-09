<template>
    <div id="welcome">
        <button class="close-window" @click="closeWindow()"> x </button>
        <div class="info">
            <span>Welcome to <i> Shaders Playground </i></span>
        </div>
        <div class="recents">
            <ul>
                <li v-for="item in formatedRecents" :key="item.shortPath" @click="openFile( item.fullPath )">
                    <span class="name"> {{ item.name }} </span>
                    <span class="path"> {{ item.shortPath }} </span>
                </li>
            </ul>
            <div class="buttons">
                <button @click="openFile()">
                    Open another playground ...
                </button>
                <button @click="newFile()">
                    New playground
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { remote, ipcRenderer as ipc, Event } from "electron"
import path from "path"
import { FILE_EXTENSION } from "@/constants"

const { app } = remote
const homeFolder = app.getPath( "home" )

interface RecentsItem {
    name: string,
    shortPath: string,
    fullPath: string
}

export default Vue.extend( {
    name: "Welcome",
    data: () => ( {
        window: remote.getCurrentWindow(),
        recents: [] as string[]
    } ),
    computed: {
        formatedRecents(): RecentsItem[] {
            const recents: RecentsItem[] = []

            for ( let filePath of this.recents ) {
                recents.push( {
                    name: path.basename( filePath, "." + FILE_EXTENSION ),
                    shortPath: filePath.replace( homeFolder, "~" ),
                    fullPath: filePath
                } )
            }

            return recents
        }
    },
    mounted() {
        ipc.on( "recents", this.onRecentsUpdate )
    },
    methods: {
        onRecentsUpdate( event: Event, recents: string[] ) {
            this.recents = recents
        },
        closeWindow() {
            this.window.close()
        },
        openFile( filePath?: string ) {
            ipc.send( "open-file", filePath )
        },
        newFile() {
            ipc.send( "new-file" )
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
    -webkit-font-smoothing: antialiased;
    font-family: IBM Plex Sans;
    font-size: 13px;
    font-weight: 500;
    color: white;
}
body::after { /* Window outline */
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

#welcome {
    font-size: 20px;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
}

.info {
    -webkit-app-region: drag;
    user-select: none;
    height: 100%;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

button.close-window {
    -webkit-app-region: no-drag; /* has no effect on absolutely positiones elements */
    user-select: none;
    position: absolute;
    top: 8px;
    left: 8px;
}

.recents {
    height: 100%;
    flex: 0 0 300px;
    background: black;
    position: relative;
}

.recents .buttons {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    display: flex;
    justify-content: space-between;
    padding: 8px;
}

.recents ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.recents li {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    padding: 8px;
}
.recents li .path {
    font-size: 14px;
    opacity: 0.4;
}
</style>
