<template>
    <div class="select">
        <label> <slot> set label </slot> </label>
        <div class="select-container" ref="clickableArea">
            <div
                class="button"
                @mousedown.prevent
                @click="isActive = ! isActive"
                :class="{ active: isActive }"
            >
                <span> {{ selected.text }} </span>
                <div class="select-icon" />
            </div>
            <div class="options" :class="{ visible: isActive, dropup }">
                <div
                    class="option"
                    v-for="option in options"
                    :key="option.value"
                    :class="{ 'selected': option.value === selected.value }"
                    @mousedown.prevent
                    @click="updateValue( option.value )"
                >
                    <span> {{ option.text }} </span>
                    <v-check-icon class="icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { mapState } from "vuex"
import { LanguageVersion } from "@/scripts/renderer/_constants"

const { CheckIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    name: "LanguageVersionSelect",
    components: {
        "v-check-icon": CheckIcon
    },
    props: {
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
            isActive: false,
            options: [
                { text: "1.00", value: LanguageVersion.GLSL_ES100 },
                { text: "3.00", value: LanguageVersion.GLSL_ES300 }
            ]
        }
    },
    computed: {
        selected(): { text: string, value: LanguageVersion } {
            // @ts-ignore
            return ( this.languageVersion === this.options[ 0 ].value ) ? this.options[ 0 ] : this.options[ 1 ]
        },
        ...mapState( [
            "languageVersion"
        ] )
    },
    created() {
        document.addEventListener( "mousedown", ( event ) => { this.checkOutsideClick( event ) } )
    },
    methods: {
        updateValue( value: LanguageVersion ) {
            if ( this.autohide ) {
                setTimeout( () => { this.isActive = false }, 150 )
            }
            this.$store.commit( "SET_LANGUAGE_VERSION", value )
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

    label {

        opacity: 0.4
        margin-right: 0.3rem
        text-overflow: ellipsis
        white-space: nowrap

    }

    width: fit-content
    display: flex
    align-items: center
    user-select: none
    pointer-events: all;

    .select-container {

        position: relative
        display: flex

        .button {

            cursor: pointer
            display: flex
            flex-direction: row
            align-items: center
            justify-content: center
            text-overflow: ellipsis
            white-space: nowrap
            padding-left: 0.2rem
            padding-right: 0.1rem
            border-radius: 3pt
            transition: background-color 0.15s;
            color: rgba(255, 255, 255, 0.7)

            .select-icon {
                width: 13px;
                height: 13px;
                margin-left: 2px;
                position: relative
                opacity: 0.8
            }
            .select-icon:after {
                display: block;
                position: absolute;
                top: 0.5px;
                width: 100%;
                height: 100%;
                content: "";
                mask: url("/assets/icons/chevrons.svg");
                mask-size: cover;
                background: white;
            }

            // states

            &:active, &.active {

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
            border-radius: var(--border-radius);
            background: rgb( 60, 60, 60 )
            border: 1px solid rgb( 20, 20, 20 )
            box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden
            opacity: 0
            pointer-events: none
            transition: all 0.15s

            &::after {
                content: "";
                position: absolute;
                box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
                border-radius: var(--border-radius);
                width: 100%;
                height: 100%;
                top: 0;
                pointer-events: none;
            }

            &:not(.dropup) {

                top: 1.5rem
                transform: translateY( - 2pt )

            }

            &.dropup {

                bottom: 1.5rem
                transform: translateY( 2pt )

            }

            .option {

                display: flex
                align-items: center
                justify-content: space-between
                text-overflow: ellipsis
                white-space: nowrap
                cursor: pointer
                color: rgba( 255, 255, 255, 0.6 )
                padding: 0.3rem 0.5rem 0.3rem 0.5rem
                transition: color 0.1s

                .icon {

                    width: 1rem
                    height: 1rem
                    margin-left: 0.5rem
                    margin-top: 0.1rem
                    opacity: 0

                }

                &.selected,
                &.selected:hover {

                    color: white
                    background: accent-color

                    .icon {

                        opacity: 1

                    }

                }

                &:hover {

                    background-color: rgba(255, 255, 255, 0.05)
                    color: white

                }

            }

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
