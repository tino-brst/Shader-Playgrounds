<template>
    <div class="progress-bar" :class="{ loading, done }" />
</template>

<script>
export default {
    name: "ProgressBar",
    props: {
        loading: {
            type: Boolean,
            default: false
        },
        done: {
            type: Boolean,
            default: false
        }
    }

}
</script>

<style>
.progress-bar {
    width: 0%;
    height: 3px;
    background: royalblue;
    position: absolute;
    top: -3px;
    opacity: 0;
    transition: width 5s, opacity 1s;
    z-index: 1;
}
.progress-bar.loading {
    width: 75%;
    opacity: 1;
}
.progress-bar.done {
    width: 100%;
    opacity: 0;
    transition: width .8s, opacity .8s;
}
</style>
