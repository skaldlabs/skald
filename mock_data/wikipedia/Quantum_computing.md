# Quantum computing

A quantum computer is a (real or theoretical) computer that uses quantum mechanical phenomena in an essential way: it exploits superposed and entangled states, and the intrinsically non-deterministic outcomes of quantum measurements, as features of its computation. Quantum computers can be viewed as sampling from quantum systems that evolve in ways classically described as operating on an enormous number of possibilities simultaneously, though still subject to strict computational constraints. By contrast, ordinary ("classical") computers operate according to deterministic rules. Any classical computer can, in principle, be replicated by a (classical) mechanical device such as a Turing machine, with only polynomial overhead in time. Quantum computers, on the other hand are believed to require exponentially more resources to simulate classically. It is widely believed that a scalable quantum computer could perform some calculations exponentially faster than any classical computer. Theoretically, a large-scale quantum computer could break some widely used public-key cryptographic schemes and aid physicists in performing physical simulations. However, current hardware implementations of quantum computation are largely experimental and only suitable for specialized tasks.
The basic unit of information in quantum computing, the qubit (or "quantum bit"), serves the same function as the bit in ordinary or "classical" computing. However, unlike a classical bit, which can be in one of two states (a binary), a qubit can exist in a linear combination of two states known as a quantum superposition. The result of measuring a qubit is one of the two states given by a probabilistic rule. If a quantum computer manipulates the qubit in a particular way, wave interference effects amplify the probability of the desired measurement result. The design of quantum algorithms involves creating procedures that allow a quantum computer to perform this amplification.
Quantum computers are not yet practical for real-world applications. Physically engineering high-quality qubits has proven to be challenging. If a physical qubit is not sufficiently isolated from its environment, it suffers from quantum decoherence, introducing noise into calculations. National governments have invested heavily in experimental research aimed at developing scalable qubits with longer coherence times and lower error rates. Example implementations include superconductors (which isolate an electrical current by eliminating electrical resistance) and ion traps (which confine a single atomic particle using electromagnetic fields). Researchers have claimed, and are widely believed to be correct, that certain quantum devices can outperform classical computers on narrowly defined tasks, a milestone referred to as quantum advantage or quantum supremacy. These tasks are not necessarily useful for real-world applications.


== History ==

For many years, the fields of quantum mechanics and computer science formed distinct academic communities. Modern quantum theory developed in the 1920s to explain perplexing physical phenomena observed at atomic scales, and digital computers emerged in the following decades to replace human computers for tedious calculations. Both disciplines had practical applications during World War II; computers played a major role in wartime cryptography, and quantum physics was essential for nuclear physics used in the Manhattan Project.
As physicists applied quantum mechanical models to computational problems and swapped digital bits for qubits, the fields of quantum mechanics and computer science began to converge. In 1980, Paul Benioff introduced the quantum Turing machine, which uses quantum theory to describe a simplified computer.
When digital computers became faster, physicists faced an exponential increase in overhead when simulating quantum dynamics, prompting Yuri Manin and Richard Feynman to independently suggest that hardware based on quantum phenomena might be more efficient for computer simulation.
In a 1984 paper, Charles Bennett and Gilles Brassard applied quantum theory to cryptography protocols and demonstrated that quantum key distribution could enhance information security.
Quantum algorithms then emerged for solving oracle problems, such as Deutsch's algorithm in 1985, the Bernstein–Vazirani algorithm in 1993, and Simon's algorithm in 1994.
These algorithms did not solve practical problems, but demonstrated mathematically that one could gain more information by querying a black box with a quantum state in superposition, sometimes referred to as quantum parallelism.

Peter Shor built on these results with his 1994 algorithm for breaking the widely used RSA and Diffie–Hellman encryption protocols, which drew significant attention to the field of quantum computing. In 1996, Grover's algorithm established a quantum speedup for the widely applicable unstructured search problem. The same year, Seth Lloyd proved that quantum computers could simulate quantum systems without the exponential overhead present in classical simulations, validating Feynman's 1982 conjecture.
Over the years, experimentalists have constructed small-scale quantum computers using trapped ions and superconductors.
In 1998, a two-qubit quantum computer demonstrated the feasibility of the technology, and subsequent experiments have increased the number of qubits and reduced error rates.
In 2019, Google AI and NASA announced that they had achieved quantum supremacy with a 54-qubit machine, performing a computation that is impossible for any classical computer.
This announcement was met with a rebuttal from Google's direct competitor, IBM. IBM contended that the calculation Google claimed would take 10,000 years could be performed in just 2.5 days on its own Summit supercomputer if its architecture were optimized, sparking a debate over the precise threshold for "quantum supremacy".


== Quantum information processing ==
Computer engineers typically describe a modern computer's operation in terms of classical electrodynamics.
Within these "classical" computers, some components (such as semiconductors and random number generators) may rely on quantum behavior, but these components are not isolated from their environment, so any quantum information quickly decoheres.
While programmers may depend on probability theory when designing a randomized algorithm, quantum mechanical notions like superposition and interference are largely irrelevant for program analysis.
Quantum programs, in contrast, rely on precise control of coherent quantum systems. Physicists describe these systems mathematically using linear algebra. Complex numbers model probability amplitudes, vectors model quantum states, and matrices model the operations that can be performed on these states. Programming a quantum computer is then a matter of composing operations in such a way that the resulting program computes a useful result in theory and is implementable in practice.
As physicist Charlie Bennett describes the relationship between quantum and classical computers,

