# Python (programming language)

Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.
Python is dynamically type-checked and garbage-collected. It supports multiple programming paradigms, including structured (particularly procedural), object-oriented and functional programming.
Guido van Rossum began working on Python in the late 1980s as a successor to the ABC programming language. Python 3.0, released in 2008, was a major revision and not completely backward-compatible with earlier versions. Recent versions, such as Python 3.13, 3.12 and older (and 3.14), have added capabilities and keywords for typing (and more; e.g. increasing speed); helping with (optional) static typing. Currently only versions in the 3.x series are supported.
Python consistently ranks as one of the most popular programming languages, and it has gained widespread use in the machine learning community. It is widely taught as an introductory programming language.


== History ==

Python was conceived in the late 1980s by Guido van Rossum at Centrum Wiskunde & Informatica (CWI) in the Netherlands. It was designed as a successor to the ABC programming language, which was inspired by SETL, capable of exception handling and interfacing with the Amoeba operating system. Python implementation began in December 1989. Van Rossum first released it in 1991 as Python 0.9.0. Van Rossum assumed sole responsibility for the project, as the lead developer, until 12 July 2018, when he announced his "permanent vacation" from responsibilities as Python's "benevolent dictator for life" (BDFL); this title was bestowed on him by the Python community to reflect his long-term commitment as the project's chief decision-maker. (He has since come out of retirement and is self-titled "BDFL-emeritus".) In January 2019, active Python core developers elected a five-member Steering Council to lead the project.
The name Python derives from the British comedy series Monty Python's Flying Circus. (See § Naming.)
Python 2.0 was released on 16 October 2000, featuring many new features such as list comprehensions, cycle-detecting garbage collection, reference counting, and Unicode support. Python 2.7's end-of-life was initially set for 2015, and then postponed to 2020 out of concern that a large body of existing code could not easily be forward-ported to Python 3. It no longer receives security patches or updates. While Python 2.7 and older versions are officially unsupported, a different unofficial Python implementation, PyPy, continues to support Python 2, i.e., "2.7.18+" (plus 3.10), with the plus signifying (at least some) "backported security updates".
Python 3.0 was released on 3 December 2008, and was a major revision and not completely backward-compatible with earlier versions, with some new semantics and changed syntax. Python 2.7.18, released in 2020, was the last release of Python 2. Several releases in the Python 3.x series have added new syntax to the language, and made a few (considered very minor) backward-incompatible changes.
Since 7 October 2025, Python 3.14.0 is the latest stable release, and Python 3.13.8 released same day; and then all older 3.x versions had a security update down to Python 3.9.24, the last in 3.9 series. Python 3.10 is the oldest supported release. Releases receive two years of full support followed by three years of security support.


== Design philosophy and features ==
Python is a multi-paradigm programming language. Object-oriented programming and structured programming are fully supported, and many of their features support functional programming and aspect-oriented programming – including metaprogramming and metaobjects. Many other paradigms are supported via extensions, including design by contract and logic programming. Python is often referred to as a 'glue language' because it is purposely designed to be able to integrate components written in other languages.
Python uses dynamic typing and a combination of reference counting and a cycle-detecting garbage collector for memory management. It uses dynamic name resolution (late binding), which binds method and variable names during program execution.
Python's design offers some support for functional programming in the "Lisp tradition". It has filter, map, and reduce functions; list comprehensions, dictionaries, sets, and generator expressions. The standard library has two modules (itertools and functools) that implement functional tools borrowed from Haskell and Standard ML.
Python's core philosophy is summarized in the Zen of Python (PEP 20) written by Tim Peters, which includes aphorisms such as these:

