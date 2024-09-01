import 'js-loading-overlay'

function initializeLoadingOverlay() {
    JsLoadingOverlay.setOptions({
        spinnerIcon: 'ball-pulse-sync',
        'overlayBackgroundColor': '#000000',
        'overlayOpacity': 0.6,
        'spinnerColor': '#ffffff',
        'spinnerSize': '3x', // Tamaño del spinner
        'spinnerIconColor': '#ffffff',
        'lockScroll': true,
    })
}

function showLoadingOverlay() {
    JsLoadingOverlay.show()
}

function hideLoadingOverlay() {
    JsLoadingOverlay.hide()
}

export { initializeLoadingOverlay, showLoadingOverlay, hideLoadingOverlay }