<template>
    <div class="progress-bar" :class="{ started, done }">
        <div class="progress" />
        <span class="loading-info" :class="{ visible: started && ! done }">{{ info }}</span>
    </div>
</template>

<script>
export default {
    name: "ProgressBar",
    props: {
        done: {
            type: Boolean,
            default: false
        },
        info: {
            type: String,
            default: ""
        }
    },
    data: () => ( {
        started: false
    } ),
    methods: {
        start() {
            this.started = true
        }
    }
}
</script>

<style>
.progress-bar {
    width: 100%;
    height: 3px;
    top: -3px;
    position: absolute;
    z-index: 1;
}

.progress-bar .loading-info {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 8px;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(120, 120, 120, 0.9);
    color: rgba(0, 0, 0, 0.9);
    z-index: -1;
    transition: all 1s;
    opacity: 0;
}
.progress-bar .loading-info.visible {
    transition: all 1s;
    opacity: 1;
}

.progress-bar .progress {
    width: 0%;
    height: 100%;
    top: 0;
    left: 0;
    position: absolute;
    background: royalblue;
    opacity: 0;
    overflow: hidden;
    transition: width 5s, opacity 1s;
}
.progress-bar.started .progress {
    opacity: 1;
    width: 75%;
}
.progress-bar.done .progress {
    opacity: 0;
    width: 100%;
    transition: width .8s, opacity 1s;
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
