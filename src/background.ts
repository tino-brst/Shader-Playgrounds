"use strict"

import { app, protocol, BrowserWindow } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import url from "url"
import path from "path"

// #region - CLI Plugin Electron Builder Boilerplate

protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
const inDevelopment = process.env.NODE_ENV !== "production"

// #endregion

app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// Window Management 🖼

let mainWindow : BrowserWindow | null

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 600,
        backgroundColor: "#3c3c3c",
        // titleBarStyle: "hidden",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowView( mainWindow, "main" )

    mainWindow.on( "closed", () => {
        mainWindow = null
    } )
}

// App lifecycle 🔄

app.on( "ready", async() => {
    if ( inDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    createWindow()
} )

app.on( "window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== "darwin" ) {
        app.quit()
    }
} )

app.on( "activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if ( mainWindow === null ) {
        createWindow()
    }
} )

// Utils 🛠

function loadWindowView( window: BrowserWindow, view: string ) {
    if ( inDevelopment ) {
        // Load the url of the dev server if in development mode
        window.loadURL( process.env.WEBPACK_DEV_SERVER_URL as string + "/#/" + view )
    } else {
        // Load the index.html when not in development
        createProtocol( "app" )
        window.loadURL( url.format( {
            protocol: "file",
            slashes: true,
            pathname: path.join( __dirname, "index.html/" ),
            hash: "/" + view
        } ) )
    }

    window.webContents.openDevTools()
}

// Exit cleanly on request from parent process in development mode.

if ( inDevelopment ) {
    if ( process.platform === "win32" ) {
        process.on( "message", ( data ) => {
            if ( data === "graceful-exit" ) {
                app.quit()
            }
        } )
    } else {
        process.on( "SIGTERM", () => {
            app.quit()
        } )
    }
}
