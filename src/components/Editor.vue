<template>
    <div class="editor" ref="editor">
        <v-tooltip :show="tooltipVisible" :target="tooltipTarget" ref="tooltip">
            <keep-alive>
                <component :is="editorTypeComponent" :editor="lastUniformSelected.editor" />
            </keep-alive>
        </v-tooltip>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tooltip from "@/components/Tooltip.vue"
import UniformEditorOthers from "@/components/UniformEditorOthers.vue"
import UniformEditorFloat from "@/components/UniformEditorFloat.vue"
import { LogEntryType, ShaderType, UniformEditor } from "@/App.vue"
import Shader from "@/scripts/editor/Shader"
import CodeMirror, { LineHandle, Editor, Doc, TextMarker, EditorChange, Position } from "@/scripts/editor/codemirror/lib/codemirror"
import "@/scripts/editor/codemirror/mode/glsl/glsl"
import "@/scripts/editor/codemirror/addon/selection/active-line"
import "@/scripts/editor/codemirror/addon/edit/matchbrackets"
import "@/scripts/editor/codemirror/addon/edit/closebrackets"
import "@/scripts/editor/codemirror/addon/scroll/scrollpastend"
import "@/scripts/editor/codemirror/addon/scroll/simplescrollbars"
import "@/scripts/editor/codemirror/addon/fold/foldgutter"
import "@/scripts/editor/codemirror/addon/fold/foldcode"
import "@/scripts/editor/codemirror/addon/fold/brace-fold"
import "@/scripts/editor/codemirror/addon/fold/comment-fold"
import "@/scripts/editor/codemirror/addon/hint/show-hint"
import "@/scripts/editor/codemirror/addon/hint/glsl-hint"
import { mapState } from "vuex"

const TOOLS_KEY = "Alt"

interface ShaderLog {
    errors: Array <[ number, string[] ]>,
    warnings: Array <[ number, string[] ]>
}
interface Uniform {
    range: Range,
    editor: UniformEditor
}
interface Range {
    from: Position
    to: Position
}

