<template>
    <div class="picker" ref="picker" @mousedown.stop :class="{ visible: visible, below: below }" :style="pickerStyle">
        <slot>
            <div class="default-content"> ••• </div>
        </slot>
        <div class="picker-tip" ref="pickerTip" :style="pickerTipStyle"></div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"

const TARGET_OFFSET = 10
const VIEWPORT_MARGIN = 5

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
        below: false,
        pickerStyle: {} as { [ key: string ]: string },
        pickerTipStyle: {} as { [ key: string ]: string }
    } ),
    watch: {
        show() {
            if ( this.show ) {
                this.$nextTick( () => {
                    this.adjustForOverlap()
                    this.visible = true
                } )
            } else {
                this.visible = false
            }
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
            // impresentable 🤮 ...

            const targetBounds = this.target.getBoundingClientRect()

            // ajustes del contenido principal
            this.pickerStyle = {}
            const picker = this.$refs.picker as HTMLElement
            let pastMargin = 0 // mantengo registro de cuanto se paso el contenido de los margenes para centrar el tip sobre el target

            // chequeo de eje horizontal
            const left = targetBounds.left + targetBounds.width / 2 - picker.clientWidth / 2
            if ( left < VIEWPORT_MARGIN ) {
                pastMargin = Math.max( 0, VIEWPORT_MARGIN - left )
                this.pickerStyle.left = VIEWPORT_MARGIN + "px"
            } else {
                const right = window.innerWidth - ( left + picker.clientWidth )
                if ( right < VIEWPORT_MARGIN ) {
                    pastMargin = - Math.max( 0, VIEWPORT_MARGIN - right )
                    this.pickerStyle.right = VIEWPORT_MARGIN + "px"
                } else {
                    this.pickerStyle.right = right + "px"
                }
            }

            // chequeo de eje vertical
            const fitsAbove = ( targetBounds.top - picker.clientHeight - TARGET_OFFSET - VIEWPORT_MARGIN * 2 ) > 0
            if ( fitsAbove ) {
                this.pickerStyle.bottom = ( window.innerHeight - targetBounds.top + TARGET_OFFSET ) + "px"
                this.below = false
            } else {
                this.pickerStyle.top = ( targetBounds.bottom + TARGET_OFFSET ) + "px"
                this.below = true
            }

            // ajustes del tip
            this.pickerTipStyle = {}
            const tip = this.$refs.pickerTip as HTMLElement

            this.pickerTipStyle = {
                left: picker.clientWidth / 2 - tip.clientWidth / 2 - pastMargin + "px"
            }
        }
    }
} )
</script>

<style>
.picker {
    position: fixed;
    z-index: 10;
    border-radius: 6px;
    box-sizing: border-box;
    border: 1px solid rgb(30, 30, 30);
    background: rgb(50, 50, 50);
    box-shadow: 0px 2.5px 30px rgba(0, 0, 0, 0.3), inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    font-family: IBM Plex Sans;
    opacity: 0;
    backface-visibility: hidden;
    pointer-events: none;
    transition: opacity 100ms, transform 100ms;
}
.picker.visible {
    opacity: 1;
    pointer-events: all;
}

.picker .default-content {
    color: gray;
    margin: 150px 150px;
    white-space: nowrap;
}

.picker-tip {
    position: absolute;
    width: 18px;
    height: 18px;
    overflow: hidden;
}
.picker-tip::after {
    content: "";
    position: absolute;
    box-sizing: border-box;
    width: 12px;
    height: 12px;
    left: 3px;
    top: -6px;
    box-sizing: border-box;
    transform: rotate(45deg);
    border-radius: 2px;
    background: rgb(75, 75, 75);
    border: 1px solid rgb(30, 30, 30);
    backface-visibility: hidden;
}
.picker.below .picker-tip {
    bottom: 100%;
}
.picker.below .picker-tip::after {
    top: 12px;
}

</style>
