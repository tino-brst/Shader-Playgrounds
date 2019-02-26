import Vue from "vue"
import Vuex from "vuex"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import { ShaderType } from "@/scripts/renderer/_constants"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderLog } from "@/scripts/editor/Shader"

Vue.use( Vuex )

interface AppState {
    vertex: string,
    fragment: string,
    activeShader: ShaderType,
    model: string,
    animations: boolean,
    wireframe: boolean
}

export default new Vuex.Store( {
    state: {
        vertexCode: "",
        fragmentCode: "",
        activeShader: ShaderType.Vertex,
        model: "" as string,
        animation: true as boolean,
        wireframe: true as boolean,
        vertexLog: { errors: [], warnings: [] } as ShaderLog,
        fragmentLog: { errors: [], warnings: [] } as ShaderLog,
        uniformsEditors: [] as UniformEditor[],
        availableTextures: [] as string[],
        texturesAssignedToTextureUnits: [] as string[],
        textureUnitToUpdate: { unit: 0, texture: "" }
    },
    mutations: {
        setVertexCode( state, newValue ) {
            state.vertexCode = newValue
        },
        setFragmentCode( state, newValue ) {
            state.fragmentCode = newValue
        },
        setActiveShader( state, newValue ) {
            state.activeShader = newValue
        },
        setModel( state, newModel: string ) {
            state.model = newModel
        },
        setAnimation( state, newValue: boolean ) {
            state.animation = newValue
        },
        setWireframe( state, newValue: boolean ) {
            state.wireframe = newValue
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
        appState( state ) {
            const appState: AppState = {
                vertex: state.vertexCode,
                fragment: state.fragmentCode,
                activeShader: state.activeShader,
                model: state.model,
                animations: state.animation,
                wireframe: state.wireframe
            }

            return appState
        }
    },
    actions: {
        loadAppState( context, appState: AppState ) {
            context.commit( "setVertexCode", appState.vertex )
            context.commit( "setFragmentCode", appState.fragment )
            context.commit( "setActiveShader", appState.activeShader )
            context.commit( "setModel", appState.model )
            context.commit( "setAnimation", appState.animations )
            context.commit( "setWireframe", appState.wireframe )
        }
    }
} )
