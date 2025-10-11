# C (programming language)

C is a general-purpose programming language. It was created in the 1970s by Dennis Ritchie and remains widely used and influential. By design, C gives the programmer relatively direct access to the features of the typical CPU architecture, customized for the target instruction set. It has been and continues to be used to implement operating systems (especially kernels), device drivers, and protocol stacks, but its use in application software has been decreasing. C is used on computers that range from the largest supercomputers to the smallest microcontrollers and embedded systems.
A successor to the programming language B, C was originally developed at Bell Labs by Ritchie between 1972 and 1973 to construct utilities running on Unix. It was applied to re-implementing the kernel of the Unix operating system. During the 1980s, C gradually gained popularity. It has become one of the most widely used programming languages, with C compilers available for practically all modern computer architectures and operating systems. The book The C Programming Language, co-authored by the original language designer, served for many years as the de facto standard for the language. C has been standardized since 1989 by the American National Standards Institute (ANSI) and, subsequently, jointly by the International Organization for Standardization (ISO) and the International Electrotechnical Commission (IEC).
C is an imperative procedural language, supporting structured programming, lexical variable scope, and recursion, with a static type system. It was designed to be compiled to provide low-level access to memory and language constructs that map efficiently to machine instructions, all with minimal runtime support. Despite its low-level capabilities, the language was designed to encourage cross-platform programming. A standards-compliant C program written with portability in mind can be compiled for a wide variety of computer platforms and operating systems with few changes to its source code.
Although neither C nor its standard library provide some popular features found in other languages, it is flexible enough to support them. For example, object orientation and garbage collection are provided by external libraries GLib Object System and Boehm garbage collector, respectively.
Since 2000, C has consistently ranked among the top four languages in the TIOBE index, a measure of the popularity of programming languages.


== Characteristics ==

The C language exhibits the following characteristics:


== "Hello, world" example ==

The "Hello, World!" program example that appeared in the first edition of K&R has become the model for an introductory program in most programming textbooks. The program prints "hello, world" to the standard output.
The original version was:

A more modern version is:

The first line is a preprocessor directive, indicated by #include, which causes the preprocessor to replace that line of code with the text of the stdio.h header file, which contains declarations for input and output functions including printf. The angle brackets around stdio.h indicate that the header file can be located using a search strategy that selects header files provided with the compiler over files with the same name that may be found in project-specific directories.
The next code line declares the entry point function main. The run-time environment calls this function to begin program execution. The type specifier int indicates that the function returns an integer value. The void parameter list indicates that the function consumes no arguments. The run-time environment actually passes two arguments (typed int and char *[]), but this implementation ignores them. The ISO C standard (section 5.1.2.2.1) requires syntax that either is void or these two arguments – a special treatment not afforded to other functions.
The opening curly brace indicates the beginning of the code that defines the function.
The next line of code calls (diverts execution to) the C standard library function printf with the address of the first character of a null-terminated string specified as a string literal. The text \n is an escape sequence that denotes the newline character which when output in a terminal results in moving the cursor to the beginning of the next line. Even though printf returns an int value, it is silently discarded. The semicolon ; terminates the call statement.
The closing curly brace indicates the end of the main function. Prior to C99, an explicit return 0; statement was required at the end of main function, but since C99, the main function (as being the initial function call) implicitly returns 0 upon reaching its final closing curly brace.


== History ==


=== Early developments ===

The origin of C is closely tied to the development of the Unix operating system, originally implemented in assembly language on a PDP-7 by Dennis Ritchie and Ken Thompson, incorporating several ideas from colleagues.  Eventually, they decided to port the operating system to a PDP-11. The original PDP-11 version of Unix was also developed in assembly language.


==== B ====

Thompson wanted a programming language for developing utilities for the new platform. He first tried writing a Fortran compiler, but he soon gave up the idea and instead created a cut-down version of the recently developed systems programming language called BCPL. The official description of BCPL was not available at the time, and Thompson modified the syntax to be less 'wordy' and similar to a simplified ALGOL known as SMALGOL. He called the result B, describing it as "BCPL semantics with a lot of SMALGOL syntax". Like BCPL, B had a bootstrapping compiler to facilitate porting to new machines. Ultimately, few utilities were written in B because it was too slow and could not take advantage of PDP-11 features such as byte addressability.
Unlike BCPL's // comment marking comments up to the end of the line, B adopted /* comment */ as the comment delimiter, more akin to PL/1, and allowing comments to appear in the middle of lines.  (BCPL's comment style would be reintroduced in C++.)


==== New B and first C release ====
In 1971 Ritchie  started to improve B, to use the features of the more-powerful PDP-11.  A significant addition was a character data type.  He called this New B (NB).  Thompson started to use NB to write the Unix kernel, and his requirements shaped the direction of the language development.  
Through to 1972, richer types were added to the NB language. NB had arrays of int and char, and to these types were added pointers, the ability to generate pointers to other types, arrays of all types, and types to be returned from functions. Arrays within expressions were effectively treated as pointers. A new compiler was written, and the language was renamed C.
The C compiler and some utilities made with it were included in Version 2 Unix, which is also known as Research Unix.


