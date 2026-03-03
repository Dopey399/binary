"""Depth-first maze generator using recursive backtracking.

The maze is represented as a 2D grid where each cell tracks:
- four walls: top, right, bottom, left
- visited flag

`generate_maze` returns the full grid, and `to_wall_matrix` converts it to a
matrix representation where 1 means wall and 0 means open path.
"""

from __future__ import annotations

from dataclasses import dataclass
import random
from typing import List, Tuple


@dataclass
class Cell:
    top: bool = True
    right: bool = True
    bottom: bool = True
    left: bool = True
    visited: bool = False


Direction = Tuple[int, int, str, str]

# (row_delta, col_delta, current_cell_wall, neighbor_cell_opposite_wall)
DIRECTIONS: List[Direction] = [
    (-1, 0, "top", "bottom"),
    (0, 1, "right", "left"),
    (1, 0, "bottom", "top"),
    (0, -1, "left", "right"),
]


Grid = List[List[Cell]]


def _in_bounds(rows: int, cols: int, row: int, col: int) -> bool:
    return 0 <= row < rows and 0 <= col < cols


def generate_maze(rows: int, cols: int, seed: int | None = None) -> Grid:
    """Generate a maze via iterative DFS/backtracking.

    Args:
        rows: Number of maze rows (must be > 0).
        cols: Number of maze columns (must be > 0).
        seed: Optional random seed for deterministic output.

    Returns:
        2D list of Cell objects with walls carved into a perfect maze.
    """
    if rows <= 0 or cols <= 0:
        raise ValueError("rows and cols must be positive integers")

    rng = random.Random(seed)
    grid: Grid = [[Cell() for _ in range(cols)] for _ in range(rows)]

    start_row = rng.randrange(rows)
    start_col = rng.randrange(cols)
    current_row, current_col = start_row, start_col
    grid[current_row][current_col].visited = True

    stack: List[Tuple[int, int]] = []

    while True:
        unvisited_neighbors: List[Tuple[int, int, str, str]] = []

        for dr, dc, wall, opposite_wall in DIRECTIONS:
            nr, nc = current_row + dr, current_col + dc
            if _in_bounds(rows, cols, nr, nc) and not grid[nr][nc].visited:
                unvisited_neighbors.append((nr, nc, wall, opposite_wall))

        if unvisited_neighbors:
            nr, nc, wall, opposite_wall = rng.choice(unvisited_neighbors)

            # Remove wall between current and neighbor.
            setattr(grid[current_row][current_col], wall, False)
            setattr(grid[nr][nc], opposite_wall, False)

            # Push current and move to neighbor.
            stack.append((current_row, current_col))
            current_row, current_col = nr, nc
            grid[current_row][current_col].visited = True
        elif stack:
            current_row, current_col = stack.pop()
        else:
            break

    return grid


def to_wall_matrix(grid: Grid) -> List[List[int]]:
    """Convert cell-wall maze into expanded wall/open matrix.

    Matrix dimensions are `(2*rows + 1) x (2*cols + 1)`.
    - 1 denotes wall
    - 0 denotes open path
    """
    rows = len(grid)
    cols = len(grid[0]) if rows else 0

    matrix = [[1 for _ in range(2 * cols + 1)] for _ in range(2 * rows + 1)]

    for r in range(rows):
        for c in range(cols):
            cell = grid[r][c]
            mr, mc = 2 * r + 1, 2 * c + 1

            matrix[mr][mc] = 0
            if not cell.top:
                matrix[mr - 1][mc] = 0
            if not cell.right:
                matrix[mr][mc + 1] = 0
            if not cell.bottom:
                matrix[mr + 1][mc] = 0
            if not cell.left:
                matrix[mr][mc - 1] = 0

    return matrix


def pretty_print_matrix(matrix: List[List[int]]) -> str:
    """Return an ASCII rendering where █ is wall and space is path."""
    return "\n".join("".join("█" if val else " " for val in row) for row in matrix)


if __name__ == "__main__":
    maze = generate_maze(10, 16, seed=42)
    matrix = to_wall_matrix(maze)
    print(pretty_print_matrix(matrix))
