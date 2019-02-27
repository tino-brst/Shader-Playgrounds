import Vue from "vue"
import Vuex from "vuex"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import { ShaderType } from "@/scripts/renderer/_constants"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderLog } from "@/scripts/editor/Shader"

export interface EditorState {
    vertex: string,
    fragment: string,
    activeShader: ShaderType
}
export interface RendererState {
    model: string,
    animations: boolean,
    wireframe: boolean
}

Vue.use( Vuex )

export default new Vuex.Store( {
    state: {
        editor: {} as EditorState,
        renderer: {} as RendererState,
        vertexLog: { errors: [], warnings: [] } as ShaderLog,
        fragmentLog: { errors: [], warnings: [] } as ShaderLog,
        uniformsEditors: [] as UniformEditor[],
        availableTextures: [] as string[],
        texturesAssignedToTextureUnits: [] as string[],
        textureUnitToUpdate: { unit: 0, texture: "" }
    },
    mutations: {
        updateEditorState( state, editorState: EditorState ) {
            state.editor = editorState
        },
        updateRendererState( state, rendererState: RendererState ) {
            state.renderer = rendererState
        },
        updateShadersCode( state, { vertex, fragment } ) {
            Vue.set( state.editor, "vertex", vertex )
            Vue.set( state.editor, "fragment", fragment )
        },
        updateLog( state, newEntries: InspectorLogEntry[] ) {
            const vertexLog: ShaderLog = { errors: [], warnings: [] }
            const fragmentLog: ShaderLog = { errors: [], warnings: [] }

            // clasifico entradas del log segun shader y errores/warnings, agrupandolos por nro de linea
            for ( let entry of newEntries ) {
                const log = ( entry.shader === ShaderType.Vertex ) ? vertexLog : fragmentLog
                const entries = ( entry.type === LogEntryType.Error ) ? log.errors : log.warnings
                const lineNumber = entry.line - 1 // one-based -> zero-based
                const lineEntries = entries.find( ( [ line ] ) => entry.line === line )

                if ( lineEntries === undefined ) {
                    entries.push( [ lineNumber, [ entry.description ] ] )
                } else {
                    lineEntries[ 1 ].push( entry.description )
                }
            }

            state.vertexLog = vertexLog
            state.fragmentLog = fragmentLog
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
        }
    },
    getters: {
        vertex( state ) {
            return state.editor.vertex
        },
        fragment( state ) {
            return state.editor.fragment
        },
        activeShader( state ) {
            return state.editor.activeShader
        }
    }
} )
