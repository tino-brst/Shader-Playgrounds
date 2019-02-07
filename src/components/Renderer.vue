<template>
    <div class="renderer">
        <canvas ref="canvas" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { Renderer } from "@/scripts/renderer/Renderer"

const RUN_KEY = "t"

export default Vue.extend( {
    name: "Renderer",
    props: {
        vertex: {
            type: String,
            default: ""
        },
        fragment: {
            type: String,
            default: ""
        }
    },
    data: () => ( {
        renderer: {} as Renderer
    } ),
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement )
        this.compileAndRun()

        window.addEventListener( "keydown", this.handleRunKey )
    },
    methods: {
        handleRunKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === RUN_KEY ) {
                this.compileAndRun()
            }
        },
        compileAndRun() {
            this.renderer.setShaderProgram( this.vertex, this.fragment )

            const uniformsEditors = this.renderer.getUniformsEditors()
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            this.$store.commit( "updateLog", errorsAndWarnings )
            this.$store.commit( "updateUniformsEditors", uniformsEditors )
        }
    }
} )
</script>

<style>
.renderer {
    height: 100%;
    overflow: hidden;
}
.renderer canvas {
    height: 100%;
    width: 100%;
}
</style>
