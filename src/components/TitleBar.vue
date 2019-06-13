<template>
  <div
    class="title-bar"
    :class="{ edited }"
  >
    <span class="unsaved-changes"> edited - </span>
    <span class="title"> {{ fileName }} </span>
  </div>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend( {
  name: "TitleBar",
  props: {
    fileName: {
      type: String,
      default: ""
    },
    edited: {
      type: Boolean,
      default: false
    }
  }
} )
</script>

<style>
.title-bar {
  -webkit-app-region: drag;
  user-select: none;
  flex: 0 0 22px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: rgb(60,60,60);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.title-bar .title {
  color: rgba(255, 255, 255, 0.8);
  margin-left: 4px;
  margin-right: 8px;
}

.title-bar .unsaved-changes {
  color: rgba(255, 255, 255, 0.4);
  transform: translateX(2px);
  opacity: 0;
  transition: all 0.2s;
}

.title-bar.edited .unsaved-changes {
  transform: none;
  opacity: 1;
}
</style>
