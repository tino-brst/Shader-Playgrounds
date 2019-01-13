<template>
    <div
        class="editor"
        ref="editor"
        @keydown.alt="enableUniformsButtons()"
        @keyup="disableUniformsButtons()"
    />
</template>

<script lang="ts">
import Vue from "vue"
import CodeMirror from "./codemirror/lib/codemirror"
import "./codemirror/mode/glsl/glsl"
import "./codemirror/addon/selection/active-line"
import "./codemirror/addon/edit/matchbrackets"
import "./codemirror/addon/edit/closebrackets"
import "./codemirror/addon/scroll/scrollpastend"
import "./codemirror/addon/fold/foldgutter"
import "./codemirror/addon/fold/foldcode"
import "./codemirror/addon/fold/brace-fold"
import "./codemirror/addon/fold/comment-fold"
import "./codemirror/addon/hint/show-hint"
import "./codemirror/addon/hint/glsl-hint"

enum LogEntryType {
    Error = "error",
    Warning = "warning"
}

export interface LogEntry {
    type: "error" | "warning",
    line: number,
    description: string
}
export interface UniformEditor {
    target: string
    type: "int" | "float"
    locked: boolean
    // setValue: ( value: any ) => void
}
interface Range {
    from: CodeMirror.Position
    to: CodeMirror.Position
}

