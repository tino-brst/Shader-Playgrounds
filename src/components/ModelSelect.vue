<template>
    <div class="model-select">
        <label> <slot> set label </slot> </label>
        <div class="models-container" ref="clickableArea">
            <div
                class="button"
                @mousedown.prevent
                @click="isActive = ! isActive"
                :class="{ active: isActive }"
            >
                <span> {{ value }} </span>
                <v-chevron-down-icon v-if="! dropup" class="icon" />
                <v-chevron-up-icon v-if="dropup" class="icon" />
            </div>
            <div class="models" :class="{ visible: isActive, dropup }">
                <div
                    class="model"
                    v-for="model in models"
                    :key="model.name"
                    :class="{ 'selected': model.name === value }"
                    @mousedown.prevent
                    @click="updateValue( model.name )"
                >
                    <div class="model-info">
                        <span> {{ model.name }} </span>
                        <span v-if="model.attributes.textureCoordinates" class="textures" />
                    </div>
                    <v-check-icon class="icon" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { Model } from "@/scripts/renderer/Renderer"
const { ChevronDownIcon } = require( "vue-feather-icons" )
const { ChevronUpIcon } = require( "vue-feather-icons" )
const { CheckIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    name: "ModelSelect",
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
        models: {
            type: Array as () => Model[],
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
        updateValue( model: string ) {
            if ( this.autohide ) {
                this.isActive = false
            }
            this.$emit( "input", model )
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

.model-select {

    width: fit-content
    display: flex
    align-items: center
    user-select: none
    pointer-events: all;

    label {

        opacity: 0.4
        margin-right: 0.3rem
        text-overflow: ellipsis
        white-space: nowrap

    }

    .models-container {

        position: relative
        display: flex

        .button {

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

        .models {

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

            .model {

                display: flex
                align-items: center
                justify-content: space-between
                text-overflow: ellipsis
                white-space: nowrap
                cursor: pointer
                color: rgba( 255, 255, 255, 0.4 )
                padding: 0.3rem 0.5rem 0.3rem 0.5rem
                transition: color 0.1s

                .icon {

                    width: 1rem
                    height: 1rem
                    margin-left: 0.5rem
                    margin-top: 0.1rem
                    opacity: 0
                    transition: all 0.1s

                }

                .model-info {

                    display: flex;
                    align-items: center;

                    .textures {
                        width: 12px;
                        height: 12px;
                        margin-left: 8px;
                        margin-right: 15px;
                        border-radius: 2px;
                        background: rgba(255, 255, 255, 0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.1s
                    }

                    .textures::after  {
                        font-size: 11px;
                        font-weight: 500;
                        content: "T";
                        color: rgb(30, 30, 30);
                    }
                }

                &.selected,
                &.selected:hover {

                    color: white
                    background: accent-color

                    .icon {

                        opacity: 1

                    }

                    .textures {
                        background: rgba(255, 255, 255, 0.8);
                    }

                    .textures::after  {
                        color: royalblue;
                    }

                }

                &:hover {

                    background-color: rgba(255, 255, 255, 0.05)
                    color: white

                    .textures {
                        background: rgba(255, 255, 255, 0.8);
                    }

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
