"use strict"

import fs from "fs-jetpack"
import log from "electron-log"
import { autoUpdater } from "electron-updater"
import { FILE_EXTENSION, WINDOW_TYPE, MAX_RECENTS } from "./constants"
import { app, protocol, dialog, Menu, BrowserWindow, ipcMain as ipc, Event } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import { setWindowMenu, setAppMenu } from "./menu"
import Store from "electron-store"

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

function newWelcomeWindow( hidden: boolean = false ) {
    const window = new BrowserWindow( {
        title: "Welcome",
        show: false,
        width: 700,
        height: 400,
        minimizable: false,
        maximizable: false,
        resizable: false,
        fullscreenable: false,
        frame: false,
        backgroundColor: "#3c3c3c",
        webPreferences: { enableBlinkFeatures: "OverlayScrollbars" }
    } )

    loadWindowContents( window, WINDOW_TYPE.WELCOME )
    setMenu( window, WINDOW_TYPE.WELCOME )

    window.on( "close", ( event ) => {
        // by default, the welcome window just hides when closing it (to make showing it again snappy),
        // but if it is the only window remaining and the app is trying to quit (or its not runing on windows),
        // it closes itself and continues the quitting process
        if ( playgroundWindows.size === 0 && ( process.platform !== "darwin" || appQuitting ) ) {
            window.destroy()
        } else {
            event.preventDefault()
            window.hide()
        }
    } )

    window.webContents.on( "did-finish-load", () => {
        window.webContents.send( "recents", recents )
        if ( ! isDevelopment ) autoUpdater.checkForUpdates()
        if ( ! hidden ) window.show()
    } )

    return window
}

