"use strict"

import { app, protocol, dialog, BrowserWindow } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import url from "url"
import path from "path"

// #region - CLI Plugin Electron Builder Boilerplate

protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
const inDevelopment = process.env.NODE_ENV !== "production"

// #endregion

app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// Window Management 🖼

let mainWindow : BrowserWindow

function createWindow( filePath?: string ) {
    mainWindow = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 600,
        backgroundColor: "#3c3c3c",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowView( mainWindow, "main" )

    mainWindow.on( "closed", () => {
        // @ts-ignore
        mainWindow = null
    } )

    mainWindow.webContents.on( "did-finish-load", () => {
        if ( filePath ) {
            mainWindow.webContents.send( "open", filePath )
        }
    } )
}

// App lifecycle 🔄

app.on( "ready", async() => {
    if ( inDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    const filePath = showOpenFileDialog()

    if ( filePath !== undefined ) {
        createWindow( filePath )
    }
} )

app.on( "window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== "darwin" ) {
        app.quit()
    }
} )

app.on( "activate", () => {
    // mostrar la ventana de bienvenida
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

function showOpenFileDialog() {
    app.focus() // los 'dialogs' por defecto no ponen a la aplicacion en foco y pueden terminan atras de otras ventanas

    const filePaths = dialog.showOpenDialog( {
        properties: [ "openFile", "createDirectory" ],
        title: "Open file",
        filters: [
            { name: "Shaders Playground", extensions: [ "shdr" ] }
        ]
    } )

    return filePaths ? filePaths[ 0 ] : undefined
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
