"use strict"

import { FILE_EXTENSION, WINDOW_TYPE, MAX_RECENTS } from "./constants"
import { app, protocol, dialog, Menu, BrowserWindow, ipcMain as ipc, Event } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import { setWindowMenu, setAppMenu } from "./menu"
import Store from "electron-store"

const onMac = process.platform === "darwin"
const isDevelopment = process.env.NODE_ENV !== "production"
protocol.registerStandardSchemes( [ "app" ], { secure: true } ) // Standard scheme must be registered before the app is ready
app.commandLine.appendSwitch( "--ignore-gpu-blacklist" ) // Chrome by default black lists certain GPUs because of bugs.

// User data setup 🗄

const store = new Store( { defaults: {
    recents: [] as string[]
} } )

// Window management 🖼

let welcomeWindow: BrowserWindow
const playgroundWindows: Set <BrowserWindow> = new Set()
const openFiles: Map <string, BrowserWindow> = new Map()

function newWelcomeWindow() {
    const window = new BrowserWindow( {
        title: "Welcome",
        show: false,
        width: 800,
        height: 400,
        resizable: true, // for debugging 🐛
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        frame: false,
        backgroundColor: "#3c3c3c"
    } )

    loadWindowContents( window, WINDOW_TYPE.WELCOME )
    setMenu( window, WINDOW_TYPE.WELCOME )

    window.on( "close", ( event ) => {
        // by default, the welcome window just hides when closing it (to make showing it again snappy),
        // but if it is the only window remaining and the app is trying to quit, it closes itself and continues quitting
        if ( playgroundWindows.size === 0 && appQuitting ) {
            window.destroy()
        } else {
            event.preventDefault()
            window.hide()
        }
    } )

    window.webContents.on( "did-finish-load", () => {
        window.webContents.send( "recents", recents )
    } )

    window.on( "ready-to-show", () => {
        window.show()
    } )

    return window
}

function newPlaygroundWindow( filePath?: string ) {
    const window = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 700,
        backgroundColor: "#3c3c3c", // rgb(60, 60, 60)
        titleBarStyle: "hidden",
        webPreferences: { experimentalFeatures: true }
    } )

    loadWindowContents( window, WINDOW_TYPE.PLAYGROUND )
    setMenu( window, WINDOW_TYPE.PLAYGROUND )

    window.on( "close", ( event ) => {
        event.preventDefault()
        window.webContents.send( "close" )
    } )

    window.webContents.on( "did-finish-load", () => {
        if ( filePath ) {
            window.webContents.send( "open", filePath )
        } else {
            window.webContents.send( "new" )
        }
    } )

    return window
}

ipc.on( "close-window", ( event: Event, proceed: boolean, openFile: string ) => {
    const window = BrowserWindow.fromWebContents( event.sender )

    if ( proceed ) {
        playgroundWindows.delete( window )
        window.destroy()

        // if the window was working on a file, clear it from the currently open files
        if ( openFile ) {
            openFiles.delete( openFile )
        }

        // if this one was the las playground window
        if ( playgroundWindows.size === 0 ) {
            if ( appQuitting ) {
                // and the app was trying to quit, it continues the quitting process
                app.quit()
            } else {
                // if not, shows the welcome window
                welcomeWindow.show()
            }
        }
    } else {
        // cancel app quitting (if in process)
        appQuitting = false
    }
} )

ipc.on( "opened-file", ( event: Event, filePath: string ) => {
    const window = BrowserWindow.fromWebContents( event.sender )

    openFiles.set( filePath, window )
    addToRecentDocuments( filePath )
} )

ipc.on( "open-file", ( event: Event, filePath?: string ) => {
    openFile( filePath )
} )

ipc.on( "new-file", () => {
    newFile()
} )

// App lifecycle 🔄

let appQuitting = false

app.on( "ready", async() => {
    if ( isDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    loadRecents()

    welcomeWindow = newWelcomeWindow()
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
        welcomeWindow.show()
    }
} )

app.on( "before-quit", () => {
    // register start of quitting process
    appQuitting = true
} )

// Recent documents 📄

let recents: string[] = []

function addToRecentDocuments( filePath: string ) {
    // check if already in recents
    const index = recents.indexOf( filePath )

    if ( index < 0 ) {
        // if not on the list
        recents.unshift( filePath )
    } else if ( index > 0 ) {
        // if on the list and not the most recent
        recents.splice( index, 1 )
        recents.unshift( filePath )
    }

    // keep the list short
    if ( recents.length > MAX_RECENTS ) recents.length = MAX_RECENTS

    store.set( "recents", recents )
    app.addRecentDocument( filePath )
    welcomeWindow.webContents.send( "recents", recents )
}

function clearRecentDocuments() {
    recents = []
    store.set( "recents", [] )
    app.clearRecentDocuments()
    welcomeWindow.webContents.send( "recents", recents )
}

function loadRecents() {
    // keeps the stored recents and system ones in sync
    recents = store.get( "recents" )
    app.clearRecentDocuments()

    for ( let index = recents.length - 1; index >= 0; index -- ) {
        app.addRecentDocument( recents[ index ] )
    }
}

// Utils 🛠

function loadWindowContents( window: BrowserWindow, type: WINDOW_TYPE ) {
    if ( process.env.WEBPACK_DEV_SERVER_URL ) {
        // Load the url of the dev server if in development mode
        window.loadURL( process.env.WEBPACK_DEV_SERVER_URL + type + ".html" )
    } else {
        // Load the index.html when not in development
        createProtocol( "app" )
        window.loadURL( `app://./${ type }.html` )
    }
}

function setMenu( window: BrowserWindow, type: WINDOW_TYPE ) {
    if ( ! onMac ) {
        // on windows & linux the menu remains fixed per window
        setWindowMenu( window, type )
    } else {
        // on mac, it updates depending on the focused window
        window.on( "focus", () => { setAppMenu( type ) } )
    }
}

function showOpenFileDialog() {
    app.focus() // los 'dialogs' por defecto no ponen a la aplicacion en foco y pueden terminan atras de otras ventanas

    const filePaths = dialog.showOpenDialog( {
        properties: [ "openFile" ],
        title: "Open file",
        filters: [
            { name: "Shaders Playground", extensions: [ FILE_EXTENSION ] }
        ]
    } )

    return filePaths ? filePaths[ 0 ] : undefined
}

function openFile( filePath?: string ) {
    welcomeWindow.hide()

    // if no file passed, select from dialog
    if ( ! filePath ) filePath = showOpenFileDialog()

    // if the user selected a file
    if ( filePath ) {
        const windowWorkingOnFile = openFiles.get( filePath )

        // check if it is already open
        if ( windowWorkingOnFile ) {
            windowWorkingOnFile.focus()
        } else {
            // if not, open on new window
            const newPlayground = newPlaygroundWindow( filePath )
            playgroundWindows.add( newPlayground )
        }
    } else if ( playgroundWindows.size === 0 ) {
        welcomeWindow.show()
    }
}

function newFile() {
    welcomeWindow.hide()
    const newPlayground = newPlaygroundWindow()
    playgroundWindows.add( newPlayground )
}

function showWelcomeWindow() {
    welcomeWindow.show()
}

export {
    openFile,
    newFile,
    clearRecentDocuments,
    showWelcomeWindow
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
