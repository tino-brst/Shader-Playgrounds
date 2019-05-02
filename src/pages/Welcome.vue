<template>
    <div id="welcome" :class="[ platform, { loaded } ]">
        <div class="info-container">
            <button class="close-window" @click="closeWindow()" />
            <div class="info">
                <img src="assets/images/icon.png">
                <h2> Welcome to </h2>
                <h1> Shader Playgrounds </h1>
                <div class="version">
                    <transition name="fade" mode="out-in">
                        <div key="downloading" v-if="(autoUpdateProgress > 0) && (autoUpdateState !== 'failed') && (autoUpdateState !== 'downloaded')">
                            <span class="downloading-icon" />
                            <h3> Downloading Update {{ autoUpdateProgress.toFixed() }}% </h3>
                        </div>
                        <div key="restart" v-else-if="autoUpdateState === 'downloaded'">
                            <button class="restart" @click="quitAndInstall()">
                                <span class="restart-icon" />
                                <h3> Restart to update </h3>
                            </button>
                        </div>
                        <div key="default" v-else>
                            <h3> Version {{ version }} </h3>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
        <div class="recents">
            <div class="items">
                <ul v-if="formatedRecents.length">
                    <li
                        v-for="(item, index) in formatedRecents"
                        :key="item.path"
                        :class="{ selected: selectedRecent === index }"
                        @click="selectedRecent = index"
                        @dblclick="openFile( item.path )"
                    >
                        <span class="name"> {{ item.name }} </span>
                        <span class="folder"> {{ item.folder }} </span>
                    </li>
                </ul>
                <div v-else class="empty">
                    <h3> No Recent Playgrounds </h3>
                </div>
            </div>
            <div class="buttons">
                <button class="open-playground" @click="openFile()">
                    Open another playground ...
                </button>
                <button class="new-playground" @click="newFile()" />
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
    folder: string,
    path: string
}

export default Vue.extend( {
    name: "Welcome",
    data: () => ( {
        selectedRecent: 0,
        version: app.getVersion(),
        platform: remote.process.platform,
        window: remote.getCurrentWindow(),
        recents: [] as string[],
        autoUpdateProgress: 0,
        autoUpdateState: "" as "" | "downloaded" | "failed",
        loaded: false
    } ),
    computed: {
        formatedRecents(): RecentsItem[] {
            const recents: RecentsItem[] = []

            for ( let filePath of this.recents ) {
                recents.push( {
                    name: path.basename( filePath, "." + FILE_EXTENSION ),
                    folder: path.dirname( filePath ).replace( homeFolder, "~" ),
                    path: filePath
                } )
            }

            return recents
        }
    },
    mounted() {
        ipc.on( "recents", this.onRecentsUpdate )
        ipc.on( "auto-update", this.onAutoUpdate )
        window.addEventListener( "keydown", this.onKeyDown )
        window.addEventListener( "load", () => { this.loaded = true } )
    },
    methods: {
        onRecentsUpdate( event: Event, recents: string[] ) {
            this.recents = recents
        },
        onAutoUpdate( event: Event, value: "downloaded" | "failed" | number ) {
            if ( typeof value === "string" ) {
                this.autoUpdateState = value
            } else {
                this.autoUpdateProgress = value || 0
            }
        },
        closeWindow() {
            this.window.close()
        },
        openFile( filePath?: string ) {
            ipc.send( "open-file", filePath )
        },
        newFile() {
            ipc.send( "new-file" )
        },
        onKeyDown( event: KeyboardEvent ) {
            switch ( event.key ) {
                case "ArrowUp":
                    if ( this.selectedRecent > 0 ) this.selectedRecent --
                    break
                case "ArrowDown":
                    if ( this.selectedRecent < this.recents.length - 1 ) this.selectedRecent ++
                    break
                case "Enter":
                    this.openFile( this.recents[ this.selectedRecent ] )
            }
        },
        quitAndInstall() {
            ipc.send( "quit-and-install" )
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

:root {
    --font-weight: 500;
}

#welcome {
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
    font-family: system-ui;
    font-size: 13px;
    font-weight: var(--font-weight);
    color: white;
    opacity: 0;
    transition: opacity 0.5s;
}
#welcome.darwin {
    transition: opacity 0.3s;
}
#welcome::after { /* Window outline */
    content: "";
    display: block;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    box-sizing: border-box;
    box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 100;
}
#welcome.darwin::after {
    border-radius: 5px;
}
#welcome.loaded {
    opacity: 1;
}