==== Structures and Unix kernel re-write ====
At Version 4 Unix, released in November 1973, the Unix kernel was extensively re-implemented in C. By this time, the C language had acquired some powerful features such as struct types.
The preprocessor was introduced around 1973 at the urging of Alan Snyder and also in recognition of the usefulness of the file-inclusion mechanisms available in BCPL and PL/I. Its original version provided only included files and simple string replacements: #include and #define of parameterless macros. Soon after that, it was extended, mostly by Mike Lesk and then by John Reiser, to incorporate macros with arguments and conditional compilation.
Unix was one of the first operating system kernels implemented in a language other than assembly. Earlier instances include the Multics system (which was written in PL/I) and Master Control Program (MCP) for the Burroughs B5000 (which was written in ALGOL) in 1961. In and around 1977, Ritchie and Stephen C. Johnson made further changes to the language to facilitate portability of the Unix operating system.  Johnson's Portable C Compiler served as the basis for several implementations of C on new platforms.


=== K&R C ===

In 1978 Brian Kernighan and Dennis Ritchie published the first edition of The C Programming Language. Known as K&R from the initials of its authors, the book served for many years as an informal specification of the language. The version of C that it describes is commonly referred to as "K&R C". As this was released in 1978, it is now also referred to as C78. The second edition of the book covers the later ANSI C standard, described below.
K&R introduced several language features:

Standard I/O library
long int data type
unsigned int data type
Compound assignment operators of the form =op (such as =-) were changed to the form op= (that is, -=) to remove the semantic ambiguity created by constructs such as i=-10, which had been interpreted as i =- 10 (decrement i by 10) instead of the possibly intended i = -10 (let i be −10).
Even after the publication of the 1989 ANSI standard, for many years K&R C was still considered the "lowest common denominator" to which C programmers restricted themselves when maximum portability was desired, since many older compilers were still in use, and because carefully written K&R C code can be legal Standard C as well.
Although later versions of C require functions to have an explicit type declaration, K&R C only requires functions that return a type other than int to be declared before use. Functions used without prior declaration were presumed to return int.
For example:

The declaration of long_function() (on line 1) is required since it returns long; not int. Function int_function can be called (line 11) even though it is not declared since it returns int. Also, variable intvar does not need to be declared as type int since that is the default type for register keyword.
Since function declarations did not include information about arguments, type checks were not performed, although some compilers would issue a warning if different calls to a function used different numbers or types of arguments. Tools such as Unix's lint utility were developed that (among other things) checked for consistency of function use across multiple source files.
In the years following the publication of K&R C, several features were added to the language, supported by compilers from AT&T (in particular PCC) and other vendors. These included:

void functions; functions returning no value
Functions returning struct or union types
Assignment for struct variables
Enumerated types
The popularity of the language, lack of agreement on standard library interfaces, and lack of compliance to the K&R specification, led to standardization efforts.


=== ANSI C and ISO C ===

During the late 1970s and 1980s, versions of C were implemented for a wide variety of mainframe computers, minicomputers, and microcomputers, including the IBM PC, as its popularity increased significantly.
In 1983 the American National Standards Institute (ANSI) formed a committee, X3J11, to establish a standard specification of C. X3J11 based the C standard on the Unix implementation; however, the non-portable portion of the Unix C library was handed off to the IEEE working group 1003 to become the basis for the 1988 POSIX standard. In 1989, the C standard was ratified as ANSI X3.159-1989 "Programming Language C".  This version of the language is often referred to as ANSI C, Standard C, or sometimes C89.
In 1990 the ANSI C standard (with formatting changes) was adopted by the International Organization for Standardization (ISO) as ISO/IEC 9899:1990, which is sometimes called C90. Therefore, the terms "C89" and "C90" refer to the same programming language.
ANSI, like other national standards bodies, no longer develops the C standard independently, but defers to the international C standard, maintained by the working group ISO/IEC JTC1/SC22/WG14.  National adoption of an update to the international standard typically occurs within a year of ISO publication.
One of the aims of the C standardization process was to produce a superset of K&R C, incorporating many of the subsequently introduced unofficial features. The standards committee also included several additional features such as function prototypes (borrowed from C++), void pointers, support for international character sets and locales, and preprocessor enhancements. Although the syntax for parameter declarations was augmented to include the style used in C++, the K&R interface continued to be permitted, for compatibility with existing source code.
C89 is supported by current C compilers, and most modern C code is based on it. Any program written only in Standard C and without any hardware-dependent assumptions will run correctly on any platform with a conforming C implementation, within its resource limits.  Without such precautions, programs may compile only on a certain platform or with a particular compiler, due, for example, to the use of non-standard libraries, such as GUI libraries, or to a reliance on compiler- or platform-specific attributes such as the exact size of data types and byte endianness.
In cases where code must be compilable by either standard-conforming or K&R C-based compilers, the __STDC__ macro can be used to split the code into Standard and K&R sections to prevent the use on a K&R C-based compiler of features available only in Standard C.
After the ANSI/ISO standardization process, the C language specification remained relatively static for several years. In 1995, Normative Amendment 1 to the 1990 C standard (ISO/IEC 9899/AMD1:1995, known informally as C95) was published, to correct some details and to add more extensive support for international character sets.


