<template>
    <div class="picker-container" :style="{ top: position.y + 'px', left: position.x + 'px' }">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend( {
    name: "picker-container",
    props: {
        position: {
            type: Object as () => { x: number, y: number },
            default: () => ( { x: 0, y: 0 } )
        }
    }
} )
</script>
