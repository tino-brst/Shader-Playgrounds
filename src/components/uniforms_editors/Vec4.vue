<template>
  <div class="uniform-editor vec4">
    <v-float-input
      v-model="x"
      label="x"
    />
    <div class="separator" />
    <v-float-input
      v-model="y"
      label="y"
    />
    <div class="separator" />
    <v-float-input
      v-model="z"
      label="z"
    />
    <div class="separator" />
    <v-float-input
      v-model="w"
      label="w"
    />
  </div>
</template>

<script lang="ts">
import "@/styles/uniform_editor.css"
import Vue from "vue"
import FloatInput from "@/components/FloatInput.vue"
import { UniformEditor } from "@/scripts/renderer/UniformEditor"

export default Vue.extend( {
  name: "UniformEditorVec4",
  components: {
    "v-float-input": FloatInput
  },
  props: {
    editor: {
      type: Object as () => UniformEditor,
      default: null
    }
  },
  data: () => ( {
    x: 0 as number,
    y: 0 as number,
    z: 0 as number,
    w: 0 as number,
    vec4: new Float32Array( 4 )
  } ),
  computed: {
  },
  watch: {
    x() {
      this.vec4[ 0 ] = this.x
      this.editor.setValue( this.vec4 )
    },
    y() {
      this.vec4[ 1 ] = this.y
      this.editor.setValue( this.vec4 )
    },
    z() {
      this.vec4[ 2 ] = this.z
      this.editor.setValue( this.vec4 )
    },
    w() {
      this.vec4[ 3 ] = this.w
      this.editor.setValue( this.vec4 )
    },
    editor() {
      this.loadValue()
    }
  },
  activated() {
    this.loadValue()
  },
  methods: {
    loadValue() {
      this.vec4 = this.editor.getValue() as Float32Array
      [ this.x, this.y, this.z, this.w ] = this.vec4
    }
  }
} )
</script>