export default Vue.extend( {
    name: "Editor",
    components: {
        "v-tooltip": Tooltip,
        "v-uniform-editor-float": UniformEditorFloat,
        "v-uniform-editor-others": UniformEditorOthers
    },
    props: {
        activeShader: {
            type: String,
            default: "vertex" // no le gusta el enum de Typescript
        },
        vertex: {
            type: String,
            default: "// Vertex Shader"
        },
        fragment: {
            type: String,
            default: "// Fragment Shader"
        }
    },
    data: () => ( {
        editor: {} as Editor,
        vertexShader: new Shader( ShaderType.Vertex ),
        fragmentShader: new Shader( ShaderType.Fragment ),
        uniformsBasic: new Map() as Map <string, UniformEditor>,
        uniformsStruct: new Map() as Map <string, Map <string, UniformEditor> >,
        shaderChangedSinceLastUpdate: false,
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
        },
        ...mapState( [ "vertexLog", "fragmentLog", "uniformsEditors" ] )
    },
    watch: {
        activeShader( newValue: ShaderType ) {
            // cierro code-hints, tooltips, etc en caso de estar activas
            if ( this.editor.state.completionActive ) {
                this.editor.state.completionActive.close()
            }
            if ( this.tooltipVisible ) {
                this.hideTooltip()
            }

            // hago cambio de shader
            const newActiveShader = ( newValue === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader
            this.editor.swapDoc( newActiveShader.doc )
            if ( ! this.shaderChangedSinceLastUpdate ) {
                newActiveShader.enableUniformsTools( this.uniformsBasic, this.uniformsStruct, this.editor )
            }
        },
        vertex( newValue: string ) {
            if ( newValue !== this.vertexShader.getValue() ) {
                this.vertexShader.setValue( newValue )
            }
        },
        fragment( newValue: string ) {
            if ( newValue !== this.fragmentShader.getValue() ) {
                this.fragmentShader.setValue( newValue )
            }
        },
        uniformsEditors( newEditors: UniformEditor[] ) {
            this.shaderChangedSinceLastUpdate = false
            this.uniformsBasic.clear()
            this.uniformsStruct.clear()
            const activeShader = ( this.activeShader === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader

            // @ts-ignore
            if ( this.uniformsEditors.length > 0 ) {
                [ this.uniformsBasic, this.uniformsStruct ] = this.classifyUniformsEditors( newEditors )

                activeShader.enableUniformsTools( this.uniformsBasic, this.uniformsStruct, this.editor )
                activeShader.signalUniformsDetected()

                window.addEventListener( "keydown", this.handleToolsKey )
                window.addEventListener( "keyup", this.handleToolsKey )
                window.addEventListener( "blur", this.hideTooltip )

                this.editor.on( "change", () => {
                    this.shaderChangedSinceLastUpdate = true
                    this.vertexShader.disableUniformsTools()
                    this.fragmentShader.disableUniformsTools()

                    window.removeEventListener( "keydown", this.handleToolsKey )
                    window.removeEventListener( "keyup", this.handleToolsKey )
                    window.removeEventListener( "blur", this.hideTooltip )
                } )
            } else {
                activeShader.disableUniformsTools()
                window.removeEventListener( "keydown", this.handleToolsKey )
                window.removeEventListener( "keyup", this.handleToolsKey )
                window.removeEventListener( "blur", this.hideTooltip )
            }
        },
        vertexLog( newLog: ShaderLog ) {
            this.vertexShader.setLog( newLog )
        },
        fragmentLog( newLog: ShaderLog ) {
            this.fragmentShader.setLog( newLog )
        }
    },
    mounted() {
        this.vertexShader.setValue( this.vertex )
        this.fragmentShader.setValue( this.fragment )

        this.editor = CodeMirror( this.$refs.editor as HTMLElement, {
            value: this.activeShader === ShaderType.Vertex ? this.vertexShader.doc : this.fragmentShader.doc,
            lineNumbers: true,
            indentUnit: 4,
            gutters: [ "CodeMirror-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],  // define el orden de los items en el margen
            extraKeys: { "Ctrl-Q": "toggleFold", "Ctrl-Space": "autocomplete" },
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: { pairs: "()[]{}''\"\"", explode: "[]{}()" },
            scrollPastEnd: true,
            scrollbarStyle: "simple",
            foldGutter: true,
            foldOptions: { widget: "•••", minFoldSize: 1 },
            hintOptions: { completeSingle: false, alignWithWord: true }
        } )

        this.editor.on( "change", this.updateValue )
        this.editor.on( "keydown", this.handleShowHints )
        this.editor.focus()
    },
    methods: {
        updateValue() {
            this.$emit( "change", this.editor.getValue() )
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
        classifyUniformsEditors( rawUniformsEditor: UniformEditor[] ) {
            const uniformsEditors: Map <string, UniformEditor> = new Map()
            const uniformsNames: string[] = []

            for ( let editor of rawUniformsEditor ) {
                uniformsEditors.set( editor.target, editor )
                uniformsNames.push( editor.target )
            }

            // clasifico uniforms como "basicos" y "estructuras" (con sus componentes)
            const basic   = new Map()
            const structs = new Map()

            for ( let name of uniformsNames ) {
                // descompongo nombre del uniform:
                //  • si es basico: "viewMatrix"     -> [ "viewMatrix" ]
                //  • si es struct: "light.position" -> [ "light", "position" ]
                const splitName = name.split( "." )
                if ( splitName.length === 1 ) {
                    const identifier = splitName[ 0 ]
                    const editor = uniformsEditors.get( name ) as UniformEditor
                    basic.set( identifier, editor )
                } else {
                    const structIdentifier = splitName[ 0 ]
                    const structAttribute = splitName[ 1 ]
                    const editor = uniformsEditors.get( name ) as UniformEditor
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

            return [ basic, structs ]
        },
        handleToolsKey( event: KeyboardEvent ) {
            const activeShader = ( this.activeShader === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader
            if ( event.key === TOOLS_KEY ) {
                if ( event.type === "keydown" ) {
                    activeShader.enableUniformsButtons( this.handleUniformClick )
                } else {
                    activeShader.disableUniformsButtons()
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
            if ( clickableArea && ! clickableArea.contains( event.target as Node ) ) {
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
    }
} )
</script>

<style>
/* 🎨 Basics */

.editor {
    position: relative;
    flex: 1 1 auto;
    font-family: IBM Plex Mono;
    font-weight: 500;
    font-size: 14px;
    color: white;
}
.CodeMirror {
    /* Set height, width, borders, and global font properties here */
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    direction: ltr;
    line-height: 28px;
    background: rgb(41, 42, 47);
}

/* 🎨 Padding */

.CodeMirror-lines {
    padding: 15px 0; /* Vertical padding around content */
}
.CodeMirror pre {
    padding: 0 6px; /* Horizontal padding of content */
}

/* 🎨 Active line */

.CodeMirror-activeline {
    background: rgba( 255, 255, 255, 0.05 );
}
.CodeMirror-activeline .CodeMirror-gutter-background {
    background: rgba( 255, 255, 255, 0.05 );
}
.CodeMirror-activeline .CodeMirror-linenumber {
    color: rgb(170, 170, 170);
}

/* 🎨 Scroll bars */

.CodeMirror-simplescroll-horizontal div,
.CodeMirror-simplescroll-vertical div {
  position: absolute;
  background: rgba( 80, 80, 80 );
  border-radius: 2px;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.15s;
}

.CodeMirror-simplescroll-horizontal div:active,
.CodeMirror-simplescroll-vertical div:active,
.CodeMirror-simplescroll-horizontal div:hover,
.CodeMirror-simplescroll-vertical div:hover {
  opacity: 0.9;
}

.CodeMirror-simplescroll-horizontal,
.CodeMirror-simplescroll-vertical {
  position: absolute;
  z-index: 6;
  background: none;
}

.CodeMirror-simplescroll-horizontal {
  bottom: 0; left: 0;
  height: 16px;
}
.CodeMirror-simplescroll-horizontal div {
  bottom: 0;
  height: 8px;
  margin-bottom: 4px;
  margin-left: 4px;
}

.CodeMirror-simplescroll-vertical {
  right: 0; top: 0;
  width: 16px;
}
.CodeMirror-simplescroll-vertical div {
  right: 0;
  width: 8px;
  margin-right: 4px;
  margin-top: 4px;
}

.CodeMirror-scrollbar-filler,
.CodeMirror-gutter-filler {
    display: none; /* The little square between H and V scrollbars */
}

/* 🎨 Gutters */

.CodeMirror-gutters {
    left: 0; /* ⚠️ sacar y ver si no se arregla con PADDING 👆🏼 */
    border: none;
    background: rgb(41, 42, 47);
    white-space: nowrap;
}

.CodeMirror-linenumber {
    padding: 0 3px 0 5px;
    min-width: 20px;
    font-family: IBM Plex Sans;
    font-size: 14px;
    text-align: right;
    color: rgb(95, 95, 95);
    white-space: nowrap;
}

.CodeMirror-foldgutter {
    width: 15px;
}
.CodeMirror-foldgutter-open,
.CodeMirror-foldgutter-folded {
    cursor: pointer;
    font-size: 20px;
    color: rgb(150, 150, 150);
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
    background: royalblue;
    color: white;
    transition: all 0.1s;
}
.CodeMirror-foldmarker:hover {
    filter: brightness(1.2);
}

.CodeMirror-markers {
    width: 22px;
}
.CodeMirror-marker-error,
.CodeMirror-marker-warning {
    position: relative;
    width: 20px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: end;
}
.CodeMirror-marker-error::before {
    display: block;
    position: absolute;
    left: 6px;
    width: 14px;
    height: 14px;
    content: "";
    mask: url("../assets/icons/error.svg");
    mask-size: cover;
    background: rgb(255, 59, 48);
}
.CodeMirror-marker-warning::before {
    display: block;
    position: absolute;
    left: 6px;
    width: 15px;
    height: 13px;
    content: "";
    mask: url("../assets/icons/warning.svg");
    mask-size: cover;
    background: orange;
}

.CodeMirror-marker-tooltip {
    display: block;
    margin: 0;
    padding: 2px 10px 4px 8px;
    list-style: none;
    position: absolute;
    pointer-events: none;
    left: 66px;
    top: calc(100% + 2px);
    width: fit-content;
    height: fit-content;
    background: rgb( 50, 50, 50 );
    color: white;
    font-family: IBM Plex Sans;
    font-size: 13px;
    letter-spacing: 0.05em;
    line-height: 21px;
    border-radius: 6px;
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    /* box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1); */
    box-sizing: border-box;
    border: 1px solid rgb( 30, 30, 30 );
    opacity: 0;
    transform: translateY( -2px );
    transition: all 0.1s;
}
.CodeMirror-marker-tooltip.visible {
    opacity: 1;
    transform: none;
}
.CodeMirror-marker-tooltip > li {
    display: flex;
    align-items: center;
    white-space: nowrap;
}

.CodeMirror-marker-error .CodeMirror-marker-tooltip > li::before,
.CodeMirror-marker-warning .CodeMirror-marker-tooltip > li::before {
    content: "•";
    font-size: 20px;
    margin-right: 6px;
    padding-bottom: 1px;
}
.CodeMirror-marker-error .CodeMirror-marker-tooltip > li::before {
    color: rgb(255, 59, 48);
}
.CodeMirror-marker-warning .CodeMirror-marker-tooltip > li::before {
    color: orange;
}

/* 🎨 Cursor */

.CodeMirror-cursor {
    border-left: 2px solid white;
    width: 0;
}

.cm-tab { display: inline-block; text-decoration: inherit; }

/* 🎨 Matching brackets */

div.CodeMirror span.CodeMirror-matchingbracket {
    color: white;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    padding: 2px 0px;
    font-weight: bold;
}

/* 🎨 Selection */

.CodeMirror-selected {
    background: rgba( 255, 255, 255, 0.1);
}

/* 🎨 Hints Widget */

.CodeMirror-hints {
    position: fixed;
    transform: translateX( -36px );
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 350px;
    transition: opacity 0.1s;
}
.CodeMirror-hints.closing {
    opacity: 0;
}

.CodeMirror-hints-list-container {
    max-height: 10.5rem;
    overflow: auto;
    border-radius: 6px;
    background: rgb( 50, 50, 50 );
    border: 1px solid rgb( 30, 30, 30 );
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
    z-index: 1;
}
.CodeMirror-hints.docs-visible > .CodeMirror-hints-list-container {
    border-radius: 0 0 6px 6px;
}
.CodeMirror-hints.docs-visible.below > .CodeMirror-hints-list-container {
    border-radius: 6px 6px 0 0;
    z-index: 0;
}

.CodeMirror-hints-list {
    list-style: none;

    margin: 0;
    padding: 0;

    min-height: fit-content;
    min-width: fit-content;
}

.CodeMirror-hint-active-docs {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    height: fit-content;
    max-height: 80px;
    overflow-y: scroll;
    padding: 4px 8px;
    user-select: none;
    background: rgb(70, 70, 70);
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    border: 1px solid rgb( 30, 30, 30 );
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    box-sizing: border-box;
    color: white;
    font-family: IBM Plex Sans;
    font-size: 13px;
    letter-spacing: 0.05em;
    z-index: 0;
}
.CodeMirror-hints.below > .CodeMirror-hint-active-docs {
    top: 100%;
    border-radius: 0 0 6px 6px;
    border: 1px solid rgb( 30, 30, 30 );
    border-top: none;
    z-index: 1;
}
.CodeMirror-hints.docs-visible > .CodeMirror-hint-active-docs {
    display: block;
}

.CodeMirror-hint {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 6px 8px;
    white-space: nowrap;
    cursor: pointer;
}
.CodeMirror-hint:hover {
    background: rgba(65, 105, 225, 0.2);
}

.CodeMirror-hint .display-text {
    color: white;
}
.CodeMirror-hint .display-text b {
    /* font-weight: bold; */
    padding: 1px 0;
    font-weight: 700;
    background-color: rgba(255, 217, 0, 0.2);
    text-decoration: underline solid orange;
    border-radius: 2px;
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
    text-decoration: underline solid rgba( 255, 255, 255, 0.5);
}

.CodeMirror-hint .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-right: 10px;
    border-radius: 3px;
    border: 1px solid transparent;
    background: transparent;
    position: relative;
    font-weight: 500;
}

/* 🎨 Hint Types */

.CodeMirror-hint.function .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(149, 211, 149);
    border-color: rgb(85, 168, 85);
}
.CodeMirror-hint.function .icon::before {
    content: "f";
    color: rgb(21, 112, 21);
    font-family: IBM Plex Mono;
    font-size: 12px;
    font-style: italic;
    font-weight: 600;
    padding-bottom: 1px;
}

.CodeMirror-hint.local-identifier .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(223, 226, 230);
    border-color: rgb(166, 171, 179);
}
.CodeMirror-hint.local-identifier .icon::before {
    display: inline-block;
    width: 16px;
    height: 16px;
    content: "";
    mask: url("../assets/icons/local.svg");
    mask-size: cover;
    background-color: rgb(105, 117, 133);
}

.CodeMirror-hint.preprocessor .icon,
.CodeMirror-hint.macro .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(252, 209, 129);
    border-color: rgb(241, 157, 1);
}
.CodeMirror-hint.preprocessor .icon::before,
.CodeMirror-hint.macro .icon::before {
    color: rgb(139, 91, 2);
}
.CodeMirror-hint.preprocessor .icon::before {
    content: "#";
    font-family: IBM Plex Mono;
    font-size: 14px;
}
.CodeMirror-hint.macro .icon::before {
    content: "M";
    font-family: IBM Plex Sans;
    font-size: 12px;
}

.CodeMirror-hint.type .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: wheat;
    border-color: tan;
}
.CodeMirror-hint.type .icon::before {
    content: "T";
    color: sienna;
    font-family: IBM Plex Sans;
    font-size: 12px;
}

.CodeMirror-hint.storage-qualifier .icon,
.CodeMirror-hint.parameter-qualifier .icon,
.CodeMirror-hint.precision-qualifier .icon,
.CodeMirror-hint.invariance-qualifier .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(247, 207, 207);
    border-color: rgb(240, 159, 159);
}
.CodeMirror-hint.storage-qualifier .icon::before,
.CodeMirror-hint.parameter-qualifier .icon::before,
.CodeMirror-hint.precision-qualifier .icon::before,
.CodeMirror-hint.invariance-qualifier .icon::before {
    color: rgb(189, 66, 66);
    font-family: IBM Plex Sans;
    font-size: 12px;
}
.CodeMirror-hint.storage-qualifier .icon::before {
    content: "S";
}
.CodeMirror-hint.parameter-qualifier .icon::before {
    content: "Pa";
    font-size: 11px;
}
.CodeMirror-hint.precision-qualifier .icon::before {
    content: "Pr";
    font-size: 11px;
}
.CodeMirror-hint.invariance-qualifier .icon::before {
    content: "I";
}

.CodeMirror-hint.variable .icon,
.CodeMirror-hint.constant .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: lightblue;
    border-color: rgb(134, 158, 230);
}
.CodeMirror-hint.variable .icon::before,
.CodeMirror-hint.constant .icon::before {
    color: royalblue;
    font-family: IBM Plex Sans;
    font-size: 12px;
}
.CodeMirror-hint.variable .icon::before {
    content: "V";
}
.CodeMirror-hint.constant .icon::before {
    content: "C";
}

.CodeMirror-hint.iteration .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(167, 152, 255);
    border-color: rgb(127, 115, 192);
}
.CodeMirror-hint.iteration .icon::before {
    display: inline-block;
    width: 16px;
    height: 16px;
    content: "";
    mask: url("../assets/icons/iteration.svg");
    mask-size: cover;
    background-color: rgb(74, 65, 129);
}

.CodeMirror-hint.selection .icon {
    box-shadow:0 0 0 1px rgba( 0, 0, 0, 0.3 );
    background: rgb(167, 152, 255);
    border-color: rgb(127, 115, 192);
}
.CodeMirror-hint.selection .icon::before {
    display: inline-block;
    width: 15px;
    height: 15px;
    content: "";
    mask: url("../assets/icons/selection.svg");
    mask-size: cover;
    background-color: rgb(55, 47, 104);
}

/* Errors & Warnings */

.CodeMirror-markedline-error {
    background: rgba(255, 59, 48, 0.12);
}
.CodeMirror-markedline-error .CodeMirror-gutter-background {
    background: rgba(255, 59, 48, 0.12);
}
.CodeMirror-markedline-error .CodeMirror-linenumber {
    color: rgba(252, 91, 82, 0.5);
}

.CodeMirror-activeline.CodeMirror-markedline-error {
    background: rgba(255, 59, 48, 0.2);
}
.CodeMirror-activeline.CodeMirror-markedline-error .CodeMirror-gutter-background {
    background: rgba(255, 59, 48, 0.2);
}
.CodeMirror-activeline.CodeMirror-markedline-error .CodeMirror-linenumber{
    color: rgba(252, 91, 82, 0.7);
}

.CodeMirror-markedline-warning {
    background: rgba(255, 166, 0, 0.1);
}
.CodeMirror-markedline-warning .CodeMirror-gutter-background {
    background: rgba(255, 166, 0, 0.1);
}
.CodeMirror-markedline-warning .CodeMirror-linenumber {
    color: rgba(255, 166, 0, 0.6);
}

.CodeMirror-activeline.CodeMirror-markedline-warning {
    background: rgba(255, 166, 0, 0.15);

}
.CodeMirror-activeline.CodeMirror-markedline-warning .CodeMirror-gutter-background {
    background: rgba(255, 166, 0, 0.15);
}
.CodeMirror-activeline.CodeMirror-markedline-warning .CodeMirror-linenumber{
    color: rgba(255, 166, 0, 1);
}

/* 🎨 Color scheme */

.cm-s-default .cm-keyword { color: rgb(239, 113, 168); font-weight: 500; }
.cm-s-default .cm-type { color: rgb(117, 180, 146); }
.cm-s-default .cm-atom { color: rgb(239, 113, 168); font-style: italic; font-weight: 600; }
.cm-s-default .cm-meta { color: rgb(122, 201, 175); }
.cm-s-default .cm-builtin { color: rgb(145, 212, 98); }
.cm-s-default .cm-identifier { color: white; }
.cm-s-default .cm-attribute { color: rgb(200, 200, 200); font-style: italic; }
.cm-s-default .cm-number { color: rgb(167, 152, 255); }
.cm-s-default .cm-boolean { color: rgb(167, 152, 255); }
.cm-s-default .cm-punctuation { color: rgb(100, 100, 100); }
.cm-s-default .cm-operator { color: rgb(150, 150, 150) }
.cm-s-default .cm-bracket { color: rgb(150, 150, 150); }
.cm-s-default .cm-comment { color: rgb(108, 121, 134); font-style: italic; }

.CodeMirror-composing { border-bottom: 2px solid; }

/* 🎨 Uniforms */

.cm-identifier.uniform,
.cm-punctuation.uniform,
.cm-attribute.uniform {
    text-decoration: underline solid;
    text-decoration-color: gray;
}

/* 🎨 Uniforms buttons */

.uniform-button,
.uniform-signal {
    position: relative;
    padding: 2px 0px;
    cursor: pointer;
    user-select: none;
}
.uniform-button *,
.uniform-signal * {
    pointer-events: none;
}
.uniform-button::after,
.uniform-signal::after {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    border-radius: 4px;
    transition: background 0.1s;
    z-index: -1;
}
.uniform-button:hover::after,
.uniform-signal::after {
    background: rgba(100, 148, 237, 0.3);
}

.uniform-signal {
    cursor: default;
}
.uniform-signal::after {
    opacity: 0;
    animation-name: pulse;
    animation-duration: 0.7s;
    animation-timing-function: cubic-bezier(0.2, 0.045, 0.355, 1);
    animation-iteration-count: 1;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0;
    }
    50% {
        opacity: 1;
    }
}

/* 🛑 Do not change */

/* The rest of this file contains styles related to the mechanics of
the editor. You probably shouldn't touch them. */

.CodeMirror-scroll {
    overflow: scroll !important; /* Things will break if this is overridden */
    /* 30px is the magic margin used to hide the element's real scrollbars */
    /* See overflow: hidden in .CodeMirror */
    margin-bottom: -30px; margin-right: -30px;
    padding-bottom: 30px;
    height: 100%;
    outline: none; /* Prevent dragging from highlighting the element */
    position: relative;
}
.CodeMirror-sizer {
    position: relative;
    border-right: 30px solid transparent;
}

/* The fake, visible scrollbars. Used to force redraw during scrolling
before actual scrolling happens, thus preventing shaking and
flickering artifacts. */
.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
    position: absolute;
    z-index: 6;
    display: none;
}
.CodeMirror-vscrollbar {
    right: 0; top: 0;
    overflow-x: hidden;
    overflow-y: scroll;
}
.CodeMirror-hscrollbar {
    bottom: 0; left: 0;
    overflow-y: hidden;
    overflow-x: scroll;
}
.CodeMirror-scrollbar-filler {
    right: 0; bottom: 0;
}
.CodeMirror-gutter-filler {
    left: 0; bottom: 0;
}

.CodeMirror-gutters {
    position: absolute; left: 0; top: 0;
    min-height: 100%;
    z-index: 3;
}
.CodeMirror-gutter {
    white-space: normal;
    height: 100%;
    display: inline-block;
    vertical-align: top;
    margin-bottom: -30px;
}
.CodeMirror-gutter-wrapper {
    position: absolute;
    z-index: 4;
    background: none !important;
    border: none !important;
}
.CodeMirror-gutter-background {
    position: absolute;
    top: 0; bottom: 0;
    z-index: 4;
}
.CodeMirror-gutter-elt {
    position: absolute;
    cursor: default;
    z-index: 4;
}
.CodeMirror-gutter-wrapper ::selection { background-color: transparent }
.CodeMirror-gutter-wrapper ::-moz-selection { background-color: transparent }

.CodeMirror-lines {
    cursor: text;
    min-height: 1px; /* prevents collapsing before first draw */
}
.CodeMirror pre {
    /* Reset some styles that the rest of the page might have set */
    -moz-border-radius: 0; -webkit-border-radius: 0; border-radius: 0;
    border-width: 0;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
    margin: 0;
    white-space: pre;
    word-wrap: normal;
    line-height: inherit;
    color: inherit;
    z-index: 2;
    position: relative;
    overflow: visible;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-variant-ligatures: contextual;
    font-variant-ligatures: contextual;
}
.CodeMirror-wrap pre {
    word-wrap: break-word;
    white-space: pre-wrap;
    word-break: normal;
}

.CodeMirror-linebackground {
    position: absolute;
    left: 0; right: 0; top: 0; bottom: 0;
    z-index: 0;
}

.CodeMirror-linewidget {
    position: relative;
    z-index: 2;
    padding: 0.1px; /* Force widget margins to stay inside of the container */
}

.CodeMirror-rtl pre { direction: rtl; }

.CodeMirror-code {
    outline: none;
}

/* Force content-box sizing for the elements where we expect it */
.CodeMirror-scroll,
.CodeMirror-sizer,
.CodeMirror-gutter,
.CodeMirror-gutters,
.CodeMirror-linenumber {
    -moz-box-sizing: content-box;
    box-sizing: content-box;
}

.CodeMirror-measure {
    position: absolute;
    width: 100%;
    height: 0;
    overflow: hidden;
    visibility: hidden;
}

.CodeMirror-cursor {
    position: absolute;
    pointer-events: none;
}
.CodeMirror-measure pre { position: static; }

div.CodeMirror-cursors {
    visibility: hidden;
    position: relative;
    z-index: 3;
}
div.CodeMirror-dragcursors {
    visibility: visible;
}

.CodeMirror-focused div.CodeMirror-cursors {
    visibility: visible;
}

.CodeMirror-crosshair { cursor: crosshair; }
.CodeMirror-line::selection, .CodeMirror-line > span::selection, .CodeMirror-line > span > span::selection { background: #d7d4f0; }
.CodeMirror-line::-moz-selection, .CodeMirror-line > span::-moz-selection, .CodeMirror-line > span > span::-moz-selection { background: #d7d4f0; }

.cm-searching {
    background-color: rgba(255, 255, 0, .4);
}

/* Used to force a border model for a node */
.cm-force-border { padding-right: .1px; }

@media print {
    /* Hide the cursor when printing */
    .CodeMirror div.CodeMirror-cursors {
        visibility: hidden;
    }
}

/* See issue #2901 */
.cm-tab-wrap-hack:after { content: ''; }

/* Help users use markselection to safely style text background */
span.CodeMirror-selectedtext { background: none; }

</style>
