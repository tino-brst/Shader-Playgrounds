<template>
    <div class="tabs">
        <div
            class="tab"
            :class="{ selected: value === 'vertex', errors: vertexLog.errors.length, warnings: vertexLog.warnings.length }"
            @mousedown.prevent
            @click="updateValue('vertex')"
        >
            <span class="marker" />
            <span> Vertex </span>
            <span class="shortcut">
                ⌘ 1
            </span>
        </div>

        <div class="separator" />

        <div
            class="tab"
            :class="{ selected: value === 'fragment', errors: fragmentLog.errors.length, warnings: fragmentLog.warnings.length }"
            @mousedown.prevent
            @click="updateValue('fragment')"
        >
            <span class="marker" />
            <span> Fragment </span>
            <span class="shortcut">
                ⌘ 2
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import { mapState } from "vuex"

export default Vue.extend( {
    name: "Tabs",
    props: {
        value: {
            type: String,
            default: ""
        }
    },
    computed: mapState( [ "vertexLog", "fragmentLog" ] ),
    methods: {
        updateValue( value: string ) {
            if ( value !== this.value ) {
                this.$emit( "input", value )
            }
        }
    }
} )
</script>

<style scoped>
.tabs {
    user-select: none;
    z-index: 4;
    display: flex;
    flex-direction: row;
    align-items: center;
    flex: 0 0 30px;
    box-sizing: border-box;
    background: black;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0px 0px 30px rgba(0, 0, 0, 0.1);
}

.separator {
    width: 1px;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
}

.tab {
    height: 100%;
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(150, 150, 150);
    background: rgb(25, 25, 25);
    cursor: pointer;
    user-select: none;
    transition: all 0.1s;
    position: relative;
}
.tab:hover {
    background: rgb(30, 30, 30);
    color: rgb(220, 220, 220);
}
.tab.selected {
    color: white;
    background: rgb(60, 60, 60);
}

.tab .shortcut {
    opacity: 0;
    position: absolute;
    letter-spacing: 1px;
    font-weight: 600;
    right: 8px;
    transition: opacity 0.1s;
}
.tab:hover .shortcut {
    opacity: 0.4;
}

.tab .marker {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    position: absolute;
    left: 10px;
    opacity: 0;
    transform: scale(0.1);
    transition: all 0.2s;
}
.tab.errors .marker,
.tab.errors.warnings .marker {
    transform: none;
    opacity: 1;
    background: rgb(255, 59, 48);
}
.tab.warnings .marker {
    transform: none;
    opacity: 1;
    background: orange;
}

</style>
