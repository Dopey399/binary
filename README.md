# maze-generator

Maze generation experiments.

## Algorithm implemented

This repository includes a maze generator based on **recursive backtracking**
(depth-first search using an explicit stack):

1. Initialize a 2D grid of cells.
2. Each cell starts with four walls (`top`, `right`, `bottom`, `left`) and `visited=False`.
3. Pick a random starting cell and mark it visited.
4. While the stack is not empty:
   - Find unvisited neighbors of the current cell.
   - If neighbors exist, pick one at random, remove the shared wall,
     mark the neighbor visited, and push it.
   - Otherwise, pop from the stack to backtrack.
5. Return the final grid as a matrix of wall flags.

## Usage

### 1) Generate wall data

```bash
python maze_generator.py
```

Or import from Python:

```python
from maze_generator import generate_maze, maze_to_wall_matrix

grid = generate_maze(rows=10, cols=10, seed=123)
matrix = maze_to_wall_matrix(grid)
```

### 2) Play the maze in terminal

```bash
python playable_maze.py
```

Controls:
- `W` / `A` / `S` / `D` (or `up` / `left` / `down` / `right`) to move.
- `Q` to quit.

Goal:
- Start at `P` and reach `G`.
