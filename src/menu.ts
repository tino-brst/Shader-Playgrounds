import { app, Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron"
import * as background from "./background"
import { ShaderType } from "./scripts/renderer/_constants"

const enum WINDOW { WELCOME, PLAYGROUND }
const ___ = "separator"

function sendAction( action: string, payload?: any ) {
    const focusedWindow = BrowserWindow.getFocusedWindow()

    if ( focusedWindow ) {
        focusedWindow.webContents.send( action, payload )
    }
}

function getMenuTemplate( type: WINDOW ) {

    const isPlayground = type === WINDOW.PLAYGROUND

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
                enabled: isPlayground,
                role: "close"
            },
            {
                label: "Save",
                enabled: isPlayground,
                accelerator: "CmdOrCtrl+S",
                click: () => { sendAction( "save" ) }
            }
        ]
    }
    const editSubmenu: MenuItemConstructorOptions = {
        label: "Edit",
        submenu: [
            {
                role: "undo",
                enabled: isPlayground,
            },
            {
                role: "redo",
                enabled: isPlayground,
            },
            { type: ___ },
            {
                role: "cut",
                enabled: isPlayground,
            },
            {
                role: "copy",
                enabled: isPlayground,
            },
            {
                role: "paste",
                enabled: isPlayground,
            },
            { type: ___ },
            {
                role: "selectall",
                enabled: isPlayground,
            }
        ]
    }
    const toolsSubmenu: MenuItemConstructorOptions = {
        label: "Tools",
        submenu: [
            {
                label: "Compile and Run",
                enabled: isPlayground,
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
                enabled: isPlayground,
                accelerator: "CmdOrCtrl+1",
                click: () => { sendAction( "set-active-shader", ShaderType.Vertex ) }
            },
            {
                label: "Fragment Shader",
                enabled: isPlayground,
                accelerator: "CmdOrCtrl+2",
                click: () => { sendAction( "set-active-shader", ShaderType.Fragment ) }
            },
            { type: ___ },
            { role: "togglefullscreen" }
        ]
    }
    const devSubmenu: MenuItemConstructorOptions = {
        label: "Development",
        submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { role: "toggledevtools" },
            { type: ___ },
            { role: "resetzoom" },
            { role: "zoomin" },
            { role: "zoomout" },
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

    const template: MenuItemConstructorOptions[] = [
        fileSubmenu,
        editSubmenu,
        toolsSubmenu,
        viewSubmenu,
        devSubmenu,
        windowSubmenu,
        helpSubmenu
    ]

    if ( process.platform === "darwin" ) {
        template.unshift( appSubmenu )
    }

    return template
}

function setWelcomeMenu() {
    const menu = Menu.buildFromTemplate( getMenuTemplate( WINDOW.WELCOME ))
    Menu.setApplicationMenu( menu )
}

function setPlaygroundMenu() {
    const menu = Menu.buildFromTemplate( getMenuTemplate( WINDOW.PLAYGROUND ))
    Menu.setApplicationMenu( menu )
}

export {
    setWelcomeMenu,
    setPlaygroundMenu
}
