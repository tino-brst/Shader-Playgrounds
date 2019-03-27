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
    rendererClean: boolean,

    // codigo del editor a ser leido por el renderer ante compilacion
    vertex: string,
    fragment: string,

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
}

Vue.use( Vuex )

const state: State = {
    editorState: {} as EditorState,
    rendererState: {} as RendererState,
    editorClean: true,
    rendererClean: true,
    vertex: "",
    fragment: "",
    compilationSucceeded: true,
    vertexLog: { errors: [], warnings: [] } as ShaderLog,
    fragmentLog: { errors: [], warnings: [] } as ShaderLog,
    uniformsEditors: [] as UniformEditor[],
    availableTextures: [] as string[],
    texturesAssignedToTextureUnits: [] as string[],
    textureUnitToUpdate: { unit: 0, texture: "" },
    windowReady: false
}

const mutations = {
    updateEditorState: ( state: State, editorState: EditorState ) => {
        state.editorState = editorState
        state.editorClean = true
    },
    updateRendererState: ( state: State, rendererState: RendererState ) => {
        state.rendererState = rendererState
        state.rendererClean = true
    },
    updateShadersCode: ( state: State, { vertex, fragment }: { vertex: string, fragment: string } ) => {
        state.vertex = vertex
        state.fragment = fragment
    },
    updateLog: ( state: State, newEntries: InspectorLogEntry[] ) => {
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
    updateCompilationState: ( state: State, succeeded: boolean ) => {
        state.compilationSucceeded = succeeded
    },
    updateUniformsEditors: ( state: State, newEditors: UniformEditor[] ) => {
        state.uniformsEditors = newEditors
    },
    updateAvailableTextures: ( state: State, newTextures: string[] ) => {
        state.availableTextures = newTextures
    },
    updateTexturesAssignedToTextureUnits: ( state: State, newTextures: string[] ) => {
        state.texturesAssignedToTextureUnits = newTextures
    },
    updateTextureAssignedToTextureUnit: ( state: State, newValue: { unit: number, texture: string } ) => {
        Vue.set( state.texturesAssignedToTextureUnits, newValue.unit, newValue.texture )
    },
    setTextureUnitForUpdate: ( state: State, newValue: { unit: number, texture: string } ) => {
        state.textureUnitToUpdate = newValue
    },
    clearLineLog: ( state: State, { shader, line }: { shader: ShaderType, line: number } ) => {
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
    markEditorDirty: ( state: State ) => {
        state.editorClean = false
    },
    markRendererDirty: ( state: State ) => {
        state.rendererClean = false
    },
    setWindowReady: ( state: State ) => {
        state.windowReady = true
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
        return ( ! state.editorClean ) || ( ! state.rendererClean )
    }
}

export default new Vuex.Store( {
    state,
    mutations,
    getters
} )
