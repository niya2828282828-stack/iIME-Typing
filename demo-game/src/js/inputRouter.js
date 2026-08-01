// src/js/inputRouter.js

window.enableIIME = function () {
    window.isImeEnabled = true;

    if (typeof clearAllBuffers === "function") {
        clearAllBuffers();
    }
};

window.disableIIME = function () {
    window.isImeEnabled = false;

    if (typeof clearAllBuffers === "function") {
        clearAllBuffers();
    }
};