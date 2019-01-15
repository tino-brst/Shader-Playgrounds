<template>
    <div class="dot-red">
        {{ editor.type }}
    </div>
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend( {
    props: {
        editor: {
            type: Object,
            default: () => ( {} )
        }
    }
} )
</script>

<style>
.dot-red {
    position: relative;
    width: fit-content;
    height: fit-content;
    border-radius: 3px;
    opacity: 0.8;
    background: firebrick;
}
</style>
