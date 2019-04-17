import Vue from "vue"
import Vuex, { ActionContext } from "vuex"
import { remote } from "electron"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import { ShaderType, LanguageVersion } from "@/scripts/renderer/_constants"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderLog } from "@/scripts/editor/ShaderView"
import { UniformState } from "./scripts/renderer/UniformsCache"

export interface State {
    platform: string,
    vertexSource: string,
    fragmentSource: string,
    languageVersion: LanguageVersion,
    activeShader: ShaderType,
    editorClean: boolean,
    model: string,
    animation: boolean,
    wireframe: boolean,
    vertexLog: ShaderLog,
    fragmentLog: ShaderLog,
    compilationSucceeded: boolean,
    uniforms: UniformState[]
    uniformsEditors: UniformEditor[],
    availableTextures: string[],
    texturesAssignedToTextureUnits: string[],
    textureUnitToUpdate: { unit: number, texture: string },
    windowReady: boolean
}

export interface StateSaveInfo {
    vertexSource: string,
    fragmentSource: string,
    model: string,
    uniforms: UniformState[]
}

Vue.use( Vuex )

const state: State = {
    platform: remote.process.platform,
    vertexSource: "",
    fragmentSource: "",
    languageVersion: LanguageVersion.GLSL_ES300,
    activeShader: ShaderType.Vertex,
    editorClean: true,
    model: "",
    animation: true,
    wireframe: false,
    vertexLog: { errors: [], warnings: [] } as ShaderLog,
    fragmentLog: { errors: [], warnings: [] } as ShaderLog,
    compilationSucceeded: true,
    uniforms: [],
    uniformsEditors: [] as UniformEditor[],
    availableTextures: [] as string[],
    texturesAssignedToTextureUnits: [] as string[],
    textureUnitToUpdate: { unit: 0, texture: "" },
    windowReady: false
}

const mutations = {
    SET_VERTEX_SOURCE( state: State, value: string ) {
        state.vertexSource = value
    },
    SET_FRAGMENT_SOURCE( state: State, value: string ) {
        state.fragmentSource = value
    },
    SET_LANGUAGE_VERSION( state: State, value: LanguageVersion ) {
        state.languageVersion = value
    },
    SET_ACTIVE_SHADER( state: State, value: ShaderType ) {
        state.activeShader = value
    },
    SET_EDITOR_CLEAN( state: State, value: boolean ) {
        state.editorClean = value
    },
    SET_ANIMATION( state: State, value: boolean ) {
        state.animation = value
    },
    SET_MODEL( state: State, value: string ) {
        state.model = value
    },
    SET_WIREFRAME( state: State, value: boolean ) {
        state.wireframe = value
    },
    SET_LOGS( state: State, log: InspectorLogEntry[] ) {
        const vertexLog: ShaderLog = { errors: [], warnings: [] }
        const fragmentLog: ShaderLog = { errors: [], warnings: [] }

        // clasifico entradas del log segun shader y errores/warnings, y las agrupo por nro de linea
        for ( let entry of log ) {
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
    CLEAR_LOG_LINE( state: State, { shader, line }: { shader: ShaderType, line: number } ) {
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
    SET_COMPILATION_SUCCEEDED( state: State, value: boolean ) {
        state.compilationSucceeded = value
    },
    SET_UNIFORMS( state: State, uniforms: UniformState[] ) {
        state.uniforms = uniforms
    },
    SET_UNIFORMS_EDITORS( state: State, editors: UniformEditor[] ) {
        state.uniformsEditors = editors
    },
    SET_AVAILABLE_TEXTURES( state: State, textures: string[] ) {
        state.availableTextures = textures
    },
    SET_TEXTURES_ASSIGNED_TO_TEXTURE_UNITS( state: State, textures: string[] ) {
        state.texturesAssignedToTextureUnits = textures
    },
    SET_TEXTURE_ASSIGNED_TO_TEXTURE_UNIT( state: State, value: { unit: number, texture: string } ) {
        Vue.set( state.texturesAssignedToTextureUnits, value.unit, value.texture )
    },
    SET_TEXTURE_UNIT_TO_UPDATE( state: State, value: { unit: number, texture: string } ) {
        state.textureUnitToUpdate = value
    },
    SET_WINDOW_READY( state: State, value: boolean ) {
        state.windowReady = value
    }
}

const getters = {
    errorsCount( state: State ) {
        const vertexErrors = state.vertexLog.errors.reduce( ( previous, current ) => previous + current[ 1 ].length, 0 )
        const fragmentErrors = state.fragmentLog.errors.reduce( ( previous, current ) => previous + current[ 1 ].length, 0 )

        return vertexErrors + fragmentErrors
    },
    warningsCount( state: State ) {
        const vertexWarnings = state.vertexLog.warnings.reduce( ( previous, current ) => previous + current[ 1 ].length, 0 )
        const fragmentWarnings = state.fragmentLog.warnings.reduce( ( previous, current ) => previous + current[ 1 ].length, 0 )

        return vertexWarnings + fragmentWarnings
    },
    documentHasUnsavedChanges( state: State ) {
        return ! state.editorClean
    },
    saveInfo( state: State ) {
        const saveInfo: StateSaveInfo = {
            vertexSource: state.vertexSource,
            fragmentSource: state.fragmentSource,
            model: state.model,
            uniforms: state.uniforms
        }

        return saveInfo
    }
}

const actions = {
    restoreState( context: ActionContext< State, State >, state: StateSaveInfo ) {
        context.commit( "SET_VERTEX_SOURCE", state.vertexSource )
        context.commit( "SET_FRAGMENT_SOURCE", state.fragmentSource )
        context.commit( "SET_MODEL", state.model )
        context.commit( "SET_UNIFORMS", state.uniforms )
    }
}

export default new Vuex.Store( {
    strict: process.env.NODE_ENV !== "production",
    state,
    mutations,
    getters,
    actions
} )
