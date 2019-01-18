<template>
    <div class="dot-blue">
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
.dot-blue {
    position: relative;
    width: fit-content;
    height: fit-content;
    margin: 10px 150px;
}
</style>
