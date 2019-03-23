"use strict"

import { app, protocol, dialog, Menu, BrowserWindow } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import menu from "./menu"

const isDevelopment = process.env.NODE_ENV !== "production"
protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// Window Management 🖼

const mainWindows: Set <BrowserWindow> = new Set()

function newMainWindow( filePath?: string ) {
    const mainWindow = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 700,
        backgroundColor: "#3c3c3c", // rgb(60, 60, 60)
        titleBarStyle: "hidden",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowContents( mainWindow )

    // Window lifecycle

    mainWindow.on( "close", ( event ) => {
        event.preventDefault()
        mainWindow.webContents.send( "close" )
    } )

    mainWindow.on( "closed", () => {
        mainWindows.delete( mainWindow )
    } )

    mainWindow.webContents.on( "did-finish-load", () => {
        if ( filePath ) {
            mainWindow.webContents.send( "open", filePath )
        }
    } )

    mainWindows.add( mainWindow )
}

// App lifecycle 🔄

app.on( "ready", async() => {
    if ( isDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    Menu.setApplicationMenu( menu )

    openFile()
} )

app.on( "window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if ( process.platform !== "darwin" ) {
        app.quit()
    }
} )

app.on( "activate", () => {
    // 📝 mostrar la ventana de bienvenida si no hay ninguna abierta
    if ( mainWindows.size === 0 ) {
        openFile()
    }
} )

// Utils 🛠

function loadWindowContents( window: BrowserWindow ) {
    if ( process.env.WEBPACK_DEV_SERVER_URL ) {
        // Load the url of the dev server if in development mode
        window.loadURL( process.env.WEBPACK_DEV_SERVER_URL )
    } else {
        // Load the index.html when not in development
        createProtocol( "app" )
        window.loadURL( "app://./index.html" )
    }
}

function showOpenFileDialog() {
    app.focus() // los 'dialogs' por defecto no ponen a la aplicacion en foco y pueden terminan atras de otras ventanas

    const filePaths = dialog.showOpenDialog( {
        properties: [ "openFile" ],
        title: "Open file",
        filters: [
            { name: "Shaders Playground", extensions: [ "shdr" ] }
        ]
    } )

    return filePaths ? filePaths[ 0 ] : undefined
}

function openFile() {
    const filePath = showOpenFileDialog()

    if ( filePath !== undefined ) {
        newMainWindow( filePath )
    }
}

function saveFile( focusedWindow: BrowserWindow | undefined ) {
    if ( focusedWindow ) { // ⚠️ ¿ no habria que ver que la enfocada sea una de las "main" ?
        focusedWindow.webContents.send( "save" )
    }
}

function activeShader( focusedWindow: BrowserWindow | undefined, shader: ShaderType ) {
    if ( focusedWindow ) {
        focusedWindow.webContents.send( "shader", shader )
    }
}

function compileAndRun( focusedWindow: BrowserWindow | undefined ) {
    if ( focusedWindow ) {
        focusedWindow.webContents.send( "compileAndRun" )
    }
}

export {
    openFile,
    saveFile,
    activeShader,
    compileAndRun
}

// Exit cleanly on request from parent process in development mode.

if ( isDevelopment ) {
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
