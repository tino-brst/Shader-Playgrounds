import { app, Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron"
import * as background from "./background"
import { ShaderType } from "./scripts/renderer/_constants"

const ___ = "separator"

function sendAction( action: string, payload?: any ) {
    const focusedWindow = BrowserWindow.getFocusedWindow()

    if ( focusedWindow ) {
        focusedWindow.webContents.send( action, payload )
    }
}

// Menu items

const appSubmenu: MenuItemConstructorOptions = {
    label: app.getName(),
    submenu: [
        { role: "about" },
        { type: ___ },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: ___ },
        { role: "quit" }
    ]
}

const fileSubmenu: MenuItemConstructorOptions = {
    label: "File",
    submenu: [
        {
            label: "New",
            accelerator: "CmdOrCtrl+N",
            click() { background.newFile() }
        },
        {
            label: "Open...",
            accelerator: "CmdOrCtrl+O",
            click() { background.openFile() }
        },
        {
            role: "recentDocuments",
            submenu: [
                { type: ___ },
                { role: "clearRecentDocuments" }
            ]
        },
        { type: ___ },
        {
            label: "Close",
            role: "close"
        },
        {
            label: "Save",
            accelerator: "CmdOrCtrl+S",
            click: () => { sendAction( "save" ) }
        }
    ]
}

const editSubmenu: MenuItemConstructorOptions = {
    label: "Edit",
    submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: ___ },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { type: ___ },
        { role: "selectall" }
    ]
}

const toolsSubmenu: MenuItemConstructorOptions = {
    label: "Tools",
    submenu: [
        {
            label: "Compile and Run",
            accelerator: "CmdOrCtrl+T",
            click: () => { sendAction( "compile-and-run" ) }
        }
    ]
}

const viewSubmenu: MenuItemConstructorOptions = {
    label: "View",
    submenu: [
        {
            label: "Vertex Shader",
            accelerator: "CmdOrCtrl+1",
            click: () => { sendAction( "set-active-shader", ShaderType.Vertex ) }
        },
        {
            label: "Fragment Shader",
            accelerator: "CmdOrCtrl+2",
            click: () => { sendAction( "set-active-shader", ShaderType.Fragment ) }
        },
        { type: ___ },
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: ___ },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: ___ },
        { role: "togglefullscreen" }
    ]
}

const windowSubmenu: MenuItemConstructorOptions = {
    role: "window",
    submenu: ( process.platform === "darwin" ) ? [
        { role: "minimize" },
        { role: "close" },
        { role: "zoom" },
        { type: ___ },
        { role: "front" }
    ] : [
        { role: "minimize" },
        { role: "close" }
    ]
}

const helpSubmenu: MenuItemConstructorOptions = {
    role: "help",
    submenu: [
        {
            label: "Source Code",
            click: () => { shell.openExternal( "https://github.com/AgustinBrst/Shaders-Playground" ) }
        }
    ]
}

// Template

const template: MenuItemConstructorOptions[] = [
    fileSubmenu,
    editSubmenu,
    toolsSubmenu,
    viewSubmenu,
    windowSubmenu,
    helpSubmenu
]

if ( process.platform === "darwin" ) {
    template.unshift( appSubmenu )
}

export default Menu.buildFromTemplate( template )
