<template>
    <div class="editor" ref="editor"></div>
</template>

<script lang="ts">
import Vue from "vue"
import sampleCode from "./sample-code"
import CodeMirror from "./codemirror/lib/codemirror"
import "./codemirror/lib/codemirror.css"

export default Vue.extend( {
    name: "editor",
    data: () => ( {
        editor: {} as CodeMirror.Editor
    } ),
    mounted() {
        this.editor = CodeMirror( this.$refs.editor as HTMLElement, {
            value: sampleCode
        } )
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
</style>