A classical computer is a quantum computer ... so we shouldn't be asking about "where do quantum speedups come from?" We should say, "well, all computers are quantum. ... Where do classical slowdowns come from?"


=== Quantum information ===
Just as the bit is the basic concept of classical information theory, the qubit is the fundamental unit of quantum information. The same term qubit is used to refer to an abstract mathematical model and to any physical system that is represented by that model. A classical bit, by definition, exists in either of two physical states, which can be denoted 0 and 1. A qubit is also described by a state, and two states often written 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 and 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
 serve as the quantum counterparts of the classical states 0 and 1. However, the quantum states 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 and 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
 belong to a vector space, meaning that they can be multiplied by constants and added together, and the result is again a valid quantum state. Such a combination is known as a superposition of 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 and 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
.
A two-dimensional vector mathematically represents a qubit state. Physicists typically use Dirac notation for quantum mechanical linear algebra, writing 
  
    
      
        
          |
        
        ψ
        ⟩
      
    
    {\displaystyle |\psi \rangle }
  
 'ket psi' for a vector labeled 
  
    
      
        ψ
      
    
    {\displaystyle \psi }
  
 . Because a qubit is a two-state system, any qubit state takes the form 
  
    
      
        α
        
          |
        
        0
        ⟩
        +
        β
        
          |
        
        1
        ⟩
      
    
    {\displaystyle \alpha |0\rangle +\beta |1\rangle }
  
, where 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 and 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
 are the standard basis states, and 
  
    
      
        α
      
    
    {\displaystyle \alpha }
  
 and 
  
    
      
        β
      
    
    {\displaystyle \beta }
  
 are the probability amplitudes, which are in general complex numbers. If either 
  
    
      
        α
      
    
    {\displaystyle \alpha }
  
 or 
  
    
      
        β
      
    
    {\displaystyle \beta }
  
 is zero, the qubit is effectively a classical bit; when both are nonzero, the qubit is in superposition. Such a quantum state vector acts similarly to a (classical) probability vector, with one key difference: unlike probabilities, probability amplitudes are not necessarily positive numbers. Negative amplitudes allow for destructive wave interference.
When a qubit is measured in the standard basis, the result is a classical bit. The Born rule describes the norm-squared correspondence between amplitudes and probabilities—when measuring a qubit 
  
    
      
        α
        
          |
        
        0
        ⟩
        +
        β
        
          |
        
        1
        ⟩
      
    
    {\displaystyle \alpha |0\rangle +\beta |1\rangle }
  
, the state collapses to 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 with probability 
  
    
      
        
          |
        
        α
        
          
            |
          
          
            2
          
        
      
    
    {\displaystyle |\alpha |^{2}}
  
, or to 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
 with probability 
  
    
      
        
          |
        
        β
        
          
            |
          
          
            2
          
        
      
    
    {\displaystyle |\beta |^{2}}
  
.
Any valid qubit state has coefficients 
  
    
      
        α
      
    
    {\displaystyle \alpha }
  
 and 
  
    
      
        β
      
    
    {\displaystyle \beta }
  
 such that 
  
    
      
        
          |
        
        α
        
          
            |
          
          
            2
          
        
        +
        
          |
        
        β
        
          
            |
          
          
            2
          
        
        =
        1
      
    
    {\displaystyle |\alpha |^{2}+|\beta |^{2}=1}
  
.
As an example, measuring the qubit 
  
    
      
        1
        
          /
        
        
          
            2
          
        
        
          |
        
        0
        ⟩
        +
        1
        
          /
        
        
          
            2
          
        
        
          |
        
        1
        ⟩
      
    
    {\displaystyle 1/{\sqrt {2}}|0\rangle +1/{\sqrt {2}}|1\rangle }
  
 would produce either 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\displaystyle |0\rangle }
  
 or 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\displaystyle |1\rangle }
  
 with equal probability.
Each additional qubit doubles the dimension of the state space.
As an example, the vector ⁠1/√2⁠|00⟩ + ⁠1/√2⁠|01⟩ represents a two-qubit state, a tensor product of the qubit |0⟩ with the qubit ⁠1/√2⁠|0⟩ + ⁠1/√2⁠|1⟩.
This vector inhabits a four-dimensional vector space spanned by the basis vectors |00⟩, |01⟩, |10⟩, and |11⟩.
The Bell state ⁠1/√2⁠|00⟩ + ⁠1/√2⁠|11⟩ is impossible to decompose into the tensor product of two individual qubits—the two qubits are entangled because neither qubit has a state vector of its own.
In general, the vector space for an n-qubit system is 2n-dimensional, and this makes it challenging for a classical computer to simulate a quantum one: representing a 100-qubit system requires storing 2100 classical values.


=== Unitary operators ===

The state of this one-qubit quantum memory can be manipulated by applying quantum logic gates, analogous to how classical memory can be manipulated with classical logic gates. One important gate for both classical and quantum computation is the NOT gate, which can be represented by a matrix

  
    
      
        X
        :=
        
          
            (
            
              
                
                  0
                
                
                  1
                
              
              
                
                  1
                
                
                  0
                
              
            
            )
          
        
        .
      
    
    {\displaystyle X:={\begin{pmatrix}0&1\\1&0\end{pmatrix}}.}
  

Mathematically, the application of such a logic gate to a quantum state vector is modelled with matrix multiplication. Thus

  
    
      
        X
        
          |
        
        0
        ⟩
        =
        
          |
        
        1
        ⟩
      
    
    {\displaystyle X|0\rangle =|1\rangle }
  
 and 
  
    
      
        X
        
          |
        
        1
        ⟩
        =
        
          |
        
        0
        ⟩
      
    
    {\displaystyle X|1\rangle =|0\rangle }
  
