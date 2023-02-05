export default function init() {
    return { isWebGLSupported };
}

export const isWebGLSupported = (function () {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl');
})();
