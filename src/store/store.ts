import Vue from "vue"
import Vuex from "vuex"

Vue.use( Vuex )

interface ShaderLog {
    errors: Array <[ number, string[] ]>,
    warnings: Array <[ number, string[] ]>
}
enum ShaderType {
    Vertex = "vertex",
    Fragment = "fragment"
}
enum LogEntryType {
    Error = "error",
    Warning = "warning"
}
interface LogEntry {
    shader: ShaderType,
    type: LogEntryType,
    line: number,
    description: string
}
interface UniformEditor {
    target: string
    type: "int" | "float" | "mat4" | "vec3"
    locked: boolean
    // setValue: ( value: any ) => void
}

export default new Vuex.Store( {
    state: {
        vertexLog: { errors: [], warnings: [] } as ShaderLog,
        fragmentLog: { errors: [], warnings: [] } as ShaderLog,
        uniformsEditors: [] as UniformEditor[]
    },
    mutations: {
        updateLog( state, newEntries: LogEntry[] ) {
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
        updateUniformsEditors( state, newEditors: Map <string, UniformEditor> ) {
            state.uniformsEditors = Array.from( newEditors.values() )
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
    }
} )
