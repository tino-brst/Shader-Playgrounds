<template>
    <div class="uniform-editor-float">
        {{ editor.type }}
    </div>
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend( {
    name: "uniform-editor-float",
    props: {
        editor: {
            type: Object,
            default: () => ( {} )
        }
    }
} )
</script>

<style>
.uniform-editor-float {
    position: relative;
    width: fit-content;
    height: fit-content;
    margin: 150px 250px;
}
</style>
