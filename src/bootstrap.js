try {
    if (typeof jQuery === 'undefined') {
        window.$ = window.jQuery = require('jquery')
        /*
        * https://stackoverflow.com/a/14768682
        * */
        if (typeof $().emulateTransitionEnd !== 'function' && typeof $().modal !== 'function') {
            require('bootstrap-sass/assets/javascripts/bootstrap/transition')
            require('bootstrap-sass/assets/javascripts/bootstrap/modal')
        }
    }
} catch (e) {}