<template>
    <div class="uniform-editor float">
        <v-float-input v-model="value" />
    </div>
</template>

<script lang="ts">
import "@/styles/uniform_editor.css"
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
            this.loadValue()
        }
    },
    activated() {
        this.loadValue()
    },
    methods: {
        loadValue() {
            this.value = this.editor.getValue()
        }
    }
} )
</script>
