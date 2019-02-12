<template>
    <div class="number-input">
        <label><slot /></label>
        <div class="input-controls-group" @wheel.prevent="onScroll" :class="{ dragging, editing }">
            <input
                type="text"
                ref="input"
                :value="value.toFixed( 2 )"
                @focus="enterEditingMode"
                @blur="saveEdit"
                @keypress.enter="$event.target.blur()"
            >
            <div class="controls" @mousedown="dragStart">
                <button @mouseup="stepUp">
                    <v-chevron-up-icon class="icon" />
                </button>
                <button @mouseup="stepDown">
                    <v-chevron-down-icon class="icon" />
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
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
        }
    },
    data() {
        return {
            step: 0.1,
            stepMultiplier: 10,
            decimals: 3,
            editing: false,
            dragging: false
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
                this.$parent.$emit( "change-window-cursor", "ns-resize" )
            }
            const step = ( event.shiftKey ) ? this.step * this.stepMultiplier : this.step
            this.updateValue( this.value - step * event.movementY * 0.1 )
        },
        dragEnd( event: MouseEvent ) {
            this.dragging = false
            this.$parent.$emit( "restore-window-cursor" )
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
            this.$emit( "input", newValue )
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

.number-input label {
    align-self: center;
    height: 100%;
    /* margin-right: 0.4rem; */
    font-size: 14px;
    user-select: none;
    color: rgba( 255, 255, 255, 0.5 )
}

.number-input .input-controls-group {
    display: flex;
    box-sizing: border-box;
    background-color: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 3pt;
    overflow: hidden;
    transition: all 0.15s;
}
.number-input .input-controls-group:hover,
.number-input .input-controls-group.dragging,
.number-input .input-controls-group.editing {
    background-color: rgba(255,255,255,0.1);
}

.number-input input {
    width: 3.5rem;
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
    padding-left: 0.3rem;
    align-self: center;
    font-family: IBM Plex Sans;
    font-size: 15px;
    text-overflow: ellipsis;
    color: white;
    background-color: transparent;
    border: none;
    outline: none;
}
.number-input input::selection {
    background: rgba( 255, 255, 255, 0.2 );
    border-radius: 2pt;
}

.number-input .controls {
    width: 1rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background-color: rgba(255,255,255,0.1);
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
}
.number-input button .icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.number-input .input-controls-group:not(.dragging) button:active {
    filter: brightness( 0.8 )
}

</style>
