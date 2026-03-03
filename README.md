# maze-generator

Maze generation experiments.

## Implemented algorithm

This project now includes an implementation of the classic **recursive backtracking** maze-generation algorithm (iterative DFS with an explicit stack):

1. Build a 2D grid of cells with all four walls present and `visited = False`.
2. Pick a random starting cell and mark it visited.
3. Repeatedly:
   - Collect unvisited neighbors of the current cell.
   - If one exists, choose one at random, remove the shared wall, push current cell, move to neighbor, mark visited.
   - If none exist, pop from stack and backtrack.
4. Stop when the stack is empty.
5. Convert the result to a wall/path matrix.

## Files

- `maze_generator.py`: core data model and algorithm.
- `tests/test_maze_generator.py`: unit tests.

## Run

```bash
python maze_generator.py
```

## Test

```bash
python -m unittest discover -s tests -v
```
