<template>
    <div class="editor" ref="editor"></div>
</template>

<script lang="ts">
import Vue from "vue"
import CodeMirror from "./codemirror/lib/codemirror"
import "./codemirror/lib/codemirror.css"

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
            value: this.value
        } )

        this.editor.on( "change", editor => this.updateValue( editor ) )
    },
    methods: {
        updateValue( editor: CodeMirror.Editor ) {
            const value = editor.getValue()
            if ( this.value !== value ) {
                this.$emit( "change", value )
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
</style>
