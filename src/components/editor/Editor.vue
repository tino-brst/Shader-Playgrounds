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
import { LogEntryType, ShaderType, Log, UniformEditor, ShaderLog } from "../../App.vue"
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
import { mapState } from "vuex"

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
        uniformsEditors: {
            type: Array as () => UniformEditor[],
            default: () => []
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
        ...mapState( [ "vertexLog", "fragmentLog" ] )
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

<style src="./codemirror/theme/dark.css"></style>
