<template>
    <div class="select">
        <label> <slot> set label </slot> </label>
        <div class="options-container" ref="clickableArea">
            <div class="selected" @click="isActive = ! isActive" :class="{ active: isActive }">
                <span> {{ value }} </span>
                <v-chevron-down-icon v-if="! dropup" class="icon" />
                <v-chevron-up-icon v-if="dropup" class="icon" />
            </div>
            <div class="options" :class="{ visible: isActive, dropup }">
                <div
                    class="option"
                    v-for="( option, index ) in options"
                    :key="option"
                    :class="{ 'selected-option': option === value}"
                    @click="updateValue( index )"
                >
                    {{ option }}
                    <v-check-icon class="icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
const { ChevronDownIcon } = require( "vue-feather-icons" )
const { ChevronUpIcon } = require( "vue-feather-icons" )
const { CheckIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    components: {
        "v-chevron-down-icon": ChevronDownIcon,
        "v-chevron-up-icon": ChevronUpIcon,
        "v-check-icon": CheckIcon
    },
    props: {
        value: {
            type: String,
            default: ""
        },
        options: {
            type: Array,
            default: () => []
        },
        autohide: {
            type: Boolean,
            default: false
        },
        dropup: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isActive: false
        }
    },
    created() {
        document.addEventListener( "mousedown", ( event ) => { this.checkOutsideClick( event ) } )
    },
    methods: {
        updateValue( index: number ) {
            if ( this.autohide ) {
                this.isActive = false
            }
            this.$emit( "input", this.options[ index ] )
        },
        checkOutsideClick( event: MouseEvent ) {
            const clickableArea = this.$refs.clickableArea as Element
            if ( clickableArea !== undefined ) {
                const clickedInside = clickableArea.contains( event.target as Node )
                if ( ! clickedInside ) {
                    this.isActive = false
                }
            }
        }
    }
} )
</script>

<style lang="stylus">

accent-color = royalblue

.select {

    width: fit-content
    display: flex
    align-items: center
    user-select: none

    label {

        opacity: 0.4
        margin-right: 0.3rem
        text-overflow: ellipsis
        white-space: nowrap

    }

    .options-container {

        position: relative
        display: flex

        .selected {

            cursor: pointer
            display: flex
            align-items: center
            text-overflow: ellipsis
            white-space: nowrap
            padding-left: 0.2rem
            padding-right: 0.1rem
            border-radius: 3pt
            transition: background-color 0.15s;

            .icon {

                width: 1rem
                height: 1rem
                padding-left: 0.1rem
                padding-top: 0.1rem

            }

            // states

            &:active, &.active {

                filter: brightness( 0.8 )
                background-color: rgba( 255, 255, 255, 0.1 )

            }

            &:hover {

                background-color: rgba( 255, 255, 255, 0.1 )

            }

        }

        .options {

            z-index: 1
            box-sizing: border-box
            left: -0.3rem
            position: absolute
            border-radius: 6px
            background: rgb( 30, 30, 30 )
            border: 1px solid rgb( 20, 20, 20 )
            box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1)
            overflow: hidden
            opacity: 0
            pointer-events: none
            transition: all 0.15s

            &:not(.dropup) {

                top: 1.6rem
                transform: translateY( - 2pt )

            }

            &.dropup {

                bottom: 1.6rem
                transform: translateY( 2pt )

            }

            .option {

                display: flex
                align-items: center
                justify-content: space-between
                text-overflow: ellipsis
                white-space: nowrap
                cursor: pointer
                color: rgba( 255, 255, 255, 0.4 )
                padding: 0.2rem 0.5rem 0.2rem 0.5rem
                transition: all 0.1s

                .icon {

                    width: 1rem
                    height: 1rem
                    margin-left: 0.5rem
                    margin-top: 0.1rem
                    opacity: 0
                    transform: scale( 0.5 )
                    transition: all 0.15s

                }

                &.selected-option {

                    color: white

                    .icon {

                        opacity: 1
                        transform: scale( 1 )

                    }

                }

                &:hover {

                    background-color: accent-color
                    color: white

                }

            }

            // top, bottom padding

            & .option:first-child { padding-top: 0.3rem }
            & .option:last-child { padding-bottom: 0.3rem }

            // states

            &.visible {

                opacity: 1
                pointer-events: all
                transform: translateY( 0 )

            }

        }

    }

}

</style>
