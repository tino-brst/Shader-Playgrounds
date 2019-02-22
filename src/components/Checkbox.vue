<template>
    <div
        class="checkbox"
        :class="{ checked: value, disabled }"
        @mousedown.prevent=""
        @click="updateValue"
    >
        <span class="icon">
            <slot name="icon">
                <span class="check-icon-box">
                    <v-check-icon class="check-icon" />
                </span>
            </slot>
        </span>
        <slot name="label" />
    </div>
</template>

<script lang="ts">
import Vue from "vue"
const { CheckIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    components: {
        "v-check-icon": CheckIcon
    },
    props: {
        value: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        updateValue() {
            if ( ! this.disabled ) {
                this.$emit( "input", ! this.value )
            }
        }
    }
} )
</script>

<style lang="stylus">

accent-color = rgb( 20, 100, 220 )

.checkbox {

    // default values

    display: flex
    align-items: center
    user-select: none
    width: fit-content
    color: white
    cursor: pointer
    pointer-events: all

    input[type="checkbox"] {

        opacity: 0
        position: absolute
        pointer-events: none

    }

    .icon {
        width: 15px
        height: 15px
        display: flex
        align-items: center
        justify-content: center
    }

    svg:not(.check-icon) {

        color: rgb( 120, 120, 120 )
        transition: color 0.2s

    }

    .check-icon-box {

        width: 1rem
        height: 1rem
        display: flex
        align-items: center
        box-sizing: border-box
        background-color: rgba( 255, 255, 255, 0.05 )
        border: 1pt solid rgba( 255, 255, 255, 0.2 )
        border-radius: 3pt
        transition: all 0.15s

    }

    .check-icon {

        margin-left: 0.01rem
        margin-top: 0.05rem
        opacity: 0
        transform: scale( 0.5 )
        transition: all 0.1s ease-out

    }

    // states values

    &.disabled {

        filter: grayscale( 1 )
        opacity: 0.4
        pointer-events: none

    }

    &.checked {

        .check-icon-box {

            background-color: accent-color

        }

        .check-icon {

            opacity: 1
            transform: scale( 1 )

        }

        svg:not(.check-icon) {

            color: white

        }

    }

    &:active {

        .icon {

            filter: brightness( 0.8 )

        }

    }

}

</style>
