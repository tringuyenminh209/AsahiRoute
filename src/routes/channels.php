<?php

use Illuminate\Support\Facades\Broadcast;

// Private channel for a shop — accessible by users belonging to that shop
Broadcast::channel('shop.{shopId}', function ($user, $shopId) {
    return (int) $user->shop_id === (int) $shopId;
});

// Private channel for a specific delivery session
Broadcast::channel('delivery.{deliveryId}', function ($user, $deliveryId) {
    // Allow access to the deliverer or any admin of the same shop
    return $user->role === 'admin' ||
        \App\Models\DeliverySession::where('id', $deliveryId)
            ->where('user_id', $user->id)
            ->exists();
});
