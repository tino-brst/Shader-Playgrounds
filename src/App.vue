<template>
    <div id="app">
        <v-editor v-model="codeVertexShader" :log="logVertexShader" :uniforms-editors="uniformsEditors" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
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
        "v-editor": Editor
    },
    data: () => ( {
        tab: 0,
        codeVertexShader: sampleCodeVertex,
        codeFragmentShader: sampleCodeFragment,
        log: [] as LogEntry[],
        logVertexShader: { errors: new Map(), warnings: new Map() } as ShaderLog,
        logFragmentShader: { errors: new Map(), warnings: new Map() } as ShaderLog,
        uniformsEditors: [] as UniformEditor[]
    } ),
    watch: {
        log( newLog: LogEntry[] ) {
            const logVertexShader: ShaderLog = { errors: new Map(), warnings: new Map() }
            const logFragmentShader: ShaderLog = { errors: new Map(), warnings: new Map() }

            // organizo el log en vertex/fragment, warnings/errors y los agrupo por nro. de linea
            for ( let entry of newLog ) {
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

            this.logVertexShader = logVertexShader
            this.logFragmentShader = logFragmentShader
        }
    },
    mounted() {
        // 📝 el log va a tener entradas tanto para el shader de vertices como de fragmentos
        // this.log = [
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 4, description: "'foo' - syntax error" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 4, description: "'bar' - undeclared identifier" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 9, description: "'foobar' - undeclared identifier" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 19, description: "'bar' - super danger!" },
        //     { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 15, description: "'foofoo' - just be careful" },
        //     { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 15, description: "'barbar' - just be careful okay?" },
        //     { shader: ShaderType.Fragment, type: LogEntryType.Warning, line: 8, description: "'foobar' - just be careful okay?" }
        // ]

        // setTimeout( () => {
        //     this.log = [
        //         { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 16, description: "'foo' - syntax error" },
        //         { shader: ShaderType.Vertex, type: LogEntryType.Error, line: 16, description: "'bar' - undeclared identifier" }
        //     ]
        // }, 1000 )

        // setTimeout( () => {
        //     this.log = [
        //         { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 10, description: "'foofoo' - just be careful" },
        //         { shader: ShaderType.Vertex, type: LogEntryType.Warning, line: 10, description: "'barbar' - just be careful okay?" }
        //     ]
        // }, 2000 )

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

        setTimeout( () => {
            this.uniformsEditors = [
                { type: "mat4", target: "viewMatrix", locked: false },
                { type: "int", target: "light.position", locked: false },
                { type: "vec3", target: "light.color", locked: false }
            ]
        }, 5000 )
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
    height: 100%;
}
</style>