export default Vue.extend( {
    name: "editor",
    props: {
        value: {
            type: String,
            default: ""
        },
        log: {
            type: Array as () => LogEntry[],
            default: () => []
        },
        uniformsEditors: {
            type: Array as () => UniformEditor[],
            default: () => []
        }
    },
    data: () => ( {
        editor: {} as CodeMirror.Editor,
        document: {} as CodeMirror.Doc,
        uniforms: new Map() as Map< Range, UniformEditor >,
        uniformsPickers: [] as CodeMirror.TextMarker[]
    } ),
    model: {
        event: "change"
    },
    mounted() {
        this.editor = CodeMirror( this.$refs.editor as HTMLElement, {
            value: this.value,
            mode: "glsl",
            lineNumbers: true,
            indentUnit: 4,
            gutters: [ "CodeMirror-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],  // define el orden de los items en el margen
            extraKeys: { "Ctrl-Q": "toggleFold", "Ctrl-Space": "autocomplete" },
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: { pairs: "()[]{}''\"\"", explode: "[]{}()" },
            scrollPastEnd: true,
            foldGutter: true,
            foldOptions: { widget: "•••", minFoldSize: 1 },
            hintOptions: { completeSingle: false, alignWithWord: true }
        } )

        this.document = this.editor.getDoc()

        this.editor.on( "change", this.updateValue )
        this.editor.on( "keydown", this.handleShowHints )
        this.editor.focus()
    },
    methods: {
        updateValue() {
            const value = this.editor.getValue()
            if ( this.value !== value ) {
                this.$emit( "change", value )
            }
        },
        handleShowHints( editor: CodeMirror.Editor, event: Event ) {
            if ( ! editor.state.completionActive ) {    // evito reactivacion innecesaria de hints
                // @ts-ignore
                const cursor = editor.getCursor()
                const token  = editor.getTokenAt( cursor )

                const cursorAtMiddleOfToken = cursor.ch < token.end

                if ( ! cursorAtMiddleOfToken ) {    // evito que se active al tipear a la mitad de una palabra
                    const modifiersActive = ( event as KeyboardEvent ).ctrlKey || ( event as KeyboardEvent ).metaKey    // evito que Ctrl+C active el autocompletado

                    if ( ! modifiersActive ) {
                        const which = ( event as KeyboardEvent ).which  // codigo de tecla ( a: 65, z: 90, etc )
                        const key = ( event as KeyboardEvent ).key      // character ingresado ( "a", "A", "å", etc )

                        const isLetterKey = ( which >= 65 && which <= 90 )  // si primero no filtrara por teclas correspondientes a letras, la key = "Enter" caeria en el rango "A"..."Z" ( por usar la "E" para la comparacion )
                        const isValidIdentifierLetter = isLetterKey && ( ( key >= "a" && key <= "z" ) || ( key >= "A" && key <= "z" ) )

                        if ( isValidIdentifierLetter || ( key === "_" ) || ( key === "#" ) ) {
                            // @ts-ignore
                            this.editor.showHint( { trigger: key } )
                        }
                    }
                }
            }
        },
        showLog( entries: Map < number, string[] >, type: LogEntryType ) {
            entries.forEach( ( descriptions, line ) => {
                const marker = document.createElement( "div" )
                marker.className = "CodeMirror-marker-" + type

                const markerTooltip = document.createElement( "ul" )
                markerTooltip.className = "CodeMirror-marker-tooltip"
                marker.appendChild( markerTooltip )

                for ( let description of descriptions ) {
                    const descriptionListItem = document.createElement( "li" )
                    descriptionListItem.textContent = description
                    markerTooltip.appendChild( descriptionListItem )
                }

                marker.addEventListener( "mouseenter", () => {
                    markerTooltip.classList.add( "visible" )
                } )
                marker.addEventListener( "mouseout", () => {
                    markerTooltip.classList.remove( "visible" )
                } )

                const lineHandle = this.editor.setGutterMarker( line, "CodeMirror-markers", marker )

                this.editor.addLineClass( line, "wrap", "CodeMirror-markedline-" + type )
                this.editor.addLineClass( line, "gutter", "CodeMirror-markedline-gutter-" + type )

                // @ts-ignore
                lineHandle.on( "change", ( lineHandle: CodeMirror.LineHandle, change: CodeMirror.EditorChange ) => {
                    // obtengo el numero de linea actualizado (puede haber cambiado por ediciones)
                    const currentLine = this.document.getLineNumber( lineHandle )

                    this.editor.setGutterMarker( currentLine, "CodeMirror-markers", null )

                    this.editor.removeLineClass( currentLine, "wrap", "CodeMirror-markedline-" + type )
                    this.editor.removeLineClass( currentLine, "gutter", "CodeMirror-markedline-gutter-" + type )
                } )
            } )
        },
        enableUniformsButtons() {
            this.uniformsPickers = []

            this.uniforms.forEach( ( editor, range ) => {
                const uniformButton = document.createElement( "span" )
                uniformButton.className = "uniform-button"

                const nameParts = editor.target.split( "." )
                const identifier = document.createElement( "span" )
                identifier.className = "cm-identifier editable"
                identifier.innerText = nameParts[ 0 ]
                uniformButton.appendChild( identifier )

                if ( nameParts.length > 1 ) {
                    const punctuation = document.createElement( "span" )
                    punctuation.className = "cm-punctuation editable"
                    punctuation.innerText = "."
                    uniformButton.appendChild( punctuation )

                    const attribute = document.createElement( "span" )
                    attribute.className = "cm-attribute editable"
                    attribute.innerText = nameParts[ 1 ]
                    uniformButton.appendChild( attribute )
                }

                const widget = this.document.markText( range.from, range.to, { replacedWith: uniformButton } )
                this.uniformsPickers.push( widget )
            } )
        },
        disableUniformsButtons() {
            for ( let widget of this.uniformsPickers ) {
                widget.clear()
            }
        }
    },
    watch: {
        value( newValue: string ) {
            if ( newValue !== this.editor.getValue() ) {
                this.editor.setValue( newValue )
            }
        },
        log( newLog: LogEntry[] ) {
            const errors: Map < number, string[] > = new Map()
            const warnings: Map < number, string[] > = new Map()

            // separo el log en errores y warnings, agrupandolos por nro. de linea
            for ( let entry of newLog ) {
                const target = entry.type === LogEntryType.Error ? errors : warnings
                const line = entry.line - 1 // one-based -> zero-based
                const lineEntries = target.get( line )

                if ( lineEntries === undefined ) {
                    target.set( line, [ entry.description ] )
                } else {
                    lineEntries.push( entry.description )
                }
            }

            this.showLog( errors, LogEntryType.Error )

            if ( errors.size === 0 ) {
                this.showLog( warnings, LogEntryType.Warning )
            }
        },
        uniformsEditors( newUniformsEditors: UniformEditor[] ) {
            // ⚠️ contemplar que se deberian poder editar solo cuando no hay errores

            const uniformsEditors: Map <string, UniformEditor> = new Map()
            const uniformsNames: Array <string> = []

            for ( let editor of newUniformsEditors ) {
                // mapa para acceso rapido de editores
                uniformsEditors.set( editor.target, editor )
                // nombres de uniforms desarmados:
                //  • "viewMatrix"     -> [ "viewMatrix" ]
                //  • "light.position" -> [ "light", "position" ]
                uniformsNames.push( editor.target )
            }

            // los separo en "basicos" y "estructuras" (con sus componentes)
            const basic: string[] = [] // [ "viewMatrix", ... ]
            const structs: Map < string, string[] > = new Map() // "light" -> [ "position", "color", ... ]

            for ( let name of uniformsNames ) {
                const nameParts = name.split( "." )
                if ( nameParts.length === 1 ) {
                    // [ "viewMatrix" ]
                    const identifier = nameParts[ 0 ]
                    basic.push( identifier )
                } else {
                    // [ "light", "position" ]
                    const structIdentifier = nameParts[ 0 ]
                    const structAttribute = nameParts[ 1 ]
                    const structAttributes = structs.get( structIdentifier )
                    if ( structAttributes !== undefined ) {
                        structAttributes.push( structAttribute )
                    } else {
                        structs.set( structIdentifier, [ structAttribute ] )
                    }
                }
            }

            // encuentro los rangos en el codigo que ocupan los uniforms
            this.uniforms.clear()
            const lineCount = this.document.lineCount()

            for ( let lineNumber = 0; lineNumber < lineCount; lineNumber ++ ) {
                const lineTokens = this.editor.getLineTokens( lineNumber )
                for ( let tokenNumber = 0; tokenNumber < lineTokens.length; tokenNumber ++ ) {
                    const token = lineTokens[ tokenNumber ]
                    if ( token.type === "identifier" ) {
                        if ( basic.includes( token.string ) ) {
                            const from: CodeMirror.Position = { line: lineNumber, ch: token.start }
                            const to: CodeMirror.Position   = { line: lineNumber, ch: token.end }
                            this.uniforms.set( { from, to }, uniformsEditors.get( token.string ) as UniformEditor )
                        } else {
                            const structComponents = structs.get( token.string )
                            if ( structComponents !== undefined ) {
                                const possibleAttribute = lineTokens[ tokenNumber + 2 ] // [ ... "light", ".", >"position"< ... ]
                                if ( possibleAttribute && possibleAttribute.type === "attribute" && structComponents.includes( possibleAttribute.string ) ) {
                                    const from: CodeMirror.Position = { line: lineNumber, ch: token.start }
                                    const to: CodeMirror.Position   = { line: lineNumber, ch: possibleAttribute.end }
                                    this.uniforms.set( { from, to }, uniformsEditors.get( token.string + "." + possibleAttribute.string ) as UniformEditor )
                                }
                            }
                        }
                    }
                }
            }

            // resalto rangos encontrados
            this.uniforms.forEach( ( editor, range ) => {
                this.document.markText( range.from, range.to, { className: "editable" } )
            } )
        }
    }
} )
</script>

<style src="./codemirror/theme/dark.css"></style>