Explicit is better than implicit.
Simple is better than complex.
Readability counts.
Special cases aren't special enough to break the rules.
Although practicality beats purity.
Errors should never pass silently.
Unless explicitly silenced.
There should be one-- and preferably only one --obvious way to do it.
However, Python have received criticism for violating these principles and adding unnecessary language bloat. Responses to these criticisms note that the Zen of Python is a guideline rather than a rule. The addition of some new features had been controversial: Guido van Rossum resigned as Benevolent Dictator for Life after conflict about adding the assignment expression operator in Python 3.8 .
Nevertheless, rather than building all functionality into its core, Python was designed to be highly extensible via modules. This compact modularity has made it particularly popular as a means of adding programmable interfaces to existing applications. Van Rossum's vision of a small core language with a large standard library and easily extensible interpreter stemmed from his frustrations with ABC, which represented the opposite approach.
Python claims to strive for a simpler, less-cluttered syntax and grammar, while giving developers a choice in their coding methodology. In contrast to Perl's motto "there is more than one way to do it", Python advocates an approach where "there should be one – and preferably only one – obvious way to do it". In practice, however, Python provides many ways to achieve a given goal. There are at least three ways to format a string literal, with no certainty as to which one a programmer should use. Alex Martelli is a Fellow at the Python Software Foundation and Python book author; he wrote that "To describe something as 'clever' is not considered a compliment in the Python culture."
Python's developers usually try to avoid premature optimization; they also reject patches to non-critical parts of the CPython reference implementation that would offer marginal increases in speed at the cost of clarity. Execution speed can be improved by moving speed-critical functions to extension modules written in languages such as C, or by using a just-in-time compiler like PyPy. It is also possible to cross-compile to other languages; but this approach either fails to achieve the expected speed-up, since Python is a very dynamic language, or only a restricted subset of Python is compiled (with potential minor semantic changes).
Python is meant to be a fun language to use. This goal is reflected in the name – a tribute to the British comedy group Monty Python – and in playful approaches to some tutorials and reference materials. For instance, some code examples use the terms "spam" and "eggs" (in reference to a Monty Python sketch), rather than the typical terms "foo" and "bar".
A common neologism in the Python community is pythonic, which has a wide range of meanings related to program style: Pythonic code may use Python idioms well; be natural or show fluency in the language; or conform with Python's minimalist philosophy and emphasis on readability.


== Syntax and semantics ==
Python is meant to be an easily readable language. Its formatting is visually uncluttered and often uses English keywords where other languages use punctuation. Unlike many other languages, it does not use curly brackets to delimit blocks, and semicolons after statements are allowed but rarely used. It has fewer syntactic exceptions and special cases than C or Pascal.


=== Indentation ===

Python uses whitespace indentation, rather than curly brackets or keywords, to delimit blocks. An increase in indentation comes after certain statements; a decrease in indentation signifies the end of the current block. Thus, the program's visual structure accurately represents its semantic structure. This feature is sometimes termed the off-side rule. Some other languages use indentation this way; but in most, indentation has no semantic meaning. The recommended indent size is four spaces.


=== Statements and control flow ===
Python's statements include the following:

The assignment statement, using a single equals sign =
The if statement, which conditionally executes a block of code, along with else and elif (a contraction of else if)
The for statement, which iterates over an iterable object, capturing each element to a local variable for use by the attached block
The while statement, which executes a block of code as long as boolean condition is true
The try statement, which allows exceptions raised in its attached code block to be caught and handled by except clauses (or new syntax except* in Python 3.11 for exception groups); the try statement also ensures that clean-up code in a finally block is always run regardless of how the block exits
The raise statement, used to raise a specified exception or re-raise a caught exception
The class statement, which executes a block of code and attaches its local namespace to a class, for use in object-oriented programming
The def statement, which defines a function or method
The with statement, which encloses a code block within a context manager, allowing resource-acquisition-is-initialization (RAII)-like behavior and replacing a common try/finally idiom Examples of a context include acquiring a lock before some code is run, and then releasing the lock; or opening and then closing a file
The break statement, which exits a loop
The continue statement, which skips the rest of the current iteration and continues with the next
The del statement, which removes a variable—deleting the reference from the name to the value, and producing an error if the variable is referred to before it is redefined 
The pass statement, serving as a NOP (i.e., no operation), which is syntactically needed to create an empty code block
The assert statement, used in debugging to check for conditions that should apply
The yield statement, which returns a value from a generator function (and also an operator); used to implement coroutines
The return statement, used to return a value from a function
The import and from statements, used to import modules whose functions or variables can be used in the current program
The match and case statements, analogous to a switch statement construct, which compares an expression against one or more cases as a control-flow measure
The assignment statement (=) binds a name as a reference to a separate, dynamically allocated object. Variables may subsequently be rebound at any time to any object. In Python, a variable name is a generic reference holder without a fixed data type; however, it always refers to some object with a type. This is called dynamic typing—in contrast to statically-typed languages, where each variable may contain only a value of a certain type.
Python does not support tail call optimization or first-class continuations; according to Van Rossum, the language never will. However, better support for coroutine-like functionality is provided by extending Python's generators. Before 2.5, generators were lazy iterators; data was passed unidirectionally out of the generator. From Python 2.5 on, it is possible to pass data back into a generator function; and from version 3.3, data can be passed through multiple stack levels.


