<?php

return [

    'default' => env('BROADCAST_CONNECTION', 'null'),

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key'    => env('PUSHER_APP_KEY', 'asahi-key'),
            'secret' => env('PUSHER_APP_SECRET', 'asahi-secret'),
            'app_id' => env('PUSHER_APP_ID', 'asahi-app'),
            'options' => [
                'cluster'   => env('PUSHER_APP_CLUSTER', 'mt1'),
                'host'      => env('PUSHER_HOST', '127.0.0.1'),
                'port'      => env('PUSHER_PORT', 6001),
                'scheme'    => env('PUSHER_SCHEME', 'http'),
                'encrypted' => true,
                'useTLS'    => env('PUSHER_SCHEME', 'http') === 'https',
            ],
            'client_options' => [],
        ],

        'ably' => [
            'driver' => 'ably',
            'key'    => env('ABLY_KEY'),
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
