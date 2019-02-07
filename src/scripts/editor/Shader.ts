import CodeMirror, { Doc, Editor, Position, TextMarker } from "./codemirror/lib/codemirror"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import ShaderLogMarker from "./ShaderLogMarker"

export interface ShaderLog {
    errors: Array <[ number, string[] ]>,
    warnings: Array <[ number, string[] ]>
}

export interface LogEntry {
    shader: ShaderType,
    type: LogEntryType,
    line: number,
    description: string
}
enum LogEntryType {
    Error = "error",
    Warning = "warning"
}
export enum ShaderType {
    Vertex = "vertex",
    Fragment = "fragment"
}
interface Uniform {
    range: Range,
    editor: UniformEditor
}
interface Range {
    from: Position
    to: Position
}

export default class Shader {
    public type: ShaderType
    public doc: Doc
    public log: ShaderLog
    private markedLines: ShaderLogMarker[]
    private uniforms: Uniform[]
    private uniformsMarkers: TextMarker[]
    private uniformsButtons: HTMLElement[]
    private uniformsButtonsMarkers: TextMarker[]
    private uniformsButtonsEnabled: boolean

    constructor( type: ShaderType ) {
        this.type = type
        this.doc = CodeMirror.Doc( "", "glsl" )
        this.log = { errors: [], warnings: [] }
        this.markedLines = []
        this.uniforms = []
        this.uniformsMarkers = []
        this.uniformsButtons = []
        this.uniformsButtonsMarkers = []
        this.uniformsButtonsEnabled = false
    }

    // 👥 Metodos Publicos

    public setValue( value: string ) {
        this.doc.setValue( value )
        this.doc.clearHistory()
    }

    public getValue() {
        return this.doc.getValue()
    }

    // Log

    public setLog( log: ShaderLog ) {
        this.clearLog()
        this.log = log
        // ⚠️ fiero
        if ( this.log.errors.length > 0 ) {
            this.showLog( LogEntryType.Error )
        } else {
            this.showLog( LogEntryType.Warning )
        }
    }

    // Uniforms

    public enableUniformsTools( basic: Map <string, UniformEditor>, structs: Map <string, Map <string, UniformEditor> >, editor: Editor ) {
        // clean-up
        this.unmarkUniforms()
        this.uniforms = []

        // encuentro los rangos en el codigo que ocupan los uniforms
        const lineCount = this.doc.lineCount()

        for ( let lineNumber = 0; lineNumber < lineCount; lineNumber ++ ) {
            const lineTokens = editor.getLineTokens( lineNumber )
            for ( let tokenNumber = 0; tokenNumber < lineTokens.length; tokenNumber ++ ) {
                const token = lineTokens[ tokenNumber ]
                if ( token.type === "identifier" ) {
                    if ( basic.has( token.string ) ) {
                        const from: Position = { line: lineNumber, ch: token.start }
                        const to: Position   = { line: lineNumber, ch: token.end }
                        const range = { from, to }
                        const editor = basic.get( token.string ) as UniformEditor
                        this.uniforms.push( { range, editor } )
                    } else {
                        const structComponents = structs.get( token.string )
                        if ( structComponents !== undefined ) {
                            const possibleAttribute = lineTokens[ tokenNumber + 2 ] // [ ... "light", ".", >"position"< ... ]
                            if ( possibleAttribute && possibleAttribute.type === "attribute" && structComponents.has( possibleAttribute.string ) ) {
                                const from: Position = { line: lineNumber, ch: token.start }
                                const to: Position   = { line: lineNumber, ch: possibleAttribute.end }
                                const range = { from, to }
                                const editor = structComponents.get( possibleAttribute.string ) as UniformEditor
                                this.uniforms.push( { range, editor } )
                            }
                        }
                    }
                }
            }
        }

        // los resalto
        this.markUniforms( this.uniforms )
    }

    public disableUniformsTools() {
        this.unmarkUniforms()
    }

    public signalUniformsDetected() {
        const uniformsSignalsMarkers: TextMarker[] = []

        for ( let { range, editor } of this.uniforms ) {
            const splitUniformName = editor.target.split( "." )

            const uniformsSignal = document.createElement( "span" )
            uniformsSignal.className = "uniform-signal"
            uniformsSignal.innerHTML = `<span class="cm-identifier uniform">${ splitUniformName[ 0 ] }</span>`
            uniformsSignal.innerHTML += splitUniformName[ 1 ] ? `<span class="cm-punctuation uniform">.</span><span class="cm-attribute uniform">${ splitUniformName[ 1 ] }</span>` : ""

            uniformsSignalsMarkers.push( this.doc.markText( range.from, range.to, { replacedWith: uniformsSignal } ) )
        }

        setTimeout( () => {
            for ( let marker of uniformsSignalsMarkers ) {
                marker.clear()
            }
        }, 700 )
    }

    public markUniforms( uniforms: Uniform[] ) {
        this.uniformsMarkers = []
        for ( let { range } of uniforms ) {
            this.uniformsMarkers.push( this.doc.markText( range.from, range.to, { className: "uniform" } ) )
        }
    }

    public unmarkUniforms() {
        for ( let marker of this.uniformsMarkers ) {
            marker.clear()
        }
    }

    public enableUniformsButtons( uniformClickCallback: ( target: HTMLElement, editor: UniformEditor, range: Range ) => void ) {
        if ( ! this.uniformsButtonsEnabled ) {
            this.uniformsButtons = []
            this.uniformsButtonsMarkers = []
            this.uniformsButtonsEnabled = true

            for ( let { range, editor } of this.uniforms ) {
                const splitUniformName = editor.target.split( "." )

                const uniformButton = document.createElement( "span" )
                uniformButton.className = "uniform-button"
                uniformButton.innerHTML = `<span class="cm-identifier uniform">${ splitUniformName[ 0 ] }</span>`
                uniformButton.innerHTML += splitUniformName[ 1 ] ? `<span class="cm-punctuation uniform">.</span><span class="cm-attribute uniform">${ splitUniformName[ 1 ] }</span>` : ""
                uniformButton.addEventListener( "click", () => uniformClickCallback( uniformButton, editor, range ) )

                this.uniformsButtons.push( uniformButton )
                this.uniformsButtonsMarkers.push( this.doc.markText( range.from, range.to, { replacedWith: uniformButton } ) )
            }
        }
    }

    public disableUniformsButtons() {
        for ( let button of this.uniformsButtonsMarkers ) {
            button.clear()
        }
        this.uniformsButtons = []
        this.uniformsButtonsMarkers = []
        this.uniformsButtonsEnabled = false
    }

    // ✋🏼 Metodos Privados

    private showLog( type: LogEntryType ) {
        const log = ( type === LogEntryType.Error ) ? this.log.errors : this.log.warnings

        for ( let [ lineNumber, descriptions ] of log ) {
            const marker = new ShaderLogMarker( this, lineNumber, descriptions, type )
            this.markedLines.push( marker )
        }
    }

    private clearLog() {
        for ( let marker of this.markedLines ) {
            marker.clear()
        }
        this.markedLines = []
    }
}