.
The mathematics of single qubit gates can be extended to operate on multi-qubit quantum memories in two important ways. One way is simply to select a qubit and apply that gate to the target qubit while leaving the remainder of the memory unaffected. Another way is to apply the gate to its target only if another part of the memory is in a desired state. These two choices can be illustrated using another example. The possible states of a two-qubit quantum memory are

  
    
      
        
          |
        
        00
        ⟩
        :=
        
          
            (
            
              
                
                  1
                
              
              
                
                  0
                
              
              
                
                  0
                
              
              
                
                  0
                
              
            
            )
          
        
        ;
        
        
          |
        
        01
        ⟩
        :=
        
          
            (
            
              
                
                  0
                
              
              
                
                  1
                
              
              
                
                  0
                
              
              
                
                  0
                
              
            
            )
          
        
        ;
        
        
          |
        
        10
        ⟩
        :=
        
          
            (
            
              
                
                  0
                
              
              
                
                  0
                
              
              
                
                  1
                
              
              
                
                  0
                
              
            
            )
          
        
        ;
        
        
          |
        
        11
        ⟩
        :=
        
          
            (
            
              
                
                  0
                
              
              
                
                  0
                
              
              
                
                  0
                
              
              
                
                  1
                
              
            
            )
          
        
        .
      
    
    {\displaystyle |00\rangle :={\begin{pmatrix}1\\0\\0\\0\end{pmatrix}};\quad |01\rangle :={\begin{pmatrix}0\\1\\0\\0\end{pmatrix}};\quad |10\rangle :={\begin{pmatrix}0\\0\\1\\0\end{pmatrix}};\quad |11\rangle :={\begin{pmatrix}0\\0\\0\\1\end{pmatrix}}.}
  

The controlled NOT (CNOT) gate can then be represented using the following matrix:

  
    
      
        CNOT
        :=
        
          
            (
            
              
                
                  1
                
                
                  0
                
                
                  0
                
                
                  0
                
              
              
                
                  0
                
                
                  1
                
                
                  0
                
                
                  0
                
              
              
                
                  0
                
                
                  0
                
                
                  0
                
                
                  1
                
              
              
                
                  0
                
                
                  0
                
                
                  1
                
                
                  0
                
              
            
            )
          
        
        .
      
    
    {\displaystyle \operatorname {CNOT} :={\begin{pmatrix}1&0&0&0\\0&1&0&0\\0&0&0&1\\0&0&1&0\end{pmatrix}}.}
  

As a mathematical consequence of this definition, 
  
    
      
        CNOT
        ⁡
        
          |
        
        00
        ⟩
        =
        
          |
        
        00
        ⟩
      
    
    {\textstyle \operatorname {CNOT} |00\rangle =|00\rangle }
  
, 
  
    
      
        CNOT
        ⁡
        
          |
        
        01
        ⟩
        =
        
          |
        
        01
        ⟩
      
    
    {\textstyle \operatorname {CNOT} |01\rangle =|01\rangle }
  
, 
  
    
      
        CNOT
        ⁡
        
          |
        
        10
        ⟩
        =
        
          |
        
        11
        ⟩
      
    
    {\textstyle \operatorname {CNOT} |10\rangle =|11\rangle }
  
, and 
  
    
      
        CNOT
        ⁡
        
          |
        
        11
        ⟩
        =
        
          |
        
        10
        ⟩
      
    
    {\textstyle \operatorname {CNOT} |11\rangle =|10\rangle }
  
. In other words, the CNOT applies a NOT gate (
  
    
      
        X
      
    
    {\textstyle X}
  
 from before) to the second qubit if and only if the first qubit is in the state 
  
    
      
        
          |
        
        1
        ⟩
      
    
    {\textstyle |1\rangle }
  
. If the first qubit is 
  
    
      
        
          |
        
        0
        ⟩
      
    
    {\textstyle |0\rangle }
  
, nothing is done to either qubit.
In summary, quantum computation can be described as a network of quantum logic gates and measurements. However, any measurement can be deferred to the end of quantum computation, though this deferment may come at a computational cost, so most quantum circuits depict a network consisting only of quantum logic gates and no measurements.


=== Quantum parallelism ===
Quantum parallelism is the heuristic that quantum computers can be thought of as evaluating a function for multiple input values simultaneously. This can be achieved by preparing a quantum system in a superposition of input states and applying a unitary transformation that encodes the function to be evaluated. The resulting state encodes the function's output values for all input values in the superposition, allowing for the computation of multiple outputs simultaneously. This property is key to the speedup of many quantum algorithms. However, "parallelism" in this sense is insufficient to speed up a computation, because the measurement at the end of the computation gives only one value. To be useful, a quantum algorithm must also incorporate some other conceptual ingredient.


=== Quantum programming ===

There are a number of models of computation for quantum computing, distinguished by the basic elements in which the computation is decomposed.


==== Gate array ====

