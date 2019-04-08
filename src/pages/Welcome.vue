<template>
    <div id="welcome">
        <span>Welcome to <i> Shaders Playground </i></span>
    </div>
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend( {
    name: "Welcome"
} )
</script>

<style>
@import "../styles/fonts.css";

html {
    height: 100%;
}

body {
    margin: 0;
    height: 100%;
    -webkit-font-smoothing: antialiased;
    font-family: IBM Plex Sans;
    font-size: 13px;
    font-weight: 500;
    color: white;
}

/* Window outline */
body::after {
    content: "";
    display: block;
    position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;
    box-sizing: border-box;
    border-radius: 5px;
    box-shadow: inset 0 0 0px 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
    z-index: 100;
}

#welcome {
    font-size: 20px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
