<template>
    <div class="uniform-editor-float">
        <input type="range" v-model.number="value" min="0" max="1" step="0.01">
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
    name: "UniformEditorFloat",
    props: {
        editor: {
            type: Object as () => UniformEditor,
            default: null
        }
    },
    data: () => ( {
        value: 0 as number
    } ),
    watch: {
        value( newValue: number ) {
            this.editor.setValue( newValue )
        },
        editor( newEditor: UniformEditor ) {
            this.value = this.editor.getValue()
        }
    }
} )
</script>

<style>
.uniform-editor-float {
    position: relative;
    width: fit-content;
    height: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 5px 8px;
}
</style>
