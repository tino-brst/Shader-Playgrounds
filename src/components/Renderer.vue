<template>
    <div class="renderer">
        <canvas ref="canvas" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { Renderer } from "@/scripts/renderer/Renderer"

export default Vue.extend( {
    data: () => ( {
        renderer: {} as Renderer
    } ),
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement )
    }
} )
</script>

<style>
.renderer {
    height: 100%;
}
.renderer canvas {
    height: 100%;
    width: 100%;
}
</style>
