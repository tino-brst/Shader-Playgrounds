<template>
    <div class="editor" ref="editor"></div>
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

export interface LogEntry {
    type: "error" | "warning",
    line: number,
    description: string
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
        }
    },
    data: () => ( {
        editor: {} as CodeMirror.Editor,
        document: {} as CodeMirror.Doc
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
            gutters: [ "CodeMirror-logmarkers", "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],  // define el orden de los items en el margen
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
        }
    },
    watch: {
        value( newValue: string ) {
            if ( newValue !== this.editor.getValue() ) {
                this.editor.setValue( newValue )
            }
        },
        log( newLog: LogEntry[] ) {
            for ( let logEntry of newLog ) {
                const line = logEntry.line - 1 // one-based -> zero-based

                const marker = document.createElement( "div" )
                marker.classList.add( logEntry.type === "error" ? "CodeMirror-logmarker-error" : "CodeMirror-logmarker-warning"  )

                const lineHandle = this.editor.setGutterMarker( line, "CodeMirror-logmarkers", marker )

                this.editor.addLineClass( line, "wrap", logEntry.type === "error" ? "CodeMirror-errorline" : "CodeMirror-warningline" )
                this.editor.addLineClass( line, "gutter", logEntry.type === "error" ? "CodeMirror-errorline-gutter" : "CodeMirror-warningline-gutter" )

                // @ts-ignore
                lineHandle.on( "change", ( lineHandle: CodeMirror.LineHandle, change: CodeMirror.EditorChange ) => {
                    // obtengo el numero de linea actualizado (puede haber cambiado por ediciones)
                    const currentLine = this.document.getLineNumber( lineHandle )

                    this.editor.setGutterMarker( currentLine, "CodeMirror-logmarkers", null )

                    this.editor.removeLineClass( currentLine, "wrap", "CodeMirror-errorline" )
                    this.editor.removeLineClass( currentLine, "wrap", "CodeMirror-warningline" )
                    this.editor.removeLineClass( currentLine, "gutter", "CodeMirror-errorline-gutter" )
                    this.editor.removeLineClass( currentLine, "gutter", "CodeMirror-warningline-gutter" )
                } )
            }
        }
    }
} )
</script>

<style src="./codemirror/theme/dark.css"></style>
