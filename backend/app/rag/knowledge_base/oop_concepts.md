# Object-Oriented Programming Concepts

## Encapsulation
Encapsulation means bundling data with the methods that operate on it, and
hiding internal state behind a controlled interface (getters/setters,
public vs. private members) rather than letting other code reach in and
modify fields directly. Good interview questions ask for a real example of
a bug encapsulation would have prevented, not just the textbook definition.

## Inheritance vs composition
Inheritance ("is-a") lets a class reuse and extend another class's
behavior, but overusing it creates rigid, deeply nested hierarchies that
are hard to change safely. Composition ("has-a") builds behavior by
combining smaller objects instead, and is generally preferred when the
relationship isn't a true "is-a" one. A strong candidate should be able to
give a concrete example of when they chose composition over inheritance (or
vice versa) and explain the trade-off, not just recite "favor composition
over inheritance."

## Polymorphism
Polymorphism lets code call the same method name on different types and get
type-appropriate behavior -- either through inheritance (overriding a
parent method) or through duck typing/interfaces (any object with the right
method shape can be used). The practical value being tested is whether a
candidate can explain how polymorphism reduces the need for type-checking
branches (if/else or switch on type) scattered through a codebase.

## Abstraction
Abstraction means exposing only what a consumer of a class or module needs
to know, and hiding the how. This is closely related to encapsulation, but
where encapsulation is about protecting state, abstraction is about
simplifying the mental model of what something does. A good behavioral
prompt: "describe a time you had to design an interface for other engineers
to use" tests this in a real-world way rather than a dictionary definition.

## SOLID principles (brief)
SOLID is a set of five design guidelines: Single Responsibility (a class
should have one reason to change), Open/Closed (open for extension, closed
for modification), Liskov Substitution (subtypes must be usable wherever
their base type is expected), Interface Segregation (prefer many small
interfaces over one large one), and Dependency Inversion (depend on
abstractions, not concrete implementations). These are best tested with a
concrete refactoring scenario rather than asking a candidate to recite the
acronym.
