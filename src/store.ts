import Vue from "vue"
import Vuex from "vuex"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import { ShaderType } from "@/scripts/renderer/_constants"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderLog } from "@/scripts/editor/ShaderView"
import { UniformState } from "./scripts/renderer/UniformsCache"

export interface EditorState {
    vertex: string,
    fragment: string,
    activeShader: ShaderType
}
export interface RendererState {
    model: string,
    animations: boolean,
    wireframe: boolean,
    uniforms: UniformState[]
}

export interface State {
    // editorState, rendererState: almacenan el estado de la aplicacion levantado de un archivo y se actualizan cada vez que el archivo se guarda
    editorState: EditorState,
    rendererState: RendererState,

    // si existen cambios sin guardar en alguno de los componentes
    editorClean: boolean,

    // codigo del editor a ser leido por el renderer ante compilacion
    vertexSource: string,
    fragmentSource: string,

    // estado de ultima compilacion
    compilationSucceeded: boolean,

    // errores y warnings generados por el renderer ante compilacion, cambios de modelo, etc
    vertexLog: ShaderLog,
    fragmentLog: ShaderLog,

    // uniforms en uso detectados por el renderer
    uniformsEditors: UniformEditor[],

    // info y actualizacion de texturas
    availableTextures: string[],
    texturesAssignedToTextureUnits: string[],
    textureUnitToUpdate: { unit: number, texture: string },

    // estado de la ventana para inicio prolijo de algunas animaciones etc
    windowReady: boolean

    // 🚧
    model: string,
    animations: boolean,
    wireframe: boolean,
    activeShader: ShaderType,
    uniforms: UniformState[]
}

export interface StateSaveInfo {
    vertexSource: string,
    fragmentSource: string,
    model: string,
    uniforms: UniformState[]
}

Vue.use( Vuex )

const state: State = {
    editorState: {} as EditorState,
    rendererState: {} as RendererState,
    editorClean: true,
    vertexSource: "",
    fragmentSource: "",
    compilationSucceeded: true,
    vertexLog: { errors: [], warnings: [] } as ShaderLog,
    fragmentLog: { errors: [], warnings: [] } as ShaderLog,
    uniformsEditors: [] as UniformEditor[],
    availableTextures: [] as string[],
    texturesAssignedToTextureUnits: [] as string[],
    textureUnitToUpdate: { unit: 0, texture: "" },
    windowReady: false,
    // 🚧
    model: "",
    animations: true,
    wireframe: false,
    activeShader: ShaderType.Vertex,
    uniforms: []
}