A quantum gate array decomposes computation into a sequence of few-qubit quantum gates. A quantum computation can be described as a network of quantum logic gates and measurements. However, any measurement can be deferred to the end of quantum computation, though this deferment may come at a computational cost, so most quantum circuits depict a network consisting only of quantum logic gates and no measurements.
Any quantum computation (which is, in the above formalism, any unitary matrix of size 
  
    
      
        
          2
          
            n
          
        
        ×
        
          2
          
            n
          
        
      
    
    {\displaystyle 2^{n}\times 2^{n}}
  
 over 
  
    
      
        n
      
    
    {\displaystyle n}
  
 qubits) can be represented as a network of quantum logic gates from a fairly small family of gates. A choice of gate family that enables this construction is known as a universal gate set, since a computer that can run such circuits is a universal quantum computer. One common such set includes all single-qubit gates as well as the CNOT gate from above. This means any quantum computation can be performed by executing a sequence of single-qubit gates together with CNOT gates. Though this gate set is infinite, it can be replaced with a finite gate set by appealing to the Solovay-Kitaev theorem. Implementation of Boolean functions using the few-qubit quantum gates is presented here.


==== Measurement-based quantum computing ====
A measurement-based quantum computer decomposes computation into a sequence of Bell state measurements and single-qubit quantum gates applied to a highly entangled initial state (a cluster state), using a technique called quantum gate teleportation.


==== Adiabatic quantum computing ====
An adiabatic quantum computer, based on quantum annealing, decomposes computation into a slow continuous transformation of an initial Hamiltonian into a final Hamiltonian, whose ground states contain the solution.


==== Neuromorphic quantum computing ====
Neuromorphic quantum computing (abbreviated as 'n.quantum computing') is an unconventional type of computing that uses neuromorphic computing to perform quantum operations. It was suggested that quantum algorithms, which are algorithms that run on a realistic model of quantum computation, can be computed equally efficiently with neuromorphic quantum computing. Both traditional quantum computing and neuromorphic quantum computing are physics-based unconventional computing approaches to computations and do not follow the von Neumann architecture. They both construct a system (a circuit) that represents the physical problem at hand and then leverage their respective physics properties of the system to seek the "minimum". Neuromorphic quantum computing and quantum computing share similar physical properties during computation.


==== Topological quantum computing ====
A topological quantum computer decomposes computation into the braiding of anyons in a 2D lattice.


==== Quantum Turing machine ====
A quantum Turing machine is the quantum analog of a Turing machine. All of these models of computation—quantum circuits, one-way quantum computation, adiabatic quantum computation, and topological quantum computation—have been shown to be equivalent to the quantum Turing machine; given a perfect implementation of one such quantum computer, it can simulate all the others with no more than polynomial overhead. This equivalence need not hold for practical quantum computers, since the overhead of simulation may be too large to be practical.


==== Noisy intermediate-scale quantum computing ====
The threshold theorem shows how increasing the number of qubits can mitigate errors, yet fully fault-tolerant quantum computing remains "a rather distant dream". According to some researchers, noisy intermediate-scale quantum (NISQ) machines may have specialized uses in the near future, but noise in quantum gates limits their reliability.
Scientists at Harvard University successfully created "quantum circuits" that correct errors more efficiently than alternative methods, which may potentially remove a major obstacle to practical quantum computers. The Harvard research team was supported by MIT, QuEra Computing, Caltech, and Princeton University and funded by DARPA's Optimization with Noisy Intermediate-Scale Quantum devices (ONISQ) program.


==== Quantum cryptography and cybersecurity ====

Digital cryptography allows communications without observation by unauthorized parties. Conventional encryption, the obscuring of a message with a key through an algorithm, relies on the algorithm being difficult to reverse. Encryption is also the basis for digital signatures and authentication mechanisms. Quantum computing may be sufficiently more powerful that difficult reversals are feasible, allowing messages relying on conventional encryption to be read.
Quantum cryptography replaces conventional algorithms with computations based on quantum computing. In principle, quantum encryption would be impossible to decode even with a quantum computer. This advantage comes at a significant cost in terms of elaborate infrastructure as well as preventing legitimate decoding of messages by governmental security officials.
Ongoing research in quantum and post-quantum cryptography has led to new algorithms for quantum key distribution, initial work on quantum random number generation and to some early technology demonstrations.


== Communication ==

Quantum cryptography enables new ways to transmit data securely; for example, quantum key distribution uses entangled quantum states to establish secure cryptographic keys. When a sender and receiver exchange quantum states, they can guarantee that an adversary does not intercept the message, as any unauthorized eavesdropper would disturb the delicate quantum system and introduce a detectable change. With appropriate cryptographic protocols, the sender and receiver can thus establish shared private information resistant to eavesdropping.
Modern fiber-optic cables can transmit quantum information over relatively short distances. Ongoing experimental research aims to develop more reliable hardware (such as quantum repeaters), hoping to scale this technology to long-distance quantum networks with end-to-end entanglement. Theoretically, this could enable novel technological applications, such as distributed quantum computing and enhanced quantum sensing.


