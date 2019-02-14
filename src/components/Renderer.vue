<template>
    <div class="renderer">
        <canvas ref="canvas" />
        <div class="toolbar">
            <v-select
                autohide
                dropup
                v-model="selectedModel"
                :options="availableModels"
            >
                model:
            </v-select>
            <div class="toolbar-space-flex" />
            <v-checkbox v-model="animationsEnabled">
                <template slot="icon">
                    <v-refresh-cw-icon />
                </template>
            </v-checkbox>
            <div class="toolbar-space" />
            <v-checkbox v-model="wireframeEnabled">
                <template slot="icon">
                    <v-box-icon />
                </template>
            </v-checkbox>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Select from "@/components/Select.vue"
import Checkbox from "@/components/Checkbox.vue"
import { Renderer } from "@/scripts/renderer/Renderer"
const { RefreshCwIcon, BoxIcon } = require( "vue-feather-icons" )

const RUN_KEY = "t"

export default Vue.extend( {
    name: "Renderer",
    components: {
        "v-select": Select,
        "v-checkbox": Checkbox,
        "v-refresh-cw-icon": RefreshCwIcon,
        "v-box-icon": BoxIcon
    },
    props: {
        vertex: {
            type: String,
            default: ""
        },
        fragment: {
            type: String,
            default: ""
        }
    },
    data: () => ( {
        renderer: {} as Renderer,
        availableModels: [] as string[],
        selectedModel: "" as string,
        animationsEnabled: true as boolean,
        wireframeEnabled: false as boolean
    } ),
    watch: {
        // ⚠️ revisar que mas hacia falta chequear ante cambios en modelo
        selectedModel( newModel: string ) {
            this.renderer.setModel( this.selectedModel )
            this.updateErrorsAndWarnings()
        },
        animationsEnabled( newValue: boolean ) {
            this.renderer.setAnimations( newValue )
        },
        wireframeEnabled( newValue: boolean ) {
            this.renderer.setWireframe( newValue )
        }
    },
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement )
        this.availableModels = this.renderer.getAvailableModels().map( model => model.name )
        this.selectedModel = this.availableModels[ 0 ]
        this.wireframeEnabled = false
        this.compileAndRun()

        window.addEventListener( "keydown", this.handleRunKey )
    },
    methods: {
        handleRunKey( event: KeyboardEvent ) {
            if ( event.metaKey === true && event.key === RUN_KEY ) {
                this.compileAndRun()
            }
        },
        compileAndRun() {
            this.renderer.setShaderProgram( this.vertex, this.fragment )
            this.updateErrorsAndWarnings()
            this.updateUniformsEditors()
        },
        updateErrorsAndWarnings() {
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            this.$store.commit( "updateLog", errorsAndWarnings )
        },
        updateUniformsEditors() {
            const uniformsEditors = this.renderer.getUniformsEditors()
            this.$store.commit( "updateUniformsEditors", uniformsEditors )
        }
    }
} )
</script>

<style>
.renderer {
    height: 100%;
    overflow: hidden;
    position: relative;
}

.renderer canvas {
    height: 100%;
    width: 100%;
}

.renderer .toolbar {
    position: absolute;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 25px;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid rgb( 20, 20, 20 );
    padding-left: 8px;
    padding-right: 8px;
}
.renderer .toolbar:last-child::after { /* light inner border */
    content: "";
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    position: absolute;
    background-color: rgba( 255, 255, 255, 0.08 );
}
.renderer .toolbar:last-child::before { /* light inner border */
    content: "";
    left: 0; top: 0; right: 0; bottom: 0;
    position: absolute;
    background-color: rgba( 30, 30, 30, 0.9 );
    backdrop-filter: saturate(180%) blur(15px);
    z-index: 0;
}
.renderer .toolbar > * {
    z-index: 1;
}

.renderer .toolbar .toolbar-space {
    flex: 0 0 10px;
}
.renderer .toolbar .toolbar-space-flex {
    flex-grow: 1;
}

</style>
