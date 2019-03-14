import CodeMirror, { Doc, Editor, Position, TextMarker } from "./codemirror/lib/codemirror"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { ShaderType } from "@/scripts/renderer/_constants"
import { InspectorLogEntry, LogEntryType } from "@/scripts/renderer/InspectorLogEntry"
import ShaderLogMarker from "./ShaderLogMarker"

export interface ShaderLog {
    errors: Array <[ number, string[] ]>,
    warnings: Array <[ number, string[] ]>
}
interface UniformRange {
    range: Range,
    editor: UniformEditor
}
interface Range {
    from: Position
    to: Position
}

export class ShaderView {
    public type: ShaderType
    public doc: Doc
    public log: ShaderLog
    private markedLines: ShaderLogMarker[]
    private uniformsButtons: HTMLElement[]
    private uniformsButtonsMarkers: TextMarker[]
    private toolsEnabled: boolean
    private activeUniformButton: null | HTMLElement

    constructor( type: ShaderType ) {
        this.type = type
        this.doc = CodeMirror.Doc( "", "glsl" )
        this.log = { errors: [], warnings: [] }
        this.markedLines = []
        this.uniformsButtons = []
        this.uniformsButtonsMarkers = []
        this.toolsEnabled = false
        this.activeUniformButton = null
    }

    // 👥 Metodos Publicos

    public setValue( value: string = "" ) {
        this.doc.setValue( value )
        this.doc.clearHistory()
    }

    public getValue() {
        return this.doc.getValue()
    }

    public setLog( log: ShaderLog ) {
        this.clearLog()
        this.log = log

        if ( this.log.errors.length > 0 ) {
            this.showLog( LogEntryType.Error )
        } else if ( this.log.warnings.length > 0 ) {
            this.showLog( LogEntryType.Warning )
        }
    }

    public enableUniformsTools( uniformsEditors: UniformEditor[], onUniformClick: ( target: HTMLElement, editor: UniformEditor, range: Range ) => void, onUniformDoubleClick: ( event: MouseEvent ) => void ) {
        const editor = this.doc.getEditor()

        // enable tools only if the shader document is the current editor document ( i.e. getEditor() returns something )
        if ( editor ) {
            // clean-up previously enabled uniforms buttons
            if ( this.toolsEnabled ) {
                this.disableUniformsTools()
            }
            const uniformsRanges = this.findUniformsRanges( uniformsEditors, editor )
            this.addUniformsButtons( uniformsRanges, onUniformClick, onUniformDoubleClick )
            this.toolsEnabled = true
        }
    }

    public disableUniformsTools() {
        this.removeUniformsButtons()
        this.toolsEnabled = false
    }