== Algorithms ==
Progress in finding quantum algorithms typically focuses on this quantum circuit model, though exceptions like the quantum adiabatic algorithm exist. Quantum algorithms can be roughly categorized by the type of speedup achieved over corresponding classical algorithms.
Quantum algorithms that offer more than a polynomial speedup over the best-known classical algorithm include Shor's algorithm for factoring and the related quantum algorithms for computing discrete logarithms, solving Pell's equation, and more generally solving the hidden subgroup problem for abelian finite groups. These algorithms depend on the primitive of the quantum Fourier transform. No mathematical proof has been found that shows that an equally fast classical algorithm cannot be discovered, but evidence suggests that this is unlikely. Certain oracle problems like Simon's problem and the Bernstein–Vazirani problem do give provable speedups, though this is in the quantum query model, which is a restricted model where lower bounds are much easier to prove and doesn't necessarily translate to speedups for practical problems.
Other problems, including the simulation of quantum physical processes from chemistry and solid-state physics, the approximation of certain Jones polynomials, and the quantum algorithm for linear systems of equations, have quantum algorithms appearing to give super-polynomial speedups and are BQP-complete. Because these problems are BQP-complete, an equally fast classical algorithm for them would imply that "no quantum algorithm" provides a super-polynomial speedup, which is believed to be unlikely.
In addition to these problems, quantum algorithms are being explored for applications in cryptography, optimization, and machine learning, although most of these remain at the research stage and require significant advances in error correction and hardware scalability before practical implementation.
Some quantum algorithms, like Grover's algorithm and amplitude amplification, give polynomial speedups over corresponding classical algorithms. Though these algorithms give comparably modest quadratic speedup, they are widely applicable and thus give speedups for a wide range of problems. These speed-ups are, however, over the theoretical worst-case of classical algorithms, and concrete real-world speed-ups over algorithms used in practice have not been demonstrated.


=== Simulation of quantum systems ===

Since chemistry and nanotechnology rely on understanding quantum systems, and such systems are impossible to simulate in an efficient manner classically, quantum simulation may be an important application of quantum computing. Quantum simulation could also be used to simulate the behavior of atoms and particles at unusual conditions such as the reactions inside a collider. In June 2023, IBM computer scientists reported that a quantum computer produced better results for a physics problem than a conventional supercomputer.
About 2% of the annual global energy output is used for nitrogen fixation to produce ammonia for the Haber process in the agricultural fertiliser industry (even though naturally occurring organisms also produce ammonia). Quantum simulations might be used to understand this process and increase the energy efficiency of production. It is expected that an early use of quantum computing will be modeling that improves the efficiency of the Haber–Bosch process by the mid-2020s although some have predicted it will take longer.


=== Post-quantum cryptography ===

A notable application of quantum computing is in attacking cryptographic systems that are currently in use. Integer factorization, which underpins the security of public key cryptographic systems, is believed to be computationally infeasible on a classical computer for large integers if they are the product of a few prime numbers (e.g., the product of two 300-digit primes). By contrast, a quantum computer could solve this problem exponentially faster using Shor's algorithm to factor the integer. This ability would allow a quantum computer to break many of the cryptographic systems in use today, in the sense that there would be a polynomial time (in the number of digits of the integer) algorithm for solving the problem. In particular, most of the popular public key ciphers are based on the difficulty of factoring integers or the discrete logarithm problem, both of which can be solved by Shor's algorithm. In particular, the RSA, Diffie–Hellman, and elliptic curve Diffie–Hellman algorithms could be broken. These are used to protect secure Web pages, encrypted email, and many other types of data. Breaking these would have significant ramifications for electronic privacy and security.
Identifying cryptographic systems that may be secure against quantum algorithms is an actively researched topic under the field of post-quantum cryptography. Some public-key algorithms are based on problems other than the integer factorization and discrete logarithm problems to which Shor's algorithm applies, such as the McEliece cryptosystem, which relies on a hard problem in coding theory. Lattice-based cryptosystems are also not known to be broken by quantum computers, and finding a polynomial time algorithm for solving the dihedral hidden subgroup problem, which would break many lattice-based cryptosystems, is a well-studied open problem. It has been shown that applying Grover's algorithm to break a symmetric (secret-key) algorithm by brute force requires time equal to roughly 2n/2 invocations of the underlying cryptographic algorithm, compared with roughly 2n in the classical case, meaning that symmetric key lengths are effectively halved: AES-256 would have comparable security against an attack using Grover's algorithm to that AES-128 has against classical brute-force search (see Key size).


=== Search problems ===

The most well-known example of a problem that allows for a polynomial quantum speedup is unstructured search, which involves finding a marked item out of a list of 
  
    
      
        n
      
    
    {\displaystyle n}
  
 items in a database. This can be solved by Grover's algorithm using 
  
    
      
        O
        (
        
          
            n
          
        
        )
      
    
    {\displaystyle O({\sqrt {n}})}
  
 queries to the database, quadratically fewer than the 
  
    
      
        Ω
        (
        n
        )
      
    
    {\displaystyle \Omega (n)}
  
 queries required for classical algorithms. In this case, the advantage is not only provable but also optimal: it has been shown that Grover's algorithm gives the maximal possible probability of finding the desired element for any number of oracle lookups. Many examples of provable quantum speedups for query problems are based on Grover's algorithm, including Brassard, Høyer, and Tapp's algorithm for finding collisions in two-to-one functions, and Farhi, Goldstone, and Gutmann's algorithm for evaluating NAND trees.
Problems that can be efficiently addressed with Grover's algorithm have the following properties:

There is no searchable structure in the collection of possible answers,
The number of possible answers to check is the same as the number of inputs to the algorithm, and
There exists a Boolean function that evaluates each input and determines whether it is the correct answer.
For problems with all these properties, the running time of Grover's algorithm on a quantum computer scales as the square root of the number of inputs (or elements in the database), as opposed to the linear scaling of classical algorithms. A general class of problems to which Grover's algorithm can be applied is a Boolean satisfiability problem, where the database through which the algorithm iterates is that of all possible answers. An example and possible application of this is a password cracker that attempts to guess a password. Breaking symmetric ciphers with this algorithm is of interest to government agencies.


