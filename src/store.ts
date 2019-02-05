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

export default new Vuex.Store( {
    state: {
        log: [] as LogEntry[]
    },
    getters: {
        vertexLog: ( state ): ShaderLog => {
            const errors = state.log.filter( entry => ( entry.shader === ShaderType.Vertex ) && ( entry.type === LogEntryType.Error ) )
            const warnings = state.log.filter( entry => ( entry.shader === ShaderType.Vertex ) && ( entry.type === LogEntryType.Warning ) )

            return {
                errors: groupByLine( errors ),
                warnings: groupByLine( warnings )
            }
        },
        fragmentLog: ( state ): ShaderLog => {
            const errors = state.log.filter( entry => ( entry.shader === ShaderType.Fragment ) && ( entry.type === LogEntryType.Error ) )
            const warnings = state.log.filter( entry => ( entry.shader === ShaderType.Fragment ) && ( entry.type === LogEntryType.Warning ) )

            return {
                errors: groupByLine( errors ),
                warnings: groupByLine( warnings )
            }
        }
    },
    mutations: {
        updateLog( state, newEntries: LogEntry[] ) {
            state.log = newEntries
        },
        clearLineLog( state, { shader, line }: { shader: ShaderType, line: number } ) {
            for ( var index = state.log.length - 1; index >= 0; index -- ) {
                if ( state.log[ index ].line === line && state.log[ index ].shader === shader ) {
                    state.log.splice( index, 1 )
                }
            }
        }
    }
} )

function groupByLine( entries: LogEntry[] ) {
    const groups: Array <[ number, string[] ]> = []

    for ( let entry of entries ) {
        const group = groups.find( ( [ line ] ) => entry.line === line )
        if ( group === undefined ) {
            const newGroupEntries = [ entry.description ]
            groups.push( [ entry.line, newGroupEntries ] )
        } else {
            group[ 1 ].push( entry.description )
        }
    }

    return groups
}