=== Expressions ===
Python's expressions include the following:

The +, -, and * operators for mathematical addition, subtraction, and multiplication are similar to other languages, but the behavior of division differs. There are two types of division in Python: floor division (or integer division) //, and floating-point division /. Python uses the ** operator for exponentiation.
Python uses the + operator for string concatenation. The language uses the * operator for duplicating a string a specified number of times.
The @ infix operator is intended to be used by libraries such as NumPy for matrix multiplication.
The syntax :=, called the "walrus operator", was introduced in Python 3.8. This operator assigns values to variables as part of a larger expression.
In Python, == compares two objects by value. Python's is operator may be used to compare object identities (i.e., comparison by reference), and comparisons may be chained—for example, a <= b <= c.
Python uses and, or, and not as Boolean operators.
Python has a type of expression called a list comprehension, and a more general expression called a generator expression.
Anonymous functions are implemented using lambda expressions; however, there may be only one expression in each body.
Conditional expressions are written as x if c else y. (This is different in operand order from the c ? x : y operator common to many other languages.)
Python makes a distinction between lists and tuples. Lists are written as [1, 2, 3], are mutable, and cannot be used as the keys of dictionaries (since dictionary keys must be immutable in Python). Tuples, written as (1, 2, 3), are immutable and thus can be used as the keys of dictionaries, provided that all of the tuple's elements are immutable. The + operator can be used to concatenate two tuples, which does not directly modify their contents, but produces a new tuple containing the elements of both. For example, given the variable t initially equal to (1, 2, 3), executing t = t + (4, 5) first evaluates t + (4, 5), which yields (1, 2, 3, 4, 5); this result is then assigned back to t—thereby effectively "modifying the contents" of t while conforming to the immutable nature of tuple objects. Parentheses are optional for tuples in unambiguous contexts.
Python features sequence unpacking where multiple expressions, each evaluating to something assignable (e.g., a variable or a writable property) are associated just as in forming tuple literal; as a whole, the results are then put on the left-hand side of the equal sign in an assignment statement. This statement expects an iterable object on the right-hand side of the equal sign to produce the same number of values as the writable expressions on the left-hand side; while iterating, the statement assigns each of the values produced on the right to the corresponding expression on the left.
Python has a "string format" operator % that functions analogously to printf format strings in the C language—e.g. "spam=%s eggs=%d" % ("blah", 2) evaluates to "spam=blah eggs=2". In Python 2.6+ and 3+, this operator was supplemented by the format() method of the str class, e.g., "spam={0} eggs={1}".format("blah", 2). Python 3.6 added "f-strings": spam = "blah"; eggs = 2; f'spam={spam} eggs={eggs}'.
Strings in Python can be concatenated by "adding" them (using the same operator as for adding integers and floats); e.g., "spam" + "eggs" returns "spameggs". If strings contain numbers, they are concatenated as strings rather than as integers, e.g. "2" + "2" returns "22".
Python supports string literals in several ways:
Delimited by single or double quotation marks; single and double quotation marks have equivalent functionality (unlike in Unix shells, Perl, and Perl-influenced languages). Both marks use the backslash (\) as an escape character. String interpolation became available in Python 3.6 as "formatted string literals".
Triple-quoted, i.e., starting and ending with three single or double quotation marks; this may span multiple lines and function like here documents in shells, Perl, and Ruby.
Raw string varieties, denoted by prefixing the string literal with r. Escape sequences are not interpreted; hence raw strings are useful where literal backslashes are common, such as in regular expressions and Windows-style paths. (Compare "@-quoting" in C#.)
Python has array index and array slicing expressions in lists, which are written as a[key], a[start:stop] or a[start:stop:step]. Indexes are zero-based, and negative indexes are relative to the end. Slices take elements from the start index up to, but not including, the stop index. The (optional) third slice parameter, called step or stride, allows elements to be skipped or reversed. Slice indexes may be omitted—for example, a[:] returns a copy of the entire list. Each element of a slice is a shallow copy.
In Python, a distinction between expressions and statements is rigidly enforced, in contrast to languages such as Common Lisp, Scheme, or Ruby. This distinction leads to duplicating some functionality, for example:

List comprehensions vs. for-loops
Conditional expressions vs. if blocks
The eval() vs. exec() built-in functions (in Python 2, exec is a statement); the former function is for expressions, while the latter is for statements
A statement cannot be part of an expression; because of this restriction, expressions such as list and dict comprehensions (and lambda expressions) cannot contain statements. As a particular case, an assignment statement such as a = 1 cannot be part of the conditional expression of a conditional statement.


=== Typing ===

Python uses duck typing, and it has typed objects but untyped variable names. Type constraints are not checked at definition time; rather, operations on an object may fail at usage time, indicating that the object is not of an appropriate type. Despite being dynamically typed, Python is strongly typed, forbidding operations that are poorly defined (e.g., adding a number and a string) rather than quietly attempting to interpret them.
Python allows programmers to define their own types using classes, most often for object-oriented programming. New instances of classes are constructed by calling the class, for example, SpamClass() or EggsClass()); the classes are instances of the metaclass type (which is an instance of itself), thereby allowing metaprogramming and reflection.
Before version 3.0, Python had two kinds of classes, both using the same syntax: old-style and new-style. Current Python versions support the semantics of only the new style.
Python supports optional type annotations. These annotations are not enforced by the language, but may be used by external tools such as mypy to catch errors. Python includes a module typing including several type names for type annotations. Mypy also supports a Python compiler called mypyc, which leverages type annotations for optimization.


