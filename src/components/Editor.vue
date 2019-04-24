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
import { ShaderView, ShaderLog, UniformRange, Range } from "@/scripts/editor/ShaderView"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import CodeMirror, { LineHandle, Editor, Doc, TextMarker, EditorChange, Position } from "@/scripts/editor/codemirror/lib/codemirror"
import { focusOnNextPlaceholder, focusOnPreviousPlaceholder, isPlaceholderMarker } from "@/scripts/editor/codemirror/addon/hint/placeholder"
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
import "@/scripts/editor/codemirror/addon/comment/comment"
import "@/scripts/editor/codemirror/keymap/sublime"

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
    data: () => ( {
        editor: {} as Editor,
        vertexView: new ShaderView( ShaderType.Vertex ) as ShaderView,
        fragmentView: new ShaderView( ShaderType.Fragment ) as ShaderView,
        supportedUniformsTypes: new Set( Object.keys( UniformsEditors ) ),
        toolsEnabled: false,
        noShaderChangesSinceToolsEnabled: false,
        lastUniformSelected: {} as UniformRange,
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
        activeShaderView(): ShaderView {
            // @ts-ignore
            return ( this.activeShader === ShaderType.Vertex ) ? this.vertexView : this.fragmentView
        },
        supportedUniformsEditors(): UniformEditor[] {
            // @ts-ignore
            return this.uniformsEditors.filter( editor => this.supportedUniformsTypes.has( editor.type ) )
        },
        ...mapState( [
            "activeShader",
            "vertexSource",
            "fragmentSource",
            "vertexLog",
            "fragmentLog",
            "uniformsEditors"
        ] )
    },
    watch: {
        activeShaderView() {
            // close code-hints, tooltips, etc when switching tabs/views
            if ( this.editor.state.completionActive ) {
                this.editor.state.completionActive.close()
            }
            if ( this.tooltipVisible ) {
                this.hideUniformTooltip()
            }

            // swap current editor document ( vertex <-> fragment )
            this.editor.swapDoc( this.activeShaderView.doc )

            // force active-line highlighting when swapping docs (CodeMirror bug)
            this.activeShaderView.doc.setCursor( this.activeShaderView.doc.getCursor() )

            // enable uniforms tools
            if ( this.noShaderChangesSinceToolsEnabled && this.toolsEnabled ) {
                // @ts-ignore
                this.activeShaderView.enableUniformsTools( this.supportedUniformsEditors, this.onUniformClick, this.onUniformDoubleClick )
            }
        },
        vertexLog() {
            // @ts-ignore
            this.vertexView.setLog( this.vertexLog )

            // force editor to show new log markers (CodeMirror bug)
            // @ts-ignore
            const logIsNotEmpty = this.vertexLog.errors.length || this.vertexLog.warnings.length
            if ( this.activeShaderView === this.vertexView && logIsNotEmpty ) {
                this.editor.refresh()
            }
        },
        fragmentLog() {
            // @ts-ignore
            this.fragmentView.setLog( this.fragmentLog )

            // force editor to show new log markers (CodeMirror bug)
            // @ts-ignore
            const logIsNotEmpty = this.fragmentLog.errors.length || this.fragmentLog.warnings.length
            if ( this.activeShaderView === this.fragmentView && logIsNotEmpty ) {
                this.editor.refresh()
            }
        },
        supportedUniformsEditors() {
            // @ts-ignore
            if ( this.supportedUniformsEditors.length > 0 ) {
                this.enableUniformsTools()
                this.activeShaderView.highlightUniformsFound()
            } else {
                this.disableUniformsTools()
            }
        }
    },
    mounted() {
        const editorConfiguration: CodeMirror.EditorConfiguration = {
            value: this.activeShaderView.doc,
            lineNumbers: true,
            indentUnit: 4,
            tabindex: - 1,
            showCursorWhenSelecting: true,
            autofocus: true,
            gutters: [ "CodeMirror-markers", "CodeMirror-linenumbers", "CodeMirror-foldgutter" ],  // define el orden de los items en el margen
            extraKeys: { "Ctrl-Q": "toggleFold", "Ctrl-Space": "autocomplete" },
            keyMap: "sublime",
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            scrollPastEnd: true,
            scrollbarStyle: "simple",
            foldGutter: true,
            foldOptions: { widget: "•••", minFoldSize: 1 },
            hintOptions: { completeSingle: false, alignWithWord: true }
        }

        this.editor = CodeMirror( this.$refs.editor as HTMLElement, editorConfiguration )
        this.editor.on( "keydown", this.handleKeyDown )
        this.editor.on( "changes", this.updateCleanState )

        EventBus.$on( "saveShadersCode", this.saveShadersCode )
        EventBus.$on( "saveState", this.saveState )
        EventBus.$on( "loadState", this.loadState )
    },
    methods: {
        handleKeyDown( editor: Editor, event: KeyboardEvent ) {
            const hintsActive = editor.state.completionActive && editor.state.completionActive.data && editor.state.completionActive.data.list.length
            if ( hintsActive ) return

            const cursor = editor.getCursor()
            const modifiersActive = event.ctrlKey || event.metaKey

            switch ( event.key ) {
                // ➡️ Look for nearby placeholders
                case "Tab":
                    if ( ! editor.somethingSelected() ) {
                        const focusedOnPlaceholder = event.shiftKey ? focusOnPreviousPlaceholder( editor, cursor ) : focusOnNextPlaceholder( editor, cursor )
                        if ( focusedOnPlaceholder ) {
                            event.stopImmediatePropagation()
                            event.preventDefault()
                        }
                    }
                    break
                // 🔠 Show code hints
                default:
                    const token = editor.getTokenAt( cursor )
                    const cursorAtMiddleOfToken = cursor.ch < token.end

                    if ( ! cursorAtMiddleOfToken ) {    // evito que se active al tipear a la mitad de una palabra
                        const modifiersActive = ( event as KeyboardEvent ).ctrlKey || ( event as KeyboardEvent ).metaKey    // evito que Ctrl+C active el autocompletado

                        if ( ! modifiersActive ) {
                            const which = event.which  // codigo de tecla ( a: 65, z: 90, etc )
                            const key = event.key      // character ingresado ( "a", "A", "å", etc )

                            const isLetterKey = ( which >= 65 && which <= 90 )  // si primero no filtrara por teclas correspondientes a letras, la key = "Enter" caeria en el rango "A"..."Z" ( por usar la "E" para la comparacion )
                            const isValidIdentifierLetter = isLetterKey && ( ( key >= "a" && key <= "z" ) || ( key >= "A" && key <= "z" ) )

                            if ( isValidIdentifierLetter || ( key === "_" ) || ( key === "#" ) ) {
                                this.editor.showHint( { trigger: key } )
                            }
                        }
                    }
                    break
            }
        },
        handleClicksOutsideButtonAndTooltip( event: MouseEvent ) {
            const buttonArea = this.tooltipTarget
            const tooltipArea = ( this.$refs.tooltip as Vue ).$el as HTMLElement
            const clickedInsideButtonOrTooltip = tooltipArea.contains( event.target as Node ) || buttonArea.contains( event.target as Node )

            if ( ! clickedInsideButtonOrTooltip ) {
                this.hideUniformTooltip()
            }
        },
        showUniformTooltip( target: HTMLElement ) {
            this.tooltipTarget = target
            this.tooltipVisible = true

            document.addEventListener( "mousedown", this.handleClicksOutsideButtonAndTooltip )
            this.editor.on( "scroll", this.hideUniformTooltip )
        },
        hideUniformTooltip() {
            this.activeShaderView.clearSelectedUniform()
            this.tooltipVisible = false
            document.removeEventListener( "mousedown", this.handleClicksOutsideButtonAndTooltip )
            this.editor.off( "scroll", this.hideUniformTooltip )
        },
        enableUniformsTools() {
            if ( ! this.toolsEnabled ) { // avoid re-registering unnecesary events
                // @ts-ignore
                this.activeShaderView.enableUniformsTools( this.supportedUniformsEditors, this.onUniformClick, this.onUniformDoubleClick )
                this.toolsEnabled = true
                this.noShaderChangesSinceToolsEnabled = true
                window.addEventListener( "blur", this.hideUniformTooltip )

                const onEditorChange = () => {
                    this.noShaderChangesSinceToolsEnabled = false
                    this.disableUniformsTools()
                    this.editor.off( "change", onEditorChange ) // listen for the event once ( CodeMirros lacks the feature )
                }

                this.editor.on( "change", onEditorChange )
            }
        },
        disableUniformsTools() {
            this.vertexView.disableUniformsTools()
            this.fragmentView.disableUniformsTools()
            this.toolsEnabled = false
            window.removeEventListener( "blur", this.hideUniformTooltip )
        },
        onUniformClick( target: HTMLElement, editor: UniformEditor, range: Range ) {
            if ( ( this.lastUniformSelected.range !== range ) || ( this.lastUniformSelected.range === range && ! this.tooltipVisible ) ) {
                this.lastUniformSelected = { range, editor }
                this.showUniformTooltip( target )
            }
        },
        onUniformDoubleClick( event: MouseEvent ) {
            // 🤔 this shouldn't be necessary, but when doing a "slow" double-click the tooltip sometimes still shows-up
            this.hideUniformTooltip()

            // disable all uniforms buttons (as any change on the shaders)
            this.disableUniformsTools()

            // set cursor on clicked position and return focus on tooltip to the editor
            const clickedPosition = this.editor.coordsChar( { top: event.clientY, left: event.clientX }, "window" )
            this.activeShaderView.doc.setCursor( clickedPosition )
            this.editor.focus()
        },
        saveShadersCode() {
            this.$store.commit( "SET_VERTEX_SOURCE", this.vertexView.getValue() )
            this.$store.commit( "SET_FRAGMENT_SOURCE", this.fragmentView.getValue() )
        },
        saveState() {
            this.saveShadersCode()
            this.markClean()
        },
        loadState() {
            // momentarily turn change detection off (to avoid marking the editor as dirty while loading the shaders content)
            this.editor.off( "changes", this.updateCleanState )

            // @ts-ignore
            this.vertexView.setValue( this.vertexSource )
            this.vertexView.clearHistory()
            // @ts-ignore
            this.fragmentView.setValue( this.fragmentSource )
            this.fragmentView.clearHistory()

            // change detection back on
            this.editor.on( "changes", this.updateCleanState )

            this.markClean()
        },
        markClean() {
            this.vertexView.markClean()
            this.fragmentView.markClean()

            this.$store.commit( "SET_EDITOR_CLEAN", true )
        },
        isClean() {
            return this.vertexView.isClean() && this.fragmentView.isClean()
        },
        updateCleanState() {
            this.$store.commit( "SET_EDITOR_CLEAN", this.isClean() )
        }
    }
} )
</script>

<style src="@/styles/editor.css" />
