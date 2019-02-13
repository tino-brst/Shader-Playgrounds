<template>
    <div class="uniform-editor-float">
        <v-float-input v-model="value" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import FloatInput from "@/components/FloatInput.vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
    name: "UniformEditorFloat",
    components: {
        "v-float-input": FloatInput
    },
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
        value() {
            this.editor.setValue( this.value )
        },
        editor() {
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
    border-radius: 6px;
    overflow: hidden;
}

.uniform-editor-float::after {
    content: "";
    position: absolute;
    box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>
