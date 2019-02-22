<template>
    <div class="progress-bar" :class="{ loading, done }">
        <div class="progress" />
    </div>
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
    width: 100%;
    height: 3px;
    position: absolute;
    top: -3px;
    opacity: 0;
    transition: opacity 1s;
    z-index: 1;
}
.progress-bar.loading {
    opacity: 1;
}
.progress-bar.done {
    opacity: 0;
    transition: opacity .8s;
}

.progress-bar .progress {
    width: 0%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    background: royalblue;
    transition: width 5s;
    overflow: hidden;
}
.progress-bar.loading .progress {
    width: 75%;
}
.progress-bar.done .progress {
    width: 100%;
    transition: width .8s;
}

.progress-bar .progress::after {
    position: absolute;
    content: "";
    top: 0;
    left: -100px;
    height: 100%;
    width: 100px;
    background: linear-gradient(to right, rgba(128, 187, 255, 0), rgba(128, 187, 255, 0.5), rgba(128, 187, 255, 0));

    animation-name: slide;
    animation-timing-function: linear;
    animation-duration: 2s;
    animation-delay: 5s;
    animation-timing-function: ease;
    animation-iteration-count: infinite;
    animation-direction: normal;
}

@keyframes slide {
    0% {
        left: -100px;
    }
    100% {
        left: 100%;
    }

}
</style>
