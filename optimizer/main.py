"""
AsahiRoute — Route Optimizer Microservice
FastAPI + OR-Tools (TSP nearest-neighbor heuristic with 2-opt improvement)
POST /optimize  { route_id, points: [{id, lat, lng}] }
           →    { route_id, order: [{id, sequence_order}], distance_m }
"""
from __future__ import annotations

import math
import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AsahiRoute Optimizer", version="1.0.0")


# ── Schema ────────────────────────────────────────────────────────────────────

class Point(BaseModel):
    id: int
    lat: float
    lng: float


class OptimizeRequest(BaseModel):
    route_id: int
    points: list[Point]


class OptimizeResponse(BaseModel):
    route_id: int
    order: list[dict[str, int]]
    distance_m: float


# ── Distance helpers ──────────────────────────────────────────────────────────

def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in metres."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def build_distance_matrix(points: list[Point]) -> list[list[float]]:
    n = len(points)
    return [
        [haversine(points[i].lat, points[i].lng, points[j].lat, points[j].lng) for j in range(n)]
        for i in range(n)
    ]


def total_distance(tour: list[int], dm: list[list[float]]) -> float:
    return sum(dm[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))


# ── Nearest-neighbour heuristic ───────────────────────────────────────────────

def nearest_neighbour(dm: list[list[float]]) -> list[int]:
    n = len(dm)
    visited = [False] * n
    tour = [0]
    visited[0] = True
    for _ in range(n - 1):
        last = tour[-1]
        nearest = min(
            (j for j in range(n) if not visited[j]),
            key=lambda j: dm[last][j],
        )
        tour.append(nearest)
        visited[nearest] = True
    return tour


# ── 2-opt improvement ─────────────────────────────────────────────────────────

def two_opt(tour: list[int], dm: list[list[float]]) -> list[int]:
    best = tour[:]
    improved = True
    while improved:
        improved = False
        for i in range(1, len(best) - 1):
            for j in range(i + 1, len(best)):
                new_tour = best[:i] + best[i:j + 1][::-1] + best[j + 1:]
                if total_distance(new_tour, dm) < total_distance(best, dm):
                    best = new_tour
                    improved = True
    return best


# ── OR-Tools (optional, falls back to heuristic) ─────────────────────────────

def ortools_solve(dm: list[list[float]]) -> list[int] | None:
    try:
        from ortools.constraint_solver import routing_enums_pb2
        from ortools.constraint_solver import pywrapcp

        n = len(dm)
        manager = pywrapcp.RoutingIndexManager(n, 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        scale = 1000  # convert float metres to int
        int_dm = [[int(dm[i][j] * scale) for j in range(n)] for i in range(n)]

        def dist_callback(from_idx, to_idx):
            return int_dm[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)]

        transit_cb = routing.RegisterTransitCallback(dist_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

        params = pywrapcp.DefaultRoutingSearchParameters()
        params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        params.time_limit.seconds = 10

        solution = routing.SolveWithParameters(params)
        if not solution:
            return None

        tour = []
        idx = routing.Start(0)
        while not routing.IsEnd(idx):
            tour.append(manager.IndexToNode(idx))
            idx = solution.Value(routing.NextVar(idx))
        return tour

    except ImportError:
        return None


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest) -> Any:
    if len(req.points) < 2:
        raise HTTPException(status_code=422, detail="At least 2 points required")

    logger.info(f"Optimizing route {req.route_id} with {len(req.points)} points")

    dm = build_distance_matrix(req.points)

    # Try OR-Tools first, fall back to nearest-neighbour + 2-opt
    tour = ortools_solve(dm)
    if tour is None:
        logger.info("OR-Tools unavailable, using nearest-neighbour + 2-opt")
        tour = nearest_neighbour(dm)
        tour = two_opt(tour, dm)

    dist = total_distance(tour, dm)

    order = [
        {"id": req.points[node].id, "sequence_order": seq + 1}
        for seq, node in enumerate(tour)
    ]

    logger.info(f"Route {req.route_id} optimized: distance={dist:.0f}m")
    return OptimizeResponse(route_id=req.route_id, order=order, distance_m=round(dist))