=== Arithmetic operations ===
Python includes conventional symbols for arithmetic operators (+, -, *, /), the floor-division operator //, and the modulo operator %. (With the modulo operator, a remainder can be negative, e.g., 4 % -3 == -2.) Python also offers the ** symbol for exponentiation, e.g. 5**3 == 125 and 9**0.5 == 3.0; it also offers the matrix‑multiplication operator @ . These operators work as in traditional mathematics; with the same precedence rules, the infix operators + and - can also be unary, to represent positive and negative numbers respectively.
Division between integers produces floating-point results. The behavior of division has changed significantly over time:

The current version of Python (i.e., since 3.0) changed the / operator to always represent floating-point division, e.g., 5/2 == 2.5.
The floor division // operator was introduced, meaning that 7//3 == 2, -7//3 == -3, 7.5//3 == 2.0, and -7.5//3 == -3.0. For Python 2.7, adding the from __future__ import division statement allows a module in Python 2.7 to use Python 3.x rules for division (see above).
In Python terms, the / operator represents true division (or simply division), while the // operator represents floor division. Before version 3.0, the / operator represents classic division.
Rounding towards negative infinity, though a different method than in most languages, adds consistency to Python. For instance, this rounding implies that the equation (a + b)//b == a//b + 1 is always true. The rounding also implies that the equation b*(a//b) + a%b == a is valid for both positive and negative values of a. As expected, the result of a%b lies in the half-open interval [0, b), where b is a positive integer; however, maintaining the validity of the equation requires that the result must lie in the interval (b, 0] when b is negative.
Python provides a round function for rounding a float to the nearest integer. For tie-breaking, Python 3 uses the round to even method: round(1.5) and round(2.5) both produce 2. Python versions before 3 used the round-away-from-zero method: round(0.5) is 1.0, and round(-0.5) is −1.0.
Python allows Boolean expressions that contain multiple equality relations to be consistent with general usage in mathematics. For example, the expression a < b < c tests whether a is less than b and b is less than c. C-derived languages interpret this expression differently: in C, the expression would first evaluate a < b, resulting in 0 or 1, and that result would then be compared with c.
Python uses arbitrary-precision arithmetic for all integer operations. The Decimal type/class in the decimal module provides decimal floating-point numbers to a pre-defined arbitrary precision with several rounding modes. The Fraction class in the fractions module provides arbitrary precision for rational numbers.
Due to Python's extensive mathematics library and the third-party library NumPy, the language is frequently used for scientific scripting in tasks such as numerical data processing and manipulation.


