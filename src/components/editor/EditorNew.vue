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
import Tooltip from "./Tooltip.vue"
import UniformEditorOthers from "./UniformEditorOthers.vue"
import UniformEditorFloat from "./UniformEditorFloat.vue"
import { LogEntryType, ShaderType, Log, UniformEditor } from "../../App.vue"
import Shader from "./Shader"
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

const TOOLS_KEY = "Alt"

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
        },
        log: {
            type: Object as () => Log,
            default: null
        },
        uniformsEditors: {
            type: Array as () => UniformEditor[],
            default: () => []
        }
    },
    data: () => ( {
        editor: {} as Editor,
        vertexShader: new Shader(),
        fragmentShader: new Shader(),
        uniforms: [] as Uniform[],
        uniformsMarkers: [] as TextMarker[],
        uniformsButtons: [] as HTMLElement[],
        uniformsButtonsMarkers: [] as TextMarker[],
        uniformsButtonsEnabled: false,
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
    watch: {
        activeShader( newValue: ShaderType ) {
            // cierro code-hints si estan activas ( ⚠️ hacer lo mismo para tooltips, etc )
            if ( this.editor.state.completionActive ) {
                this.editor.state.completionActive.close()
            }

            // hago cambio de shader
            if ( newValue === ShaderType.Vertex ) {
                this.editor.swapDoc( this.vertexShader.doc )
            } else {
                this.editor.swapDoc( this.fragmentShader.doc )
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
        log( newLog: Log ) {
            this.vertexShader.setLog( this.log.vertex )
            this.fragmentShader.setLog( this.log.fragment )

            if ( this.vertexShader.hasErrors() || this.fragmentShader.hasErrors() ) {
                this.vertexShader.showErrors()
                this.fragmentShader.showErrors()
            } else if ( this.vertexShader.hasWarnings() || this.fragmentShader.hasWarnings() ) {
                this.vertexShader.showWarnings()
                this.fragmentShader.showWarnings()
            }
        }
        // uniformsEditors( newEditors: UniformEditor[] ) {
        //     this.unmarkUniforms()
        //     this.tooltipVisible = false
        //     if ( this.uniformsEditors.length > 0 ) {
        //         this.scanForUniforms()
        //         this.markUniforms()
        //         this.flashUniformsButtons()
        //         window.addEventListener( "keydown", this.handleToolsKey )
        //         window.addEventListener( "keyup", this.handleToolsKey )
        //         window.addEventListener( "blur", this.disableUniformsButtons )
        //         this.editor.on( "change", () => {
        //             this.unmarkUniforms()
        //             window.removeEventListener( "keydown", this.handleToolsKey )
        //             window.removeEventListener( "keyup", this.handleToolsKey )
        //             window.removeEventListener( "blur", this.disableUniformsButtons )
        //         } )
        //     }
        // }
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
        }
        // scanForUniforms() {
        //     const uniformsEditors: Map <string, UniformEditor> = new Map()
        //     const uniformsNames: Array <string> = []

        //     for ( let editor of this.uniformsEditors ) {
        //         // mapa para acceso rapido de editores
        //         uniformsEditors.set( editor.target, editor )
        //         // nombres de uniforms desarmados:
        //         //  • "viewMatrix"     -> [ "viewMatrix" ]
        //         //  • "light.position" -> [ "light", "position" ]
        //         uniformsNames.push( editor.target )
        //     }

        //     // los separo en "basicos" y "estructuras" (con sus componentes)
        //     const basic: string[] = [] // [ "viewMatrix", ... ]
        //     const structs: Map < string, string[] > = new Map() // "light" -> [ "position", "color", ... ]

        //     for ( let name of uniformsNames ) {
        //         const nameParts = name.split( "." )
        //         if ( nameParts.length === 1 ) {
        //             // [ "viewMatrix" ]
        //             const identifier = nameParts[ 0 ]
        //             basic.push( identifier )
        //         } else {
        //             // [ "light", "position" ]
        //             const structIdentifier = nameParts[ 0 ]
        //             const structAttribute = nameParts[ 1 ]
        //             const structAttributes = structs.get( structIdentifier )
        //             if ( structAttributes !== undefined ) {
        //                 structAttributes.push( structAttribute )
        //             } else {
        //                 structs.set( structIdentifier, [ structAttribute ] )
        //             }
        //         }
        //     }

        //     // encuentro los rangos en el codigo que ocupan los uniforms
        //     this.uniforms = []
        //     const lineCount = this.document.lineCount()

        //     for ( let lineNumber = 0; lineNumber < lineCount; lineNumber ++ ) {
        //         const lineTokens = this.editor.getLineTokens( lineNumber )
        //         for ( let tokenNumber = 0; tokenNumber < lineTokens.length; tokenNumber ++ ) {
        //             const token = lineTokens[ tokenNumber ]
        //             if ( token.type === "identifier" ) {
        //                 if ( basic.includes( token.string ) ) {
        //                     const from: Position = { line: lineNumber, ch: token.start }
        //                     const to: Position   = { line: lineNumber, ch: token.end }
        //                     const range = { from, to }
        //                     const editor = uniformsEditors.get( token.string ) as UniformEditor
        //                     this.uniforms.push( { range, editor } )
        //                 } else {
        //                     const structComponents = structs.get( token.string )
        //                     if ( structComponents !== undefined ) {
        //                         const possibleAttribute = lineTokens[ tokenNumber + 2 ] // [ ... "light", ".", >"position"< ... ]
        //                         if ( possibleAttribute && possibleAttribute.type === "attribute" && structComponents.includes( possibleAttribute.string ) ) {
        //                             const from: Position = { line: lineNumber, ch: token.start }
        //                             const to: Position   = { line: lineNumber, ch: possibleAttribute.end }
        //                             const range = { from, to }
        //                             const editor = uniformsEditors.get( token.string + "." + possibleAttribute.string ) as UniformEditor
        //                             this.uniforms.push( { range, editor } )
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // markUniforms() {
        //     this.uniformsMarkers = []
        //     for ( let { range } of this.uniforms ) {
        //         this.uniformsMarkers.push( this.document.markText( range.from, range.to, { className: "uniform" } ) )
        //     }
        // },
        // unmarkUniforms() {
        //     for ( let marker of this.uniformsMarkers ) {
        //         marker.clear()
        //     }
        // },
        // enableUniformsButtons() {
        //     if ( ! this.uniformsButtonsEnabled ) {
        //         this.uniformsButtons = []
        //         this.uniformsButtonsMarkers = []
        //         this.uniformsButtonsEnabled = true

        //         for ( let { range, editor } of this.uniforms ) {
        //             const splitUniformName = editor.target.split( "." )

        //             const uniformButton = document.createElement( "span" )
        //             uniformButton.className = "uniform-button"
        //             uniformButton.innerHTML = `<span class="cm-identifier uniform">${ splitUniformName[ 0 ] }</span>`
        //             uniformButton.innerHTML += splitUniformName[ 1 ] ? `<span class="cm-punctuation uniform">.</span><span class="cm-attribute uniform">${ splitUniformName[ 1 ] }</span>` : ""
        //             uniformButton.addEventListener( "click", event => this.handleUniformClick( uniformButton, editor, range ) )

        //             this.uniformsButtons.push( uniformButton )
        //             this.uniformsButtonsMarkers.push( this.document.markText( range.from, range.to, { replacedWith: uniformButton } ) )
        //         }
        //     }
        // },
        // disableUniformsButtons() {
        //     for ( let button of this.uniformsButtonsMarkers ) {
        //         button.clear()
        //     }
        //     this.uniformsButtonsEnabled = false
        // },
        // flashUniformsButtons() {
        //     this.enableUniformsButtons()
        //     for ( let button of this.uniformsButtons ) {
        //         button.classList.add( "flash" )
        //     }
        //     setTimeout( () => this.disableUniformsButtons(), 700 )
        // },
        // handleToolsKey( event: KeyboardEvent ) {
        //     if ( event.key === TOOLS_KEY ) {
        //         if ( event.type === "keydown" ) {
        //             this.enableUniformsButtons()
        //         } else {
        //             this.disableUniformsButtons()
        //         }
        //     }
        // },
        // handleUniformClick( target: HTMLElement, editor: UniformEditor, range: Range ) {
        //     if ( ( this.lastUniformSelected.range !== range ) || ( this.lastUniformSelected.range === range && ! this.tooltipVisible ) ) {
        //         this.lastUniformSelected = { range, editor }
        //         this.showTooltip( target )
        //     }
        // },
        // handleClicksOutside( event: MouseEvent ) {
        //     const clickableArea = ( this.$refs.tooltip as Vue ).$el as Element
        //     if ( clickableArea && ! clickableArea.contains( event.target as Node ) && ! this.uniformsButtons.includes( event.target as HTMLElement ) ) {
        //         this.hideTooltip()
        //     }
        // },
        // handleScroll() {
        //     this.hideTooltip()
        // },
        // showTooltip( target: HTMLElement ) {
        //     this.tooltipTarget = target
        //     this.tooltipVisible = true

        //     document.addEventListener( "mousedown", this.handleClicksOutside )
        //     this.editor.on( "scroll", this.handleScroll )
        // },
        // hideTooltip() {
        //     this.tooltipVisible = false
        //     document.removeEventListener( "mousedown", this.handleClicksOutside )
        //     this.editor.off( "scroll", this.handleScroll )
        // }
    }
} )
</script>

<style src="./codemirror/theme/dark.css"></style>
