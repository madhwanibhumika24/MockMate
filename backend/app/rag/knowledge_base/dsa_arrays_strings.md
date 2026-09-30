# Arrays and Strings

## Two-pointer technique
Two-pointer problems use two indices moving through a sequence -- either from
opposite ends toward the middle, or both from the start at different speeds
-- to avoid a nested loop. Common uses: checking if a string is a
palindrome, finding a pair in a sorted array that sums to a target, and
removing duplicates from a sorted array in place. The key interview
insight to test for is recognizing that sorted input plus a "find a pair/
triplet" requirement is a strong signal for two pointers instead of brute
force O(n^2).

## Sliding window
A sliding window keeps a contiguous range of elements (the "window") and
grows or shrinks it as it scans the array or string once, giving O(n)
solutions to problems that look like they need nested loops. Classic
examples: longest substring without repeating characters, smallest subarray
with a sum >= target, and finding all anagrams of a pattern in a string. A
good interview question tests whether the candidate can identify when to
shrink the window (a constraint was violated) versus when to grow it.

## Hashing for lookups
Using a hash map to trade space for time is one of the most common array/
string optimizations: turning an O(n^2) "for each element, scan the rest"
into O(n) by storing what's been seen so far. Classic example: two-sum
(store each number's index as you scan, check if the complement was already
seen). Good follow-up questions probe whether the candidate considers hash
collisions, ordering guarantees, and when a hash map isn't the right choice
(e.g. when order matters, or extra space is not allowed).

## String manipulation edge cases
Strong string questions usually hide their difficulty in edge cases rather
than the core algorithm: empty strings, single-character strings, strings
with only duplicate characters, case sensitivity, and unicode/multi-byte
characters. A candidate who immediately asks about these cases before
coding is demonstrating a valuable habit that's worth explicitly rewarding
in feedback.
