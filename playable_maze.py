"""Terminal-playable maze game built on top of the DFS maze generator."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from maze_generator import Grid, generate_maze


@dataclass
class Position:
    row: int
    col: int


def _can_move(grid: Grid, pos: Position, direction: str) -> bool:
    cell = grid[pos.row][pos.col]
    if direction == "w":
        return not cell.top
    if direction == "d":
        return not cell.right
    if direction == "s":
        return not cell.bottom
    if direction == "a":
        return not cell.left
    return False


def _apply_move(pos: Position, direction: str) -> Position:
    if direction == "w":
        return Position(pos.row - 1, pos.col)
    if direction == "d":
        return Position(pos.row, pos.col + 1)
    if direction == "s":
        return Position(pos.row + 1, pos.col)
    if direction == "a":
        return Position(pos.row, pos.col - 1)
    return pos


def _render_ascii(grid: Grid, player: Position, goal: Position) -> str:
    """Render the maze as ASCII art with player/goal markers."""

    rows = len(grid)
    cols = len(grid[0])
    lines: list[str] = []

    # Top border
    top = "+"
    for c in range(cols):
        top += ("---" if grid[0][c].top else "   ") + "+"
    lines.append(top)

    for r in range(rows):
        mid = "|"
        bottom = "+"

        for c in range(cols):
            marker = " "
            if player.row == r and player.col == c:
                marker = "P"
            elif goal.row == r and goal.col == c:
                marker = "G"

            cell = grid[r][c]
            right_wall = "|" if cell.right else " "
            mid += f" {marker} {right_wall}"
            bottom += ("---" if cell.bottom else "   ") + "+"

        lines.append(mid)
        lines.append(bottom)

    return "\n".join(lines)


def _normalize_command(raw: str) -> str:
    value = raw.strip().lower()
    if value in {"up", "w"}:
        return "w"
    if value in {"right", "d"}:
        return "d"
    if value in {"down", "s"}:
        return "s"
    if value in {"left", "a"}:
        return "a"
    return value


def _iter_moves() -> Iterable[str]:
    while True:
        yield input("Move (W/A/S/D, or Q to quit): ")


def play(rows: int = 10, cols: int = 20, seed: int | None = None) -> None:
    if rows <= 0 or cols <= 0:
        raise ValueError("rows and cols must both be > 0")

    grid = generate_maze(rows=rows, cols=cols, seed=seed)
    player = Position(0, 0)
    goal = Position(rows - 1, cols - 1)
    moves = 0

    print("Reach G from P. You can move using W/A/S/D.")

    for raw in _iter_moves():
        print(_render_ascii(grid, player, goal))

        command = _normalize_command(raw)
        if command in {"q", "quit", "exit"}:
            print("Game ended.")
            return

        if command not in {"w", "a", "s", "d"}:
            print("Invalid move. Use W/A/S/D.")
            continue

        if _can_move(grid, player, command):
            player = _apply_move(player, command)
            moves += 1
        else:
            print("Blocked by a wall.")

        if player == goal:
            print(_render_ascii(grid, player, goal))
            print(f"You solved the maze in {moves} moves! 🎉")
            return


if __name__ == "__main__":
    play()
