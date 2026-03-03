import unittest

from maze_generator import generate_maze, to_wall_matrix


class MazeGeneratorTests(unittest.TestCase):
    def test_generates_grid_of_expected_size(self):
        rows, cols = 4, 7
        grid = generate_maze(rows, cols, seed=1)
        self.assertEqual(rows, len(grid))
        self.assertEqual(cols, len(grid[0]))

    def test_all_cells_marked_visited(self):
        grid = generate_maze(6, 5, seed=2)
        self.assertTrue(all(cell.visited for row in grid for cell in row))

    def test_matrix_dimensions(self):
        rows, cols = 3, 8
        matrix = to_wall_matrix(generate_maze(rows, cols, seed=3))
        self.assertEqual(2 * rows + 1, len(matrix))
        self.assertEqual(2 * cols + 1, len(matrix[0]))

    def test_deterministic_with_seed(self):
        matrix_a = to_wall_matrix(generate_maze(5, 5, seed=99))
        matrix_b = to_wall_matrix(generate_maze(5, 5, seed=99))
        self.assertEqual(matrix_a, matrix_b)


if __name__ == "__main__":
    unittest.main()