=== Quantum annealing ===
Quantum annealing relies on the adiabatic theorem to undertake calculations. A system is placed in the ground state for a simple Hamiltonian, which slowly evolves to a more complicated Hamiltonian whose ground state represents the solution to the problem in question. The adiabatic theorem states that if the evolution is slow enough the system will stay in its ground state at all times through the process. Quantum annealing can solve Ising models and the (computationally equivalent) QUBO problem, which in turn can be used to encode a wide range of combinatorial optimization problems. Adiabatic optimization may be helpful for solving computational biology problems.


=== Machine learning ===

Since quantum computers can produce outputs that classical computers cannot produce efficiently, and since quantum computation is fundamentally linear algebraic, some express hope in developing quantum algorithms that can speed up machine learning tasks.
For example, the HHL Algorithm, named after its discoverers Harrow, Hassidim, and Lloyd, is believed to provide speedup over classical counterparts. Some research groups have recently explored the use of quantum annealing hardware for training Boltzmann machines and deep neural networks.

Deep generative chemistry models emerge as powerful tools to expedite drug discovery. However, the immense size and complexity of the structural space of all possible drug-like molecules pose significant obstacles, which could be overcome in the future by quantum computers. Quantum computers are naturally good for solving complex quantum many-body problems and thus may be instrumental in applications involving quantum chemistry. Therefore, one can expect that quantum-enhanced generative models including quantum GANs may eventually be developed into ultimate generative chemistry algorithms.


== Engineering ==

As of 2023, classical computers outperform quantum computers for all real-world applications. While current quantum computers may speed up solutions to particular mathematical problems, they give no computational advantage for practical tasks. Scientists and engineers are exploring multiple technologies for quantum computing hardware and hope to develop scalable quantum architectures, but serious obstacles remain.


=== Challenges ===
There are a number of technical challenges in building a large-scale quantum computer. Physicist David DiVincenzo has listed these requirements for a practical quantum computer:

Physically scalable to increase the number of qubits
Qubits that can be initialized to arbitrary values
Quantum gates that are faster than decoherence time
Universal gate set
Qubits that can be read easily.
Sourcing parts for quantum computers is also very difficult. Superconducting quantum computers, like those constructed by Google and IBM, need helium-3, a nuclear research byproduct, and special superconducting cables made only by the Japanese company Coax Co.
The control of multi-qubit systems requires the generation and coordination of a large number of electrical signals with tight and deterministic timing resolution. This has led to the development of quantum controllers that enable interfacing with the qubits. Scaling these systems to support a growing number of qubits is an additional challenge.


==== Decoherence ====
One of the greatest challenges involved in constructing quantum computers is controlling or removing quantum decoherence. This usually means isolating the system from its environment as interactions with the external world cause the system to decohere. However, other sources of decoherence also exist. Examples include the quantum gates and the lattice vibrations and background thermonuclear spin of the physical system used to implement the qubits. Decoherence is irreversible, as it is effectively non-unitary, and is usually something that should be highly controlled, if not avoided. Decoherence times for candidate systems in particular, the transverse relaxation time T2 (for NMR and MRI technology, also called the dephasing time), typically range between nanoseconds and seconds at low temperatures. Currently, some quantum computers require their qubits to be cooled to 20 millikelvin (usually using a dilution refrigerator) in order to prevent significant decoherence. A 2020 study argues that ionizing radiation such as cosmic rays can nevertheless cause certain systems to decohere within milliseconds.
As a result, time-consuming tasks may render some quantum algorithms inoperable, as attempting to maintain the state of qubits for a long enough duration will eventually corrupt the superpositions.
These issues are more difficult for optical approaches as the timescales are orders of magnitude shorter and an often-cited approach to overcoming them is optical pulse shaping. Error rates are typically proportional to the ratio of operating time to decoherence time; hence any operation must be completed much more quickly than the decoherence time.
As described by the threshold theorem, if the error rate is small enough, it is thought to be possible to use quantum error correction to suppress errors and decoherence. This allows the total calculation time to be longer than the decoherence time if the error correction scheme can correct errors faster than decoherence introduces them. An often-cited figure for the required error rate in each gate for fault-tolerant computation is 10−3, assuming the noise is depolarizing.
Meeting this scalability condition is possible for a wide range of systems. However, the use of error correction brings with it the cost of a greatly increased number of required qubits. The number required to factor integers using Shor's algorithm is still polynomial, and thought to be between L and L2, where L is the number of binary digits in the number to be factored; error correction algorithms would inflate this figure by an additional factor of L. For a 1000-bit number, this implies a need for about 104 bits without error correction. With error correction, the figure would rise to about 107 bits. Computation time is about L2 or about 107 steps and at 1 MHz, about 10 seconds. However, the encoding and error-correction overheads increase the size of a real fault-tolerant quantum computer by several orders of magnitude. Careful estimates show that at least 3 million physical qubits would factor 2,048-bit integer in 5 months on a fully error-corrected trapped-ion quantum computer. In terms of the number of physical qubits, to date, this remains the lowest estimate for practically useful integer factorization problem sizing 1,024-bit or larger. 
One approach to overcoming errors combines low-density parity-check code with cat qubits that have intrinsic bit-flip error suppression. Implementing 100 logical qubits with 768 cat qubits could reduce the error rate to on part in 108 per cycle per bit.
Another approach to the stability-decoherence problem is to create a topological quantum computer with anyons, quasi-particles used as threads, and relying on braid theory to form stable logic gates. Non-Abelian anyons can, in effect, remember how they have been manipulated, making them potentially useful in quantum computing. As of 2025, Microsoft and other organizations are investing in quasi-particle research.


