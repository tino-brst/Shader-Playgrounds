<template>
    <div class="uniform-editor sampler2D">
        <div class="texture-units">
            <div v-for="( texture, unitNumber ) in texturesAssignedToTextureUnits" :key="unitNumber">
                <input type="radio" :id="unitNumber" :value="unitNumber" v-model="selectedUnit">
                <label :for="unitNumber"> unit {{ unitNumber }} </label>
            </div>
        </div>
        <div class="textures">
            <img
                v-for="texture in availableTextures"
                :key="texture"
                :src="`/assets/textures/thumbnails/${ texture }.jpg`"
                :class="{ selected: texture === texturesAssignedToTextureUnits[ selectedUnit ] }"
                @click="updateTextureUnit( selectedUnit, texture )"
            >
        </div>
    </div>
</template>

<script lang="ts">
import "@/styles/uniform_editor.css"
import Vue from "vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"
import { mapState } from "vuex"

export default Vue.extend( {
    name: "UniformEditorSampler2D",
    props: {
        editor: {
            type: Object as () => UniformEditor,
            default: null
        }
    },
    data: () => ( {
        selectedUnit: 0 as number
    } ),
    computed: mapState( [ "availableTextures", "texturesAssignedToTextureUnits" ] ),
    watch: {
        selectedUnit() {
            this.editor.setValue( this.selectedUnit )
        },
        editor() {
            this.selectedUnit = this.editor.getValue()
        }
    },
    mounted() {
        this.selectedUnit = this.editor.getValue()
    },
    methods: {
        updateTextureUnit( unit: number, texture: string ) {
            this.$store.commit( "setTextureUnitForUpdate", { unit, texture } )
        }
    }
} )
</script>

<style>
.uniform-editor.sampler2D {
    height: 200px;
}

.uniform-editor.sampler2D .texture-units {
    height: 100%;
    overflow: auto;
}

.uniform-editor.sampler2D .textures {
    height: 100%;
    display: flex;
    align-items: flex-start;
}

.uniform-editor.sampler2D .textures img {
    width: 60px;
    height: 60px;
    margin: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}
.uniform-editor.sampler2D .textures img.selected {
    border: 2px solid white;
}
</style>