=== Function syntax ===
Functions are created in Python by using the def keyword. A function is defined similarly to how it is called, by first providing the function name and then the required parameters. Here is an example of a function that prints its inputs:

To assign a default value to a function parameter in case no actual value is provided at run time, variable-definition syntax can be used inside the function header.


== Code examples ==
"Hello, World!" program:

Program to calculate the factorial of a positive integer:


== Libraries ==
Python's large standard library is commonly cited as one of its greatest strengths. For Internet-facing applications, many standard formats and protocols such as MIME and HTTP are supported. The language includes modules for creating graphical user interfaces, connecting to relational databases, generating pseudorandom numbers, arithmetic with arbitrary-precision decimals, manipulating regular expressions, and unit testing.
Some parts of the standard library are covered by specifications—for example, the Web Server Gateway Interface (WSGI) implementation wsgiref follows PEP 333—but most parts are specified by their code, internal documentation, and test suites. However, because most of the standard library is cross-platform Python code, only a few modules must be altered or rewritten for variant implementations.
As of 13 March 2025, the Python Package Index (PyPI), the official repository for third-party Python software, contains over 614,339 packages.


== Development environments ==

Most Python implementations (including CPython) include a read–eval–print loop (REPL); this permits the environment to function as a command line interpreter, with which users enter statements sequentially and receive results immediately.
Python is also bundled with an integrated development environment (IDE) called IDLE, which is oriented toward beginners.
Other shells, including IDLE and IPython, add additional capabilities such as improved auto-completion, session-state retention, and syntax highlighting.
Standard desktop IDEs include PyCharm, Spyder, and Visual Studio Code; there are also web browser-based IDEs, such as the following environments:

Jupyter Notebooks, an open-source interactive computing platform;
PythonAnywhere, a browser-based IDE and hosting environment; and
Canopy, a commercial IDE from Enthought that emphasizes scientific computing.


== Implementations ==


=== Reference implementation ===
CPython is the reference implementation of Python. This implementation is written in C, meeting the C11 standard since version 3.11. Older versions use the C89 standard with several select C99 features, but third-party extensions are not limited to older C versions—e.g., they can be implemented using C11 or C++. CPython compiles Python programs into an intermediate bytecode, which is then executed by a virtual machine. CPython is distributed with a large standard library written in a combination of C and native Python.
CPython is available for many platforms, including Windows and most modern Unix-like systems, including macOS (and Apple M1 Macs, since Python 3.9.1, using an experimental installer). Starting with Python 3.9, the Python installer intentionally fails to install on Windows 7 and 8; Windows XP was supported until Python 3.5, with unofficial support for VMS. Platform portability was one of Python's earliest priorities. During development of Python 1 and 2, even OS/2 and Solaris were supported; since that time, support has been dropped for many platforms.
All current Python versions (since 3.7) support only operating systems that feature multithreading, by now supporting not nearly as many operating systems (dropping many outdated) than in the past.


=== Other implementations ===
All alternative implementations have at least slightly different semantics. For example, an alternative may include unordered dictionaries, in contrast to other current Python versions. As another example in the larger Python ecosystem, PyPy does not support the full C Python API. Alternative implementations include the following:

PyPy is a fast, compliant interpreter of Python 2.7 and  3.10. PyPy's just-in-time compiler often improves speed significantly relative to CPython, but PyPy does not support some libraries written in C. PyPy offers support for the RISC-V instruction-set architecture.
Codon is an implementation with an ahead-of-time (AOT) compiler, which compiles a statically-typed Python-like language whose "syntax and semantics are nearly identical to Python's, there are some notable differences" For example, Codon uses 64-bit machine integers for speed, not arbitrarily as with Python; Codon developers claim that speedups over CPython are usually on the order of ten to a hundred times. Codon compiles to machine code (via LLVM) and supports native multithreading.  Codon can also compile to Python extension modules that can be imported and used from Python.
MicroPython and CircuitPython are Python 3 variants that are optimized for microcontrollers, including the Lego Mindstorms EV3.
Pyston is a variant of the Python runtime that uses just-in-time compilation to speed up execution of Python programs.
Cinder is a performance-oriented fork of CPython 3.8 that features a number of optimizations, including bytecode inline caching, eager evaluation of coroutines, a method-at-a-time JIT, and an experimental bytecode compiler.
The Snek embedded computing language "is Python-inspired, but it is not Python. It is possible to write Snek programs that run under a full Python system, but most Python programs will not run under Snek." Snek is compatible with 8-bit AVR microcontrollers such as ATmega 328P-based Arduino, as well as larger microcontrollers that are compatible with MicroPython. Snek is an imperative language that (unlike Python) omits object-oriented programming. Snek supports only one numeric data type, which features 32-bit single precision (resembling JavaScript numbers, though smaller).