=== Quantum supremacy ===
Physicist John Preskill coined the term quantum supremacy to describe the engineering feat of demonstrating that a programmable quantum device can solve a problem beyond the capabilities of state-of-the-art classical computers. The problem need not be useful, so some view the quantum supremacy test only as a potential future benchmark.
In October 2019, Google AI Quantum, with the help of NASA, became the first to claim to have achieved quantum supremacy by performing calculations on the Sycamore quantum computer more than 3,000,000 times faster than they could be done on Summit, generally considered the world's fastest computer. This claim has been subsequently challenged: IBM has stated that Summit can perform samples much faster than claimed, and researchers have since developed better algorithms for the sampling problem used to claim quantum supremacy, giving substantial reductions to the gap between Sycamore and classical supercomputers and even beating it.
In December 2020, a group at USTC implemented a type of Boson sampling on 76 photons with a photonic quantum computer, Jiuzhang, to demonstrate quantum supremacy. The authors claim that a classical contemporary supercomputer would require a computational time of 600 million years to generate the number of samples their quantum processor can generate in 20 seconds.
Claims of quantum supremacy have generated hype around quantum computing, but they are based on contrived benchmark tasks that do not directly imply useful real-world applications.
In January 2024, a study published in Physical Review Letters provided direct verification of quantum supremacy experiments by computing exact amplitudes for experimentally generated bitstrings using a new-generation Sunway supercomputer, demonstrating a significant leap in simulation capability built on a multiple-amplitude tensor network contraction algorithm. This development underscores the evolving landscape of quantum computing, highlighting both the progress and the complexities involved in validating quantum supremacy claims.


=== Skepticism ===
Despite high hopes for quantum computing, significant progress in hardware, and optimism about future applications, a 2023 Nature spotlight article summarized current quantum computers as being "For now, [good for] absolutely nothing". The article elaborated that quantum computers are yet to be more useful or efficient than conventional computers in any case, though it also argued that in the long term such computers are likely to be useful. A 2023 Communications of the ACM article found that current quantum computing algorithms are "insufficient for practical quantum advantage without significant improvements across the software/hardware stack". It argues that the most promising candidates for achieving speedup with quantum computers are "small-data problems", for example in chemistry and materials science. However, the article also concludes that a large range of the potential applications it considered, such as machine learning, "will not achieve quantum advantage with current quantum algorithms in the foreseeable future", and it identified I/O constraints that make speedup unlikely for "big data problems, unstructured linear systems, and database search based on Grover's algorithm".
This state of affairs can be traced to several current and long-term considerations.

Conventional computer hardware and algorithms are not only optimized for practical tasks, but are still improving rapidly, particularly GPU accelerators.
Current quantum computing hardware generates only a limited amount of entanglement before getting overwhelmed by noise.
Quantum algorithms provide speedup over conventional algorithms only for some tasks, and matching these tasks with practical applications proved challenging. Some promising tasks and applications require resources far beyond those available today. In particular, processing large amounts of non-quantum data is a challenge for quantum computers.
Some promising algorithms have been "dequantized", i.e., their non-quantum analogues with similar complexity have been found.
If quantum error correction is used to scale quantum computers to practical applications, its overhead may undermine speedup offered by many quantum algorithms.
Complexity analysis of algorithms sometimes makes abstract assumptions that do not hold in applications. For example, input data may not already be available encoded in quantum states, and "oracle functions" used in Grover's algorithm often have internal structure that can be exploited for faster algorithms.
In particular, building computers with large numbers of qubits may be futile if those qubits are not connected well enough and cannot maintain sufficiently high degree of entanglement for a long time. When trying to outperform conventional computers, quantum computing researchers often look for new tasks that can be solved on quantum computers, but this leaves the possibility that efficient non-quantum techniques will be developed in response, as seen for Quantum supremacy demonstrations. Therefore, it is desirable to prove lower bounds on the complexity of best possible non-quantum algorithms (which may be unknown) and show that some quantum algorithms asymptomatically improve upon those bounds.
Bill Unruh doubted the practicality of quantum computers in a paper published in 1994. Paul Davies argued that a 400-qubit computer would even come into conflict with the cosmological information bound implied by the holographic principle. Skeptics like Gil Kalai doubt that quantum supremacy will ever be achieved. Physicist Mikhail Dyakonov has expressed skepticism of quantum computing as follows:

"So the number of continuous parameters describing the state of such a useful quantum computer at any given moment must be... about 10300... Could we ever learn to control the more than 10300 continuously variable parameters defining the quantum state of such a system? My answer is simple. No, never."


=== Physical realizations ===

A practical quantum computer must use a physical system as a programmable quantum register. Researchers are exploring several technologies as candidates for reliable qubit implementations. Superconductors and trapped ions are some of the most developed proposals, but experimentalists are considering other hardware possibilities as well.
For example, topological quantum computer approaches are being explored for more fault-tolerance computing systems.
The first quantum logic gates were implemented with trapped ions and prototype general purpose machines with up to 20 qubits have been realized. However, the technology behind these devices combines complex vacuum equipment, lasers, microwave and radio frequency equipment making full scale processors difficult to integrate with standard computing equipment. Moreover, the trapped ion system itself has engineering challenges to overcome.
The largest commercial systems are based on superconductor devices and have scaled to 2000 qubits. However, the error rates for larger machines have been on the order of 5%. Technologically these devices are all cryogenic and scaling to large numbers of qubits requires wafer-scale integration, a serious engineering challenge by itself.


== Potential applications ==
With focus on business management's point of view, the potential applications of quantum computing into four major categories are cybersecurity, data analytics and artificial intelligence, optimization and simulation, and data management and searching.
Other applications include healthcare (i.e. drug discovery), financial modeling, and natural language processing.