=== C99 ===

The C standard was further revised in the late 1990s, leading to the publication of ISO/IEC 9899:1999 in 1999, which is commonly referred to as "C99". It has since been amended three times by Technical Corrigenda.
C99 introduced several new features, including inline functions, several new data types (including long long int and a complex type to represent complex numbers), variable-length arrays and flexible array members, improved support for IEEE 754 floating point, support for variadic macros (macros of variable arity), and support for one-line comments beginning with //, as in BCPL or C++. Many of these had already been implemented as extensions in several C compilers.
C99 is for the most part backward compatible with C90, but is stricter in some ways; in particular, a declaration that lacks a type specifier no longer has int implicitly assumed. A standard macro __STDC_VERSION__ is defined with value 199901L to indicate that C99 support is available. GCC, Solaris Studio, and other C compilers now support many or all of the new features of C99. The C compiler in Microsoft Visual C++, however, implements the C89 standard and those parts of C99 that are required for compatibility with C++11.
In addition, the C99 standard requires support for identifiers using Unicode in the form of escaped characters (e.g. \u0040 or \U0001f431) and suggests support for raw Unicode names.


=== C11 ===

Work began in 2007 on another revision of the C standard, informally called "C1X" until its official publication of ISO/IEC 9899:2011 on December 8, 2011. The C standards committee adopted guidelines to limit the adoption of new features that had not been tested by existing implementations.
The C11 standard adds numerous new features to C and the library, including type generic macros, anonymous structures, improved Unicode support, atomic operations, multi-threading, and bounds-checked functions.  It also makes some portions of the existing C99 library optional, and improves compatibility with C++. The standard macro __STDC_VERSION__ is defined as 201112L to indicate that C11 support is available.


=== C17 ===

C17 is an informal name for ISO/IEC 9899:2018, a standard for the C programming language published in June 2018. It introduces no new language features, only technical corrections, and clarifications to defects in C11. The standard macro __STDC_VERSION__ is defined as 201710L to indicate that C17 support is available.


=== C23 ===

C23 is an informal name for the current major C language standard revision and was known as "C2X" through most of its development. It builds on past releases, introducing features like new keywords, types including nullptr_t and _BitInt(N), and expansions to the standard library.
C23 was published in October 2024 as ISO/IEC 9899:2024.  The standard macro __STDC_VERSION__ is defined as 202311L to indicate that C23 support is available.


=== C2Y ===
C2Y is an informal name for the next major C language standard revision, after C23 (C2X), that is hoped to be released later in the 2020s, hence the '2' in "C2Y". An early working draft of C2Y was released in February 2024 as N3220 by the working group ISO/IEC JTC1/SC22/WG14.


=== Embedded C ===

Historically, embedded C programming requires non-standard extensions to the C language to support exotic features such as fixed-point arithmetic, multiple distinct memory banks, and basic I/O operations.
In 2008, the C Standards Committee published a technical report extending the C language to address these issues by providing a common standard for all implementations to adhere to. It includes a number of features not available in normal C, such as fixed-point arithmetic, named address spaces, and basic I/O hardware addressing.


== Definition ==

C has a formal grammar specified by the C standard. Line endings are generally not significant in C; however, line boundaries do have significance during the preprocessing phase. Comments may appear either between the delimiters /* and */, or (since C99) following // until the end of the line. Comments delimited by /* and */ do not nest, and these sequences of characters are not interpreted as comment delimiters if they appear inside string or character literals.
C source files contain declarations and function definitions. Function definitions, in turn, contain declarations and statements. Declarations either define new types using keywords such as struct, union, and enum, or assign types to and perhaps reserve storage for new variables, usually by writing the type followed by the variable name. Keywords such as char and int specify built-in types. Sections of code are enclosed in braces ({ and }, sometimes called "curly brackets") to limit the scope of declarations and to act as a single statement for control structures.
As an imperative language, C uses statements to specify actions. The most common statement is an expression statement, consisting of an expression to be evaluated, followed by a semicolon; as a side effect of the evaluation, functions may be called and variables assigned new values. To modify the normal sequential execution of statements, C provides several control-flow statements identified by reserved keywords. Structured programming is supported by if ... [else] conditional execution and by do ... while, while, and for iterative execution (looping). The for statement has separate initialization, testing, and reinitialization expressions, any or all of which can be omitted. break and continue can be used within the loop. Break is used to leave the innermost enclosing loop statement and continue is used to skip to its reinitialisation. There is also a non-structured goto statement, which branches directly to the designated label within the function. switch selects a case to be executed based on the value of an integer expression. Different from many other languages, control-flow will fall through to the next case unless terminated by a break.
Expressions can use a variety of built-in operators and may contain function calls. The order in which arguments to functions and operands to most operators are evaluated is unspecified. The evaluations may even be interleaved. However, all side effects (including storage to variables) will occur before the next "sequence point"; sequence points include the end of each expression statement, and the entry to and return from each function call.  Sequence points also occur during evaluation of expressions containing certain operators (&&, ||, ?: and the comma operator). This permits a high degree of object code optimization by the compiler, but requires C programmers to take more care to obtain reliable results than is needed for other programming languages.
Kernighan and Ritchie say in the Introduction of The C Programming Language: "C, like any other language, has its blemishes. Some of the operators have the wrong precedence; some parts of the syntax could be better." The C standard did not attempt to correct many of these blemishes, because of the impact of such changes on already existing software.


