# Databases and SQL Basics

## Normalization
Normalization organizes a relational database's tables to reduce data
duplication and avoid update anomalies, following a series of "normal
forms." In practice, the most commonly tested idea is: don't store the same
fact (like a customer's address) in more than one table, or you risk it
going out of sync when it's updated in only one place. A good interview
question asks a candidate to spot a normalization problem in a sample
schema, not recite the formal definitions of 1NF/2NF/3NF.

## Indexes
An index is a separate data structure (usually a B-tree) that lets the
database find rows matching a condition without scanning the whole table,
dramatically speeding up reads at the cost of slightly slower writes (since
the index must also be updated) and extra storage. The key trade-off worth
testing: indexes should go on columns that are frequently searched/filtered/
joined on, not on every column, since each additional index adds write
overhead.

## Joins
An inner join returns only rows that match in both tables; a left (outer)
join returns every row from the left table plus matching rows from the
right (with nulls where there's no match); a right join is the mirror of
that. A common interview trap: asking a candidate to predict how many rows
a join returns given specific sample data, which tests real understanding
rather than memorized definitions.

## Transactions and ACID
A transaction groups multiple database operations so they either all
succeed or all fail together. ACID describes the guarantees a proper
transaction provides: Atomicity (all-or-nothing), Consistency (the database
moves from one valid state to another), Isolation (concurrent transactions
don't interfere with each other), and Durability (once committed, a change
survives a crash). A strong follow-up question: "what could go wrong if two
transactions run at the same time without isolation?" tests whether the
candidate understands *why* isolation matters, not just the acronym.

## SQL vs NoSQL
SQL (relational) databases enforce a fixed schema and strong consistency,
and are the natural fit when data is relational and integrity matters (e.g.
financial records). NoSQL databases (document, key-value, wide-column,
graph) trade some of that structure and consistency for flexibility and
horizontal scalability, and suit use cases like rapidly evolving schemas or
massive write-heavy workloads. A good question asks a candidate to justify
a choice for a specific scenario rather than declare one category
universally better.
