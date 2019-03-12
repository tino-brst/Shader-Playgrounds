import Vue from "vue"
import Vuex from "vuex"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import { ShaderType } from "@/scripts/renderer/_constants"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderLog } from "@/scripts/editor/Shader"
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

Vue.use( Vuex )

export default new Vuex.Store( {
    state: {
        // editorState, rendererState: almacenan el estado de la aplicacion levantado de un archivo y se actualizan cada vez que el archivo se guarda
        editorState: {} as EditorState,
        rendererState: {} as RendererState,
        // si existen cambios sin guardar en alguno de los componentes
        editorClean: true,
        rendererClean: true,
        // codigo que carga el editor para ser leido por el renderer ante compilacion
        vertex: "",
        fragment: "",
        // estado de ultima compilacion
        compilationSucceeded: true,
        // errores y warnings generados por el renderer ante compilacion, cambios de modelo, etc
        vertexLog: { errors: [], warnings: [] } as ShaderLog,
        fragmentLog: { errors: [], warnings: [] } as ShaderLog,
        // uniforms en uso detectados por el renderer
        uniformsEditors: [] as UniformEditor[],
        // info y actualizacion de texturas
        availableTextures: [] as string[],
        texturesAssignedToTextureUnits: [] as string[],
        textureUnitToUpdate: { unit: 0, texture: "" },
        // estado de la ventana para inicio prolijo de algunas animaciones etc
        windowReady: false
    },
    mutations: {
        updateEditorState( state, editorState: EditorState ) {
            state.editorState = editorState
            state.editorClean = true
        },
        updateRendererState( state, rendererState: RendererState ) {
            state.rendererState = rendererState
            state.rendererClean = true
        },
        updateShadersCode( state, { vertex, fragment } ) {
            state.vertex = vertex
            state.fragment = fragment
        },
        updateLog( state, newEntries: InspectorLogEntry[] ) {
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
        updateCompilationState( state, succeeded: boolean ) {
            state.compilationSucceeded = succeeded
        },
        updateUniformsEditors( state, newEditors: UniformEditor[] ) {
            state.uniformsEditors = newEditors
        },
        updateAvailableTextures( state, newTextures: string[] ) {
            state.availableTextures = newTextures
        },
        updateTexturesAssignedToTextureUnits( state, newTextures: string[] ) {
            state.texturesAssignedToTextureUnits = newTextures
        },
        updateTextureAssignedToTextureUnit(  state, newValue: { unit: number, texture: string } ) {
            Vue.set( state.texturesAssignedToTextureUnits, newValue.unit, newValue.texture )
        },
        setTextureUnitForUpdate( state, newValue: { unit: number, texture: string } ) {
            state.textureUnitToUpdate = newValue
        },
        clearLineLog( state, { shader, line }: { shader: ShaderType, line: number } ) {
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
        markEditorDirty( state ) {
            state.editorClean = false
        },
        markRendererDirty( state ) {
            state.rendererClean = false
        },
        setWindowReady( state ) {
            state.windowReady = true
        }
    },
    getters: {
        activeShader( state ) {
            return state.editorState.activeShader
        },
        errorsCount( state ) {
            const vertexErrors = state.vertexLog.errors.reduce( ( previous, current ) => {
                return previous + current[ 1 ].length
            }, 0 )

            const fragmentErrors = state.fragmentLog.errors.reduce( ( previous, current ) => {
                return previous + current[ 1 ].length
            }, 0 )

            return vertexErrors + fragmentErrors
        },
        warningsCount( state ) {
            const vertexWarnings = state.vertexLog.warnings.reduce( ( previous, current ) => {
                return previous + current[ 1 ].length
            }, 0 )

            const fragmentWarnings = state.fragmentLog.warnings.reduce( ( previous, current ) => {
                return previous + current[ 1 ].length
            }, 0 )

            return vertexWarnings + fragmentWarnings
        },
        documentHasUnsavedChanges( state ) {
            return ( ! state.editorClean ) || ( ! state.rendererClean )
        }
    }
} )
