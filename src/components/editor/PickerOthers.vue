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
    margin: 0px 6px;
}
</style>