function newPlaygroundWindow( filePath?: string ) {
    const window = new BrowserWindow( {
        show: false,
        width: 1000,
        height: 700,
        minWidth: 700,
        minHeight: 600,
        useContentSize: true,
        titleBarStyle: "hidden",
        backgroundColor: "#3c3c3c", // rgb(60, 60, 60)
        webPreferences: {
            experimentalFeatures: true,
            enableBlinkFeatures: "OverlayScrollbars"
        }
    } )

    loadWindowContents( window, WINDOW_TYPE.PLAYGROUND )
    setMenu( window, WINDOW_TYPE.PLAYGROUND )
    adjustPlaygroundWindowPosition( window )

    window.on( "close", ( event ) => {
        event.preventDefault()
        window.webContents.send( "close" )
    } )

    window.on( "closed", () => {
        playgroundWindows.delete( window )
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
        window.destroy()

        // if the window was working on a file, clear it from the currently open files
        if ( openFile ) {
            openFiles.delete( openFile )
        }

        // if this one was the last playground window
        if ( playgroundWindows.size === 0 ) {
            if ( appQuitting ) {
                // and the app was trying to quit, it continues the quitting process
                app.quit()
            } else {
                // if not, shows the welcome window
                showWelcomeWindow()
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
    if ( filePath ) {
        openFile( filePath )
    } else {
        showOpenFileDialog()
    }
} )

ipc.on( "new-file", () => {
    newFile()
} )

// App lifecycle 🔄

let appQuitting = false
let triggerFiles: Set <string> = new Set()
const gotTheLock = app.requestSingleInstanceLock()

if ( ! gotTheLock ) {
    app.quit()
} else {
    app.on( "second-instance", ( event, argv ) => {
        // the user tried to run a second instance, focus on current instance
        app.focus()
        const window = BrowserWindow.getFocusedWindow()
        if ( window ) window.focus()

        // check if the second instance was due to trying to open a file and open it
        if ( process.platform === "win32" && app.isReady() && argv.length > 1 ) openFile( argv[ 1 ] )
    } )
}

app.on( "ready", async() => {
    if ( isDevelopment && ! process.env.IS_TEST ) {
        await installVueDevtools()
    }

    loadRecents()

    // handle app being opened by alternative methods (open-with, drag & drop, recents, etc)
    const triggerFile = ( process.platform === "win32" && process.argv.length > 1 ) ? process.argv[ 1 ] : ""
    const hidden = ( triggerFiles.size > 0 ) || ( triggerFile !== "" )
    welcomeWindow = newWelcomeWindow( hidden )

    if ( triggerFile ) {
        openFile( triggerFile )
    } else if ( triggerFiles.size > 0 ) {
        for ( let file of triggerFiles ) {
            openFile( file )
        }
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
    if ( playgroundWindows.size === 0 ) {
        showWelcomeWindow()
    }
} )

app.on( "will-finish-launching", () => {
    if ( process.platform === "darwin" ) {
        app.on( "open-file", ( event, filePath ) => {
            if ( app.isReady() ) {
                openFile( filePath )
            } else {
                triggerFiles.add( filePath )
            }
        } )
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

// Auto-updates ⬇️

autoUpdater.logger = log
autoUpdater.allowPrerelease = false
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on( "download-progress", ( { percent } ) => {
    if ( welcomeWindow ) welcomeWindow.webContents.send( "auto-update", percent )
} )

autoUpdater.on( "update-downloaded", () => {
    if ( welcomeWindow ) welcomeWindow.webContents.send( "auto-update", "downloaded" )
} )

autoUpdater.on( "error", () => {
    if ( welcomeWindow ) welcomeWindow.webContents.send( "auto-update", "failed" )
} )

ipc.on( "quit-and-install", () => {
    if ( ! isDevelopment ) {
        // manually register start of quitting process (by default called on "before-quit", but autoUpdater.quitAndInstall() postpones it)
        appQuitting = true
        // quit & install update
        autoUpdater.quitAndInstall( true, true )
    }
} )

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
    if ( process.platform !== "darwin" ) {
        // on windows & linux the menu remains fixed per window
        setWindowMenu( window, type )
    } else {
        // on mac, it updates depending on the focused window
        window.on( "focus", () => { setAppMenu( type ) } )
    }
}

function showOpenFileDialog() {
    welcomeWindow.hide()
    app.focus() // by default, dialogs don't bring the app into focus

    const filePaths = dialog.showOpenDialog( {
        properties: [ "openFile" ],
        title: "Open file",
        filters: [
            { name: "Shader Playgrounds Files", extensions: [ FILE_EXTENSION ] }
        ]
    } )

    if ( filePaths ) {
        openFile( filePaths[ 0 ] )
    } else if ( playgroundWindows.size === 0 ) {
        showWelcomeWindow()
    }
}

function showFileNotFoundDialog() {
    enum options {
        ok
    }
    const optionsLabels = [
        "Ok"
    ]

    dialog.showMessageBox( {
        title: "File Not Found",
        message: "The selected file is unavailable. It might have been moved, renamed or removed.",
        type: "warning",
        buttons: optionsLabels,
        defaultId: options.ok,
        cancelId: options.ok
    } )
}

function openFile( filePath: string ) {
    if ( fs.exists( filePath ) === "file" ) {
        const windowWorkingOnFile = openFiles.get( filePath )

        // check if it is already open
        if ( windowWorkingOnFile ) {
            windowWorkingOnFile.focus()
        } else {
            // if not, hide welcome window and open on new window
            welcomeWindow.hide()
            const newPlayground = newPlaygroundWindow( filePath )
            playgroundWindows.add( newPlayground )
        }
    } else {
        showFileNotFoundDialog()
        if ( playgroundWindows.size === 0 ) {
            showWelcomeWindow()
        }
    }
}

function newFile() {
    welcomeWindow.hide()
    const newPlayground = newPlaygroundWindow()
    playgroundWindows.add( newPlayground )
}

function showWelcomeWindow() {
    // Work-around to avoid moving the user to whatever workspace the welcomeWindow was hidden on.
    // If the window is already visible, by default it moves to its corresponding worspace, but if it's not:
    if ( ! welcomeWindow.isVisible() ) {
        welcomeWindow.setVisibleOnAllWorkspaces( true )
        welcomeWindow.show()
        welcomeWindow.setVisibleOnAllWorkspaces( false )
    }
}

function getFocusedPlaygroundWindow() {
    const focusedWindow = BrowserWindow.getFocusedWindow()

    if ( focusedWindow && focusedWindow !== welcomeWindow ) {
        return focusedWindow
    }
}

function adjustPlaygroundWindowPosition( window: BrowserWindow ) {
    const focusedPlaygroundWindow = getFocusedPlaygroundWindow()

    if ( focusedPlaygroundWindow ) {
        const [ focusedX, focusedY ] = focusedPlaygroundWindow.getPosition()
        const offset = 22
        window.setPosition( focusedX + offset, focusedY + offset )
    }
}

export {
    showOpenFileDialog,
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
