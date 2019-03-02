import { app, Menu, MenuItemConstructorOptions, Accelerator, MenuItem } from "electron"
import * as background from "./background"
import { ShaderType } from "./scripts/renderer/_constants"

const ___ = "separator"

// Menu items

const App: MenuItemConstructorOptions = {
    label: app.getName(),
    submenu: [
        { role: "about" },
        { type: ___ },
        { role: "services", submenu: [] },
        { type: ___ },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: ___ },
        { role: "quit" }
    ]
}

const File: MenuItemConstructorOptions = {
    label: "File",
    submenu: [
        {
            label: "New",
            accelerator: "CmdOrCtrl+N",
            // click() { background... }
        },
        {
            label: "Open...",
            accelerator: "CmdOrCtrl+O",
            click() { background.openFile() }
        },
        {
            label: "Open Recent...",
            submenu: [
                { type: ___ },
                {
                    label: "Clear Recents",
                    // click() { background... }
                }
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
            click( menuItem, focusedWindow ) { background.saveFile( focusedWindow ) }
        }
    ]
}

const Edit: MenuItemConstructorOptions = {
    label: "Edit",
    submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: ___ },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteandmatchstyle" },
        { role: "delete" },
        { role: "selectall" }
    ]
}

const Tools: MenuItemConstructorOptions = {
    label: "Tools",
    submenu: [
        {
            label: "Compile and Run",
            accelerator: "CmdOrCtrl+T",
            click( menuItem, focusedWindow ) { background.compileAndRun( focusedWindow ) }
        }
    ]
}

const View: MenuItemConstructorOptions = {
    label: "View",
    submenu: [
        {
            label: "Vertex Shader",
            accelerator: "CmdOrCtrl+1",
            click( menuItem, focusedWindow ) { background.activeShader( focusedWindow, ShaderType.Vertex ) }
        },
        {
            label: "Fragment Shader",
            accelerator: "CmdOrCtrl+2",
            click( menuItem, focusedWindow ) { background.activeShader( focusedWindow, ShaderType.Fragment ) }
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

const Window: MenuItemConstructorOptions = {
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

const Help: MenuItemConstructorOptions = {
    role: "help",
    submenu: [
        {
            label: "Learn More",
            // click() { background... }
        }
    ]
}

// Template

const template: MenuItemConstructorOptions[] = [ File, Edit, Tools, View, Window, Help ]

if ( process.platform === "darwin" ) {
    template.unshift( App )
}

export default Menu.buildFromTemplate( template )
