<template>
    <div class="picker-container" ref="pickerTarget" :class="{ visible: visible }" :style="targetStyle">
        <div class="picker-box" ref="pickerContent" @mousedown.stop :style="contentStyle">
            <slot>
                <div class="default-content"> ••• </div>
            </slot>
        </div>
        <span class="picker-tip"></span>
    </div>
</template>

<script lang="ts">
import Vue from "vue"

const viewportMargin = 5

export default Vue.extend( {
    name: "picker-container",
    props: {
        show: {
            type: Boolean,
            default: false
        },
        target: {
            type: HTMLElement,
            required: true
        }
    },
    data: () => ( {
        visible: false,
        contentStyle: {} as { [ key: string ]: string }
    } ),
    computed: {
        targetBounds(): ClientRect {
            return this.target.getBoundingClientRect()
        },
        targetStyle(): { [ key: string ]: string } {
            return {
                top: this.targetBounds.top + "px",
                left: this.targetBounds.left + "px",
                width: this.targetBounds.width + "px",
                height: this.targetBounds.height + "px"
            }
        }
    },
    watch: {
        show() {
            this.$nextTick( () => {
                if ( ! this.visible ) {
                    this.adjustForOverlap()
                }
                this.visible = this.show
            } )
        },
        target() {
            this.$nextTick( () => {
                if ( this.visible ) {
                    this.adjustForOverlap()
                }
            } )
        }
    },
    methods: {
        adjustForOverlap() {
            const contentBounds = ( this.$refs.pickerContent as HTMLElement ).getBoundingClientRect()

            const currentLeft = this.targetBounds.left + ( this.targetBounds.width / 2 ) - ( contentBounds.width / 2 ) // calculo indirecto que no depende del left actual del contenido
            let adjustedLeft = ( - contentBounds.width / 2 ) + ( this.targetBounds.width / 2 )

            if ( currentLeft < viewportMargin ) {
                adjustedLeft += currentLeft > 0 ? + ( viewportMargin - currentLeft ) : - ( currentLeft - viewportMargin )
            }

            this.contentStyle = {
                left: adjustedLeft + "px"
            }
        }
    }
} )
</script>

<style>
.picker-container {
    position: fixed;
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
    font-family: IBM Plex Sans;
}
.picker-box .default-content {
    color: gray;
    margin: 0px 8px;
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
    top: -9px;
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
