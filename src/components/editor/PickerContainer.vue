<template>
    <div class="picker-container" :class="{ visible: visible }" :style="{ top: targetBounds.top + 'px', left: targetBounds.left + 'px', width: targetBounds.width + 'px', height: targetBounds.height + 'px' }">
        <div class="picker-box" ref="pickerContent" @mousedown.stop :style="contentStyle">
            <slot>
                <div class="default-content"> <button> lele </button> No suggestions</div>
            </slot>
            <span class="picker-tip"></span>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend( {
    name: "picker-container",
    props: {
        show: {
            type: Boolean,
            default: false
        },
        targetBounds: {
            type: Object as () => { top: number, left: number, width: number, height: number },
            default: () => ( { top: 0, left: 0, width: 0, height: 0 } )
        }
    },
    data: () => ( {
        visible: false,
        contentStyle: undefined as undefined | { [ key: string ]: string }
    } ),
    watch: {
        show() {
            if ( this.show ) {
                this.$nextTick( () => {
                    const bounds = ( this.$refs.pickerContent as HTMLElement ).getBoundingClientRect()
                    if ( bounds.left <= 5 ) {
                        let left = ( - bounds.width / 2 ) + ( this.targetBounds.width / 2 ) - bounds.left
                        left += bounds.left > 0 ? 5 - bounds.left : + 5
                        this.contentStyle = { left: left + "px" }
                    } else {
                        this.contentStyle = undefined
                    }
                    this.visible = true
                } )
            } else {
                this.visible = false
            }
        },
        targetBounds() {
            if ( this.visible ) {
                this.$nextTick( () => {
                    const bounds = ( this.$refs.pickerContent as HTMLElement ).getBoundingClientRect()
                    if ( bounds.left <= 5 ) {
                        let left = ( - bounds.width / 2 ) + ( this.targetBounds.width / 2 ) - bounds.left
                        left += bounds.left > 0 ? 5 - bounds.left : + 5
                        this.contentStyle = { left: left + "px" }
                    } else {
                        this.contentStyle = undefined
                    }
                } )
            }
        }
    }
} )
</script>

<style>
.picker-container {
    position: absolute;
    display: flex;
    justify-content: center;
    z-index: 10;
    opacity: 0;
    transform: translateY(2px);
    pointer-events: none;
    transition: opacity .1s, transform .1s;
}

.picker-container.visible {
    opacity: 1;
    transform: none;
}

.picker-box {
    position: absolute;
    bottom: calc(100% + 8px);
    width: fit-content;
    height: fit-content;
    border-radius: 6px;
    box-sizing: border-box;
    border: 1px solid rgb(30, 30, 30);
    background: rgb(50, 50, 50);
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
}
.picker-box .default-content {
    margin: 0px 6px;
    margin: 50px 50px;
    white-space: nowrap;
}
.picker-container.visible .picker-box {
    pointer-events: all;
}

.picker-tip {
    position: absolute;
    width: 12px;
    height: 10px;
    left: calc(50% - 5px);
    top: 100%;
    overflow: hidden;
}
.picker-tip::after {
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
