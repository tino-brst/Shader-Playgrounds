<template>
    <div id="app">
        <div class="editor-panel">
            <v-tabs v-model="activeShader" :log="log" />
            <v-editor
                :active-shader="activeShader"
                :vertex="codeVertexShader"
                :fragment="codeFragmentShader"
                :log="log"
                :uniforms-editors="uniformsEditors"
                @change="updateShader"
            />
        </div>
        <!-- <div class="renderer-panel">
        </div> -->
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Tabs from "./components/tabs/Tabs.vue"
import Editor from "./components/editor/Editor.vue"
import sampleCodeVertex from "./sample-code-vertex"
import sampleCodeFragment from "./sample-code-fragment"

export enum ShaderType {
    Vertex = "vertex",
    Fragment = "fragment"
}
export enum LogEntryType {
    Error = "error",
    Warning = "warning"
}
export interface LogEntry {
    shader: ShaderType,
    type: LogEntryType,
    line: number,
    description: string
}
export interface Log {
    vertex: ShaderLog,
    fragment: ShaderLog
}
export interface ShaderLog {
    errors: Map < number, string[] >,
    warnings: Map < number, string[] >
}
export interface UniformEditor {
    target: string
    type: "int" | "float" | "mat4" | "vec3"
    locked: boolean
    // setValue: ( value: any ) => void
}

export default Vue.extend( {
    name: "App",
    components: {
        "v-editor": Editor,
        "v-tabs": Tabs
    },
    data: () => ( {
        activeShader: ShaderType.Vertex,
        codeVertexShader: sampleCodeVertex,
        codeFragmentShader: sampleCodeFragment,
        log: {
            vertex: { errors: new Map(), warnings: new Map() },
            fragment: { errors: new Map(), warnings: new Map() }
        } as Log,
        uniformsEditors: [] as UniformEditor[]
    } ),
    mounted() {
        // shorcut para cambio de shader activo ( ⚠️ tener en cuenta la plataforma: cmd / ctrl )
        window.addEventListener( "keydown", this.handleActiveShaderChange )

        // 📝 el log va a tener entradas tanto para el shader de vertices como de fragmentos
        // this.updateLog( [
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 3, description: "'foo' - syntax error" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 3, description: "'bar' - undeclared identifier" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 9, description: "'foobar' - undeclared identifier" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 14, description: "'bar' - super danger!" },
        //     { shader: ShaderType.Fragment, type: LogEntryType.Error, line: 15, description: "'bar' - super danger!" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 14, description: "'foofoo' - just be careful" },
        //     { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 15, description: "'barbar' - just be careful okay?" },
        //     { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 8, description: "'foobar' - just be careful okay?" }
        // ] )
        // this.uniformsEditors = [
        //     { type: "mat4", target: "viewMatrix", locked: false },
        //     { type: "mat4", target: "modelViewProjectionMatrix", locked: false },
        //     { type: "mat4", target: "modelViewMatrix", locked: false },
        //     { type: "mat4", target: "normalMatrix", locked: false },
        //     { type: "int", target: "light.position", locked: false },
        //     { type: "vec3", target: "light.color", locked: false },
        //     { type: "vec3", target: "surface.ambient", locked: false },
        //     { type: "vec3", target: "surface.diffuse", locked: false },
        //     { type: "vec3", target: "surface.specular", locked: false },
        //     { type: "float", target: "surface.shininess", locked: false }
        // ]

        // setTimeout( () => {
        //     this.updateLog( [
        //         { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 2, description: "'foo' - syntax error" },
        //         { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 2, description: "'bar' - undeclared identifier" },
        //         { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 9, description: "'barbar' - just be careful okay?" },
        //         { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 9, description: "'foobar' - just be careful okay?" }
        //     ] )
        //     this.uniformsEditors = []
        // }, 2000 )

        setTimeout( () => {
            this.updateLog( [
                // { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 12, description: "'foofoo' - just be careful" },
                // { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 12, description: "'barbar' - just be careful okay?" },
                { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 8, description: "'barbar' - just be careful okay?" },
                { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 8, description: "'foobar' - just be careful okay?" }
            ] )
            this.uniformsEditors = [
                { type: "mat4", target: "viewMatrix", locked: false },
                { type: "mat4", target: "modelViewProjectionMatrix", locked: false },
                { type: "mat4", target: "modelViewMatrix", locked: false },
                { type: "mat4", target: "normalMatrix", locked: false },
                { type: "int", target: "light.position", locked: false },
                { type: "vec3", target: "light.color", locked: false },
                { type: "vec3", target: "surface.ambient", locked: false },
                { type: "vec3", target: "surface.diffuse", locked: false },
                { type: "vec3", target: "surface.specular", locked: false },
                { type: "float", target: "surface.shininess", locked: false }
            ]
        }, 5000 )

        setTimeout( () => {
            this.updateLog( [] )
            this.uniformsEditors = [
                { type: "mat4", target: "viewMatrix", locked: false },
                { type: "mat4", target: "modelViewProjectionMatrix", locked: false },
                { type: "mat4", target: "modelViewMatrix", locked: false },
                { type: "mat4", target: "normalMatrix", locked: false },
                { type: "int", target: "light.position", locked: false },
                { type: "vec3", target: "light.color", locked: false }
            ]
        }, 10000 )
    },
    methods: {
        updateShader( newValue: string ) {
            if ( this.activeShader === ShaderType.Vertex ) {
                this.codeVertexShader = newValue
            } else {
                this.codeFragmentShader = newValue
            }
        },
        updateLog( newEntries: LogEntry[] ) {
            const logVertexShader: ShaderLog = { errors: new Map(), warnings: new Map() }
            const logFragmentShader: ShaderLog = { errors: new Map(), warnings: new Map() }

            // organizo el log en vertex/fragment, warnings/errors y los agrupo por nro. de linea
            for ( let entry of newEntries ) {
                const shaderLog = ( entry.shader === ShaderType.Vertex ) ? logVertexShader : logFragmentShader
                const entries = ( entry.type === LogEntryType.Error ) ? shaderLog.errors : shaderLog.warnings
                const lineNumber = entry.line - 1 // one-based -> zero-based
                const lineEntries = entries.get( lineNumber )

                if ( lineEntries === undefined ) {
                    entries.set( lineNumber, [ entry.description ] )
                } else {
                    lineEntries.push( entry.description )
                }
            }

            this.log = {
                vertex: logVertexShader,
                fragment: logFragmentShader
            }
        },
        handleActiveShaderChange( event: KeyboardEvent ) {
            if ( event.metaKey === true ) {
                if ( event.key === "1" ) {
                    this.activeShader = ShaderType.Vertex
                } else if ( event.key === "2" ) {
                    this.activeShader = ShaderType.Fragment
                }
            }
        }
    }
} )
</script>

<style>
html {
    height: 100%;
}

body {
    margin: 0;
    height: 100%;
}

#app {
    -webkit-font-smoothing: antialiased;
    height: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
}

.editor-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    flex: 1 1 auto;
}

.renderer-panel {
    height: 100%;
    box-sizing: border-box;
    background:  rgb(10, 10, 10);
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    flex: 0 0 200px;
}
</style>
