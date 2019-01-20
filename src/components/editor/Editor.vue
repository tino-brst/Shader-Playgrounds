<template>
    <div class="editor" ref="editor" @keydown="enableUniformsButtons" @keyup="disableUniformsButtons">
        <v-tooltip :show="tooltipVisible" :target="tooltipTarget" ref="tooltip" >
            <keep-alive>
                <component :is="editorTypeComponent" :editor="lastUniformSelected.editor"></component>
            </keep-alive>
        </v-tooltip>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tooltip from "./Tooltip.vue"
import UniformEditorOthers from "./UniformEditorOthers.vue"
import UniformEditorFloat from "./UniformEditorFloat.vue"
import CodeMirror, { LineHandle, Editor, Doc, TextMarker, EditorChange, Position } from "./codemirror/lib/codemirror"
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
export interface Uniform {
    range: Range,
    editor: UniformEditor
}
export interface UniformEditor {
    target: string
    type: "int" | "float" | "mat4" | "vec3"
    locked: boolean
    // setValue: ( value: any ) => void
}
export interface Range {
    from: Position
    to: Position
}

export default Vue.extend( {
    name: "editor",
    components: {
        "v-tooltip": Tooltip,
        "v-uniform-editor-float": UniformEditorFloat,
        "v-uniform-editor-others": UniformEditorOthers
    },
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
        editor: {} as Editor,
        document: {} as Doc,
        logLines: [] as Array <{ lineHandle: LineHandle, type: LogEntryType }>,
        uniforms: [] as Uniform[],
        uniformsButtons: [] as HTMLElement[],
        uniformsButtonsMarkers: [] as TextMarker[],
        lastUniformSelected: {} as Uniform,
        tooltipTarget: document.createElement( "span" ) as HTMLElement,
        tooltipVisible: false
    } ),
    computed: {
        editorTypeComponent(): string {
            if ( this.lastUniformSelected.editor ) {
                return this.lastUniformSelected.editor.type === "float" ? "v-uniform-editor-float" : "v-uniform-editor-others"
            } else {
                return ""
            }
        }
    },
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
        handleShowHints( editor: Editor, event: Event ) {
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

                this.addLogInfo( line, marker, type )
            } )
        },
        clearLog() {
            for ( let { lineHandle, type } of this.logLines ) {
                this.removeLogInfo( lineHandle, type )
            }
            this.logLines = []
        },
        addLogInfo( line: number, marker: HTMLElement, type: LogEntryType ) {
            const lineHandle = this.editor.setGutterMarker( line, "CodeMirror-markers", marker )
            this.editor.addLineClass( line, "wrap", "CodeMirror-markedline-" + type )
            this.editor.addLineClass( line, "gutter", "CodeMirror-markedline-gutter-" + type )

            // @ts-ignore
            lineHandle.on( "change", ( lineHandle: LineHandle, change: EditorChange ) => {
                this.removeLogInfo( lineHandle, type )
            } )

            this.logLines.push( { lineHandle, type } )
        },
        removeLogInfo( lineHandle: LineHandle, type: LogEntryType ) {
            this.editor.setGutterMarker( lineHandle, "CodeMirror-markers", null )
            this.editor.removeLineClass( lineHandle, "wrap", "CodeMirror-markedline-" + type )
            this.editor.removeLineClass( lineHandle, "gutter", "CodeMirror-markedline-gutter-" + type )
        },
        enableUniformsButtons( event: KeyboardEvent ) {
            if ( event.key === "Alt" ) {
                this.uniformsButtons = []
                this.uniformsButtonsMarkers = []

                for ( let { range, editor } of this.uniforms ) {
                    const splitUniformName = editor.target.split( "." )

                    const uniformButton = document.createElement( "span" )
                    uniformButton.className = "uniform-button"
                    uniformButton.innerHTML = `<span class="cm-identifier uniform">${ splitUniformName[ 0 ] }</span>`
                    uniformButton.innerHTML += splitUniformName[ 1 ] ? `<span class="cm-punctuation uniform">.</span><span class="cm-attribute uniform">${ splitUniformName[ 1 ] }</span>` : ""
                    uniformButton.addEventListener( "click", event => this.handleUniformClick( uniformButton, editor, range ) )
                    this.uniformsButtons.push( uniformButton )

                    const buttonMark = this.document.markText( range.from, range.to, { replacedWith: uniformButton } )
                    this.uniformsButtonsMarkers.push( buttonMark )
                }
            }
        },
        disableUniformsButtons( event: KeyboardEvent ) {
            if ( event.key === "Alt" ) {
                for ( let button of this.uniformsButtonsMarkers ) {
                    button.clear()
                }
            }
        },
        handleUniformClick( target: HTMLElement, editor: UniformEditor, range: Range ) {
            if ( ( this.lastUniformSelected.range !== range ) || ( this.lastUniformSelected.range === range && ! this.tooltipVisible ) ) {
                this.lastUniformSelected = { range, editor }
                this.showTooltip( target )
            }
        },
        handleClicksOutside( event: MouseEvent ) {
            const clickableArea = ( this.$refs.tooltip as Vue ).$el as Element
            if ( clickableArea && ! clickableArea.contains( event.target as Node ) && ! this.uniformsButtons.includes( event.target as HTMLElement ) ) {
                this.hideTooltip()
            }
        },
        handleScroll() {
            this.hideTooltip()
        },
        showTooltip( target: HTMLElement ) {
            this.tooltipTarget = target
            this.tooltipVisible = true

            document.addEventListener( "mousedown", this.handleClicksOutside )
            this.editor.on( "scroll", this.handleScroll )
        },
        hideTooltip() {
            this.tooltipVisible = false
            document.removeEventListener( "mousedown", this.handleClicksOutside )
            this.editor.off( "scroll", this.handleScroll )
        }
    },
    watch: {
        value( newValue: string ) {
            if ( newValue !== this.editor.getValue() ) {
                this.editor.setValue( newValue )
            }
        },
        log( newLog: LogEntry[] ) {
            this.clearLog()

            const errors: Map < number, string[] > = new Map()
            const warnings: Map < number, string[] > = new Map()

            // separo el log en errores y warnings, agrupandolos por nro. de linea
            for ( let entry of newLog ) {
                const targetList = entry.type === LogEntryType.Error ? errors : warnings
                const line = entry.line - 1 // one-based -> zero-based
                const lineLogEntries = targetList.get( line )

                if ( lineLogEntries === undefined ) {
                    targetList.set( line, [ entry.description ] )
                } else {
                    lineLogEntries.push( entry.description )
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
            this.uniforms = []
            const lineCount = this.document.lineCount()

            for ( let lineNumber = 0; lineNumber < lineCount; lineNumber ++ ) {
                const lineTokens = this.editor.getLineTokens( lineNumber )
                for ( let tokenNumber = 0; tokenNumber < lineTokens.length; tokenNumber ++ ) {
                    const token = lineTokens[ tokenNumber ]
                    if ( token.type === "identifier" ) {
                        if ( basic.includes( token.string ) ) {
                            const from: Position = { line: lineNumber, ch: token.start }
                            const to: Position   = { line: lineNumber, ch: token.end }
                            const range = { from, to }
                            const editor = uniformsEditors.get( token.string ) as UniformEditor
                            this.uniforms.push( { range, editor } )
                        } else {
                            const structComponents = structs.get( token.string )
                            if ( structComponents !== undefined ) {
                                const possibleAttribute = lineTokens[ tokenNumber + 2 ] // [ ... "light", ".", >"position"< ... ]
                                if ( possibleAttribute && possibleAttribute.type === "attribute" && structComponents.includes( possibleAttribute.string ) ) {
                                    const from: Position = { line: lineNumber, ch: token.start }
                                    const to: Position   = { line: lineNumber, ch: possibleAttribute.end }
                                    const range = { from, to }
                                    const editor = uniformsEditors.get( token.string + "." + possibleAttribute.string ) as UniformEditor
                                    this.uniforms.push( { range, editor } )
                                }
                            }
                        }
                    }
                }
            }

            // resalto rangos encontrados
            for ( let { range } of this.uniforms ) {
                this.document.markText( range.from, range.to, { className: "uniform" } )
            }
        }
    }
} )
</script>

<style src="./codemirror/theme/dark.css"></style>
