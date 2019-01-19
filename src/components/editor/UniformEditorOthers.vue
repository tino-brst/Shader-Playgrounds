<template>
    <div class="uniform-editor-others">
        {{ editor.type }}
    </div>
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend( {
    name: "uniform-editor-others",
    props: {
        editor: {
            type: Object,
            default: () => ( {} )
        }
    }
} )
</script>

<style>
.uniform-editor-others {
    position: relative;
    width: fit-content;
    height: fit-content;
    margin: 50px 150px;
}
</style>