=== Character set ===
The basic C source character set includes the following characters:

Lowercase and uppercase letters of the ISO basic Latin alphabet: a–z, A–Z
Decimal digits: 0–9
Graphic characters: ! " # % & ' ( ) * + , - . / : ; < = > ? [ \ ] ^ _ { | } ~
Whitespace characters: space, horizontal tab, vertical tab, form feed, newline
The newline character indicates the end of a text line; it need not correspond to an actual single character, although for convenience C treats it as such.
The POSIX standard mandates a portable character set which adds a few characters (notably "@") to the basic C source character set. Both standards do not prescribe any particular value encoding -- ASCII and EBCDIC both comply with these standards, since they include at least those basic characters, even though they use different encoded values for those characters.
Additional multi-byte encoded characters may be used in string literals, but they are not entirely portable. Since C99 multi-national Unicode characters can be embedded portably within C source text by using \uXXXX or \UXXXXXXXX encoding (where X denotes a hexadecimal character).
The basic C execution character set contains the same characters, along with representations for the null character, alert, backspace, and carriage return.
Run-time support for extended character sets has increased with each revision of the C standard.


=== Reserved words ===
All versions of C have reserved words that are case sensitive. As reserved words, they cannot be used for variable names.
C89 has 32 reserved words:

C99 added five more reserved words: (‡ indicates an alternative spelling alias for a C23 keyword)

C11 added seven more reserved words: (‡ indicates an alternative spelling alias for a C23 keyword)

C23 reserved fifteen more words:

Most of the recently reserved words begin with an underscore followed by a capital letter, because identifiers of that form were previously reserved by the C standard for use only by implementations.  Since existing program source code should not have been using these identifiers, it would not be affected when C implementations started supporting these extensions to the programming language. Some standard headers do define more convenient synonyms for underscored identifiers. Some of those words were added as keywords with their conventional spelling in C23 and the corresponding macros were removed.
Prior to C89, entry was reserved as a keyword. In the second edition of their book The C Programming Language, which describes what became known as C89, Kernighan and Ritchie wrote, "The ... [keyword] entry, formerly reserved but never used, is no longer reserved." and "The stillborn entry keyword is withdrawn."


=== Operators ===

C supports a rich set of operators, which are symbols used within an expression to specify the manipulations to be performed while evaluating that expression. C has operators for:

arithmetic: +, -, *, /, %
assignment: =
augmented assignment: +=, -=, *=, /=, %=, &=, |=, ^=, <<=, >>=
bitwise logic: ~, &, |, ^
bitwise shifts: <<, >>
Boolean logic: !, &&, ||
conditional evaluation: ? :
equality testing: ==, !=
calling functions: ( )
increment and decrement: ++, --
member selection: ., ->
object size: sizeof
type: typeof, typeof_unqual since C23
order relations: <, <=, >, >=
reference and dereference: &, *, [ ]
sequencing: ,
subexpression grouping: ( )
type conversion: (typename)
C uses the operator = (used in mathematics to express equality) to indicate assignment, following the precedent of Fortran and PL/I, but unlike ALGOL and its derivatives. C uses the operator == to test for equality. The similarity between the operators for assignment and equality may result in the accidental use of one in place of the other, and in many cases the mistake does not produce an error message (although some compilers produce warnings). For example, the conditional expression if (a == b + 1) might mistakenly be written as if (a = b + 1), which will be evaluated as true unless the value of a is 0 after the assignment.
The C operator precedence is not always intuitive. For example, the operator == binds more tightly than (is executed prior to) the operators & (bitwise AND) and | (bitwise OR) in expressions such as x & 1 == 0, which must be written as (x & 1) == 0 if that is the coder's intent.


=== Data types ===

The type system in C is static and weakly typed, which makes it similar to the type system of ALGOL descendants such as Pascal.  There are built-in types for integers of various sizes, both signed and unsigned, floating-point numbers, and enumerated types (enum).  Integer type char is often used for single-byte characters.  C99 added a Boolean data type.  There are also derived types including arrays, pointers, records (struct), and unions (union).
C is often used in low-level systems programming where escapes from the type system may be necessary.  The compiler attempts to ensure type correctness of most expressions, but the programmer can override the checks in various ways, either by using a type cast to explicitly convert a value from one type to another, or by using pointers or unions to reinterpret the underlying bits of a data object in some other way.
Some find C's declaration syntax unintuitive, particularly for function pointers. (Ritchie's idea was to declare identifiers in contexts resembling their use: "declaration reflects use".)
C's usual arithmetic conversions allow for efficient code to be generated, but can sometimes produce unexpected results.  For example, a comparison of signed and unsigned integers of equal width requires a conversion of the signed value to unsigned.  This can generate unexpected results if the signed value is negative.


