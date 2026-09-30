# Trees and Graphs

## Tree traversals
The three depth-first traversals of a binary tree -- preorder (root, left,
right), inorder (left, root, right), and postorder (left, right, root) --
each have a natural use: inorder gives sorted order for a binary search
tree, preorder is useful for copying/serializing a tree, and postorder is
useful for deleting a tree bottom-up or evaluating an expression tree.
Breadth-first (level-order) traversal, using a queue, is the natural choice
whenever a question asks about depth, level, or "shortest path" in an
unweighted tree.

## Binary search trees
A binary search tree keeps every node's left subtree smaller and right
subtree larger, which makes search, insert, and delete O(log n) on average
but O(n) in the worst case if the tree becomes unbalanced (e.g. inserting
already-sorted data one at a time turns it into a linked list). This
worst-case is exactly why self-balancing trees (AVL, red-black) exist --
a good question here checks whether the candidate understands *why*
balance matters, not just that "BSTs are fast."

## Graph representations
Graphs are usually represented either as an adjacency list (a map from each
node to its neighbors -- space-efficient for sparse graphs) or an adjacency
matrix (a 2D array -- simpler and O(1) edge lookups, but O(V^2) space,
better for dense graphs). Interview questions should test whether a
candidate picks the representation that fits the graph's density and the
operations the problem actually needs.

## BFS vs DFS
Breadth-first search explores level by level using a queue and is the right
tool whenever the question involves the *shortest* path in an unweighted
graph. Depth-first search explores as far as possible down one path before
backtracking, using a stack (or recursion), and is the natural fit for
exploring all paths, detecting cycles, or topological sorting. A strong
candidate should be able to explain not just how each works, but why one is
correct for shortest-path and the other typically isn't (DFS doesn't
guarantee the first path found is the shortest).

## Weighted shortest paths
When edges have different weights (costs), plain BFS no longer finds the
shortest path -- Dijkstra's algorithm (using a priority queue/min-heap) is
the standard approach for non-negative weights, and Bellman-Ford is used
instead when negative weights are possible. A good follow-up question:
"why won't BFS work here anymore?" tests whether the candidate truly
understands what BFS's shortest-path guarantee actually depends on.
