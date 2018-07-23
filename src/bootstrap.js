try {
    if (typeof jQuery === 'undefined') {
        window.$ = window.jQuery = require('jquery/dist/jquery.slim')
        /*
        * @see CallUsWidget.js@init
        * */
    }
} catch (e) {}