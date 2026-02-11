"""Maze generator using recursive backtracking (depth-first search with a stack)."""

from __future__ import annotations

from dataclasses import dataclass
from random import Random
from typing import List


@dataclass
class Cell:
    """A maze cell with walls on each side and a visited flag."""

    top: bool = True
    right: bool = True
    bottom: bool = True
    left: bool = True
    visited: bool = False


Grid = List[List[Cell]]


def _unvisited_neighbors(grid: Grid, row: int, col: int) -> list[tuple[int, int, str]]:
    """Return unvisited neighboring cells and their relative direction from (row, col)."""

    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    neighbors: list[tuple[int, int, str]] = []

    candidates = [
        (row - 1, col, "top"),
        (row, col + 1, "right"),
        (row + 1, col, "bottom"),
        (row, col - 1, "left"),
    ]

    for nr, nc, direction in candidates:
        if 0 <= nr < rows and 0 <= nc < cols and not grid[nr][nc].visited:
            neighbors.append((nr, nc, direction))

    return neighbors


def _remove_wall_between(current: Cell, neighbor: Cell, direction: str) -> None:
    """Remove walls between current cell and a selected neighbor."""

    if direction == "top":
        current.top = False
        neighbor.bottom = False
    elif direction == "right":
        current.right = False
        neighbor.left = False
    elif direction == "bottom":
        current.bottom = False
        neighbor.top = False
    elif direction == "left":
        current.left = False
        neighbor.right = False
    else:
        raise ValueError(f"Unsupported direction: {direction}")


def generate_maze(rows: int, cols: int, seed: int | None = None) -> Grid:
    """Generate a maze with DFS backtracking and return the grid of cells.

    The returned structure is a 2D matrix where each cell keeps:
    - wall booleans: top/right/bottom/left
    - visited flag
    """

    if rows <= 0 or cols <= 0:
        raise ValueError("rows and cols must both be > 0")

    rng = Random(seed)
    grid: Grid = [[Cell() for _ in range(cols)] for _ in range(rows)]

    # 1) Choose random starting cell and mark it as visited.
    current_row = rng.randrange(rows)
    current_col = rng.randrange(cols)
    grid[current_row][current_col].visited = True

    # 2) Process cells via stack-based backtracking.
    stack: list[tuple[int, int]] = [(current_row, current_col)]

    while stack:
        current_row, current_col = stack[-1]
        current_cell = grid[current_row][current_col]

        neighbors = _unvisited_neighbors(grid, current_row, current_col)

        if neighbors:
            # Select random unvisited neighbor and carve passage.
            next_row, next_col, direction = rng.choice(neighbors)
            next_cell = grid[next_row][next_col]

            _remove_wall_between(current_cell, next_cell, direction)
            next_cell.visited = True
            stack.append((next_row, next_col))
        else:
            # Backtrack when dead-end is reached.
            stack.pop()

    return grid


def maze_to_wall_matrix(grid: Grid) -> list[list[dict[str, bool]]]:
    """Convert maze cells to a serializable walls matrix."""

    return [
        [
            {
                "top": cell.top,
                "right": cell.right,
                "bottom": cell.bottom,
                "left": cell.left,
                "visited": cell.visited,
            }
            for cell in row
        ]
        for row in grid
    ]


if __name__ == "__main__":
    sample_grid = generate_maze(rows=4, cols=6, seed=42)
    for line in maze_to_wall_matrix(sample_grid):
        print(line)
