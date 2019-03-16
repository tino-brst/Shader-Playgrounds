<template>
    <router-view />
</template>

<style>
@import "styles/fonts.css";

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

/* macOS window outline - if not used: delete unnecessary bottom padding on renderer-toolbar & statusbar */
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
</style>
