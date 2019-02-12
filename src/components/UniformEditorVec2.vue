<template>
    <div class="uniform-editor-vec2">
        <v-number-input v-model="x" />
        <v-number-input v-model="y" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import NumberInput from "@/components/NumberInput.vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
    name: "UniformEditorVec2",
    components: {
        "v-number-input": NumberInput
    },
    props: {
        editor: {
            type: Object as () => UniformEditor,
            default: null
        }
    },
    data: () => ( {
        x: 0 as number,
        y: 0 as number
    } ),
    watch: {
        x( newX: number ) {
            this.editor.setValue( new Float32Array( [ this.x, this.y ] ) )
        },
        y( newY: number ) {
            this.editor.setValue( new Float32Array( [ this.x, this.y ] ) )
        },
        editor( newEditor: UniformEditor ) {
            [ this.x, this.y ] = this.editor.getValue() as Float32Array
        }
    }
} )
</script>

<style>
.uniform-editor-vec2 {
    position: relative;
    width: fit-content;
    height: fit-content;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 5px 8px;
}
</style>