==== Pointers ====
C supports the use of pointers, a type of reference that records the address or location of an object or function in memory.  Pointers can be dereferenced to access data stored at the address pointed to, or to invoke a pointed-to function.  Pointers can be manipulated using assignment or pointer arithmetic.  The run-time representation of a pointer value is typically a raw memory address (perhaps augmented by an offset-within-word field), but since a pointer's type includes the type of the thing pointed to, expressions including pointers can be type-checked at compile time.  Pointer arithmetic is automatically scaled by the size of the pointed-to data type.
Pointers are used for many purposes in C.  Text strings are commonly manipulated using pointers into arrays of characters.  Dynamic memory allocation is performed using pointers; the result of a malloc is usually cast to the data type of the data to be stored.  Many data types, such as trees, are commonly implemented as dynamically allocated struct objects linked together using pointers. Pointers to other pointers are often used in multi-dimensional arrays and arrays of struct objects.  Pointers to functions (function pointers) are useful for passing functions as arguments to higher-order functions (such as qsort or bsearch), in dispatch tables, or as callbacks to event handlers.
A null pointer value explicitly points to no valid location. Dereferencing a null pointer value is undefined, often resulting in a segmentation fault.  Null pointer values are useful for indicating special cases such as no "next" pointer in the final node of a linked list, or as an error indication from functions returning pointers.  In appropriate contexts in source code, such as for assigning to a pointer variable, a null pointer constant can be written as 0, with or without explicit casting to a pointer type, as the NULL macro defined by several standard headers or, since C23 with the constant nullptr.  In conditional contexts, null pointer values evaluate to false, while all other pointer values evaluate to true.
Void pointers (void *) point to objects of unspecified type, and can therefore be used as "generic" data pointers. Since the size and type of the pointed-to object is not known, void pointers cannot be dereferenced, nor is pointer arithmetic on them allowed, although they can easily be (and in many contexts implicitly are) converted to and from any other object pointer type.
Careless use of pointers is potentially dangerous.  Because they are typically unchecked, a pointer variable can be made to point to any arbitrary location, which can cause undesirable effects.  Although properly used pointers point to safe places, they can be made to point to unsafe places by using invalid pointer arithmetic; the objects they point to may continue to be used after deallocation (dangling pointers); they may be used without having been initialized (wild pointers); or they may be directly assigned an unsafe value using a cast, union, or through another corrupt pointer.  In general, C is permissive in allowing manipulation of and conversion between pointer types, although compilers typically provide options for various levels of checking. Some other programming languages address these problems by using more restrictive reference types.


==== Arrays ====

Array types in C are traditionally of a fixed, static size specified at compile time. The more recent C99 standard also allows a form of variable-length arrays.  However, it is also possible to allocate a block of memory (of arbitrary size) at run time, using the standard library's malloc function, and treat it as an array.
Since arrays are always accessed (in effect) via pointers, array accesses are typically not checked against the underlying array size, although some compilers may provide bounds checking as an option.  Array bounds violations are therefore possible and can lead to various repercussions, including illegal memory accesses, corruption of data, buffer overruns, and run-time exceptions.
C does not have a special provision for declaring multi-dimensional arrays, but rather relies on recursion within the type system to declare arrays of arrays, which effectively accomplishes the same thing.  The index values of the resulting "multi-dimensional array" can be thought of as increasing in row-major order. Multi-dimensional arrays are commonly used in numerical algorithms (mainly from applied linear algebra) to store matrices. The structure of the C array is well suited to this particular task. However, in early versions of C the bounds of the array must be known fixed values or else explicitly passed to any subroutine that requires them, and dynamically sized arrays of arrays cannot be accessed using double indexing. (A workaround for this was to allocate the array with an additional "row vector" of pointers to the columns.) C99 introduced "variable-length arrays" which address this issue.
The following example using modern C (C99 or later) shows allocation of a two-dimensional array on the heap and the use of multi-dimensional array indexing for accesses (which can use bounds-checking on many C compilers):

And here is a similar implementation using C99's Auto VLA feature:


==== Array–pointer interchangeability ====
The subscript notation x[i] (where x designates a pointer) is syntactic sugar for *(x+i). Taking advantage of the compiler's knowledge of the pointer type, the address that x + i points to is not the base address (pointed to by x) incremented by i bytes, but rather is defined to be the base address incremented by i multiplied by the size of an element that x points to.  Thus, x[i] designates the i+1th element of the array.
Furthermore, in most expression contexts (a notable exception is as operand of sizeof), an expression of array type is automatically converted to a pointer to the array's first element. This implies that an array is never copied as a whole when named as an argument to a function, but rather only the address of its first element is passed. Therefore, although function calls in C use pass-by-value semantics, arrays are in effect passed by reference.
The total size of an array x can be determined by applying sizeof to an expression of array type. The size of an element can be determined by applying the operator sizeof to any dereferenced element of an array A, as in n = sizeof A[0]. Thus, the number of elements in a declared array A can be determined as sizeof A / sizeof A[0]. Note, that if only a pointer to the first element is available as it is often the case in C code because of the automatic conversion described above, the information about the full type of the array and its length are lost.


=== Memory management ===
One of the most important functions of a programming language is to provide facilities for managing memory and the objects that are stored in memory. C provides three principal ways to allocate memory for objects:

Static memory allocation: space for the object is provided in the binary at compile time; these objects have an extent (or lifetime) as long as the binary which contains them is loaded into memory.
Automatic memory allocation: temporary objects can be stored on the stack, and this space is automatically freed and reusable after the block in which they are declared is exited.
Dynamic memory allocation: blocks of memory of arbitrary size can be requested at run time using library functions such as malloc from a region of memory called the heap; these blocks persist until subsequently freed for reuse by calling the library function realloc or free.
These three approaches are appropriate in different situations and have various trade-offs. For example, static memory allocation has little allocation overhead, automatic allocation may involve slightly more overhead, and dynamic memory allocation can potentially have a great deal of overhead for both allocation and deallocation. The persistent nature of static objects is useful for maintaining state information across function calls, automatic allocation is easy to use but stack space is typically much more limited and transient than either static memory or heap space, and dynamic memory allocation allows convenient allocation of objects whose size is known only at run time. Most C programs make extensive use of all three.
Where possible, automatic or static allocation is usually simplest because the storage is managed by the compiler, freeing the programmer of the potentially error-prone chore of manually allocating and releasing storage. However, many data structures can change in size at run time, and since static allocations (and automatic allocations before C99) must have a fixed size at compile time, there are many situations in which dynamic allocation is necessary.  Prior to the C99 standard, variable-sized arrays were a common example of this. (See the article on C dynamic memory allocation for an example of dynamically allocated arrays.) Unlike automatic allocation, which can fail at run time with uncontrolled consequences, the dynamic allocation functions return an indication (in the form of a null pointer value) when the required storage cannot be allocated.  (Static allocation that is too large is usually detected by the linker or loader, before the program can even begin execution.)
Unless otherwise specified, static objects contain zero or null pointer values upon program startup. Automatically and dynamically allocated objects are initialized only if an initial value is explicitly specified; otherwise they initially have indeterminate values (typically, whatever bit pattern happens to be present in the storage, which might not even represent a valid value for that type). If the program attempts to access an uninitialized value, the results are undefined. Many modern compilers try to detect and warn about this problem, but both false positives and false negatives can occur.
Heap memory allocation has to be synchronized with its actual usage in any program to be reused as much as possible. For example, if the only pointer to a heap memory allocation goes out of scope or has its value overwritten before it is deallocated explicitly, then that memory cannot be recovered for later reuse and is essentially lost to the program, a phenomenon known as a memory leak. Conversely, it is possible for memory to be freed but referenced subsequently, leading to unpredictable results. Typically, the failure symptoms appear in a portion of the program unrelated to the code that causes the error, making it difficult to diagnose the failure. Such issues are ameliorated in languages with automatic garbage collection.


=== Libraries ===
The C programming language uses libraries as its primary method of extension. In C, a library is a set of functions contained within a single "archive" file.  Each library typically has a header file, which contains the prototypes of the functions contained within the library that may be used by a program, and declarations of special data types and macro symbols used with these functions. For a program to use a library, it must include the library's header file, and the library must be linked with the program, which in many cases requires compiler flags (e.g., -lm, shorthand for "link the math library").
The most common C library is the C standard library, which is specified by the ISO and ANSI C standards and comes with every C implementation (implementations which target limited environments such as embedded systems may provide only a subset of the standard library). This library supports stream input and output, memory allocation, mathematics, character strings, and time values.  Several separate standard headers (for example, stdio.h) specify the interfaces for these and other standard library facilities.
Another common set of C library functions are those used by applications specifically targeted for Unix and Unix-like systems, especially functions which provide an interface to the kernel. These functions are detailed in various standards such as POSIX and the Single UNIX Specification.
Since many programs have been written in C, there are a wide variety of other libraries available. Libraries are often written in C because C compilers generate efficient object code; programmers then create interfaces to the library so that the routines can be used from higher-level languages like Java, Perl, and Python.