const mutations = {
    SET_EDITOR_STATE: ( state: State, editorState: EditorState ) => {
        state.editorState = editorState
    },
    SET_RENDERER_STATE: ( state: State, rendererState: RendererState ) => {
        state.rendererState = rendererState
    },
    SET_VERTEX_SOURCE: ( state: State, value: string ) => {
        state.vertexSource = value
    },
    SET_FRAGMENT_SOURCE: ( state: State, value: string ) => {
        state.fragmentSource = value
    },
    SET_LOGS: ( state: State, newEntries: InspectorLogEntry[] ) => {
        const vertexLog: ShaderLog = { errors: [], warnings: [] }
        const fragmentLog: ShaderLog = { errors: [], warnings: [] }

        // clasifico entradas del log segun shader y errores/warnings, y las agrupo por nro de linea
        for ( let entry of newEntries ) {
            const log = ( entry.shader === ShaderType.Vertex ) ? vertexLog : fragmentLog
            const entries = ( entry.type === LogEntryType.Error ) ? log.errors : log.warnings
            const lineNumber = entry.line - 1 // one-based -> zero-based
            const lineEntries = entries.find( ( [ line ] ) => line === lineNumber )

            if ( lineEntries === undefined ) {
                entries.push( [ lineNumber, [ entry.description ] ] )
            } else {
                lineEntries[ 1 ].push( entry.description )
            }
        }

        state.vertexLog = vertexLog
        state.fragmentLog = fragmentLog
    },
    SET_COMPILATION_SUCCEEDED: ( state: State, succeeded: boolean ) => {
        state.compilationSucceeded = succeeded
    },
    SET_UNIFORMS_EDITORS: ( state: State, newEditors: UniformEditor[] ) => {
        state.uniformsEditors = newEditors
    },
    SET_AVAILABLE_TEXTURES: ( state: State, newTextures: string[] ) => {
        state.availableTextures = newTextures
    },
    SET_TEXTURES_ASSIGNED_TO_TEXTURE_UNITS: ( state: State, newTextures: string[] ) => {
        state.texturesAssignedToTextureUnits = newTextures
    },
    SET_TEXTURE_ASSIGNED_TO_TEXTURE_UNIT: ( state: State, newValue: { unit: number, texture: string } ) => {
        Vue.set( state.texturesAssignedToTextureUnits, newValue.unit, newValue.texture )
    },
    SET_TEXTURE_UNIT_TO_UPDATE: ( state: State, newValue: { unit: number, texture: string } ) => {
        state.textureUnitToUpdate = newValue
    },
    CLEAR_LOG_LINE: ( state: State, { shader, line }: { shader: ShaderType, line: number } ) => {
        const log      = ( shader === ShaderType.Vertex ) ? state.vertexLog : state.fragmentLog
        const errors   = log.errors
        const warnings = log.warnings

        for ( let index = errors.length - 1; index >= 0; index -- ) {
            if ( errors[ index ][ 0 ] === line ) {
                errors.splice( index, 1 )
            }
        }

        for ( let index = warnings.length - 1; index >= 0; index -- ) {
            if ( warnings[ index ][ 0 ] === line ) {
                warnings.splice( index, 1 )
            }
        }

        // Asigno un nuevo objeto al estado (state.vert/state.frag) para que activar la reactividad de Vue
        if ( shader === ShaderType.Vertex ) {
            state.vertexLog = { errors, warnings }
        } else {
            state.fragmentLog = { errors, warnings }
        }
    },
    SET_EDITOR_CLEAN: ( state: State, value: boolean ) => {
        state.editorClean = value
    },
    WINDOW_READY: ( state: State ) => {
        state.windowReady = true
    },
    // 🚧
    SET_ANIMATIONS: ( state: State, value: boolean ) => {
        state.animations = value
    },
    SET_MODEL: ( state: State, value: string ) => {
        state.model = value
    },
    SET_WIREFRAME: ( state: State, value: boolean ) => {
        state.wireframe = value
    },
    SET_ACTIVE_SHADER: ( state: State, value: ShaderType ) => {
        state.activeShader = value
    },
    SET_UNIFORMS: ( state: State, value: UniformState[] ) => {
        state.uniforms = value
    }
}

const getters = {
    activeShader: ( state: State ) => {
        return state.editorState.activeShader
    },
    errorsCount: ( state: State ) => {
        const vertexErrors = state.vertexLog.errors.reduce( ( previous, current ) => {
            return previous + current[ 1 ].length
        }, 0 )

        const fragmentErrors = state.fragmentLog.errors.reduce( ( previous, current ) => {
            return previous + current[ 1 ].length
        }, 0 )

        return vertexErrors + fragmentErrors
    },
    warningsCount: ( state: State ) => {
        const vertexWarnings = state.vertexLog.warnings.reduce( ( previous, current ) => {
            return previous + current[ 1 ].length
        }, 0 )

        const fragmentWarnings = state.fragmentLog.warnings.reduce( ( previous, current ) => {
            return previous + current[ 1 ].length
        }, 0 )

        return vertexWarnings + fragmentWarnings
    },
    documentHasUnsavedChanges: ( state: State ) => {
        return ! state.editorClean
    },
    saveInfo: ( state: State ) => {
        const saveInfo: StateSaveInfo = {
            vertexSource: state.vertexSource,
            fragmentSource: state.fragmentSource,
            model: state.model,
            uniforms: state.uniforms
        }

        return saveInfo
    }
}

export default new Vuex.Store( {
    strict: process.env.NODE_ENV !== 'production',
    state,
    mutations,
    getters
} )
