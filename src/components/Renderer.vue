<template>
    <div class="renderer" :class="{ loading: ! modelsLoaded }">
        <canvas ref="canvas" />
        <div class="toolbar">
            <v-progress-bar :started="loading" :finished="modelsLoaded && texturesLoaded" />
            <span class="loading-info" :class="{ visible: loading && ! ( modelsLoaded && texturesLoaded ) } "> loading models & textures </span>
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
        loading: false,
        modelsLoaded: false,
        texturesLoaded: false
    } ),
    computed: {
        ...mapState( [ "rendererState", "rendererClean", "vertex", "fragment", "textureUnitToUpdate" ] )
    },
    watch: {
        textureUnitToUpdate() {
            if ( this.renderer.setTextureForUnit( this.textureUnitToUpdate.texture, this.textureUnitToUpdate.unit ) ) {
                this.$store.commit( "updateTextureAssignedToTextureUnit", this.textureUnitToUpdate )
            }
        },
        model() {
            this.renderer.setModel( this.model )
            this.updateErrorsAndWarnings()

            if ( this.rendererClean ) {
                const lastSaveModel = this.rendererState.model
                if ( ( lastSaveModel !== undefined ) && ( lastSaveModel !== this.model ) ) {
                    this.$store.commit( "markRendererDirty" )
                }
            }
        },
        animations() {
            this.renderer.setAnimation( this.animations )

            if ( this.rendererClean ) {
                const lastSaveAnimations = this.rendererState.animations
                if ( ( lastSaveAnimations !== undefined ) && ( lastSaveAnimations !== this.animations ) ) {
                    this.$store.commit( "markRendererDirty" )
                }
            }
        },
        wireframe() {
            this.renderer.setWireframe( this.wireframe )

            if ( this.rendererClean ) {
                const lastSaveWireframe = this.rendererState.wireframe
                if ( ( lastSaveWireframe !== undefined ) && ( lastSaveWireframe !== this.wireframe ) ) {
                    this.$store.commit( "markRendererDirty" )
                }
            }
        }
    },
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement, this.onGeometriesLoaded, this.onTexturesLoaded )
        this.loading = true

        this.availableModels = this.renderer.getAvailableModels()
        this.model = this.availableModels[ 0 ].name
        this.animations = true
        this.wireframe = true

        this.$store.commit( "updateTexturesAssignedToTextureUnits", this.renderer.getTexturesAssignedToTextureUnits() )

        EventBus.$on( "compileAndRun", this.compileAndRun )
        EventBus.$on( "commitState", this.commitState )
        EventBus.$on( "loadState", this.loadState )
    },
    methods: {
        compileAndRun() {
            this.renderer.setShaderProgram( this.vertex, this.fragment )
            this.updateErrorsAndWarnings()
            this.updateUniformsEditors()
        },
        updateErrorsAndWarnings() {
            this.$store.commit( "updateLog", this.renderer.getErrorsAndWarnings() )
        },
        updateUniformsEditors() {
            this.$store.commit( "updateUniformsEditors", this.renderer.getUniformsEditors() )
        },
        onGeometriesLoaded() {
            this.availableModels = this.renderer.getAvailableModels()
            this.modelsLoaded = true

            this.renderer.setModel( this.model )
            this.updateErrorsAndWarnings()
        },
        onTexturesLoaded() {
            this.$store.commit( "updateAvailableTextures", this.renderer.getAvailableTextures() )
            this.texturesLoaded = true
        },
        commitState() {
            const rendererState: RendererState = {
                model: this.model,
                animations: this.animations,
                wireframe: this.wireframe,
                uniforms: this.renderer.getUniformsState()
            }

            this.$store.commit( "updateRendererState", rendererState )
        },
        loadState() {
            this.model = this.rendererState.model
            this.animations = this.rendererState.animations
            this.wireframe = this.rendererState.wireframe
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
}

.renderer canvas {
    height: 100%;
    width: 100%;
    transition: all 0.5s ease;
}

.renderer.loading canvas {
    transform: scale( 0.8 );
    opacity: 0;
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