==== File handling and streams ====
File input and output (I/O) is not part of the C language itself but instead is handled by libraries (such as the C standard library) and their associated header files (e.g. stdio.h). File handling is generally implemented through high-level I/O which works through streams. A stream is from this perspective a data flow that is independent of devices, while a file is a concrete device. The high-level I/O is done through the association of a stream to a file. In the C standard library, a buffer (a memory area or queue) is temporarily used to store data before it is sent to the final destination. This reduces the time spent waiting for slower devices, for example a hard drive or solid-state drive. Low-level I/O functions are not part of the standard C library but are generally part of "bare metal" programming (programming that is independent of any operating system such as most embedded programming). With few exceptions, implementations include low-level I/O.


== Language tools ==

A number of tools have been developed to help C programmers find and fix statements with undefined behavior or possibly erroneous expressions, with greater rigor than that provided by the compiler.
Automated source code checking and auditing tools exist, such as Lint. A common practice is to use Lint to detect questionable code when a program is first written. Once a program passes Lint, it is then compiled using the C compiler. Also, many compilers can optionally warn about syntactically valid constructs that are likely to actually be errors. MISRA C is a proprietary set of guidelines to avoid such questionable code, developed for embedded systems.
There are also compilers, libraries, and operating system level mechanisms for performing actions that are not a standard part of C, such as bounds checking for arrays, detection of buffer overflow, serialization, dynamic memory tracking, and automatic garbage collection.
Memory management checking tools like Purify or Valgrind and linking with libraries containing special versions of the memory allocation functions can help uncover run-time errors in memory usage.


== Uses ==
C has been widely used to implement end-user and system-level applications.


=== Rationale for use in systems programming ===

C is widely used for systems programming in implementing operating systems and embedded system applications. This is for several reasons:

The C language permits platform hardware and memory to be accessed with pointers and type punning, so system-specific features (e.g. Control/Status Registers, I/O registers) can be configured and used with code written in C – it allows fullest control of the platform it is running on.
The code generated by compilation does not demand many system features, and can be invoked from some boot code in a straightforward manner – it is simple to execute.
The C language statements and expressions typically map well to sequences of instructions for the target processor, and consequently there is a low run-time demand on system resources – it is fast to execute.
With its rich set of operators, the C language can use many of the features of target CPUs.  Where a particular CPU has more esoteric instructions, a language variant can be constructed with perhaps intrinsic functions to exploit those instructions – it can use practically all the target CPU's features.
The language makes it easy to overlay structures onto blocks of binary data, allowing the data to be comprehended, navigated and modified – it can write data structures, even file systems.
The language supports a rich set of operators, including bit manipulation, for integer arithmetic and logic, and perhaps different sizes of floating point numbers – it can process appropriately structured data effectively.
C is a fairly small language, with only a handful of statements, and without too many features that generate extensive target code – it is comprehensible.
C has direct control over memory allocation and deallocation, which gives reasonable efficiency and predictable timing to memory-handling operations, without any concerns for sporadic stop-the-world garbage collection events – it has predictable performance.
C permits the use and implementation of different memory allocation schemes, including a typical malloc and free; a more sophisticated mechanism with arenas; or a version for an OS kernel that may suit DMA, use within interrupt handlers, or integrated with the virtual memory system.
Depending on the linker and environment, C code can also call libraries written in assembly language, and may be called from assembly language – it interoperates well with other lower-level code.
C and its calling conventions and linker structures are commonly used in conjunction with other high-level languages, with calls both to C and from C supported – it interoperates well with other high-level code.
C has a mature and broad ecosystem, including libraries, frameworks, open source compilers, debuggers and utilities, and is the de facto standard. It is likely the drivers already exist in C, or that there is a similar CPU architecture as a back-end of a C compiler, so there is reduced incentive to choose another language.


=== Games ===
Computer games are often built from a combination of languages. C has featured significantly, especially for those games attempting to obtain best performance from computer platforms.  Examples include Doom from 1993.


=== World Wide Web ===
Historically, C was sometimes used for web development using the Common Gateway Interface (CGI) as a "gateway" for information between the web application, the server, and the browser. C may have been chosen over interpreted languages because of its speed, stability, and near-universal availability.  It is no longer common practice for web development to be done in C, and many other web development languages are popular.  Applications where C-based web development continues include the HTTP configuration pages on routers, IoT devices and similar, although even here some projects have parts in higher-level languages e.g. the use of Lua within OpenWRT.
Two popular web servers, Apache HTTP Server and Nginx, are written in C. C's close-to-the-metal approach allows for the construction of these high-performance software systems.


=== C as an intermediate language ===
C is sometimes used as an intermediate language by implementations of other languages. This approach may be used for portability or convenience; by using C as an intermediate language, additional machine-specific code generators are not necessary.  C has some features, such as line-number preprocessor directives and optional superfluous commas at the end of initializer lists, that support compilation of generated code. However, some of C's shortcomings have prompted the development of other C-based languages specifically designed for use as intermediate languages, such as C--. Also, contemporary major compilers GCC and LLVM both feature an intermediate representation that is not C, and those compilers support front ends for many languages including C.


