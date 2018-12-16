<template>
    <div class="editor" ref="editor"></div>
</template>

<script lang="ts">
import Vue from "vue"
import CodeMirror from "./codemirror/lib/codemirror"
import "./codemirror/lib/codemirror.css"
import "./codemirror/mode/clike/clike"
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

export default Vue.extend( {
    name: "editor",
    props: {
        value: {
            type: String,
            default: ""
        }
    },
    data: () => ( {
        editor: {} as CodeMirror.Editor
    } ),
    model: {
        event: "change"
    },
    mounted() {
        this.editor = CodeMirror( this.$refs.editor as HTMLElement, {
            value: this.value,
            mode: "x-shader/x-vertex",
            lineNumbers: true,
            indentUnit: 4,
            gutters: [ "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],  // define el orden de los items en el margen
            extraKeys: { "Ctrl-Q": "toggleFold", "Ctrl-Space": "autocomplete" },
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            scrollPastEnd: true,
            foldGutter: true,
            foldOptions: { widget: "•••", minFoldSize: 1 },
            hintOptions: { completeSingle: false, alignWithWord: true }
        } )

        this.editor.on( "change", this.updateValue )
        this.editor.on( "keydown", this.showHints )
    },
    methods: {
        updateValue() {
            const value = this.editor.getValue()
            if ( this.value !== value ) {
                this.$emit( "change", value )
            }
        },
        showHints( editor: CodeMirror.Editor, event: Event ) {
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
                            this.editor.execCommand( "autocomplete" )
                        }
                    }
                }
            }
        }
    },
    watch: {
        value( newValue ) {
            if ( newValue !== this.editor.getValue() ) {
                this.editor.setValue( newValue )
            }
        }
    }
} )
</script>

<style>
.editor {
    height: 100%;
    -webkit-font-smoothing: antialiased;
}
.CodeMirror {
    height: 100%;
    font-family: IBM Plex Mono;
    line-height: 1.8rem;
    font-size: 14px;
}

/* Base gutter */

.CodeMirror-gutters {
    left: 0;
    background: white;
    border: none;
}

/* Fold gutter */

.CodeMirror-foldgutter {
  width: 15px;
}
.CodeMirror-foldgutter-open,
.CodeMirror-foldgutter-folded {
    cursor: pointer;
    font-size: 20px;
    color: gray;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.CodeMirror-foldgutter-open {
    transform:  translate(4px, 0px) rotate(90deg);
}
.CodeMirror-foldgutter-folded {
    transform: translate(2px, -1px);
}
.CodeMirror-foldgutter-open:after,
.CodeMirror-foldgutter-folded:after {
    content: "›";
}

/* Fold marker */

.CodeMirror-foldmarker {
    all: unset;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    font-size: 10px;
    font-weight: 500;
    height: 12px;
    margin: 0 4px;
    padding: 0 3px;
    border-radius: 3px;
    cursor: pointer;
    background-color: rgba(65, 105, 225, 0.3);
    color: royalblue;
    transition: all 0.1s;
}
.CodeMirror-foldmarker:hover {
    background-color: royalblue;
    color: white;
}

/* Active line */

.CodeMirror-activeline-background {
    background: rgba(65, 105, 225, 0.1);
}
.CodeMirror-activeline-gutter {
    background: rgba(65, 105, 225, 0.1);
}

/* Matching brackets */

div.CodeMirror span.CodeMirror-matchingbracket {
    display: inline-block;
    color: darkslateblue;
    background: rgba(65, 105, 225, 0.3);
    font-weight: 600;
    border-radius: 2px;
}
div.CodeMirror span.CodeMirror-nonmatchingbracket {
    all: unset;
}

/* Code hints */

.CodeMirror-hints {
    position: absolute;
    transform: translateX( -30px );
    z-index: 10;
    overflow: hidden;
    list-style: none;

    margin: 0;
    padding: 0;

    box-shadow: 0px 2px 5px rgba(0,0,0,.2);
    border-radius: 4px;
    border: 1px solid rgb(200, 200, 200);
    background: white;

    max-height: 20em;
    overflow-y: auto;

    font-size: 14px;
    font-family: IBM Plex Mono;
    font-weight: normal;
}

.CodeMirror-hint {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 6px 8px;
    white-space: pre;
    cursor: pointer;
}
.CodeMirror-hint .display-text {
    color: black;
}
.CodeMirror-hint .display-text b {
    /* font-weight: bold; */
    padding: 1px 0;
    font-weight: normal;
    background-color: rgba(255, 217, 0, 0.3);
    text-decoration: underline solid orange;
    border-radius: 2px;
}

.CodeMirror-hint:hover {
    background: rgba(65, 105, 225, 0.2);
}

.CodeMirror-hint-active,
.CodeMirror-hint-active:hover {
    background: royalblue;
}

.CodeMirror-hint-active .display-text {
    color: white;
}
.CodeMirror-hint-active .display-text b {
    background-color: rgba(255, 255, 255, 0.2);
    text-decoration: underline solid white;
}

.CodeMirror-hint::before,
.class2.CodeMirror-hint::before,
.class3.CodeMirror-hint::before {
    content: "";
    display: inline-flex;
    align-items: center;
    width: 12px;
    height: 12px;
    margin-right: 8px;
    border-radius: 3px;
    border: solid 1px transparent;
}
.class2.CodeMirror-hint::before {
    border: solid 1px white;
    background: yellowgreen;
}
.class3.CodeMirror-hint::before {
    border: solid 1px white;
    background: orange;
}
</style>
