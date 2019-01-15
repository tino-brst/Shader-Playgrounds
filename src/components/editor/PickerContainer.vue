<template>
    <div class="picker-container" :style="{ top: position.y + 'px', left: position.x + 'px' }">
        <slot></slot>
        <span class="picker-container-tip"></span>
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

<style>
.picker-container {
    position: absolute;
    width: fit-content;
    height: fit-content;
    z-index: 10;
    border-radius: 6px;
    border: 1px solid rgb(30, 30, 30);
    background: rgb(50, 50, 50);
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
}

.picker-container-tip {
    position: absolute;
    width: 12px;
    height: 10px;
    left: calc(50% - 5px);
    overflow: hidden;
}
.picker-container-tip::after {
    content: "";
    position: absolute;
    width: 10px;
    height: 10px;
    top: -7px;
    transform: rotate(45deg);
    border-radius: 2px;
    background: rgb(75, 75, 75);
    border: 1px solid rgb(30, 30, 30);
}
</style>