=== Computationally intensive libraries ===
C enables programmers to create efficient implementations of algorithms and data structures, because the layer of abstraction from hardware is thin, and its overhead is low, an important criterion for computationally intensive programs. For example, the GNU Multiple Precision Arithmetic Library, the GNU Scientific Library, Mathematica, and MATLAB are completely or partially written in C.  Many languages support calling library functions in C; for example, the Python-based framework NumPy uses C for the high-performance and hardware-interacting aspects.


=== Other languages are  written in C ===
A consequence of C's wide availability and efficiency is that compilers, libraries and interpreters of other programming languages are often implemented in C. For example, the reference implementations of Python, Perl, Ruby, and PHP are written in C.


== Limitations ==
Ritchie himself joked about the limitations of the language that he created:

the power of assembly language and the convenience of ... assembly language
While C is popular, influential and hugely successful, it has drawbacks, including:

The standard dynamic memory handling with malloc and free is prone to mistakes. Improper use can lead to memory leaks and dangling pointers.
The use of pointers and the direct manipulation of memory means corruption of memory is possible.
There is type checking, yet it does not apply to some areas like variadic functions, and the type checking can be trivially or inadvertently circumvented.  It is weakly typed, despite being statically typed.
Since the code generated by the compiler contains few run-time checks, there is a burden on the programmer to consider all possible outcomes, to protect against buffer overruns, array bounds checking, stack overflows, and memory exhaustion, and consider race conditions, thread isolation, etc.
The use of pointers and the run-time manipulation of these enables two ways to access the same data (aliasing), which is not always determinable at compile time.  This means that some optimizations that may be available to some other languages, such as Fortran, are not possible in C.  For this reason, Fortran is sometimes considered faster.
Some of the standard library functions, e.g. scanf or strncat, can lead to buffer overruns.
There is limited standardization in support for low-level variants in generated code, such as different function calling conventions and ABIs; different structure packing conventions; and different byte ordering within larger integers (including endianness).  In many language implementations, some of these options may be handled with the preprocessor directive #pragma, and some with additional keywords e.g. use __cdecl calling convention.  The directive and options are not consistently supported.
String handling using the standard library is code-intensive, with explicit memory management required.
The language does not directly support object orientation, introspection, run-time expression evaluation (like eval in JavaScript), garbage collection, etc.
There are few guards against misuse of language features, which may enable unmaintainable code. In particular, the C preprocessor can hide troubling effects such as double evaluation and worse.  This capability for obfuscated code has been celebrated with competitions such as the International Obfuscated C Code Contest and the Underhanded C Contest.
C lacks standard support for exception handling and only offers return codes for error checking. The setjmp and longjmp standard library functions have been used to implement a try-catch mechanism via macros. Also, goto statements are commonly used for error handling.
For some purposes, restricted styles of C have been adopted, e.g. MISRA C or CERT C, in an attempt to reduce the opportunity for glitches.  Databases such as CWE attempt to count the ways that C has potential vulnerabilities, along with recommendations for mitigation.
There are tools that can mitigate some of the drawbacks.  Contemporary C compilers include checks which may generate warnings to help identify many potential bugs.


== Related languages ==

Many languages developed after C were influenced by and borrowed aspects of C, including C++, C#, C shell, D, Go, Java, JavaScript, Julia, Limbo, LPC, Objective-C, Perl, PHP, Python, Ruby, Rust, Swift, Verilog and SystemVerilog. Some claim that the most pervasive influence has been syntactical – that these languages combine the statement and expression syntax of C with type systems, data models and large-scale program structures that differ from those of C, sometimes radically.
Several C or near-C interpreters exist, including Ch and CINT, which can also be used for scripting.
When object-oriented programming languages became popular, C++ and Objective-C were two different extensions of C that provided object-oriented capabilities. Both languages were originally implemented as source-to-source compilers; source code was translated into C, and then compiled with a C compiler.
The C++ programming language (originally named "C with Classes") was devised by Bjarne Stroustrup as an approach to providing object-oriented functionality with a C-like syntax. C++ adds greater typing strength, scoping, and other tools useful in object-oriented programming, and permits generic programming via templates. Nearly a superset of C, C++ now supports most of C, with a few exceptions.
Objective-C was originally a thin layer on top of C, and remains a strict superset of C that permits object-oriented programming using a hybrid dynamic/static typing paradigm. Objective-C derives its syntax from both C and Smalltalk: syntax that involves preprocessing, expressions, function declarations, and function calls is inherited from C, while the syntax for object-oriented features was originally taken from Smalltalk.
In addition to C++ and Objective-C, Ch, Cilk, and Unified Parallel C are nearly supersets of C.


== See also ==

Comparison of Pascal and C
Comparison of programming languages
List of C compilers
List of C programming books
Outline of the C programming language


== Notes ==


== References ==


== Sources ==


== Further reading ==


== External links ==
ISO C Working Group official website
ISO/IEC 9899, publicly available official C documents, including the C99 Rationale
"C99 with Technical corrigenda TC1, TC2, and TC3 included" (PDF). Archived (PDF) from the original on October 25, 2007. (3.61 MB)
comp.lang.c Frequently Asked Questions
A History of C, by Dennis Ritchie
C Library Reference and Examples
