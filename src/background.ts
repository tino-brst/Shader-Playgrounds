"use strict"

import { FILE_EXTENSION } from "./constants"
import { app, protocol, dialog, Menu, BrowserWindow, ipcMain as ipc } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import { setWelcomeMenu, setPlaygroundMenu } from "./menu"

const isDevelopment = process.env.NODE_ENV !== "production"
protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// Window Management 🖼

const playgroundWindows: Set <BrowserWindow> = new Set()
const openFiles: Map <string, BrowserWindow> = new Map()

function newPlaygroundWindow( filePath?: string ) {
    const window = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 700,
        backgroundColor: "#3c3c3c", // rgb(60, 60, 60)
        titleBarStyle: "hidden",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowContents( window, "playground" )

    // Window lifecycle

    window.on( "close", ( event ) => {
        event.preventDefault()
        window.webContents.send( "close" )
    } )

    window.on( "focus", () => {
        setPlaygroundMenu()
    } )

    window.webContents.on( "did-finish-load", () => {
        if ( filePath ) {
            window.webContents.send( "open", filePath )
        } else {
            window.webContents.send( "new" )
        }
    } )

    playgroundWindows.add( window )
}

ipc.on( "close-window", ( event: any, proceed: boolean, openFile: string ) => {
    const window = BrowserWindow.fromWebContents( event.sender )

    if ( proceed ) {
        playgroundWindows.delete( window )
        window.destroy()

        // if the window was working on a file, clear it from the currently open files
        if ( openFile ) {
            openFiles.delete( openFile )
        }

        // if the window closing was due to a "quit" command and this one was the last window, quit the app.
        if ( appQuitting && playgroundWindows.size === 0 ) {
            app.quit()
        }
    } else {
        // cancel app quitting (if in process)
        appQuitting = false
    }
} )

ipc.on( "opened-file", ( event: any, filePath: string ) => {
    const window = BrowserWindow.fromWebContents( event.sender )

    // keep track of which window is working on the file
    openFiles.set( filePath, window )
} )

// App lifecycle 🔄

let appQuitting = false

app.on( "ready", async() => {
    if ( isDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    setWelcomeMenu()
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
    if ( playgroundWindows.size === 0 ) {
        openFile()
    }
} )

app.on( "before-quit", () => {
    // register start of quitting process
    appQuitting = true
} )

// Utils 🛠

function loadWindowContents( window: BrowserWindow, type: "playground" | "welcome" ) {
    if ( process.env.WEBPACK_DEV_SERVER_URL ) {
        // Load the url of the dev server if in development mode
        window.loadURL( process.env.WEBPACK_DEV_SERVER_URL + type + ".html" )
    } else {
        // Load the index.html when not in development
        createProtocol( "app" )
        window.loadURL( `app://./${type}.html` )
    }
}

function showOpenFileDialog( callback: ( filePath?: string ) => void ) {
    app.focus() // los 'dialogs' por defecto no ponen a la aplicacion en foco y pueden terminan atras de otras ventanas

    dialog.showOpenDialog( {
        properties: [ "openFile" ],
        title: "Open file",
        filters: [
            { name: "Shaders Playground", extensions: [ FILE_EXTENSION ] }
        ]
    }, ( filePaths ) => {
        callback( filePaths ? filePaths[ 0 ] : undefined )
    } )
}

function openFile() {
    showOpenFileDialog( ( filePath ) => {
        if ( filePath !== undefined ) {
            const windowWorkingOnFile = openFiles.get( filePath )

            if ( windowWorkingOnFile ) {
                windowWorkingOnFile.focus()
            } else {
                newPlaygroundWindow( filePath )
            }
        }
    } )
}

function newFile() {
    newPlaygroundWindow()
}

export {
    openFile,
    newFile
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