== Theory ==


=== Computability ===

Any computational problem solvable by a classical computer is also solvable by a quantum computer. Intuitively, this is because it is believed that all physical phenomena, including the operation of classical computers, can be described using quantum mechanics, which underlies the operation of quantum computers.
Conversely, any problem solvable by a quantum computer is also solvable by a classical computer. It is possible to simulate both quantum and classical computers manually with just some paper and a pen, if given enough time. More formally, any quantum computer can be simulated by a Turing machine. In other words, quantum computers provide no additional power over classical computers in terms of computability. This means that quantum computers cannot solve undecidable problems like the halting problem, and the existence of quantum computers does not disprove the Church–Turing thesis.


=== Complexity ===

While quantum computers cannot solve any problems that classical computers cannot already solve, it is suspected that they can solve certain problems faster than classical computers. For instance, it is known that quantum computers can efficiently factor integers, while this is not believed to be the case for classical computers.
The class of problems that can be efficiently solved by a quantum computer with bounded error is called BQP, for "bounded error, quantum, polynomial time". More formally, BQP is the class of problems that can be solved by a polynomial-time quantum Turing machine with an error probability of at most 1/3. As a class of probabilistic problems, BQP is the quantum counterpart to BPP ("bounded error, probabilistic, polynomial time"), the class of problems that can be solved by polynomial-time probabilistic Turing machines with bounded error. It is known that 
  
    
      
        
          
            B
            P
            P
            ⊆
            B
            Q
            P
          
        
      
    
    {\displaystyle {\mathsf {BPP\subseteq BQP}}}
  
 and is widely suspected that 
  
    
      
        
          
            B
            Q
            P
            ⊊
            B
            P
            P
          
        
      
    
    {\displaystyle {\mathsf {BQP\subsetneq BPP}}}
  
, which intuitively would mean that quantum computers are more powerful than classical computers in terms of time complexity.

The exact relationship of BQP to P, NP, and PSPACE is not known. However, it is known that 
  
    
      
        
          
            P
            ⊆
            B
            Q
            P
            ⊆
            P
            S
            P
            A
            C
            E
          
        
      
    
    {\displaystyle {\mathsf {P\subseteq BQP\subseteq PSPACE}}}
  
; that is, all problems that can be efficiently solved by a deterministic classical computer can also be efficiently solved by a quantum computer, and all problems that can be efficiently solved by a quantum computer can also be solved by a deterministic classical computer with polynomial space resources. It is further suspected that BQP is a strict superset of P, meaning there are problems that are efficiently solvable by quantum computers that are not efficiently solvable by deterministic classical computers. For instance, integer factorization and the discrete logarithm problem are known to be in BQP and are suspected to be outside of P. On the relationship of BQP to NP, little is known beyond the fact that some NP problems that are believed not to be in P are also in BQP (integer factorization and the discrete logarithm problem are both in NP, for example). It is suspected that 
  
    
      
        
          
            N
            P
            ⊈
            B
            Q
            P
          
        
      
    
    {\displaystyle {\mathsf {NP\nsubseteq BQP}}}
  
; that is, it is believed that there are efficiently checkable problems that are not efficiently solvable by a quantum computer. As a direct consequence of this belief, it is also suspected that BQP is disjoint from the class of NP-complete problems (if an NP-complete problem were in BQP, then it would follow from NP-hardness that all problems in NP are in BQP).


== See also ==


== Notes ==


== References ==


== Sources ==
Aaronson, Scott (2013). Quantum Computing Since Democritus. Cambridge University Press. doi:10.1017/CBO9780511979309. ISBN 978-0-521-19956-8. OCLC 829706638.
Grumbling, Emily; Horowitz, Mark, eds. (2019). Quantum Computing: Progress and Prospects. Washington, DC: The National Academies Press. doi:10.17226/25196. ISBN 978-0-309-47970-7. OCLC 1091904777. S2CID 125635007.
Mermin, N. David (2007). Quantum Computer Science: An Introduction. doi:10.1017/CBO9780511813870. ISBN 978-0-511-34258-5. OCLC 422727925.
Nielsen, Michael; Chuang, Isaac (2010). Quantum Computation and Quantum Information (10th anniversary ed.). doi:10.1017/CBO9780511976667. ISBN 978-0-511-99277-3. OCLC 700706156. S2CID 59717455.
Shor, Peter W. (1994). Algorithms for Quantum Computation: Discrete Logarithms and Factoring. Symposium on Foundations of Computer Science. Santa Fe, New Mexico: IEEE. pp. 124–134. doi:10.1109/SFCS.1994.365700. ISBN 978-0-8186-6580-6.


== Further reading ==


== External links ==
 Media related to Quantum computer at Wikimedia Commons
 Learning materials related to Quantum computing at Wikiversity
Stanford Encyclopedia of Philosophy: "Quantum Computing" by Amit Hagar and Michael E. Cuffaro
"Quantum computation, theory of", Encyclopedia of Mathematics, EMS Press, 2001 [1994]
Introduction to Quantum Computing for Business by Koen Groenland
Schneider, J., & Smalley, I. (2024, August 5). What Is Quantum Computing? | IBM. https://www.ibm.com/think/topics/quantum-computing
Lectures
Quantum computing for the determined – 22 video lectures by Michael Nielsen
Video Lectures by David Deutsch
Lomonaco, Sam. Four Lectures on Quantum Computing given at Oxford University in July 2006
