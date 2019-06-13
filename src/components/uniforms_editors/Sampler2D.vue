<template>
  <div class="uniform-editor sampler2D">
    <div class="texture-units">
      <span> Texture Unit: </span>
      <div class="unit-numbers">
        <div
          v-for="unitNumber in availableTextureUnitsCount"
          class="unit-number"
          :class="{ selected: selectedUnit === unitNumber - 1}"
          :key="unitNumber - 1"
          @click="selectUnit( unitNumber - 1 )"
        >
          <span> {{ unitNumber - 1 }} </span>
        </div>
      </div>
    </div>
    <div class="textures-container">
      <transition-group name="fade">
        <div
          v-show="texturesLoaded"
          class="textures"
          :class="{ 'highlight-selected': highlightSelected }"
          key="loaded"
        >
          <div
            v-for="texture in availableTextures"
            class="texture-cell"
            :class="{ selected: texture === texturesAssignedToTextureUnits[ selectedUnit ] }"
            :key="texture"
          >
            <div
              class="texture"
              @click="updateTextureUnit( selectedUnit, texture )"
            >
              <div class="image-container">
                <img :src="`/assets/textures/thumbnails/${ texture }.jpg`">
              </div>
              <span> {{ texture }} </span>
            </div>
          </div>
        </div>
        <div
          v-show="! texturesLoaded"
          class="loading"
          key="loading"
        >
          <span> Loading textures ... </span>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts">
import '@/styles/uniform_editor.css'
import Vue from 'vue'
import { UniformEditor } from '@/scripts/renderer/UniformEditor'
import { mapState } from 'vuex'
import { clearTimeout } from 'timers'

export default Vue.extend({
  name: 'UniformEditorSampler2D',
  props: {
    editor: {
      type: Object as () => UniformEditor,
      default: null
    }
  },
  data: () => ({
    selectedUnit: 0,
    highlightSelected: false,
    highlightSelectedTimeout: null as any
  }),
  computed: mapState([
    'availableTextures',
    'availableTextureUnitsCount',
    'texturesAssignedToTextureUnits',
    'texturesLoaded'
  ]),
  watch: {
    selectedUnit () {
      this.editor.setValue(this.selectedUnit)
    },
    editor () {
      this.selectedUnit = this.editor.getValue()
    }
  },
  activated () {
    this.selectedUnit = this.editor.getValue()
  },
  methods: {
    updateTextureUnit (unit: number, texture: string) {
      this.$store.commit('SET_TEXTURE_UNIT_TO_UPDATE', { unit, texture })
    },
    selectUnit (unit: number) {
      const previousTexture = this.texturesAssignedToTextureUnits[ this.selectedUnit ]
      const newTexture = this.texturesAssignedToTextureUnits[ unit ]
      const textureUnchanged = (previousTexture === newTexture)
      const unitChanged = this.selectedUnit !== unit

      if (textureUnchanged || unitChanged) {
        this.highlightSelected = true
        clearTimeout(this.highlightSelectedTimeout)
        this.highlightSelectedTimeout = setTimeout(() => {
          this.highlightSelected = false
        }, 200)
      }

      this.selectedUnit = unit
    }
  }
})
</script>

<style>
.uniform-editor {
  background: rgb(45, 45, 45);
}

.uniform-editor.sampler2D {
  height: 220px;
  width: 320px;
  flex-direction: column;
  font-family: system-ui;
}

.uniform-editor.sampler2D .texture-units {
  flex: 0 0 28px;
  width: 100%;
  z-index: 0;
  position: relative;
  background: rgb(60, 60, 60);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(50, 50, 50);
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
}
/* borde inferior */
.uniform-editor.sampler2D .texture-units::after {
  position: absolute;
  bottom: 0;
  content: "";
  height: 1px;
  width: 100%;
  background: white;
  opacity: 0.1;
}

.uniform-editor.sampler2D .texture-units > span {
  margin-left: 10px;
  font-size: 13px;
}

.uniform-editor.sampler2D .texture-units .unit-numbers {
  height: 100%;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
}

.uniform-editor.sampler2D .unit-number {
  height: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
}
.uniform-editor.sampler2D .unit-number span {
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

.uniform-editor.sampler2D .unit-number.selected {
  background: royalblue;
}
.uniform-editor.sampler2D .unit-number.selected span {
  opacity: 1;
}

.uniform-editor.sampler2D .unit-number:hover:not(.selected) {
  background: rgba(255, 255, 255, 0.05);
}
.uniform-editor.sampler2D .unit-number:hover:not(.selected) span {
  opacity: 0.9;
}

.uniform-editor.sampler2D .textures-container {
  width: 100%;
  height: 100%;
  flex-grow: 1;
  overflow-y: auto;
}

.uniform-editor.sampler2D .textures-container .loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
  font-size: 15px;
}

.uniform-editor.sampler2D .textures {
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  box-sizing: border-box;
  padding: 8px;
}

.uniform-editor.sampler2D .texture-cell {
  flex: 0 0 33.333%;
  display: flex;
  justify-content: center;
  align-items: stretch;
  padding: 8px 8px 24px 8px;
  box-sizing: border-box;
}
.uniform-editor.sampler2D .texture-cell:before {
  content: '';
  display: table;
  padding-top: 100%;
}

.uniform-editor.sampler2D .texture {
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
}

.uniform-editor.sampler2D .texture .image-container {
  width: 100%;
  padding-bottom: 100%;
  position: relative;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.2);
}
.uniform-editor.sampler2D .texture .image-container::before {
  content: "";
  position: absolute;
  border-radius: 3px;
  border: 4px solid rgba( 0, 0, 0, 0);
  background: rgba( 0, 0, 0, 0);
  width: 100%;
  height: 100%;
  top: -4px;
  left: -4px;
  pointer-events: none;
  opacity: 0;
  transition: filter 0.15s, transform 0.15s ease-out;
}
.uniform-editor.sampler2D .texture .image-container::after {
  content: "";
  position: absolute;
  box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.25);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.uniform-editor.sampler2D .texture .image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position:absolute;
}

.uniform-editor.sampler2D .texture span {
  position: absolute;
  top: 100%;
  padding-top: 4px;
  display: block;
  max-width: 100%;
  font-size: 13px;
  opacity: 0.5;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.1s;
}

/* texture hover */
.uniform-editor.sampler2D .texture-cell:hover .image-container::before {
  border: 4px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}
.uniform-editor.sampler2D .texture-cell:hover span {
  opacity: 1;
}

/* texture selected */
.uniform-editor.sampler2D .texture-cell.selected .image-container::before {
  border: 4px solid royalblue;
  background: royalblue;
  opacity: 1;
}
.uniform-editor.sampler2D .texture-cell.selected span {
  opacity: 1;
}

/* texture highlight-selected (mejora el feedback ante la interaccion) */
.uniform-editor.sampler2D .textures.highlight-selected .texture-cell.selected .image-container::before {
  transform: scale(1.03);
  filter: brightness(1.2);
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

</style>
