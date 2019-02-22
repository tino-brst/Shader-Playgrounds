<template>
    <div class="renderer">
        <canvas ref="canvas" />
        <div class="toolbar">
            <v-progress-bar :loading="loading" :done="loadingDone" />
            <span class="loading-info" :class="{ visible: loading && ! loadingDone } "> loading models & textures </span>
            <div class="toolbar-items">
                <v-select dropup v-model="selectedModel" :options="availableModels">
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
    </div>
</template>

<script lang="ts">
import Vue from "vue"
import Select from "@/components/Select.vue"
import Checkbox from "@/components/Checkbox.vue"
import ProgressBar from "@/components/ProgressBar.vue"
import { Renderer } from "@/scripts/renderer/Renderer"
import { mapState } from "vuex"
const { RefreshCwIcon, BoxIcon } = require( "vue-feather-icons" )

const RUN_KEY = "t"

export default Vue.extend( {
    name: "Renderer",
    components: {
        "v-progress-bar": ProgressBar,
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
        wireframeEnabled: false as boolean,
        loading: false,
        modelsLoaded: false,
        texturesLoaded: false
    } ),
    computed: {
        loadingDone(): boolean {
            return this.modelsLoaded && this.texturesLoaded
        },
        ...mapState( [ "textureUnitToUpdate" ] )
    },
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
        },
        textureUnitToUpdate( newValue: { unit: number, texture: string } ) {
            if ( this.renderer.setTextureForUnit( newValue.texture, newValue.unit ) ) {
                this.$store.commit( "updateTextureAssignedToTextureUnit", newValue )
            }
        }
    },
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement, this.onGeometriesLoaded, this.onTexturesLoaded )
        this.availableModels = this.renderer.getAvailableModels()
        this.selectedModel = this.availableModels[ 0 ]
        this.wireframeEnabled = false
        this.loading = true
        this.$store.commit( "updateTexturesAssignedToTextureUnits", this.renderer.getTexturesAssignedToTextureUnits() )
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
        },
        onGeometriesLoaded() {
            this.availableModels = this.renderer.getAvailableModels()
            this.modelsLoaded = true
        },
        onTexturesLoaded() {
            this.$store.commit( "updateAvailableTextures", this.renderer.getAvailableTextures() )
            this.texturesLoaded = true
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
    height: 25px;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid rgb( 20, 20, 20 );
    z-index: 1;
    pointer-events: none;
}
.renderer .toolbar::after { /* light inner border */
    content: "";
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    position: absolute;
    background-color: rgba( 255, 255, 255, 0.08 );
}
.renderer .toolbar::before { /* gaussian blur background */
    content: "";
    left: 0; top: 0; right: 0; bottom: 0;
    position: absolute;
    background-color: rgba( 30, 30, 30, 0.9 );
    backdrop-filter: saturate(180%) blur(15px);
    z-index: 0;
}

.renderer .toolbar-items {
    height: 100%;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 8px;
    padding-right: 8px;
}
.renderer .toolbar-items > * {
    z-index: 1;
}

.renderer .toolbar-items .toolbar-space {
    flex: 0 0 10px;
}
.renderer .toolbar-items .toolbar-space-flex {
    flex-grow: 1;
}

.renderer .toolbar .loading-info {
    position: absolute;
    top: -32px;
    left: 8px;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(120, 120, 120, 0.8);
    color: rgba(0, 0, 0, 0.9);
    z-index: -1;
    transition: all 0.5s;
    opacity: 0;
}
.renderer .toolbar .loading-info.visible {
    opacity: 1;
}
</style>
