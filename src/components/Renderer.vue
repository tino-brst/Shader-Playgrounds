<template>
    <div class="renderer">
        <canvas ref="canvas" :class="{ visible: modelsLoaded && windowReady }" />
        <div v-if="windowReady" class="compilation-info" :class="{ visible: ! compilationSucceeded || ! compiledAtLeastOnce }">
            <transition name="fade">
                <div
                    class="never-compiled"
                    v-if="! compiledAtLeastOnce"
                    key="neverCompiled"
                >
                    <h1> Compile and Run </h1>
                    <h2> to see your shaders in action </h2>
                </div>
                <div
                    class="compilation-failed"
                    v-if="! compilationSucceeded"
                    key="compilationFailed"
                >
                    <h1> Compilation Failed </h1>
                    <h2> check for errors and warnings </h2>
                </div>
            </transition>
        </div>
        <div class="toolbar" @mousedown.prevent>
            <v-progress-bar :done="modelsLoaded && texturesLoaded" info="Loading models & textures" ref="progressBar" />
            <div class="toolbar-items">
                <v-model-select dropup v-model="model" :models="availableModels">
                    model:
                </v-model-select>
                <div class="toolbar-space-flex" />
                <v-checkbox v-model="animation">
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
        modelsLoaded: false,
        compiledAtLeastOnce: false
    } ),
    computed: {
        model: {
            get(): string {
                return this.$store.state.model
            },
            set( value: string ) {
                this.$store.commit( "SET_MODEL", value )
            }
        },
        animation: {
            get(): boolean {
                return this.$store.state.animation
            },
            set( value: boolean ) {
                this.$store.commit( "SET_ANIMATION", value )
            }
        },
        wireframe: {
            get(): boolean {
                return this.$store.state.wireframe
            },
            set( value: boolean ) {
                this.$store.commit( "SET_WIREFRAME", value )
            }
        },
        ...mapState( [
            "compilationSucceeded",
            "vertexSource",
            "fragmentSource",
            "languageVersion",
            "uniforms",
            "textureUnitToUpdate",
            "texturesLoaded",
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
        },
        animation() {
            this.renderer.setAnimation( this.animation )
        },
        wireframe() {
            this.renderer.setWireframe( this.wireframe )
        },
        languageVersion() {
            this.updateLanguageVersion()
        }
    },
    mounted() {
        this.renderer = new Renderer( this.$refs.canvas as HTMLCanvasElement, this.onModelsLoaded, this.onTexturesLoaded )

        // @ts-ignore
        this.$refs.progressBar.start()

        this.availableModels = this.renderer.getAvailableModels()
        this.model = this.availableModels[ 0 ].name
        this.renderer.setAnimation( this.animation )
        this.renderer.setWireframe( this.wireframe )

        this.$store.commit( "SET_AVAILABLE_TEXTURE_UNITS_COUNT", this.renderer.getAvailableTextureUnitsCount() )
        this.$store.commit( "SET_TEXTURES_ASSIGNED_TO_TEXTURE_UNITS", this.renderer.getTexturesAssignedToTextureUnits() )

        EventBus.$on( "compileAndRun", this.compileAndRun )
        EventBus.$on( "saveState", this.saveState )
        EventBus.$on( "loadState", this.loadState )
    },
    methods: {
        compileAndRun() {
            // @ts-ignore
            const compilationSucceeded = this.renderer.setShaderProgram( this.vertexSource, this.fragmentSource )
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            const uniformsEditors = this.renderer.getUniformsEditors()

            this.$store.commit( "SET_COMPILATION_SUCCEEDED", compilationSucceeded )
            this.$store.commit( "SET_LOGS", errorsAndWarnings )
            this.$store.commit( "SET_UNIFORMS_EDITORS", uniformsEditors )

            this.compiledAtLeastOnce = true
        },
        onModelsLoaded() {
            this.availableModels = this.renderer.getAvailableModels()
            this.modelsLoaded = true
            this.updateModel()
        },
        onTexturesLoaded() {
            this.$store.commit( "SET_TEXTURES_LOADED", true )
            this.$store.commit( "SET_AVAILABLE_TEXTURES", this.renderer.getAvailableTextures() )
        },
        updateModel() {
            this.renderer.setModel( this.model )

            // the model change may generate new warnings (e.g. missing attributes)
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            this.$store.commit( "SET_LOGS", errorsAndWarnings )
        },
        updateLanguageVersion() {
            // @ts-ignore
            this.renderer.setLanguageVersion( this.languageVersion )

            // the version change may generate new warnings (e.g. missing ins|attributes)
            const errorsAndWarnings = this.renderer.getErrorsAndWarnings()
            this.$store.commit( "SET_LOGS", errorsAndWarnings )
        },
        saveState() {
            this.$store.commit( "SET_UNIFORMS", this.renderer.getUniformsState() )
        },
        loadState() {
            // @ts-ignore
            this.renderer.setUniformsState( this.uniforms )
        }
    }
} )
</script>

<style>
.renderer {
    height: 100%;
    overflow: hidden;
    position: relative;
    background: rgb(20,20,20);
    display: flex;
    flex-direction: column;
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
    opacity: 0;
    background: rgba(0, 0, 0, 0.9);
    transition: opacity 0.3s ease;
}
.renderer .compilation-info.visible {
    opacity: 1;
}
.renderer .compilation-info > div {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}
.renderer .compilation-info h1 {
    font-size: 20px;
    font-weight: var(--font-weight);
    margin: 0;
    margin-bottom: 12px;
    opacity: 0.8;
}
.renderer .compilation-info h2 {
    font-size: 14px;
    font-weight: var(--font-weight);
    margin: 0;
    opacity: 0.5;
}

.fade-enter-active {
    transition: opacity 0.5s;
}
.fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}

.renderer canvas {
    flex-grow: 1;
    min-height: 0; /* default: auto */
    transform: scale( 0.8 );
    opacity: 0;
    z-index: 0;
    transition: transform 0.8s ease, opacity  0.8s ease;
}
.renderer canvas.visible {
    transform: none;
    opacity: 1;
}

.renderer .toolbar {
    position: relative;
    flex: 0 0 26px;
    padding-bottom: 1px;
    box-sizing: border-box;
    border-top: 1px solid rgb( 20, 20, 20 );
    background-color: rgb( 30, 30, 30 );
    z-index: 1;
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
