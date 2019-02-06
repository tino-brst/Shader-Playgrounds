<template>
    <div class="tooltip" ref="tooltip" @mousedown.stop :class="{ visible: visible, below: below }" :style="tooltipStyle">
        <slot>
            <div class="default-content">
                •••
            </div>
        </slot>
        <div class="tip" ref="tip" :style="tipStyle" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"

const TARGET_OFFSET = 10
const VIEWPORT_MARGIN = 5

export default Vue.extend( {
    name: "Tooltip",
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
        tooltipStyle: { top: "", left: "" },
        tipStyle: { left: "" }
    } ),
    watch: {
        show() {
            if ( this.show ) {
                this.$nextTick( () => {
                    this.adjustForViewportOverlap()
                    this.visible = true
                } )
            } else {
                this.visible = false
            }
        },
        target() {
            this.$nextTick( () => {
                if ( this.visible ) {
                    this.adjustForViewportOverlap()
                }
            } )
        }
    },
    methods: {
        adjustForViewportOverlap() {
            // ajustes del contenido principal ... tiene que haber forma mas prolija 🤮
            const tooltip = this.$refs.tooltip as HTMLElement
            const targetBounds = this.target.getBoundingClientRect()
            let pastMargin = 0 // mantengo registro de cuanto se paso el contenido de los margenes para centrar el tip sobre el target

            // ajuste horizontal
            const left = targetBounds.left + targetBounds.width / 2 - tooltip.clientWidth / 2
            if ( left < VIEWPORT_MARGIN ) {
                pastMargin = Math.max( 0, VIEWPORT_MARGIN - left )
                this.tooltipStyle.left = VIEWPORT_MARGIN + "px"
            } else {
                const right = window.innerWidth - ( left + tooltip.clientWidth )
                if ( right < VIEWPORT_MARGIN ) {
                    pastMargin = - Math.max( 0, VIEWPORT_MARGIN - right )
                    this.tooltipStyle.left = window.innerWidth - tooltip.clientWidth - VIEWPORT_MARGIN + "px"
                } else {
                    this.tooltipStyle.left = left + "px"
                }
            }

            // ajuste vertical
            const fitsAbove = ( targetBounds.top - tooltip.clientHeight - TARGET_OFFSET - VIEWPORT_MARGIN * 2 ) > 0
            if ( fitsAbove ) {
                this.tooltipStyle.top = ( targetBounds.top - tooltip.clientHeight - TARGET_OFFSET ) + "px"
                this.below = false
            } else {
                this.tooltipStyle.top = ( targetBounds.bottom + TARGET_OFFSET ) + "px"
                this.below = true
            }

            // ajustes del tip
            const tip = this.$refs.tip as HTMLElement
            this.tipStyle = {
                left: tooltip.clientWidth / 2 - tip.clientWidth / 2 - pastMargin + "px"
            }
        }
    }
} )
</script>

<style>
.tooltip {
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
.tooltip.visible {
    opacity: 1;
    pointer-events: all;
}

.tip {
    position: absolute;
    width: 18px;
    height: 18px;
    overflow: hidden;
}
.tip::after {
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
.tooltip.below .tip {
    bottom: 100%;
}
.tooltip.below .tip::after {
    top: 12px;
}

.tooltip .default-content {
    color: gray;
    margin: 150px 150px;
    white-space: nowrap;
}
</style>
