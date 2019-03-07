"use strict"

import { app, protocol, dialog, Menu, BrowserWindow } from "electron"
import { createProtocol, installVueDevtools } from "vue-cli-plugin-electron-builder/lib"
import { ShaderType } from "./scripts/renderer/_constants"
import url from "url"
import path from "path"
import menu from "./menu"

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
        height: 700,
        backgroundColor: "#3c3c3c",
        titleBarStyle: "hidden",
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
    if ( ! mainWindow ) {
        openFile()
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

    // window.webContents.openDevTools() // devTools open by default
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

function openFile() {
    const filePath = showOpenFileDialog()

    if ( filePath !== undefined ) {
        createWindow( filePath )
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
