<template>
    <div class="number-input" :class="{ dragging, editing, 'without-label': label === '' }">
        <div class="input-controls-wrapper" @wheel.prevent="onScroll">
            <input
                type="text"
                ref="input"
                :value="roundedValue"
                @focus="enterEditingMode"
                @blur="saveEdit"
                @keypress.enter="$event.target.blur()"
            >
            <div class="controls-label-wrapper">
                <label v-if="label !== ''" v-text="label[ 0 ]" />
                <div class="controls" @mousedown="dragStart">
                    <button class="up" @mouseup="stepUp" tabindex="-1">
                        <v-chevron-up-icon class="icon" />
                    </button>
                    <button class="down" @mouseup="stepDown" tabindex="-1">
                        <v-chevron-down-icon class="icon" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import roundTo from "round-to"
const { ChevronDownIcon } = require( "vue-feather-icons" )
const { ChevronUpIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    components: {
        "v-chevron-down-icon": ChevronDownIcon,
        "v-chevron-up-icon": ChevronUpIcon
    },
    props: {
        value: {
            type: Number,
            required: true
        },
        label: {
            type: String,
            default: ""
        },
        step: {
            type: Number,
            default: 0.1
        },
        stepMultiplier: {
            type: Number,
            default: 10
        },
        decimals: {
            type: Number,
            default: 2
        }
    },
    data() {
        return {
            editing: false,
            dragging: false
        }
    },
    computed: {
        roundedValue(): number {
            return roundTo( this.value, this.decimals )
        }
    },
    methods: {
        stepUp( event: MouseEvent ) {
            if ( ! this.dragging ) {
                const step = ( event.shiftKey ) ? this.step * this.stepMultiplier : this.step
                this.updateValue( this.value + step )
            }
        },
        stepDown( event: MouseEvent ) {
            if ( ! this.dragging ) {
                const step = ( event.shiftKey ) ? this.step * this.stepMultiplier : this.step
                this.updateValue( this.value - step )
            }
        },
        enterEditingMode() {
            this.editing = true
            const input = this.$refs.input as HTMLInputElement
            input.select()
        },
        saveEdit() {
            const input = this.$refs.input as HTMLInputElement
            const valueString = input.value.replace( ",", "." )
            if ( valueString === "" ) {
                this.updateValue( 0 )
            } else {
                const value = parseFloat( valueString )
                if ( ! isNaN( value ) ) {
                    this.updateValue( value )
                }
            }
            this.editing = false
            this.$forceUpdate()
        },
        dragStart( event: MouseEvent ) {
            window.addEventListener( "mousemove", this.dragMove )
            window.addEventListener( "mouseup", this.dragEnd )
        },
        dragMove( event: MouseEvent ) {
            if ( ! this.dragging ) {
                this.dragging = true
            }
            const step = ( event.shiftKey ) ? this.step * this.stepMultiplier : this.step
            this.updateValue( this.value - step * event.movementY * 0.1 )
        },
        dragEnd( event: MouseEvent ) {
            this.dragging = false
            event.preventDefault()
            window.removeEventListener( "mousemove", this.dragMove )
            window.removeEventListener( "mouseup", this.dragEnd )
        },
        onScroll( event: WheelEvent ) {
            if ( this.editing ) {
                this.saveEdit()
            }
            const step = ( event.shiftKey ) ? this.step * this.stepMultiplier : this.step
            this.updateValue( this.value - step * event.movementY * 0.1 )
        },
        updateValue( newValue: number ) {
            this.$emit( "input", roundTo( newValue, this.decimals ) )
        }
    }
} )
</script>

<style>

.number-input {
    width: fit-content;
    display: flex;
    flex-direction: row;
}

.number-input .input-controls-wrapper {
    display: flex;
    background-color: transparent;
    transition: all 0.15s;
}
.number-input:hover,
.number-input.dragging,
.number-input.editing {
    background-color: rgba(255,255,255,0.05);
}

.number-input input {
    width: 42px;
    padding-top: 4px;
    padding-bottom: 4px;
    padding-left: 8px;
    align-self: center;
    font-family: system-ui;
    font-size: 14px;
    font-weight: var(--font-weight);
    text-overflow: ellipsis;
    color: white;
    background-color: transparent;
    border: none;
    outline: none;
}
.number-input input::selection {
    background: rgba( 255, 255, 255, 0.15 );
}

.number-input .controls-label-wrapper {
    width: 22px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.number-input label {
    position: absolute;
    font-size: 16px;
    padding-right: 2px;
    user-select: none;
    color: rgba( 255, 255, 255, 0.5 );
    transition: opacity 0.3s;
}
.number-input:hover label,
.number-input.dragging label {
    opacity: 0;
}
#playground.darwin .number-input label {
    padding-bottom: 3px;
}

.number-input .controls {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: royalblue;
    opacity: 0;
    transition: all 0.1s;
}
/* sin label los controles se mantienen visibles */
.number-input.without-label .controls {
    opacity: 1;
    transition: none;
}

.number-input:hover .controls,
.number-input.dragging .controls {
    opacity: 1;
}

.number-input button {
    position: relative;
    height: 50%;
    padding: 0;
    border: none;
    background-color: transparent;
    outline: none;
    cursor: pointer;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
}
.number-input button .icon {
    position: absolute;
    width: 110%;
    height: 110%;
}
.number-input:not(.dragging) button:active {
    opacity: 0.8;
}
.number-input .controls button.up {
    padding-top: 1px;
}
.number-input .controls button.down {
    padding-bottom: 1px;
}

</style>
