<template>
    <div class="uniform-editor vec2">
        <v-float-input v-model="x" label="x" />
        <div class="separator" />
        <v-float-input v-model="y" label="y" />
    </div>
</template>

<script lang="ts">
import "@/styles/uniform_editor.css"
import Vue from "vue"
import FloatInput from "@/components/FloatInput.vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
    name: "UniformEditorVec2",
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
        x: 0 as number,
        y: 0 as number,
        vec2: new Float32Array( 2 )
    } ),
    computed: {
    },
    watch: {
        x() {
            this.vec2[ 0 ] = this.x
            this.editor.setValue( this.vec2 )
        },
        y() {
            this.vec2[ 1 ] = this.y
            this.editor.setValue( this.vec2 )
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
            this.vec2 = this.editor.getValue() as Float32Array
            [ this.x, this.y ] = this.vec2
        }
    }
} )
</script>
