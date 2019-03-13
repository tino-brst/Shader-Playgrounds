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
import { EventBus } from "@/event-bus"
import { mapState, mapGetters } from "vuex"
import Tooltip from "@/components/Tooltip.vue"
import UniformsEditors from "@/components/uniforms_editors/UniformsEditors.ts"
import { ShaderType, ShaderVariableType } from "@/scripts/renderer/_constants"
import Shader, { ShaderLog } from "@/scripts/editor/Shader"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
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

import sampleVertex from "@/sample_shaders/textures.vert.glsl"
import sampleFragment from "@/sample_shaders/textures.frag.glsl"
import { EditorState } from "@/store"

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
        "v-uniform-editor-float": UniformsEditors.float,
        "v-uniform-editor-vec2": UniformsEditors.vec2,
        "v-uniform-editor-vec3": UniformsEditors.vec3,
        "v-uniform-editor-vec4": UniformsEditors.vec4,
        "v-uniform-editor-sampler2D": UniformsEditors.sampler2D,
        "v-uniform-editor-others": UniformsEditors.others
    },
    props: {
        activeShader: {
            type: String,
            default: ShaderType.Vertex
        }
    },
    data: () => ( {
        editor: {} as Editor,
        changeDetectionEnabled: false,
        vertexShader: new Shader( ShaderType.Vertex ),
        fragmentShader: new Shader( ShaderType.Fragment ),
        noShaderChangesSinceToolsEnabled: false,
        lastUniformSelected: {} as Uniform,
        tooltipTarget: document.createElement( "span" ) as HTMLElement,
        tooltipVisible: false
    } ),
    computed: {
        editorTypeComponent(): string {
            if ( this.lastUniformSelected.editor ) {
                let component = "v-uniform-editor-"
                switch ( this.lastUniformSelected.editor.type ) {
                    case ShaderVariableType.float: {
                        component += "float"
                        break
                    }
                    case ShaderVariableType.vec2: {
                        component += "vec2"
                        break
                    }
                    case ShaderVariableType.vec3: {
                        component += "vec3"
                        break
                    }
                    case ShaderVariableType.vec4: {
                        component += "vec4"
                        break
                    }
                    case ShaderVariableType.sampler2D: {
                        component += "sampler2D"
                        break
                    }
                    default: {
                        component += "others"
                        break
                    }
                }
                return component
            } else {
                return ""
            }
        },
        ...mapState( [ "editorState", "vertexLog", "fragmentLog", "uniformsEditors" ] )
    },
    watch: {
        activeShader() {
            // cierro code-hints, tooltips, etc en caso de estar activas
            if ( this.editor.state.completionActive ) {
                this.editor.state.completionActive.close()
            }
            if ( this.tooltipVisible ) {
                this.hideTooltip()
            }

            // hago cambio de shader
            const activeShader = ( this.activeShader === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader
            this.editor.swapDoc( activeShader.doc )

            // after a successfull compilation the uniforms editors should be enabled when switching tabs
            if ( this.noShaderChangesSinceToolsEnabled ) {
                // @ts-ignore
                activeShader.enableUniformsTools( this.uniformsEditors, this.onUniformClick, this.onUniformDoubleClick, this.editor )
            }
        },
        vertexLog( newLog: ShaderLog ) {
            this.vertexShader.setLog( newLog )
        },
        fragmentLog( newLog: ShaderLog ) {
            this.fragmentShader.setLog( newLog )
        },
        uniformsEditors() {
            const activeShader = ( this.activeShader === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader

            // @ts-ignore
            if ( this.uniformsEditors.length > 0 ) {
                // @ts-ignore
                activeShader.enableUniformsTools( this.uniformsEditors, this.onUniformClick, this.onUniformDoubleClick, this.editor )
                this.noShaderChangesSinceToolsEnabled = true

                window.addEventListener( "blur", this.hideTooltip )

                this.editor.on( "change", () => {
                    this.vertexShader.disableUniformsTools()
                    this.fragmentShader.disableUniformsTools()
                    this.noShaderChangesSinceToolsEnabled = false

                    window.removeEventListener( "blur", this.hideTooltip )
                } )
            } else {
                activeShader.disableUniformsTools()
                window.removeEventListener( "blur", this.hideTooltip )
            }
        }
    },
    mounted() {
        const editorOptions = {
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
        }

        this.editor = CodeMirror( this.$refs.editor as HTMLElement, editorOptions )
        this.editor.on( "keydown", this.handleShowHints )
        this.editor.focus()

        EventBus.$on( "commitShadersCode", this.commitShadersCode )
        EventBus.$on( "commitState", this.commitState )
        EventBus.$on( "loadState", this.loadState )
    },
    methods: {
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
        handleClicksOutsideTooltip( event: MouseEvent ) {
            const clickableArea = ( this.$refs.tooltip as Vue ).$el as Element
            if ( clickableArea && ! clickableArea.contains( event.target as Node ) ) {
                this.hideTooltip()
            }
        },
        showTooltip( target: HTMLElement ) {
            this.tooltipTarget = target
            this.tooltipVisible = true

            document.addEventListener( "mousedown", this.handleClicksOutsideTooltip )
            this.editor.on( "scroll", this.hideTooltip )
        },
        hideTooltip() {
            this.tooltipVisible = false
            document.removeEventListener( "mousedown", this.handleClicksOutsideTooltip )
            this.editor.off( "scroll", this.hideTooltip )
        },
        onUniformClick( target: HTMLElement, editor: UniformEditor, range: Range ) {
            if ( ( this.lastUniformSelected.range !== range ) || ( this.lastUniformSelected.range === range && ! this.tooltipVisible ) ) {
                this.lastUniformSelected = { range, editor }
                this.showTooltip( target )
            }
        },
        onUniformDoubleClick( event: MouseEvent ) {
            // 🤔 this shouldn't be necessary, but when doing a "slow" double-click the tooltip sometimes shows-up
            this.hideTooltip()

            // disable all uniforms buttons (as any change on the shaders)
            const activeShader = ( this.activeShader === ShaderType.Vertex ) ? this.vertexShader : this.fragmentShader
            activeShader.disableUniformsTools()

            // set cursor on clicked position and return focus to the editor
            const clickedPosition = this.editor.coordsChar( { top: event.clientY, left: event.clientX }, "window" )
            activeShader.doc.setCursor( clickedPosition )
            this.editor.focus()
        },
        commitShadersCode() {
            const vertex = this.vertexShader.getValue()
            const fragment = this.fragmentShader.getValue()

            this.$store.commit( "updateShadersCode", { vertex, fragment } )
        },
        commitState() {
            const editorState: EditorState = {
                vertex: this.vertexShader.getValue(),
                fragment: this.fragmentShader.getValue(),
                activeShader: this.activeShader as ShaderType
            }

            this.$store.commit( "updateEditorState", editorState )
            this.enableChangeDetection()
        },
        loadState() {
            // @ts-ignore
            this.vertexShader.setValue( this.editorState.vertex )
            // @ts-ignore
            this.fragmentShader.setValue( this.editorState.fragment )

            this.enableChangeDetection()
        },
        enableChangeDetection() {
            // evito registrar muchas veces el mismo evento
            if ( ! this.changeDetectionEnabled ) {
                // ante cualquier cambio en el editor, marco su estado como "dirty" para reflejar cambios sin guardar en el archivo
                this.editor.on( "change", this.markEditorDirty )
                this.changeDetectionEnabled = true
            }
        },
        markEditorDirty() {
            this.$store.commit( "markEditorDirty" )
            this.editor.off( "change", this.markEditorDirty )
            this.changeDetectionEnabled = false
        }
    }
} )
</script>

<style src="@/styles/editor.css" />