=== Unsupported implementations ===
Stackless Python is a significant fork of CPython that implements microthreads. This implementation uses the call stack differently, thus allowing massively concurrent programs. PyPy also offers a stackless version.
Just-in-time Python compilers have been developed, but are now unsupported:

Google began a project named Unladen Swallow in 2009: this project aimed to speed up the Python interpreter five-fold by using LLVM, and improve multithreading capability for scaling to thousands of cores, while typical implementations are limited by the global interpreter lock.
Psyco is a discontinued just-in-time specializing compiler, which integrates with CPython and transforms bytecode to machine code at runtime. The emitted code is specialized for certain data types and is faster than standard Python code. Psyco does not support Python 2.7 or later.
PyS60 was a Python 2 interpreter for Series 60 mobile phones, which was released by Nokia in 2005. The interpreter implemented many modules from Python's standard library, as well as additional modules for integration with the Symbian operating system. The Nokia N900 also supports Python through the GTK widget library, allowing programs to be written and run on the target device.


=== Cross-compilers to other languages ===
There are several compilers/transpilers to high-level object languages; the source language is unrestricted Python, a subset of Python, or a language similar to Python:

Brython and Transcrypt compile Python to JavaScript.
Cython compiles a superset of Python to C. The resulting code can be used with Python via direct C-level API calls into the Python interpreter.
PyJL compiles/transpiles a subset of Python to "human-readable, maintainable, and high-performance Julia source code". Despite the developers' performance claims, this is not possible for arbitrary Python code; that is, compiling to a faster language or machine code is known to be impossible in the general case. The semantics of Python might potentially be changed, but in many cases speedup is possible with few or no changes in the Python code. The faster Julia source code can then be used from Python or compiled to machine code.
Nuitka compiles Python into C. This compiler works with Python 3.4 to 3.12 (and 2.6 and 2.7) for Python's main supported platforms (and Windows 7 or even Windows XP) and for Android. The compiler developers claim full support for Python 3.10, partial support for Python 3.11 and 3.12,  and experimental support for Python 3.13. Nuitka supports macOS including Apple Silicon-based versions.  The compiler is free of cost, though it has commercial add-ons (e.g., for hiding source code).
Numba is a JIT compiler that is used from Python; the compiler translates a subset of Python and NumPy code into fast machine code. This tool is enabled by adding a decorator to the relevant Python code.
Pythran compiles a subset of Python 3 to C++ (C++11).
RPython can be compiled to C, and it is used to build the PyPy interpreter for Python.
The Python → 11l → C++ transpiler compiles a subset of Python 3 to C++ (C++17).
There are also specialized compilers:

MyHDL is a Python-based hardware description language (HDL) that converts MyHDL code to Verilog or VHDL code.
Some older projects existed, as well as compilers not designed for use with Python 3.x and related syntax:

Google's Grumpy transpiles Python 2 to Go. The latest release was in 2017.
IronPython allows running Python 2.7 programs with the .NET Common Language Runtime. An alpha version (released in 2021), is available for "Python 3.4, although features and behaviors from later versions may be included."
Jython compiles Python 2.7 to Java bytecode, allowing the use of Java libraries from a Python program.
Pyrex (last released in 2010) and Shed Skin (last released in 2013) compile to C and C++ respectively.


=== Performance ===
A performance comparison among various Python implementations, using a non-numerical (combinatorial) workload, was presented at EuroSciPy '13. In addition, Python's performance relative to other programming languages is benchmarked by The Computer Language Benchmarks Game.
There are several approaches to optimizing Python performance, given the inherent slowness of an interpreted language. These approaches include the following strategies or tools:

Just-in-time compilation: Dynamically compiling Python code just before it is executed. This technique is used in libraries such as Numba and PyPy.
Static compilation: Python code is compiled into machine code sometime before execution. An example of this approach is Cython, which compiles Python into C.
Concurrency and parallelism: Multiple tasks can be run simultaneously. Python contains modules such as `multiprocessing` to support this form of parallelism. Moreover, this approach helps to overcome limitations of the Global Interpreter Lock (GIL) in CPU tasks.
Efficient data structures: Performance can also be improved by using data types such as Set for membership tests, or deque from collections for queue operations.


== Language Development ==
Python's development is conducted largely through the Python Enhancement Proposal (PEP) process; this process is the primary mechanism for proposing major new features, collecting community input on issues, and documenting Python design decisions. Python coding style is covered in PEP 8. Outstanding PEPs are reviewed and commented on by the Python community and the steering council.
Enhancement of the language corresponds with development of the CPython reference implementation. The mailing list python-dev is the primary forum for the language's development. Specific issues were originally discussed in the Roundup bug tracker hosted by the foundation. In 2022, all issues and discussions were migrated to GitHub. Development originally took place on a self-hosted source-code repository running Mercurial, until Python moved to GitHub in January 2017.
CPython's public releases have three types, distinguished by which part of the version number is incremented:

Backward-incompatible versions, where code is expected to break and must be manually ported. The first part of the version number is incremented. These releases happen infrequently—version 3.0 was released 8 years after 2.0. According to Guido van Rossum, a version 4.0 will probably never exist.
Major or "feature" releases are largely compatible with the previous version but introduce new features. The second part of the version number is incremented. Starting with Python 3.9, these releases are expected to occur annually. Each major version is supported by bug fixes for several years after its release.
Bug fix releases, which introduce no new features, occur approximately every three months; these releases are made when a sufficient number of bugs have been fixed upstream since the last release. Security vulnerabilities are also patched in these releases. The third and final part of the version number is incremented.
Many alpha, beta, and release-candidates are also released as previews and for testing before final releases. Although there is a rough schedule for releases, they are often delayed if the code is not ready yet. Python's development team monitors the state of the code by running a large unit test suite during development.
The major academic conference on Python is PyCon. There are also special Python mentoring programs, such as PyLadies.


== Naming ==
Python's name is inspired by the British comedy group Monty Python, whom Python creator Guido van Rossum enjoyed while developing the language. Monty Python references appear frequently in Python code and culture; for example, the metasyntactic variables often used in Python literature are spam and eggs, rather than the traditional foo and bar. The official Python documentation also contains various references to Monty Python routines. Python users are sometimes referred to as "Pythonistas".
The affix Py is often used when naming Python applications or libraries. Some examples include the following:

Pygame, a binding of Simple DirectMedia Layer to Python (commonly used to create games);
PyQt and PyGTK, which bind Qt and GTK to Python respectively;
PyPy, a Python implementation originally written in Python;
NumPy, a Python library for numerical processing.
Jupyter, a notebook interface and associated project for interactive computing


== See also ==

Google Colab –  zero setup online IDE that runs Python
List of Python programming books
pip (package manager)


== External links ==
Python documentation


== Notes ==


== References ==


=== Sources ===
"Python for Artificial Intelligence". Python Wiki. 19 July 2012. Archived from the original on 1 November 2012. Retrieved 3 December 2012.
Paine, Jocelyn, ed. (August 2005). "AI in Python". AI Expert Newsletter. Amzi!. Archived from the original on 26 March 2012. Retrieved 11 February 2012.
"PyAIML 0.8.5: Python Package Index". Pypi.python.org. Retrieved 17 July 2013.
Russell, Stuart J. & Norvig, Peter (2009). Artificial Intelligence: A Modern Approach (3rd ed.). Upper Saddle River, NJ: Prentice Hall. ISBN 978-0-13-604259-4.


== Further reading ==
Downey, Allen (July 2024). Think Python: How to Think Like a Computer Scientist (3rd ed.). O'Reilly Media. ISBN 978-1-0981-5543-8.
Lutz, Mark (2013). Learning Python (5th ed.). O'Reilly Media. ISBN 978-0-596-15806-4.
Summerfield, Mark (2009). Programming in Python 3 (2nd ed.). Addison-Wesley Professional. ISBN 978-0-321-68056-3.
Ramalho, Luciano (May 2022). Fluent Python. O'Reilly Media. ISBN 978-1-4920-5632-4.


== External links ==

Official website 
The Python Tutorial