    public clearSelectedUniform() {
        this.clearActiveUniformButton()
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

    private findUniformsRanges( uniformsEditors: UniformEditor[], editor: Editor ): UniformRange[] {
        const ranges: UniformRange[] = []
        const [ basicUniforms, structUniforms ] = this.classifyUniformsEditors( uniformsEditors )

        for ( let lineNumber = 0; lineNumber < this.doc.lineCount(); lineNumber ++ ) {
            const lineTokens = editor.getLineTokens( lineNumber )
            for ( let tokenNumber = 0; tokenNumber < lineTokens.length; tokenNumber ++ ) {
                const token = lineTokens[ tokenNumber ]
                if ( token.type === "identifier" ) {
                    if ( basicUniforms.has( token.string ) ) {
                        const from: Position = { line: lineNumber, ch: token.start }
                        const to: Position   = { line: lineNumber, ch: token.end }
                        const range = { from, to }
                        const editor = basicUniforms.get( token.string ) as UniformEditor
                        ranges.push( { range, editor } )
                    } else {
                        const structComponents = structUniforms.get( token.string )
                        if ( structComponents !== undefined ) {
                            const possibleAttribute = lineTokens[ tokenNumber + 2 ] // [ ... "light", ".", >"position"< ... ]
                            if ( possibleAttribute && possibleAttribute.type === "attribute" && structComponents.has( possibleAttribute.string ) ) {
                                const from: Position = { line: lineNumber, ch: token.start }
                                const to: Position   = { line: lineNumber, ch: possibleAttribute.end }
                                const range = { from, to }
                                const editor = structComponents.get( possibleAttribute.string ) as UniformEditor
                                ranges.push( { range, editor } )
                            }
                        }
                    }
                }
            }
        }

        return ranges
    }

    private classifyUniformsEditors( uniformsEditors: UniformEditor[] ) {
        const uniformsEditorsMap: Map <string, UniformEditor> = new Map()
        const uniformsNames: string[] = []

        for ( let editor of uniformsEditors ) {
            uniformsEditorsMap.set( editor.target, editor )
            uniformsNames.push( editor.target )
        }

        // clasifico uniforms como "basicos" y "estructuras" (con sus componentes)
        const basic: Map <string, UniformEditor> = new Map()
        const structs: Map <string, Map <string, UniformEditor> > = new Map()

        for ( let name of uniformsNames ) {
            // descompongo nombre del uniform:
            //  • si es basico: "viewMatrix"     -> [ "viewMatrix" ]
            //  • si es struct: "light.position" -> [ "light", "position" ]
            const splitName = name.split( "." )
            if ( splitName.length === 1 ) {
                const identifier = splitName[ 0 ]
                const editor = uniformsEditorsMap.get( name ) as UniformEditor
                basic.set( identifier, editor )
            } else {
                const structIdentifier = splitName[ 0 ]
                const structAttribute = splitName[ 1 ]
                const editor = uniformsEditorsMap.get( name ) as UniformEditor
                let structAttributes = structs.get( structIdentifier )
                if ( structAttributes !== undefined ) {
                    structAttributes.set( structAttribute, editor )
                } else {
                    structAttributes = new Map()
                    structAttributes.set( structAttribute, editor )
                    structs.set( structIdentifier, structAttributes )
                }
            }
        }

        return [ basic, structs ] as [ Map <string, UniformEditor>, Map <string, Map <string, UniformEditor> > ]
    }

    private addUniformsButtons( uniformsRanges: UniformRange[], onUniformClick: ( target: HTMLElement, editor: UniformEditor, range: Range ) => void, onUniformDoubleClick: ( event: MouseEvent ) => void ) {
        this.uniformsButtons = []
        this.uniformsButtonsMarkers = []

        for ( let uniform of uniformsRanges ) {
            const splitUniformName = uniform.editor.target.split( "." )

            const uniformButton = document.createElement( "span" )
            uniformButton.className = "uniform-button"
            uniformButton.innerHTML = `<span class="cm-identifier uniform">${ splitUniformName[ 0 ] }</span>`
            uniformButton.innerHTML += splitUniformName[ 1 ] ? `<span class="cm-punctuation uniform">.</span><span class="cm-attribute uniform">${ splitUniformName[ 1 ] }</span>` : ""

            let timer: NodeJS.Timeout
            let prevent = false
            const delay = 150

            uniformButton.addEventListener( "click", () => {
                timer = setTimeout( () => {
                    if ( ! prevent ) {
                        this.setActiveUniformButton( uniformButton )
                        onUniformClick( uniformButton, uniform.editor, uniform.range )
                    }
                    prevent = false
                }, delay )
            } )

            uniformButton.addEventListener("dblclick", ( event ) => {
                clearTimeout( timer )
                prevent = true
                onUniformDoubleClick( event )
            } )

            this.uniformsButtons.push( uniformButton )
            this.uniformsButtonsMarkers.push( this.doc.markText( uniform.range.from, uniform.range.to, { replacedWith: uniformButton } ) )
        }
    }

    private removeUniformsButtons() {
        for ( let button of this.uniformsButtonsMarkers ) {
            button.clear()
        }

        this.uniformsButtons = []
        this.uniformsButtonsMarkers = []
    }

    private setActiveUniformButton( button: HTMLElement ) {
        this.clearActiveUniformButton()
        this.activeUniformButton = button
        this.activeUniformButton.classList.add( "active" )
    }

    private clearActiveUniformButton() {
        if ( this.activeUniformButton ) {
            this.activeUniformButton.classList.remove( "active" )
            this.activeUniformButton = null
        }
    }
}
