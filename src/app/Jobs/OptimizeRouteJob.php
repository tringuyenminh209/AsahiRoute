<?php

namespace App\Jobs;

use App\Models\Route;
use App\Models\RoutePoint;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OptimizeRouteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        public readonly int $routeId,
    ) {}

    public function handle(): void
    {
        $route = Route::with([
            'routePoints.subscriber',
        ])->findOrFail($this->routeId);

        // Build payload for Python optimizer
        $points = $route->routePoints->map(fn($p) => [
            'id'  => $p->id,
            'lat' => $p->subscriber->lat,
            'lng' => $p->subscriber->lng,
        ])->toArray();

        if (count($points) < 2) {
            Log::info("OptimizeRouteJob: route {$this->routeId} has < 2 points, skipping");
            return;
        }

        $optimizerUrl = config('services.optimizer.url', env('OPTIMIZER_URL', 'http://optimizer:8000'));

        try {
            $response = Http::timeout(55)
                ->post("{$optimizerUrl}/optimize", [
                    'route_id' => $this->routeId,
                    'points'   => $points,
                ]);

            if ($response->failed()) {
                Log::error("OptimizeRouteJob: optimizer returned {$response->status()} for route {$this->routeId}");
                $this->fail($response->body());
                return;
            }

            $result = $response->json();
            $this->applyOptimizedOrder($route, $result['order'] ?? []);

        } catch (\Exception $e) {
            Log::error("OptimizeRouteJob: exception for route {$this->routeId}: {$e->getMessage()}");
            $this->fail($e);
        }
    }

    private function applyOptimizedOrder(Route $route, array $order): void
    {
        if (empty($order)) {
            return;
        }

        // $order = [['id' => pointId, 'sequence_order' => newSeq], ...]
        \Illuminate\Support\Facades\DB::transaction(function () use ($route, $order) {
            foreach ($order as $item) {
                RoutePoint::where('id', $item['id'])
                    ->where('route_id', $route->id)
                    ->update(['sequence_order' => $item['sequence_order']]);
            }

            $route->update(['optimized_at' => now()]);
        });

        Log::info("OptimizeRouteJob: route {$route->id} optimized — {$route->routePoints->count()} points reordered");
    }
}
