import { app, Menu, MenuItemConstructorOptions, BrowserWindow, shell } from "electron"
import { FILE_EXTENSION, WINDOW_TYPE } from "./constants"
import * as background from "./background"
import { ShaderType } from "./scripts/renderer/_constants"

const ___ = "separator"

function sendAction( action: string, payload?: any ) {
    const focusedWindow = BrowserWindow.getFocusedWindow()

    if ( focusedWindow ) {
        focusedWindow.webContents.send( action, payload )
    }
}

function getMenuTemplate( type: WINDOW_TYPE ) {
    const isPlayground = type === WINDOW_TYPE.PLAYGROUND

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
                    {
                        label: "Clear Menu",
                        click: () => { background.clearRecentDocuments() }
                    }
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
            {
                label: "Welcome",
                click: () => { background.showWelcomeWindow() }
            },
            { type: ___ },
            { role: "front" }
        ] : [
            { role: "minimize" },
            { role: "close" },
            { type: ___ },
            {
                label: "Welcome",
                click: () => { background.showWelcomeWindow() }
            },
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

function setAppMenu( type: WINDOW_TYPE ) {
    const menu = Menu.buildFromTemplate( getMenuTemplate( type ))
    Menu.setApplicationMenu( menu )
}

function setWindowMenu( window: BrowserWindow, type: WINDOW_TYPE ) {
    const menu = Menu.buildFromTemplate( getMenuTemplate( type ))
    window.setMenu( menu )
}

export {
    setAppMenu,
    setWindowMenu
}