.info-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    -webkit-app-region: drag;
    user-select: none;
    height: 100%;
    flex-grow: 1;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}

button.close-window {
    -webkit-app-region: no-drag;
    position: relative;
    align-self: flex-start;
    width: 20px;
    height: 20px;
    margin: 8px;
    padding: 0;
    user-select: none;
    border: none;
    background: none;
    outline: none;
    opacity: 0.5;
    cursor: pointer;
}
button.close-window::after {
    display: block;
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    content: "";
    mask: url("/assets/icons/close.svg");
    mask-size: cover;
    background: white;
}

.info {
    height: 100%;
    position:relative;
    top: -20px; /* close-button height */
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.info img {
    height: 140px;
    width: 140px;
    filter: drop-shadow(0 20px 10px rgba(0, 0, 0, 0.08));
    margin-bottom: 15px;
}

.info h1,
.info h2,
.info h3 {
    font-weight: normal;
    margin: 0;
}

.info h1 {
    font-size: 36px;
    font-weight: 300;
    margin-top: 5px;
    margin-bottom: 10px;
}
.info h2 {
    font-size: 20px;
}
.info h3 {
    font-size: 14px;
    opacity: 0.5;
    margin-left: 5px; margin-right: 5px;
}

.info .version > div {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 20px
}

.info .version .downloading-icon,
.info .version .restart-icon {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.info .version .restart-icon:after,
.info .version .downloading-icon:after {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    content: "";
    opacity: 0.5;
    mask-size: contain;
    background: white;
}

.info .version .restart-icon:after {
    mask: url("/assets/icons/restart.svg");
}

.info .version .downloading-icon:after {
    mask: url("/assets/icons/gear.svg");
    animation-name: rotate;
    animation-duration: 5s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
}

.info .version button.restart {
    -webkit-app-region: no-drag;
    user-select: none;
    display: flex;
    align-items: center;
    padding: 0;
    background: none;
    border: none;
    outline: none;
    pointer-events: all;
    cursor: pointer;
    color: white;
}
.info .version button.restart:hover h3,
.info .version button.restart:hover span:after {
    transition: all 0.1s;
}
.info .version button.restart:hover h3,
.info .version button.restart:hover span:after {
    opacity: 0.8;
}
.info .version button.restart:active h3,
.info .version button.restart:active span:after {
    filter: brightness(0.8);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

@keyframes rotate {
  from {
    transform: none;
  }
  to {
    transform: rotate(360deg);
  }
}

.recents {
    height: 100%;
    flex: 0 0 300px;
    background: rgb(30, 30, 30);
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.recents .items {
    flex-grow: 1;
    position: relative;
}

.recents .items .empty {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.recents .items .empty h3 {
    font-weight: normal;
    margin: 0;
    font-size: 14px;
    opacity: 0.5;
    user-select: none;
}

.recents .buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.recents button.open-playground,
.recents button.new-playground {
    padding: 0;
    background: none;
    border: none;
    outline: none;
    color: white;
    font-size: 13px;
    cursor: pointer;
    border-radius: 3px;
    transition: background 0.1s;
}

.recents button.open-playground {
    height: min-content;
    padding: 2px 4px;
    margin-left: 4px;
    margin-right: 4px;
}
.recents button.open-playground:hover {
    background: rgba(255, 255, 255, 0.07);
}
.recents button.open-playground:active {
    filter: brightness(0.8);
}

.recents button.new-playground {
    width: 26px;
    height: 26px;
    position: relative;
}
.recents button.new-playground::after {
    display: block;
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    content: "";
    mask: url("/assets/icons/add.svg");
    mask-size: cover;
    background: white;
}
.recents button.new-playground:active {
    filter: brightness(0.8);
}

.recents ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.recents li {
    display: flex;
    flex-direction: column;
    user-select: none;
    cursor: pointer;
    padding: 6px 12px 10px 12px;
}
.recents li:first-child {
    padding-top: 8px;
}
.recents li:hover {
    background: rgba(255, 255, 255, 0.05);
}

.recents li.selected {
    background: royalblue;
}
.recents li.selected .folder {
    opacity: 0.5;
}

.recents li .name {
    font-weight: normal;
    font-size: 15px;
    margin-bottom: 2px;
}
.recents li .folder {
    font-size: 12px;
    opacity: 0.3;
}
</style>
