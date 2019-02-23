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
import { mapState } from "vuex"
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
    computed: mapState( {
        activeShader: ( state: any ) => state.activeShader as ShaderType,
        vertexCode: ( state: any ) => state.vertexCode as string,
        fragmentCode: ( state: any ) => state.fragmentCode as string,
        vertexLog: ( state: any ) => state.vertexLog as ShaderLog,
        fragmentLog: ( state: any ) => state.fragmentLog as ShaderLog,
        uniformsEditors: ( state: any ) => state.uniformsEditors as UniformEditor[],
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
        }
    } ),
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
        vertexCode( newValue: string ) {
            if ( newValue !== this.vertexShader.getValue() ) {
                this.vertexShader.setValue( newValue )
            }
        },
        fragmentCode( newValue: string ) {
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
        this.vertexShader.setValue( this.vertexCode )
        this.fragmentShader.setValue( this.fragmentCode )

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
        this.editor.on( "keydown", this.handleShowHints )
        this.editor.focus()
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

<style src="@/styles/editor.css" />
