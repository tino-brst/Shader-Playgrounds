<template>
    <div class="renderer">
        <canvas ref="canvas" :class="{ visible: modelsLoaded && windowReady }" />
        <div class="compilation-info" :class="{ visible: ! compilationSucceeded }">
            <h1> Compilation Failed </h1>
            <h2> check for errors and warnings </h2>
        </div>
        <div class="toolbar">
            <v-progress-bar :done="modelsLoaded && texturesLoaded" info="loading models & textures" ref="progressBar" />
            <div class="toolbar-items">
                <v-model-select dropup v-model="model" :models="availableModels">
                    model:
                </v-model-select>
                <div class="toolbar-space-flex" />
                <v-checkbox v-model="animations">
                    <template slot="icon">
                        <v-refresh-cw-icon />
                    </template>
                </v-checkbox>
                <div class="toolbar-space" />
                <v-checkbox v-model="wireframe">
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
import { EventBus } from "@/event-bus"
import ModelSelect from "@/components/ModelSelect.vue"
import Checkbox from "@/components/Checkbox.vue"
import ProgressBar from "@/components/ProgressBar.vue"
import { Renderer, Model } from "@/scripts/renderer/Renderer"
import { mapState, mapGetters } from "vuex"
import { RendererState } from "@/store"
const { RefreshCwIcon, BoxIcon } = require( "vue-feather-icons" )

export default Vue.extend( {
    name: "Renderer",
    components: {
        "v-progress-bar": ProgressBar,
        "v-model-select": ModelSelect,
        "v-checkbox": Checkbox,
        "v-refresh-cw-icon": RefreshCwIcon,
        "v-box-icon": BoxIcon
    },
    data: () => ( {
        renderer: {} as Renderer,
        availableModels: [] as Model[],
        model: "",
        animations: true,
        wireframe: true,
        modelsLoaded: false,
        texturesLoaded: false
    } ),
    computed: {
        ...mapState( [
            "compilationSucceeded",
            "rendererState",
            "rendererClean",
            "vertex",
            "fragment",
            "textureUnitToUpdate",
            "windowReady"
        ] )
    },
    watch: {
        textureUnitToUpdate() {
            // @ts-ignore
            if ( this.renderer.setTextureForUnit( this.textureUnitToUpdate.texture, this.textureUnitToUpdate.unit ) ) {
                // @ts-ignore
                this.$store.commit( "SET_TEXTURE_ASSIGNED_TO_TEXTURE_UNIT", this.textureUnitToUpdate )
            }
        },
        model() {
            this.updateModel()

            // @ts-ignore
            if ( this.rendererClean ) {
                // @ts-ignore
                const lastSaveModel = this.rendererState.model
                if ( ( lastSaveModel !== undefined ) && ( lastSaveModel !== this.model ) ) {
                    this.$store.commit( "MARK_RENDERER_DIRTY" )
                }
            }
        },
        animations() {
            this.renderer.setAnimation( this.animations )

            // @ts-ignore
            if ( this.rendererClean ) {
                // @ts-ignore
                const lastSaveAnimations = this.rendererState.animations
                if ( ( lastSaveAnimations !== undefined ) && ( lastSaveAnimations !== this.animations ) ) {
                    this.$store.commit( "MARK_RENDERER_DIRTY" )
                }
            }
        },
        wireframe() {
            this.renderer.setWireframe( this.wireframe )

            // @ts-ignore
            if ( this.rendererClean ) {
                // @ts-ignore
                const lastSaveWireframe = this.rendererState.wireframe
                if ( ( lastSaveWireframe !== undefined ) && ( lastSaveWireframe !== this.wireframe ) ) {
                    this.$store.commit( "MARK_RENDERER_DIRTY" )
                }
            }
        }
    },
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement, this.onModelsLoaded, this.onTexturesLoaded )

        // @ts-ignore
        this.$refs.progressBar.start()

        this.availableModels = this.renderer.getAvailableModels()
        this.model = this.availableModels[ 0 ].name
        this.animations = true
        this.wireframe = true

        this.$store.commit( "SET_TEXTURES_ASSIGNED_TO_TEXTURE_UNITS", this.renderer.getTexturesAssignedToTextureUnits() )

        EventBus.$on( "compileAndRun", this.compileAndRun )
        EventBus.$on( "commitState", this.commitState )
        EventBus.$on( "loadState", this.loadState )
    },
    methods: {
        compileAndRun() {
            // @ts-ignore
            const compilationSucceeded = this.renderer.setShaderProgram( this.vertex, this.fragment )
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            const uniformsEditors = this.renderer.getUniformsEditors()

            this.$store.commit( "SET_COMPILATION_SUCCEEDED", compilationSucceeded )
            this.$store.commit( "SET_LOGS", errorsAndWarnings )
            this.$store.commit( "SET_UNIFORMS_EDITORS", uniformsEditors )
        },
        updateModel() {
            this.renderer.setModel( this.model )

            // the model change may generate new warnings (e.g. missing attributes)
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            this.$store.commit( "SET_LOGS", errorsAndWarnings )
        },
        onModelsLoaded() {
            this.availableModels = this.renderer.getAvailableModels()
            this.modelsLoaded = true
            this.updateModel()
        },
        onTexturesLoaded() {
            this.$store.commit( "SET_AVAILABLE_TEXTURES", this.renderer.getAvailableTextures() )
            this.texturesLoaded = true
        },
        commitState() {
            const rendererState: RendererState = {
                model: this.model,
                animations: this.animations,
                wireframe: this.wireframe,
                uniforms: this.renderer.getUniformsState()
            }

            this.$store.commit( "SET_RENDERER_STATE", rendererState )
        },
        loadState() {
            // @ts-ignore
            this.model = this.rendererState.model
            // @ts-ignore
            this.animations = this.rendererState.animations
            // @ts-ignore
            this.wireframe = this.rendererState.wireframe
            // @ts-ignore
            this.renderer.setUniformsState( this.rendererState.uniforms )
        }
    }
} )
</script>

<style>
.renderer {
    height: 100%;
    overflow: hidden;
    position: relative;
    background: rgb(8, 8, 8);
}

.renderer .compilation-info {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0; left: 0;
    box-sizing: border-box;
    padding-bottom: 26px; /* toolbar */
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    opacity: 0;
    background: rgba(0, 0, 0, 0.8);
    transition: opacity 0.3s ease;
}
.renderer .compilation-info h1 {
    font-size: 20px;
    font-weight: 500;
    margin: 0;
    margin-bottom: 12px;
    opacity: 0.8;
}
.renderer .compilation-info h2 {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    opacity: 0.5;
}
.renderer .compilation-info.visible {
    opacity: 1;
}

.renderer canvas {
    height: 100%;
    width: 100%;
    transform: scale( 0.8 );
    opacity: 0;
    transition: transform 0.8s ease, opacity  0.8s ease;
}
.renderer canvas.visible {
    transform: none;
    opacity: 1;
}

.renderer .toolbar {
    position: absolute;
    height: 26px;
    left: 0;
    right: 0;
    bottom: 0;
    padding-bottom: 1px;
    box-sizing: border-box;
    border-top: 1px solid rgb( 20, 20, 20 );
    background-color: rgb( 30, 30, 30 );
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
</style>
