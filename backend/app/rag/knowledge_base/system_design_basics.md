# System Design Basics

## Scaling: vertical vs horizontal
Vertical scaling means adding more power (CPU, RAM) to a single machine --
simple, but has a hard ceiling and a single point of failure. Horizontal
scaling means adding more machines and distributing load across them --
effectively unlimited, but introduces real complexity: load balancing,
data consistency across nodes, and network failures becoming a normal
occurrence instead of an edge case. A good system design question should
push a candidate to justify which approach fits the specific scale they've
been asked to design for, rather than reflexively saying "horizontal is
always better."

## Caching
A cache stores a copy of expensive-to-compute or expensive-to-fetch data
somewhere faster to access, trading a small risk of staleness for a large
speed improvement. Key decisions a candidate should be able to reason
about: what to cache, where (client, CDN, application layer, database
layer), how entries expire (TTL, LRU eviction), and how to keep the cache
from serving stale data after the underlying data changes (cache
invalidation -- famously one of the two hard problems in computer science).

## Load balancing
A load balancer distributes incoming requests across multiple backend
servers so no single server is overwhelmed, and can also detect and route
around unhealthy servers. Common strategies include round robin (simplest,
cycles through servers), least connections (sends traffic to the least busy
server), and consistent hashing (useful when requests need to consistently
land on the same backend, e.g. for caching). A good follow-up: "what
happens if the load balancer itself goes down?" tests whether the candidate
thinks about single points of failure.

## Database scaling: replication and sharding
Replication copies the same data across multiple database servers, mainly
to improve read throughput and provide failover if the primary goes down.
Sharding instead splits the data itself across servers (e.g. by user ID
range), so each shard holds a subset of the data -- this scales writes but
adds real complexity: queries that need data from multiple shards, and
rebalancing when a shard gets too large. A candidate should be able to
explain which problem each technique actually solves, since they're often
confused with each other.

## CAP theorem (practical framing)
The CAP theorem says a distributed system can't simultaneously guarantee
Consistency (every read sees the latest write), Availability (every request
gets a response), and Partition tolerance (the system keeps working when
network communication between nodes fails) -- in practice, since network
partitions do happen, real systems choose between prioritizing consistency
or availability during a partition. Rather than asking a candidate to
define CAP abstractly, a stronger question asks them to say which they'd
choose for a specific system (e.g. a bank balance vs. a social media like
counter) and why.
