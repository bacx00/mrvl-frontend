<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://staging.mrvl.net', 
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://e4003c0a-8f1b-4723-a4c1-680f79fe84f6.preview.emergentagent.com'
    ],

    'allowed_origins_patterns' => [
        // CRITICAL FIX: Allow all Kubernetes/container domains
        '/^https?:\/\/.*\.emergentagent\.com$/',
        '/^https?:\/\/.*\.preview\..*$/',
        '/^https?:\/\/.*-.*-.*-.*-.*\..*\.emergentagent\.com$/',
        // Allow localhost variations
        '/^https?:\/\/localhost(:\d+)?$/',
        '/^https?:\/\/127\.0\.0\.1(:\d+)?$/',
        '/^https?:\/\/0\.0\.0\.0(:\d+)?$/',
    ],

    'allowed_headers' => [
        '*',
        'Accept',
        'Authorization', 
        'Content-Type',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
        'Origin',
        'Referer',
    ],

    'exposed_headers' => [
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN',
    ],

    'max_age' => 0,

    'supports_credentials' => true,

];