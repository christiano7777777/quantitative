# Task: review a Stochastic Processes question bank

You are a rigorous reviewer of exam questions for an undergraduate course in Stochastic Processes
(HKU SDST3603 / CUHK STAT3007 level). Your job is to find errors and weak questions, not to praise.
Assume the author (an AI) made mistakes. If a question is fine, say so briefly and spend your effort on
the ones that are not.

## Course scope (11 lectures)
1. Markov chains: basics: Transition matrices, Chapman-Kolmogorov
2. Classification of states: Communication, recurrence, periodicity
3. Hitting probabilities and times: First-step analysis
4. Stationary distributions: Existence, uniqueness, limit theorems
5. Random walks and gambler's ruin: Ruin probabilities, expected duration
6. Poisson process: Interarrival times, superposition, thinning
7. Continuous-time Markov chains: Generators, Kolmogorov equations
8. Birth-death processes and queues: M/M/1, M/M/c, Little's law
9. Renewal theory: Renewal function, renewal reward theorem
10. Branching processes: Extinction probability, generating functions
11. Martingales (discrete): Definition, optional stopping

## What is in this document
- PART A: 61 multiple-choice questions. For each, the stem and SEVEN statements (S1..S7) in shuffled
  order, with no labels. Design intent (hidden from you until the key): exactly 2 statements are TRUE wordings of the
  same fact and 5 are FALSE distractors. In the real test a student sees 1 true wording + 3 distractors, shuffled.
  Questions are conceptual (no numerical answers).
- PART B: 10 generated long questions (2 instances of each of 5 generators). Each part has a numeric answer typed as
  a decimal or a fraction. Closed book, basic calculator, no time limit, 10 marks per long question.
- APPENDIX: the author's answer key, with the intended misconception behind each distractor, and the author's
  numeric answers and working for Part B.

## How to work (follow in order)
**Step 1, blind pass (do this BEFORE reading the Appendix).** For every MC question, decide for each of S1..S7
whether it is TRUE or FALSE as an answer to the stem. Write your verdicts in your reply first (compact form, e.g.
"1.1: true S2,S6; false S1,S3,S4,S5,S7"). For every long-question part, solve it yourself (by hand or with a
calculator) and write your own answer BEFORE reading the Appendix.
**Step 2, compare with the key.** Every disagreement is a finding. Then check each MC question for:
 a. Truth: is each intended-true statement actually true, with no hidden assumption (finite state space,
    irreducibility, aperiodicity, positive recurrence, positive rates)?
 b. Falsity: is each intended-false statement really false for the stem as asked? Look hard for distractors that are
    true in a special case, true under another reading of the stem, or implied by a true statement.
 c. Equivalence: do the two intended-true wordings really say the same thing? Flag one that is stronger or weaker.
 d. Stem: ambiguous, underspecified, or answerable more than one way?
 e. Are the misconception notes and the explanation accurate? Is each misconception one a real student could have?
 f. Is the lecture tag right?
**Step 3, quality of each MC question** (score 1-5): validity (tests understanding, not trivia or wording tricks);
distractor plausibility (would a half-understanding student be tempted?); discrimination (separates those who
understand from those who do not); giveaways (absolute words like "always"/"only", one option much longer or more
hedged, silly distractors, options that cue each other). Also difficulty (1 easy .. 5 very hard) for a student who
passed the lecture. Then an overall WEIGHT 0-1 for how much the question should count (1 = keep as is,
0.5 = keep after fixes, 0 = remove).
**Step 4, long questions.** Compare your answers with the author's. Also: is the wording unambiguous (which state, which
time, what counts as a step)? Is the requested rounding enough to identify the answer? Solvable closed-book with a
basic calculator in reasonable time? Do the parts test what the lecture tag says? Is the difficulty reasonable for 10
marks? Do the parts differ enough in difficulty to discriminate?
**Step 5, bank level.** Coverage gaps against the 11 lectures, near-duplicate questions, difficulty balance, patterns a
student could exploit (e.g. "the longest statement is true").

## Rules
- Do not invent citations. If you cite a result (Norris, Markov Chains; Ross, Stochastic Processes; Grimmett and
  Stirzaker), name only what you are sure of and say it is from memory.
- Separate what you VERIFIED (derived or checked) from what you BELIEVE (from memory) from what you are UNSURE about.
  Do not guess to look decisive.
- Do not flatter. Do not soften a real error. If you disagree with the author, say exactly why and what would change
  your mind.
- Do not rewrite the bank. Propose the smallest fix for each problem.

## Output format
1. Blind-pass verdicts (Step 1), before anything else.
2. A table, one row per MC question: id | blind-pass disagreements | verdict (OK / FIX / REJECT) |
   validity, plausibility, discrimination (1-5 each) | difficulty | weight 0-1 | main issue in one sentence.
3. For every FIX or REJECT: the problem, the exact statement involved, why it is wrong, a minimal corrected wording.
4. Long-question findings, one block per instance: your answers vs the author's, and any wording or difficulty problems.
5. Bank-level summary, at most 10 bullets, most serious first.
6. A final line: how many MC questions you would keep unchanged / keep after fixes / remove.

---

# PART A: multiple choice

### Q1.1 (lecture 1)
Which statement expresses the Markov property of a discrete-time process $(X_n)$?

- S1. The state space must be finite.
- S2. Given the present state $X_n$, the next state $X_{n+1}$ is independent of the earlier states $X_0,\dots,X_{n-1}$.
- S3. $X_{n+1}$ is independent of $X_0,\dots,X_{n-1}$ even without conditioning on $X_n$.
- S4. Every state can be reached from every other state.
- S5. $P(X_{n+1}=j\mid X_n=i,\,X_{n-1},\dots,X_0)=P(X_{n+1}=j\mid X_n=i)$.
- S6. $X_{n+1}$ is independent of $X_n$.
- S7. The transition probabilities are the same at every time step.

### Q1.2 (lecture 1)
Which property must every transition matrix $P=(p_{ij})$ satisfy?

- S1. Its determinant equals 1.
- S2. $P$ is symmetric.
- S3. Every row sums to 1.
- S4. Its diagonal entries are all zero.
- S5. Every entry is strictly positive.
- S6. Every column sums to 1.
- S7. For each state $i$, $\sum_j p_{ij}=1$.

### Q1.3 (lecture 1)
For a time-homogeneous chain with one-step transition matrix $P$, the $n$-step transition matrix is:

- S1. $(P^{\top})^{n}$.
- S2. $nP$.
- S3. $P^{1/n}$.
- S4. The matrix whose $(i,j)$ entry is $p_{ij}^{\,n}$.
- S5. The product $P\cdot P\cdots P$ with $n$ factors, i.e. repeated matrix multiplication.
- S6. $P^n$, the $n$-th matrix power of $P$.
- S7. $\frac1n\,(P+P^2+\dots+P^n)$.

### Q1.4 (lecture 1)
Let $\mu$ be the row vector giving the distribution of $X_0$. The distribution of $X_n$ is:

- S1. The vector $P^{n}\mu^{\top}$, with $\mu$ written as a column and multiplied on the right.
- S2. The row vector whose $j$-th entry is $\sum_i \mu_i\,p^{(n)}_{ij}$.
- S3. $\mu^{\,n}P$.
- S4. The entrywise product of $\mu$ with $P^n$.
- S5. The row vector $\mu P^{n}$.
- S6. $\mu+nP$.
- S7. $\mu P$ for every $n$.

### Q1.5 (lecture 1)
Let $\xi_1,\xi_2,\dots$ be i.i.d. and $S_n=\xi_1+\dots+\xi_n$. Which statement about $(S_n)$ is correct?

- S1. $(S_n)$ is not Markov, because its transition probabilities change as $S_n$ grows.
- S2. Given $S_n$, the next value is $S_n$ plus an independent increment, so the Markov property holds.
- S3. $(S_n)$ is not a Markov chain, because $S_{n+1}$ depends on $S_n$.
- S4. $(S_n)$ is a Markov chain, because $S_{n+1}=S_n+\xi_{n+1}$ and $\xi_{n+1}$ is independent of the past.
- S5. $(S_n)$ is not Markov, because $S_n$ remembers all of $\xi_1,\dots,\xi_n$.
- S6. $(S_n)$ is a Markov chain only if $E[\xi_i]=0$.
- S7. $(S_n)$ is a Markov chain only if the $\xi_i$ take finitely many values.

### Q1.6 (lecture 1)
A Markov chain is called time-homogeneous when:

- S1. The chain has a stationary distribution.
- S2. The chain visits every state equally often.
- S3. The same transition matrix is used at every step.
- S4. Each state is revisited at regular time intervals.
- S5. The chain is irreducible.
- S6. The initial distribution equals the stationary distribution.
- S7. $P(X_{n+1}=j\mid X_n=i)$ does not depend on $n$.

### Q2.1 (lecture 2)
States $i$ and $j$ of a Markov chain communicate (write $i\leftrightarrow j$) when:

- S1. $i$ and $j$ are both recurrent.
- S2. $j$ can be reached from $i$ and $i$ can be reached from $j$, each in some finite number of steps.
- S3. Starting from $i$, the chain reaches $j$ with probability exactly 1.
- S4. $p_{ii}=p_{jj}$.
- S5. $j$ can be reached from $i$ (one direction is enough).
- S6. $p_{ij}>0$ and $p_{ji}>0$, i.e. there are direct one-step transitions both ways.
- S7. There exist $m,n\ge 0$ with $p^{(m)}_{ij}>0$ and $p^{(n)}_{ji}>0$.

### Q2.2 (lecture 2)
State $i$ of a Markov chain is recurrent. Which of the following must be true?

- S1. The expected return time to $i$ is finite.
- S2. The chain has a stationary distribution.
- S3. State $i$ is absorbing.
- S4. The chain is irreducible.
- S5. $\sum_{n\ge1}p^{(n)}_{ii}<\infty$.
- S6. Starting from $i$, the chain returns to $i$ with probability 1.
- S7. The probability that the chain ever comes back to $i$, given that it starts there, equals 1.

### Q2.3 (lecture 2)
State $i$ is transient. Which statement is correct?

- S1. State $i$ cannot be reached from any other state.
- S2. Starting from $i$, with positive probability the chain never returns to $i$.
- S3. The expected number of visits to $i$ is infinite.
- S4. Every transient state has period greater than 1.
- S5. $p_{ii}=0$.
- S6. The chain visits $i$ only finitely many times, with probability 1.
- S7. State $i$ does not belong to any communicating class.

### Q2.4 (lecture 2)
Which statement is always true for a Markov chain with a finite state space?

- S1. Every recurrent state has period 1.
- S2. At least one state is recurrent.
- S3. All states are recurrent.
- S4. The chain cannot have all of its states transient.
- S5. All states are transient.
- S6. There is exactly one recurrent class.
- S7. The chain is irreducible.

### Q2.5 (lecture 2)
State $i$ is recurrent and $j$ communicates with $i$. Then:

- S1. Recurrence is a class property: every state in the communicating class of $i$ is recurrent.
- S2. State $j$ has the same stationary probability as $i$.
- S3. State $j$ is also recurrent.
- S4. State $j$ is absorbing.
- S5. State $j$ must be transient.
- S6. $p_{jj}=p_{ii}$.
- S7. State $j$ may be recurrent or transient; communication does not decide it.

### Q2.6 (lecture 2)
The period of state $i$ is defined as:

- S1. The smallest $n\ge1$ with $p^{(n)}_{ii}>0$.
- S2. $\gcd\{n\ge 1: p^{(n)}_{ii}>0\}$.
- S3. The largest $n$ with $p^{(n)}_{ii}>0$.
- S4. The greatest common divisor of all possible return times to $i$.
- S5. The expected return time to $i$.
- S6. $\lim_{n\to\infty}p^{(n)}_{ii}$.
- S7. The number of states in the communicating class of $i$.

### Q3.1 (lecture 3)
To find the probability $h_i$ of ever hitting a target set $A$ from a state $i\notin A$, first-step analysis uses:

- S1. Condition on the first move: $h_i$ is the average of $h_j$ over the next state $j$, with boundary value 1 on $A$.
- S2. $h_i=\sum_j p_{ji}h_j$, summing down the column.
- S3. $h_i=\max_j p_{ij}$.
- S4. $h_i=\sum_j p_{ij}h_j$ with $h_i=0$ for $i\in A$.
- S5. $h_i=1+\sum_j p_{ij}h_j$.
- S6. $h_i=\prod_j p_{ij}$.
- S7. $h_i=\sum_j p_{ij}h_j$, with $h_i=1$ for $i\in A$.

### Q3.2 (lecture 3)
Let $k_i$ be the expected time to reach $A$ from $i$. Which equations does it satisfy?

- S1. Each step costs one unit of time, so $k_i$ is $1$ plus the average of $k_j$ over the next state, and $k=0$ on $A$.
- S2. $k_i=1+\sum_j p_{ij}k_j$ for $i\notin A$, and $k_i=0$ for $i\in A$.
- S3. $k_i=\sum_j p_{ij}k_j$ for $i\notin A$ and $k_i=1$ for $i\in A$.
- S4. $k_i=\sum_j p_{ij}k_j$ for $i\notin A$ and $k_i=0$ for $i\in A$.
- S5. $k_i=1+\sum_j p_{ij}k_j$ with $k_i=1$ for $i\in A$.
- S6. $k_i=1+\max_j k_j$.
- S7. $k_i=1/h_i$.

### Q3.3 (lecture 3)
The hitting probabilities $h_i$ satisfy $h_i=\sum_j p_{ij}h_j$ (with $h=1$ on $A$), but this system can have several solutions. The hitting probabilities are:

- S1. Any solution, since the solution is always unique.
- S2. The solution with $h_i=1/2$ for $i\notin A$.
- S3. The minimal non-negative solution.
- S4. The solution whose entries sum to 1.
- S5. The solution with every $h_i=1$.
- S6. The entrywise smallest solution among those with all $h_i\ge0$.
- S7. The maximal solution with $h_i\le1$.

### Q3.4 (lecture 3)
In a finite chain with two absorbing states $a$ and $b$, where every other state is transient, let $h^a_i$ and $h^b_i$ be the probabilities of eventual absorption in $a$ and $b$ from $i$. Then:

- S1. $h^a_i=h^b_i$ for every $i$.
- S2. $h^a_i=h^b_i=1$ for transient $i$.
- S3. $h^a_i+h^b_i$ can exceed 1 when the chain wanders a long time.
- S4. $h^a_i\cdot h^b_i=1$.
- S5. $h^a_i+h^b_i=1$ for every $i$.
- S6. $h^a_i+h^b_i=\tfrac12$.
- S7. Absorption in $a$ or $b$ is certain, so the two probabilities add up to 1.

### Q3.5 (lecture 3)
If the probability of ever hitting $A$ from state $i$ is strictly less than 1, then the expected hitting time of $A$ from $i$ is:

- S1. $+\infty$, since the hitting time is infinite with positive probability.
- S2. Equal to $h_i$.
- S3. Infinite, because with positive probability $A$ is never reached.
- S4. Equal to $1/(1-h_i)$.
- S5. Undefined, because expectations need the variable to be finite.
- S6. Zero, because the chain never gets there.
- S7. Finite, but large.

### Q4.1 (lecture 4)
A probability vector $\pi$ is a stationary distribution of the chain with transition matrix $P$ when:

- S1. $\pi P=0$.
- S2. If $X_0$ has distribution $\pi$, then $X_n$ has distribution $\pi$ for every $n$.
- S3. $\pi_i=1/|S|$ for all states.
- S4. $P\pi=\pi$, with $\pi$ a column vector.
- S5. $\pi P=\pi$, with $\pi_i\ge0$ and $\sum_i\pi_i=1$.
- S6. $\pi_i\,p_{ij}=\pi_j\,p_{ji}$ for all $i,j$, and this is necessary.
- S7. $\pi=\lim_{n\to\infty}P^n$ entrywise.

### Q4.2 (lecture 4)
An irreducible Markov chain on a finite state space has:

- S1. At least two different stationary distributions.
- S2. A stationary distribution only if $P$ is doubly stochastic.
- S3. No stationary distribution, because the chain is finite.
- S4. Exactly one stationary distribution, and all of its entries are positive.
- S5. A stationary distribution only if it is aperiodic.
- S6. A unique stationary distribution, but some entries may be zero.
- S7. A unique stationary distribution $\pi$ with $\pi_i>0$ for every state $i$.

### Q4.3 (lecture 4)
For an irreducible, aperiodic, positive recurrent chain with stationary distribution $\pi$, the $n$-step probability $p^{(n)}_{ij}$ as $n\to\infty$:

- S1. Converges to $\pi_i$, the stationary probability of the starting state.
- S2. Converges to $\pi_j$, whatever the starting state $i$.
- S3. Converges to $\delta_{ij}$, so the chain stays where it started.
- S4. Converges to $1/|S|$ for every pair $(i,j)$.
- S5. Converges to 0 for every $j$.
- S6. Approaches the stationary probability of the target state $j$, forgetting where the chain started.
- S7. Does not converge, and keeps oscillating.

### Q4.4 (lecture 4)
A finite irreducible chain has period 2 (for instance it alternates deterministically between two states). Which statement is correct?

- S1. The chain is not irreducible.
- S2. No stationary distribution exists.
- S3. $\lim_n p^{(n)}_{ii}$ does not exist, but a unique stationary distribution still exists.
- S4. $\lim_n p^{(n)}_{ii}$ exists and equals $\pi_i$.
- S5. The stationary distribution exists but is not unique.
- S6. $P^n$ does not converge, yet $\pi P=\pi$ still has exactly one probability solution.
- S7. $\lim_n p^{(n)}_{ii}$ exists and equals 0.

### Q4.5 (lecture 4)
For an irreducible, positive recurrent chain with stationary distribution $\pi$, the expected return time to state $i$ is:

- S1. $1/\pi_i$.
- S2. The reciprocal of the stationary probability of $i$.
- S3. $1/(1-\pi_i)$.
- S4. $1-\pi_i$.
- S5. $\pi_i$.
- S6. $\sum_j\pi_j$.
- S7. $\pi_i^{\,2}$.

### Q4.6 (lecture 4)
Suppose $\pi$ is a probability vector with $\pi_i p_{ij}=\pi_j p_{ji}$ for all states $i,j$. Then:

- S1. $\pi$ is a stationary distribution of the chain.
- S2. $\pi$ is stationary only if the chain is also aperiodic.
- S3. $\pi$ must be uniform.
- S4. $P$ must be symmetric.
- S5. The chain must have an absorbing state.
- S6. The chain must be periodic.
- S7. Summing the detailed-balance equations over $i$ gives $\pi P=\pi$, so $\pi$ is stationary.

### Q5.1 (lecture 5)
A gambler with fortune $i\in\{0,\dots,N\}$ bets one unit per round on a fair coin and stops at $0$ or $N$. The probability of reaching $N$ before $0$ is:

- S1. His starting fortune as a fraction of the target.
- S2. $(N-i)/N$.
- S3. $(i/N)^2$.
- S4. $1/2$, whatever $i$ is.
- S5. $i/(N-i)$.
- S6. $i/N$.
- S7. $1-i/N^{2}$.

### Q5.2 (lecture 5)
With win probability $p\ne\tfrac12$ and $r=q/p$ where $q=1-p$, the probability of reaching $N$ before $0$ from $i$ is:

- S1. $\dfrac{1-r^{\,i}}{1-r^{\,N}}$, which is not linear in $i$.
- S2. A ratio of geometric terms in $r$, and not simply $i/N$.
- S3. $p\,i/N$.
- S4. $r^{\,i-N}$.
- S5. $\dfrac{1-r^{\,N}}{1-r^{\,i}}$.
- S6. $1-p^{\,i}$.
- S7. $i/N$ for every $p$.

### Q5.3 (lecture 5)
For the fair walk on $\{0,\dots,N\}$ started at $i$, the expected time until it hits $0$ or $N$ is:

- S1. $N-i$.
- S2. $i/N$.
- S3. $i^{2}$.
- S4. $N^{2}$.
- S5. The product of the distances from $i$ to the two boundaries.
- S6. $i(N-i)$.
- S7. $iN$.

### Q5.4 (lecture 5)
The simple symmetric random walk on $\mathbb Z$ is:

- S1. Recurrent, yet with infinite mean return time, so it has no stationary distribution.
- S2. Aperiodic and positive recurrent.
- S3. Recurrent with expected return time 2.
- S4. Positive recurrent.
- S5. Transient.
- S6. Null recurrent: it returns to the origin with probability 1, but the expected return time is infinite.
- S7. Transient, since it drifts to infinity.

### Q5.5 (lecture 5)
A random walk on $\mathbb Z$ steps $+1$ with probability $p>\tfrac12$ and $-1$ otherwise. It is:

- S1. Positive recurrent, because it is irreducible.
- S2. Recurrent, but drifting to the right.
- S3. Null recurrent.
- S4. Transient: it drifts to $+\infty$, and the probability of ever returning to the start is below 1.
- S5. Transient, since $S_n/n\to 2p-1>0$ almost surely.
- S6. Transient only if $p\ge 3/4$.
- S7. Recurrent, because every state communicates with every other.

### Q6.1 (lecture 6)
In a Poisson process of rate $\lambda$, the times between successive arrivals are:

- S1. Constant, equal to $1/\lambda$.
- S2. I.i.d. $\mathrm{Exp}(\lambda)$ random variables.
- S3. Gamma distributed with shape $\lambda$.
- S4. Independent exponential random variables with rate $\lambda$ (mean $1/\lambda$).
- S5. Exponential with mean $\lambda$.
- S6. Uniform on $[0,1/\lambda]$.
- S7. Poisson distributed with mean $\lambda$.

### Q6.2 (lecture 6)
In a Poisson process of rate $\lambda$, the number of arrivals $N(t)$ in an interval of length $t$ has:

- S1. A Poisson distribution with mean $\lambda$, whatever $t$ is.
- S2. A Poisson distribution with mean $\lambda/t$.
- S3. A binomial distribution with $n=t$ and $p=\lambda$.
- S4. An exponential distribution with rate $\lambda t$.
- S5. $N(t)\sim\mathrm{Poisson}(\lambda t)$.
- S6. A geometric distribution with parameter $\lambda t$.
- S7. A Poisson distribution with mean $\lambda t$.

### Q6.3 (lecture 6)
A Poisson process has independent increments. This means:

- S1. Knowing the number of arrivals in $(0,s]$ tells you nothing about the number in $(s,s+t]$.
- S2. The rate of arrivals changes independently over time.
- S3. Counts in overlapping intervals are independent.
- S4. Counts in disjoint intervals of equal length are always equal.
- S5. Counts of arrivals in disjoint time intervals are independent.
- S6. All interarrival times are equal.
- S7. At most one arrival can occur in any given interval.

### Q6.4 (lecture 6)
Two independent Poisson processes with rates $\lambda_1$ and $\lambda_2$ are merged into one stream. The merged process is:

- S1. A Poisson process whose rate is the sum of the two rates.
- S2. Not a Poisson process, because the two streams are independent.
- S3. A Poisson process with rate $\lambda_1+\lambda_2$.
- S4. Poisson only if $\lambda_1=\lambda_2$.
- S5. Poisson with rate $\lambda_1\lambda_2$.
- S6. Poisson with rate $\max(\lambda_1,\lambda_2)$.
- S7. Poisson with rate $(\lambda_1+\lambda_2)/2$.

### Q6.5 (lecture 6)
Each arrival of a rate-$\lambda$ Poisson process is independently kept with probability $p$ and otherwise discarded. The kept arrivals form:

- S1. Two independent Poisson processes: kept arrivals with rate $p\lambda$ and discarded arrivals with rate $(1-p)\lambda$.
- S2. A Poisson process with rate $\lambda/p$.
- S3. A Poisson process with rate $p$.
- S4. A Poisson process with rate $\lambda$ again.
- S5. Not a Poisson process, because the selection is random.
- S6. A Poisson process with rate $p\lambda$, independent of the discarded arrivals, which form a Poisson process with rate $(1-p)\lambda$.
- S7. A process that is Poisson only if $p=\tfrac12$.

### Q6.6 (lecture 6)
Given that exactly one arrival of a Poisson process occurred in $[0,t]$, the time of that arrival is:

- S1. Concentrated near $t$.
- S2. Concentrated near $0$, because arrivals tend to come early.
- S3. Exponential with rate $\lambda$, restricted to $[0,t]$, so earlier times are more likely.
- S4. Uniformly distributed on $[0,t]$.
- S5. Exactly $t/2$.
- S6. Normally distributed around $t/2$.
- S7. Equally likely to be anywhere in $[0,t]$.

### Q7.1 (lecture 7)
In a continuous-time Markov chain, the time spent in state $i$ before the next jump is:

- S1. Exponential with rate $1/q_i$.
- S2. Poisson with mean $q_i$.
- S3. Exponential with rate $q_i$, the total rate of leaving $i$.
- S4. Memoryless: exponentially distributed with mean $1/q_i$.
- S5. Geometric with success probability $q_i$.
- S6. Uniform on $[0,1/q_i]$.
- S7. Constant.

### Q7.2 (lecture 7)
The generator matrix $Q=(q_{ij})$ of a continuous-time Markov chain has:

- S1. Rows summing to 1.
- S2. Columns summing to 0 instead of rows.
- S3. Non-negative off-diagonal rates, with $q_{ii}=-\sum_{j\ne i}q_{ij}$.
- S4. All entries non-negative.
- S5. Diagonal entries equal to 1.
- S6. $q_{ij}\ge0$ for $i\ne j$, $q_{ii}\le0$, and every row sums to 0.
- S7. All off-diagonal entries non-positive.

### Q7.3 (lecture 7)
For a continuous-time chain with rates $q_{ij}$ and total exit rate $q_i=\sum_{j\ne i}q_{ij}>0$, the jump chain has transition probabilities:

- S1. $p_{ij}=e^{q_{ij}}$.
- S2. $p_{ij}=q_{ij}\,q_i$.
- S3. $p_{ij}=q_{ij}$.
- S4. $p_{ij}=q_{ij}/q_i$ for $j\ne i$, and $p_{ii}=0$.
- S5. The rate to $j$ divided by the total rate of leaving $i$.
- S6. $p_{ij}=q_{ij}/q_j$.
- S7. $p_{ij}=1/q_i$.

### Q7.4 (lecture 7)
The transition function $P(t)=e^{tQ}$ of a continuous-time chain with generator $Q$ satisfies:

- S1. $P(t)=tQ$.
- S2. $P'(t)=Q^{-1}P(t)$.
- S3. $P(t)=I+tQ$ exactly for all $t$.
- S4. The backward equation $P'(t)=QP(t)$ and the forward equation $P'(t)=P(t)Q$.
- S5. $P'(t)=QP(t)=P(t)Q$.
- S6. $P'(t)=P(t)^2$.
- S7. $P'(t)=Q+P(t)$.

### Q7.5 (lecture 7)
A probability vector $\pi$ is stationary for a continuous-time chain with generator $Q$ if and only if:

- S1. $Q\pi^{\top}=0$ for the column vector $\pi^{\top}$.
- S2. $\pi Q=\pi$.
- S3. $\pi_i\propto q_i$.
- S4. Global balance holds: for every state, the probability flow in equals the flow out.
- S5. $\pi Q=0$.
- S6. $\pi P=\pi$, where $P$ is the jump-chain matrix.
- S7. $\pi_i=q_i$ for all $i$.

### Q7.6 (lecture 7)
A two-state continuous-time chain leaves state $0$ at rate $a>0$ and leaves state $1$ at rate $b>0$. The long-run fraction of time spent in state $0$ is:

- S1. $\dfrac1a$.
- S2. $\dfrac{b}{a+b}$.
- S3. $\dfrac{ab}{a+b}$.
- S4. $\dfrac{a+b}{b}$.
- S5. $\dfrac12$.
- S6. $\dfrac{a}{a+b}$.
- S7. The exit rate of state $1$ divided by the sum of the two exit rates.

### Q8.1 (lecture 8)
A birth-death process can jump:

- S1. Only to a neighbouring state: up by one (a birth) or down by one (a death).
- S2. To any other state.
- S3. Only to state $0$.
- S4. Only upward.
- S5. By arbitrary integer amounts, up or down.
- S6. From state $n$ only to $n+1$ or $n-1$.
- S7. Only from state $0$.

### Q8.2 (lecture 8)
A birth-death process has birth rates $\lambda_n$ (from $n$ to $n+1$) and death rates $\mu_n$ (from $n$ to $n-1$). Its stationary distribution satisfies:

- S1. $\pi_{n+1}=\pi_n+\lambda_n/\mu_{n+1}$.
- S2. The flow up from level $n$ equals the flow down from level $n+1$.
- S3. $\pi_n=\lambda_n/\mu_n$.
- S4. $\pi_n\lambda_n=\pi_{n+1}\mu_{n}$.
- S5. $\pi_n\lambda_n=\pi_n\mu_n$.
- S6. $\pi_n\lambda_n=\pi_{n+1}\mu_{n+1}$ for all $n\ge0$.
- S7. $\pi_n\mu_n=\pi_{n+1}\mu_{n+1}$.

### Q8.3 (lecture 8)
An M/M/1 queue has arrival rate $\lambda$ and service rate $\mu$. It has a stationary distribution if and only if:

- S1. $\mu<1$.
- S2. $\lambda\mu<1$.
- S3. $\lambda=\mu$.
- S4. $\rho=\lambda/\mu<1$: the server works faster than customers arrive.
- S5. $\lambda\le\mu$.
- S6. $\lambda>\mu$.
- S7. $\lambda<\mu$.

### Q8.4 (lecture 8)
In equilibrium, the number $N$ of customers in a stable M/M/1 queue with $\rho=\lambda/\mu<1$ has distribution:

- S1. Uniform on $\{0,1,\dots,\lceil\rho\rceil\}$.
- S2. $P(N=n)=(1-\rho)^{\,n}\rho$.
- S3. Geometric: $P(N=n)=(1-\rho)\rho^{\,n}$ for $n=0,1,2,\dots$.
- S4. Exponential with rate $\rho$.
- S5. $P(N=n)=\rho^{\,n}$, without normalisation.
- S6. Poisson with mean $\rho$.
- S7. $P(N=n)=\rho^{\,n}(1-\rho)$, so in particular $P(N=0)=1-\rho$.

### Q8.5 (lecture 8)
Little's law, for a stable system with long-run arrival rate $\lambda$, states that:

- S1. $W=\lambda L$.
- S2. $L=\lambda+W$.
- S3. It holds only for M/M/1 queues.
- S4. $L=\lambda W$: mean number in system equals arrival rate times mean time in system.
- S5. $L=W/\lambda$.
- S6. $L=\lambda^{2}W$.
- S7. The average number of customers in the system equals $\lambda$ times the average time a customer spends in it ($L=\lambda W$).

### Q8.6 (lecture 8)
An M/M/$c$ queue has arrival rate $\lambda$ and $c$ servers, each with service rate $\mu$. It is stable (has a stationary distribution) if and only if:

- S1. $\lambda c<\mu$.
- S2. $\lambda<c\mu$.
- S3. $c<\lambda\mu$.
- S4. $\lambda<\mu$.
- S5. $\lambda<\mu/c$.
- S6. $\lambda<c+\mu$.
- S7. The arrival rate is below the total service capacity.

### Q9.1 (lecture 9)
A renewal process is a counting process whose interarrival times are:

- S1. Uniformly distributed.
- S2. Independent but with different distributions.
- S3. Independent and identically distributed positive random variables (any distribution).
- S4. Exponential random variables only.
- S5. Dependent, with each gap depending on the previous.
- S6. I.i.d. random variables on $(0,\infty)$, not necessarily exponential.
- S7. Constant.

### Q9.2 (lecture 9)
For a renewal process with mean interarrival time $\mu<\infty$, the number of renewals $N(t)$ satisfies $N(t)/t\to$ ? as $t\to\infty$, almost surely:

- S1. $1/\mu^{2}$.
- S2. $\mu$.
- S3. $\mu^{2}$.
- S4. $1/\mu$.
- S5. $0$ for every renewal process.
- S6. $\sigma^{2}/\mu$.
- S7. The reciprocal of the mean interarrival time.

### Q9.3 (lecture 9)
Cycles are i.i.d., with cycle length $T$ and reward $R$ per cycle. By the renewal reward theorem, the long-run average reward per unit time is:

- S1. $E[R]\,E[T]$.
- S2. $E[R]$.
- S3. $E[T]/E[R]$.
- S4. $E[R]/E[T]$.
- S5. $E[R/T]$.
- S6. Expected reward per cycle divided by expected cycle length.
- S7. $E[R]/\mathrm{Var}(T)$.

### Q9.4 (lecture 9)
In a renewal process with non-degenerate interarrival times, the interval covering a fixed late time $t$ is, on average:

- S1. Stochastically larger than an ordinary interarrival time (length-biased sampling).
- S2. Longer than a typical interarrival interval, because long intervals are more likely to contain $t$.
- S3. Exactly half as long as a typical interval.
- S4. The same as a typical interval, because the gaps are identically distributed.
- S5. Exactly twice as long as a typical interval, for every renewal process.
- S6. Equal to $1/\lambda$ in every renewal process.
- S7. Shorter than a typical interval.

### Q9.5 (lecture 9)
Among renewal counting processes $N(t)$, which are Markov processes?

- S1. Those with exponential interarrival times, i.e. the Poisson process.
- S2. Those with Gamma(2) interarrival times.
- S3. Only the Poisson process.
- S4. Those with uniform interarrival times.
- S5. Those with constant interarrival times.
- S6. Every renewal process.
- S7. Those with finite variance.

### Q10.1 (lecture 10)
In a Galton-Watson branching process with $Z_0=1$ and mean offspring number $m$, the expected size of generation $n$ is:

- S1. The offspring mean raised to the $n$-th power.
- S2. $m^{1/n}$.
- S3. $E[Z_n]=m^{\,n}$.
- S4. $n!\,m$.
- S5. $(1+m)^{n}$.
- S6. $m/n$.
- S7. $nm$.

### Q10.2 (lecture 10)
For a non-degenerate offspring distribution (not exactly one child with probability 1), the population dies out with probability 1 if and only if:

- S1. $m<1$ only (extinction is not certain when $m=1$).
- S2. $m>1$.
- S3. $P(\text{no offspring})>\tfrac12$.
- S4. $m\le2$.
- S5. The mean offspring number satisfies $m\le1$.
- S6. On average each individual has at most one child.
- S7. $m\ge1$.

### Q10.3 (lecture 10)
With offspring pgf $G$, the extinction probability $\eta$ is:

- S1. The root of $G(s)=0$.
- S2. $1-G(0)$.
- S3. The largest root of $G(s)=s$ in $[0,1]$.
- S4. The minimal solution in $[0,1]$ of $G(s)=s$.
- S5. The root of $G'(s)=1$.
- S6. $G(1)$.
- S7. The smallest non-negative root of $s=G(s)$.

### Q10.4 (lecture 10)
A branching process has mean offspring number $m>1$. Then:

- S1. The extinction probability is strictly less than 1, so the population survives forever with positive probability.
- S2. The extinction probability is exactly $1/m$.
- S3. The extinction probability is $m-1$.
- S4. The population size stays bounded.
- S5. The population size grows deterministically as $m^{n}$.
- S6. Extinction is still certain, but takes longer.
- S7. There is a positive chance of non-extinction, and on non-extinction $Z_n\to\infty$.

### Q10.5 (lecture 10)
Let $G$ be the offspring pgf and $Z_0=1$. The pgf of $Z_2$, the size of generation 2, is:

- S1. $G(G(s))$.
- S2. $G(2s)$.
- S3. $G(s)+G(s)$.
- S4. $G$ composed with itself.
- S5. $G'(s)$.
- S6. $G(s)^{2}$.
- S7. $2G(s)$.

### Q11.1 (lecture 11)
A process $(M_n)$ with $E|M_n|<\infty$ is a martingale if:

- S1. The increments $M_{n+1}-M_n$ are independent of each other.
- S2. $E[M_{n+1}\mid M_0,\dots,M_n]=M_n$ for every $n$.
- S3. $M_{n+1}\ge M_n$ almost surely.
- S4. $E[M_{n+1}\mid M_n]=E[M_n]$.
- S5. The best prediction of the next value, given the history, is the current value.
- S6. $E[M_{n+1}]=0$.
- S7. $\mathrm{Var}(M_{n+1})=\mathrm{Var}(M_n)$.

### Q11.2 (lecture 11)
For a martingale $(M_n)$, the expectation $E[M_n]$ is:

- S1. Equal to $n\,E[M_0]$.
- S2. Increasing in $n$.
- S3. Equal to 0.
- S4. The same for every $n$.
- S5. Decreasing in $n$.
- S6. Infinite.
- S7. Constant in $n$, equal to $E[M_0]$.

### Q11.3 (lecture 11)
For the simple symmetric random walk $S_n$ with $S_0=0$, which of the following is a martingale?

- S1. The squared position minus the number of steps taken.
- S2. $S_n^{2}$.
- S3. $S_n^{2}+n$.
- S4. $S_n^{2}-n$.
- S5. $|S_n|$.
- S6. $S_n^{2}-n^{2}$.
- S7. $S_n^{3}$.

### Q11.4 (lecture 11)
The optional stopping theorem gives $E[M_T]=E[M_0]$ for a martingale under suitable conditions. Which of the following guarantees it?

- S1. $T<\infty$ almost surely, with no other conditions.
- S2. $T$ is a stopping time with $T\le K$ almost surely for some constant $K$.
- S3. $E|M_n|<\infty$ for each $n$, and nothing else.
- S4. $T$ is a stopping time and is bounded by a fixed constant $K$.
- S5. $T$ is the first time that $M$ exceeds its eventual maximum.
- S6. $T$ is any random time, for example the time at which the path attains its maximum.
- S7. $M$ is a positive martingale and $T$ is any stopping time.

### Q11.5 (lecture 11)
Consider the fair walk $S_n$ started at $i\in\{0,\dots,N\}$, stopped at the first time $T$ it hits $0$ or $N$. Why does optional stopping give $P(S_T=N)=i/N$?

- S1. $S_n$ is a martingale, so $i=E[S_T]=N\cdot P(S_T=N)+0\cdot P(S_T=0)$.
- S2. Because $S_T=N$ with probability 1 for a walk that keeps going.
- S3. $S_n^{2}$ is a martingale, so $P(S_T=N)=i^{2}/N^{2}$.
- S4. $E[S_T]=i$ and $S_T\in\{0,N\}$, hence $P(S_T=N)=i/N$.
- S5. $T$ is bounded by $N$, so Wald's identity applies directly.
- S6. By symmetry $E[S_T]=N/2$ whatever the start, so $P(S_T=N)=\tfrac12$.
- S7. $S_n$ is a submartingale, so $E[S_T]\ge i$ is all one can say.


# PART B: long questions

### LQ1 (generator a-dtmc)
A Markov chain on states $1,2,3,4,5$ has transition matrix (rows = current state, columns = next state)$$P=\begin{pmatrix}0.4 & 0 & 0 & 0 & 0.6 \\ 0 & 1 & 0 & 0 & 0 \\ 0.1 & 0.4 & 0.2 & 0.2 & 0.1 \\ 0.1 & 0.3 & 0.3 & 0.1 & 0.2 \\ 0.6 & 0 & 0 & 0 & 0.4\end{pmatrix}$$Give decimal answers to 3 decimal places. Counts are whole numbers.

(a) [lecture 1] Starting in state $4$, find $P(X_2=4)$.

(b) [lecture 2] How many communicating classes does the chain have?

(c) [lecture 2] What is the period of state $1$?

(d) [lecture 3] Starting from state $4$, what is the probability that the chain ever reaches state $2$?

(e) [lecture 3] Starting from state $4$, what is the expected number of steps until the chain first visits a state outside $\{4,3\}$?

(f) [lecture 4] Starting in state $1$, what is the long-run fraction of time the chain spends in state $1$?

### LQ2 (generator a-dtmc)
A Markov chain on states $1,2,3,4,5$ has transition matrix (rows = current state, columns = next state)$$P=\begin{pmatrix}0.1 & 0.2 & 0.1 & 0.4 & 0.2 \\ 0.2 & 0.2 & 0.2 & 0.1 & 0.3 \\ 0 & 0 & 0.8 & 0.2 & 0 \\ 0 & 0 & 0.8 & 0.2 & 0 \\ 0 & 0 & 0 & 0 & 1\end{pmatrix}$$Give decimal answers to 3 decimal places. Counts are whole numbers.

(a) [lecture 1] Starting in state $2$, find $P(X_2=5)$.

(b) [lecture 2] How many communicating classes does the chain have?

(c) [lecture 2] What is the period of state $4$?

(d) [lecture 3] Starting from state $2$, what is the probability that the chain ever reaches state $5$?

(e) [lecture 3] Starting from state $2$, what is the expected number of steps until the chain first visits a state outside $\{2,1\}$?

(f) [lecture 4] Starting in state $4$, what is the long-run fraction of time the chain spends in state $4$?

### LQ3 (generator b-ruin)
A gambler bets 1 unit per round and keeps playing until his fortune hits 0 (ruin) or the target. Give decimal answers to 3 decimal places unless told otherwise.

(a) [lecture 5] Fair game (each round won with probability $1/2$). He starts with $5$ units and aims for $10$. What is the probability he reaches $10$ before ruin?

(b) [lecture 5] In the same fair game, what is the expected number of rounds until the game ends?

(c) [lecture 5] Biased game: each round is won with probability $p=0.6$ (so $q=0.4$). He starts with $3$ units and aims for $6$. What is the probability he reaches $6$ before ruin?

(d) [lecture 11] In the biased game let $M_n=(q/p)^{S_n}$, where $S_n$ is his fortune after $n$ rounds (a martingale), and let $T$ be the time the game ends. Use optional stopping to find $E[M_T]$. Give 4 decimal places.

(e) [lecture 5] In the biased game, what is the expected number of rounds until the game ends?

### LQ4 (generator b-ruin)
A gambler bets 1 unit per round and keeps playing until his fortune hits 0 (ruin) or the target. Give decimal answers to 3 decimal places unless told otherwise.

(a) [lecture 5] Fair game (each round won with probability $1/2$). He starts with $7$ units and aims for $15$. What is the probability he reaches $15$ before ruin?

(b) [lecture 5] In the same fair game, what is the expected number of rounds until the game ends?

(c) [lecture 5] Biased game: each round is won with probability $p=0.4$ (so $q=0.6$). He starts with $3$ units and aims for $6$. What is the probability he reaches $6$ before ruin?

(d) [lecture 11] In the biased game let $M_n=(q/p)^{S_n}$, where $S_n$ is his fortune after $n$ rounds (a martingale), and let $T$ be the time the game ends. Use optional stopping to find $E[M_T]$. Give 4 decimal places.

(e) [lecture 5] In the biased game, what is the expected number of rounds until the game ends?

### LQ5 (generator c-poisson)
Customers arrive at a shop as a Poisson process with rate $5$ per hour. Give decimal answers to 3 decimal places.

(a) [lecture 6] What is the probability that exactly $5$ customers arrive in the next $1$ hour?

(b) [lecture 6] Separately, orders from two independent sources arrive as Poisson processes with rates $1$ and $6$ per hour. What is the probability that the next order overall comes from the first source?

(c) [lecture 6] Back to the shop (rate $5$ per hour). Each arriving customer independently buys something with probability $0.4$. What is the probability that nobody buys anything in the next $1$ hour?

(d) [lecture 9] A lamp's bulb lasts a time uniformly distributed between $3$ and $11$ days, and is replaced the moment it fails. Bulb lifetimes are independent. In the long run, how many replacements per day happen?

(e) [lecture 9] Each replacement costs $19$ dollars, and the bulb also costs $5$ dollars per day while it is in use. What is the long-run average cost per day?

### LQ6 (generator c-poisson)
Customers arrive at a shop as a Poisson process with rate $3$ per hour. Give decimal answers to 3 decimal places.

(a) [lecture 6] What is the probability that exactly $5$ customers arrive in the next $1.5$ hours?

(b) [lecture 6] Separately, orders from two independent sources arrive as Poisson processes with rates $3$ and $4$ per hour. What is the probability that the next order overall comes from the first source?

(c) [lecture 6] Back to the shop (rate $3$ per hour). Each arriving customer independently buys something with probability $0.6$. What is the probability that nobody buys anything in the next $0.5$ hours?

(d) [lecture 9] A lamp's bulb lasts a time uniformly distributed between $2$ and $7$ days, and is replaced the moment it fails. Bulb lifetimes are independent. In the long run, how many replacements per day happen?

(e) [lecture 9] Each replacement costs $7$ dollars, and the bulb also costs $1$ dollars per day while it is in use. What is the long-run average cost per day?

### LQ7 (generator d-ctmc-queue)
A continuous-time Markov chain on states $1,2,3$ has generator$$Q=\begin{pmatrix}-3 & 2 & 1 \\ 2 & -5 & 3 \\ 1 & 3 & -4\end{pmatrix}$$Give decimal answers to 3 decimal places.

(a) [lecture 7] When the chain leaves state $3$, what is the probability that it jumps to state $2$?

(b) [lecture 7] What fraction of the time does the chain spend in state $1$ in the long run?

(c) [lecture 8] Now a single-server queue: customers arrive as a Poisson process at rate $8$ per minute and service times are exponential with rate $10$ per minute (M/M/1). In equilibrium, what is the mean number of customers in the system?

(d) [lecture 8] In the same queue, what is the mean time (in minutes) a customer spends in the system, waiting plus being served?

(e) [lecture 8] In the same queue in equilibrium, what is the probability that at least $3$ customers are in the system?

### LQ8 (generator d-ctmc-queue)
A continuous-time Markov chain on states $1,2,3$ has generator$$Q=\begin{pmatrix}-3 & 1 & 2 \\ 4 & -8 & 4 \\ 1 & 3 & -4\end{pmatrix}$$Give decimal answers to 3 decimal places.

(a) [lecture 7] When the chain leaves state $1$, what is the probability that it jumps to state $2$?

(b) [lecture 7] What fraction of the time does the chain spend in state $2$ in the long run?

(c) [lecture 8] Now a single-server queue: customers arrive as a Poisson process at rate $6$ per minute and service times are exponential with rate $8$ per minute (M/M/1). In equilibrium, what is the mean number of customers in the system?

(d) [lecture 8] In the same queue, what is the mean time (in minutes) a customer spends in the system, waiting plus being served?

(e) [lecture 8] In the same queue in equilibrium, what is the probability that at least $4$ customers are in the system?

### LQ9 (generator e-branching)
In a branching process, every individual independently has 0, 1 or 2 children with probabilities $0.3$, $0.1$, $0.6$ respectively. Start with one individual and let $Z_n$ be the size of generation $n$ (so $Z_0=1$). Give decimal answers to 3 decimal places.

(a) [lecture 10] What is the mean number of children of an individual?

(b) [lecture 10] What is $E[Z_3]$?

(c) [lecture 10] What is the probability that the population is extinct by generation 2, i.e. $P(Z_2=0)$?

(d) [lecture 10] What is the probability that the population eventually dies out?

(e) [lecture 11] Let $W_n=Z_n/m^n$, where $m$ is the mean number of children (a martingale). Given that $Z_1=1$, what is $E[W_3\mid Z_1=1]$?

### LQ10 (generator e-branching)
In a branching process, every individual independently has 0, 1 or 2 children with probabilities $0.8$, $0.1$, $0.1$ respectively. Start with one individual and let $Z_n$ be the size of generation $n$ (so $Z_0=1$). Give decimal answers to 3 decimal places.

(a) [lecture 10] What is the mean number of children of an individual?

(b) [lecture 10] What is $E[Z_3]$?

(c) [lecture 10] What is the probability that the population is extinct by generation 2, i.e. $P(Z_2=0)$?

(d) [lecture 10] What is the probability that the population eventually dies out?

(e) [lecture 11] Let $W_n=Z_n/m^n$, where $m$ is the mean number of children (a martingale). Given that $Z_1=3$, what is $E[W_3\mid Z_1=3]$?


---
# APPENDIX (read only after Step 1 is written down): author's key

## Part A key

**Q1.1**: intended TRUE = S2, S5.
  - S1 false; targets: thinks Markov chains need a finite state space
  - S3 false; targets: forgets that independence of the past holds only given the present
  - S4 false; targets: mixes up the Markov property with irreducibility
  - S6 false; targets: confuses a Markov chain with an i.i.d. sequence
  - S7 false; targets: mixes up the Markov property with time-homogeneity
  - Explanation: The Markov property conditions on the present only: the past matters only through $X_n$. Time-homogeneity, irreducibility and finiteness are separate properties some chains have.

**Q1.2**: intended TRUE = S3, S7.
  - S1 false; targets: treats the matrix like a rotation or a volume-preserving map
  - S2 false; targets: assumes $p_{ij}=p_{ji}$, which is only true for special chains
  - S4 false; targets: ignores that a chain can stay in the same state
  - S5 false; targets: ignores that transitions can be impossible (zero entries)
  - S6 false; targets: confuses a stochastic matrix with a doubly stochastic one
  - Explanation: Row $i$ is the distribution of the next state given the current state $i$, so it must sum to 1. Columns need not sum to 1, entries can be 0, and $p_{ii}>0$ is allowed.

**Q1.3**: intended TRUE = S5, S6.
  - S1 false; targets: transposes the matrix, which swaps the roles of $i$ and $j$
  - S2 false; targets: confuses repeated multiplication with repeated addition
  - S3 false; targets: inverts the direction of the exponent
  - S4 false; targets: raises entries to a power instead of taking a matrix power
  - S7 false; targets: uses a long-run average in place of the $n$-step probabilities
  - Explanation: Chapman-Kolmogorov: $p^{(m+n)}_{ij}=\sum_k p^{(m)}_{ik}p^{(n)}_{kj}$, which is exactly matrix multiplication, so $P^{(n)}=P^n$.

**Q1.4**: intended TRUE = S2, S5.
  - S1 false; targets: multiplies on the wrong side, which mixes up from-state and to-state
  - S3 false; targets: raises the distribution to a power instead of the matrix
  - S4 false; targets: uses an entrywise product instead of vector-matrix multiplication
  - S6 false; targets: adds instead of multiplies
  - S7 false; targets: forgets that each step applies $P$ once more
  - Explanation: By the law of total probability, $P(X_n=j)=\sum_i P(X_0=i)\,p^{(n)}_{ij}$, i.e. $\mu P^n$ with $\mu$ as a row vector on the left.

**Q1.5**: intended TRUE = S2, S4.
  - S1 false; targets: thinks that transitions depending on the current state means time-inhomogeneous
  - S3 false; targets: thinks dependence on the present violates the Markov property
  - S5 false; targets: confuses the sum containing the history with the future needing the history
  - S6 false; targets: mixes up the Markov property with the martingale property
  - S7 false; targets: believes a finite state space is required
  - Explanation: The future increment $\xi_{n+1}$ is independent of everything before, so the only thing the past contributes is the current value $S_n$. Any mean is allowed.

**Q1.6**: intended TRUE = S3, S7.
  - S1 false; targets: mixes up homogeneity with the existence of a stationary distribution
  - S2 false; targets: confuses homogeneity with uniform occupation
  - S4 false; targets: mixes up homogeneity with periodicity
  - S5 false; targets: mixes up homogeneity with irreducibility
  - S6 false; targets: mixes up homogeneity with being in equilibrium
  - Explanation: Time-homogeneous means the rule for moving from $i$ to $j$ is the same at all times; only then do we write one matrix $P$ and get $P^n$ for $n$ steps.

**Q2.1**: intended TRUE = S2, S7.
  - S1 false; targets: mixes up communication with recurrence
  - S3 false; targets: demands certainty rather than positive probability
  - S4 false; targets: thinks communicating states must have equal self-loop probability
  - S5 false; targets: forgets that communication needs both directions
  - S6 false; targets: requires direct transitions instead of paths of any length
  - Explanation: Communication is two-way reachability with positive probability, via paths of any finite length. It partitions the state space into communicating classes.

**Q2.2**: intended TRUE = S6, S7.
  - S1 false; targets: confuses recurrent with positive recurrent
  - S2 false; targets: assumes recurrence guarantees a stationary distribution (false for null recurrent chains)
  - S3 false; targets: confuses recurrent with absorbing
  - S4 false; targets: thinks one recurrent state forces the whole chain to be one class
  - S5 false; targets: has the transience criterion backwards: for recurrent states this sum is infinite
  - Explanation: Recurrent means return probability 1. The expected return time can still be infinite (null recurrent), in which case no stationary distribution exists.

**Q2.3**: intended TRUE = S2, S6.
  - S1 false; targets: confuses transience with being unreachable
  - S3 false; targets: swaps the transient and recurrent behaviour of the visit count
  - S4 false; targets: mixes up transience with periodicity
  - S5 false; targets: thinks transient states cannot have a self-loop
  - S7 false; targets: forgets that every state is in a class (possibly just itself)
  - Explanation: Transient means the return probability is below 1, so the number of visits is geometric and finite almost surely. A transient state can have $p_{ii}>0$ and can be reachable from others.

**Q2.4**: intended TRUE = S2, S4.
  - S1 false; targets: assumes finiteness removes periodicity
  - S3 false; targets: forgets that finite chains can have transient states
  - S5 false; targets: believes transience is typical in finite chains
  - S6 false; targets: overlooks chains with several closed classes, such as two absorbing states
  - S7 false; targets: thinks finiteness implies a single communicating class
  - Explanation: With finitely many states the chain must keep visiting some state infinitely often, which forces a recurrent state. Several recurrent classes, transient states and periodic states are all possible.

**Q2.5**: intended TRUE = S1, S3.
  - S2 false; targets: assumes classmates have equal long-run probability
  - S4 false; targets: mixes up recurrent with absorbing
  - S5 false; targets: thinks communication flips the type
  - S6 false; targets: assumes classmates have equal self-loop probability
  - S7 false; targets: does not know recurrence is a class property
  - Explanation: If $i\leftrightarrow j$ and $i$ is recurrent, $\sum_n p^{(n)}_{jj}\ge c\sum_n p^{(n)}_{ii}=\infty$ for some $c>0$, so $j$ is recurrent. The same holds for transience and for the period.

**Q2.6**: intended TRUE = S2, S4.
  - S1 false; targets: uses the shortest return time instead of the gcd
  - S3 false; targets: uses a maximum, which is unbounded for chains that can wander
  - S5 false; targets: mixes up the period with the mean return time
  - S6 false; targets: mixes up the period with the limiting probability
  - S7 false; targets: confuses the period with the class size
  - Explanation: If return times can be 2 and 3, the gcd is 1 (aperiodic), even though the smallest return time is 2. So the shortest return time is not the period.

**Q3.1**: intended TRUE = S1, S7.
  - S2 false; targets: swaps from-state and to-state
  - S3 false; targets: replaces the averaging over next states by a maximum of one-step probabilities
  - S4 false; targets: puts the wrong boundary value on the target set
  - S5 false; targets: uses the equation for expected times instead of probabilities
  - S6 false; targets: multiplies probabilities instead of averaging over outcomes
  - Explanation: Law of total probability on the first step: $h_i=\sum_j p_{ij}h_j$, and a chain that is already in $A$ has hit it, so $h_i=1$ there.

**Q3.2**: intended TRUE = S1, S2.
  - S3 false; targets: uses the probability equation and boundary instead of the time equation
  - S4 false; targets: forgets the cost of one step, which makes every $k_i$ equal to 0
  - S5 false; targets: counts a step even when the chain is already in the target set
  - S6 false; targets: replaces the average over next states by a maximum
  - S7 false; targets: invents a reciprocal relation between expected time and hitting probability
  - Explanation: Each step adds 1 to the time, then we average over the next state. Starting in $A$, no time is needed, so $k_i=0$ there.

**Q3.3**: intended TRUE = S3, S6.
  - S1 false; targets: assumes uniqueness, which fails for infinite chains or those with other closed classes
  - S2 false; targets: guesses a symmetric solution without solving
  - S4 false; targets: confuses hitting probabilities with a probability distribution over states
  - S5 false; targets: assumes that the target is always hit
  - S7 false; targets: picks the largest solution, which is the constant 1 whenever it solves the system
  - Explanation: For example, in the gambler's ruin on $\{0,1,2,\dots\}$ with $p>1/2$, both the true ruin probability and the constant 1 solve the equations; the true one is the smaller.

**Q3.4**: intended TRUE = S5, S7.
  - S1 false; targets: assumes a symmetric split regardless of where the chain starts
  - S2 false; targets: thinks each target is hit with certainty
  - S3 false; targets: forgets that these are probabilities of mutually exclusive outcomes
  - S4 false; targets: multiplies instead of adding complementary probabilities
  - S6 false; targets: uses a wrong total
  - Explanation: In a finite chain the transient states are left eventually, so the chain ends up in $a$ or in $b$, never both: the two probabilities sum to 1.

**Q3.5**: intended TRUE = S1, S3.
  - S2 false; targets: mixes up a probability with an expected time
  - S4 false; targets: invents a formula that is finite whenever $h_i<1$
  - S5 false; targets: thinks an expectation cannot be $+\infty$
  - S6 false; targets: treats failure to hit as time zero
  - S7 false; targets: forgets that a positive-probability infinite outcome makes the mean infinite
  - Explanation: If $P(T_A=\infty)>0$ then $E[T_A]=\infty$. Finite expected hitting time needs hitting probability 1 first.

**Q4.1**: intended TRUE = S2, S5.
  - S1 false; targets: confuses stationarity of a discrete chain with the generator equation of a continuous chain
  - S3 false; targets: assumes the stationary distribution is always uniform
  - S4 false; targets: multiplies on the wrong side: constants always satisfy this
  - S6 false; targets: treats detailed balance as necessary, but it is only sufficient
  - S7 false; targets: mixes up a vector with a limiting matrix
  - Explanation: $\pi P=\pi$ is exactly the statement that one step does not change the distribution. It is uniform only for doubly stochastic matrices, and detailed balance is a stronger condition.

**Q4.2**: intended TRUE = S4, S7.
  - S1 false; targets: thinks uniqueness fails for irreducible chains
  - S2 false; targets: confuses existence with the uniform special case
  - S3 false; targets: thinks finite chains cannot settle down
  - S5 false; targets: thinks periodicity prevents a stationary distribution
  - S6 false; targets: forgets that every state in a recurrent class is visited
  - Explanation: Finite and irreducible means positive recurrent, so there is a unique $\pi$ with $\pi_i=1/m_i>0$. Periodicity affects convergence of $P^n$, not existence.

**Q4.3**: intended TRUE = S2, S6.
  - S1 false; targets: mixes up which index the limit depends on
  - S3 false; targets: thinks the chain does not move in the long run
  - S4 false; targets: assumes the limit is always uniform
  - S5 false; targets: applies the null recurrent or transient behaviour
  - S7 false; targets: applies the periodic case to an aperiodic chain
  - Explanation: Convergence theorem: the rows of $P^n$ all approach $\pi$, so the limit depends on the target state only.

**Q4.4**: intended TRUE = S3, S6.
  - S1 false; targets: thinks periodic chains cannot be irreducible
  - S2 false; targets: thinks periodicity destroys the stationary distribution
  - S4 false; targets: applies the aperiodic convergence theorem to a periodic chain
  - S5 false; targets: thinks periodicity breaks uniqueness
  - S7 false; targets: confuses periodic with transient behaviour
  - Explanation: For the two-state alternation, $p^{(n)}_{11}$ is $1,0,1,0,\dots$ so there is no limit, while $\pi=(1/2,1/2)$ is stationary and unique.

**Q4.5**: intended TRUE = S1, S2.
  - S3 false; targets: uses the reciprocal of the complement, as for a geometric number of failures
  - S4 false; targets: uses the complement of the probability
  - S5 false; targets: mixes up a probability with a time
  - S6 false; targets: confuses the mean return time with the total mass, which is 1
  - S7 false; targets: squares the probability for no reason
  - Explanation: Visits to $i$ occupy a fraction $\pi_i$ of time, so the average gap between visits is $1/\pi_i$ steps.

**Q4.6**: intended TRUE = S1, S7.
  - S2 false; targets: thinks aperiodicity is needed for stationarity
  - S3 false; targets: assumes balance implies equal probabilities
  - S4 false; targets: assumes $p_{ij}=p_{ji}$, which holds only when $\pi$ is uniform
  - S5 false; targets: confuses balance with absorption
  - S6 false; targets: invents a link with periodicity
  - Explanation: $\sum_i\pi_ip_{ij}=\sum_i\pi_jp_{ji}=\pi_j\sum_ip_{ji}=\pi_j$. Detailed balance is sufficient for stationarity, not necessary.

**Q5.1**: intended TRUE = S1, S6.
  - S2 false; targets: swaps the two boundaries
  - S3 false; targets: squares the answer with no justification
  - S4 false; targets: uses symmetry of the coin as if it made the start irrelevant
  - S5 false; targets: uses an odds ratio instead of a probability, which can exceed 1
  - S7 false; targets: invents a formula with the wrong scaling
  - Explanation: The fair walk is a martingale, so $i=E[S_T]=N\cdot P(\text{reach }N)$, giving $P=i/N$.

**Q5.2**: intended TRUE = S1, S2.
  - S3 false; targets: multiplies the fair answer by the win probability
  - S4 false; targets: drops the normalisation, so the value is not a probability
  - S5 false; targets: inverts the ratio, which can exceed 1
  - S6 false; targets: treats the walk as needing $i$ wins in a row
  - S7 false; targets: assumes the fair-game answer holds for a biased game
  - Explanation: Solve $h_i=p\,h_{i+1}+q\,h_{i-1}$ with $h_0=0$, $h_N=1$: $h_i=(1-r^i)/(1-r^N)$. As $r\to1$ this tends to $i/N$.

**Q5.3**: intended TRUE = S5, S6.
  - S1 false; targets: gives a distance rather than a time
  - S2 false; targets: gives the ruin probability instead of a time
  - S3 false; targets: uses only the distance to one boundary
  - S4 false; targets: uses the interval length squared, which ignores the start
  - S7 false; targets: multiplies by the interval length instead of the distance to the other end
  - Explanation: $D_i=1+\tfrac12D_{i-1}+\tfrac12D_{i+1}$ with $D_0=D_N=0$ is solved by $D_i=i(N-i)$.

**Q5.4**: intended TRUE = S1, S6.
  - S2 false; targets: gets both the period (it is 2) and the recurrence type wrong
  - S3 false; targets: confuses the shortest possible return with the mean return time
  - S4 false; targets: forgets that the mean return time is infinite
  - S5 false; targets: thinks symmetry is not enough to guarantee return in one dimension
  - S7 false; targets: attributes a drift to a walk with zero mean
  - Explanation: Pólya's theorem: the symmetric walk on $\mathbb Z$ and $\mathbb Z^2$ is recurrent. $E[\text{return time}]=\infty$, so it is null recurrent and has no stationary distribution.

**Q5.5**: intended TRUE = S4, S5.
  - S1 false; targets: thinks irreducibility implies positive recurrence
  - S2 false; targets: contradicts itself: a drifting walk leaves every finite set for good
  - S3 false; targets: applies the symmetric case to a biased walk
  - S6 false; targets: invents a threshold; any bias makes the walk transient
  - S7 false; targets: thinks irreducibility implies recurrence
  - Explanation: By the strong law $S_n/n\to2p-1\ne0$, so $|S_n|\to\infty$ and each state is visited finitely often.

**Q6.1**: intended TRUE = S2, S4.
  - S1 false; targets: thinks arrivals are evenly spaced
  - S3 false; targets: confuses interarrival times with the time of the $\lambda$-th arrival
  - S5 false; targets: mixes up the rate and the mean
  - S6 false; targets: picks a bounded distribution with the right-looking scale
  - S7 false; targets: mixes up the distribution of counts with that of gaps
  - Explanation: The gaps are i.i.d. $\mathrm{Exp}(\lambda)$; the count in $[0,t]$ is Poisson, and the time of the $k$-th arrival is Gamma$(k,\lambda)$.

**Q6.2**: intended TRUE = S5, S7.
  - S1 false; targets: ignores the dependence on the interval length
  - S2 false; targets: divides by time instead of multiplying
  - S3 false; targets: treats time as a number of trials
  - S4 false; targets: mixes up counts and waiting times
  - S6 false; targets: mixes up counts with a number of trials until success
  - Explanation: Arrivals per unit time are independent with rate $\lambda$, so the mean count over length $t$ is $\lambda t$, and the distribution is Poisson.

**Q6.3**: intended TRUE = S1, S5.
  - S2 false; targets: confuses independent increments with a random rate
  - S3 false; targets: forgets that overlapping intervals share arrivals
  - S4 false; targets: confuses independence with identical counts
  - S6 false; targets: confuses independent increments with regular spacing
  - S7 false; targets: mixes up independence with ordinariness (no simultaneous arrivals)
  - Explanation: Independence is for disjoint intervals only. Overlapping intervals share arrivals, so their counts are dependent.

**Q6.4**: intended TRUE = S1, S3.
  - S2 false; targets: thinks independence prevents the Poisson property
  - S4 false; targets: thinks the rates must be equal to merge
  - S5 false; targets: multiplies rates instead of adding them
  - S6 false; targets: thinks the faster stream dominates
  - S7 false; targets: averages the rates instead of adding
  - Explanation: Superposition: counts add, and the sum of independent Poisson$(\lambda_1 t)$ and Poisson$(\lambda_2 t)$ is Poisson$((\lambda_1+\lambda_2)t)$.

**Q6.5**: intended TRUE = S1, S6.
  - S2 false; targets: divides by $p$, which would increase the rate
  - S3 false; targets: forgets to scale by $\lambda$
  - S4 false; targets: thinks random deletion leaves the rate unchanged
  - S5 false; targets: thinks randomness destroys the Poisson property
  - S7 false; targets: thinks thinning needs a fair coin
  - Explanation: Thinning: the number kept in $[0,t]$ is Poisson$(p\lambda t)$, the number discarded is Poisson$((1-p)\lambda t)$, and the two are independent.

**Q6.6**: intended TRUE = S4, S7.
  - S1 false; targets: thinks the information pushes the arrival to the end
  - S2 false; targets: thinks the first arrival is pulled to the start
  - S3 false; targets: carries over the unconditional waiting-time law
  - S5 false; targets: treats the time as deterministic
  - S6 false; targets: replaces uniform by a bell shape
  - Explanation: Conditional on $N(t)=1$, the arrival time is uniform on $[0,t]$: the process has no preferred moments, because it has stationary independent increments.

**Q7.1**: intended TRUE = S3, S4.
  - S1 false; targets: mixes up the rate and the mean
  - S2 false; targets: mixes up a time with a count
  - S5 false; targets: uses the discrete-time analogue
  - S6 false; targets: picks a bounded distribution; this would break the Markov property
  - S7 false; targets: thinks holding times are deterministic
  - Explanation: Memorylessness of the holding time is forced by the Markov property, and the only memoryless continuous law is the exponential.

**Q7.2**: intended TRUE = S3, S6.
  - S1 false; targets: confuses the generator with a transition matrix
  - S2 false; targets: swaps rows and columns
  - S4 false; targets: forgets that the diagonal is minus the exit rate
  - S5 false; targets: mixes up the diagonal with that of the identity
  - S7 false; targets: reverses the sign convention
  - Explanation: Off-diagonal $q_{ij}$ is the rate of jumping $i\to j$; the diagonal is $-q_i$, so rows sum to zero.

**Q7.3**: intended TRUE = S4, S5.
  - S1 false; targets: confuses rates with log-probabilities
  - S2 false; targets: multiplies by the exit rate instead of dividing
  - S3 false; targets: treats rates as probabilities, which can exceed 1
  - S6 false; targets: divides by the exit rate of the wrong state
  - S7 false; targets: ignores which state is the target
  - Explanation: When the clock rings from state $i$, the next state $j$ is chosen in proportion to the competing rates $q_{ij}$.

**Q7.4**: intended TRUE = S4, S5.
  - S1 false; targets: confuses the matrix exponential with its first-order term
  - S2 false; targets: inverts the generator, which is singular
  - S3 false; targets: keeps only the first-order term of the exponential series
  - S6 false; targets: invents a nonlinear equation
  - S7 false; targets: adds instead of multiplies
  - Explanation: Differentiating $e^{tQ}$ gives $Qe^{tQ}=e^{tQ}Q$. The linear approximation $I+tQ$ holds only for small $t$.

**Q7.5**: intended TRUE = S4, S5.
  - S1 false; targets: multiplies on the wrong side: constant vectors always satisfy this
  - S2 false; targets: uses the discrete-time equation
  - S3 false; targets: assumes faster states are visited more, but long holding times raise occupation
  - S6 false; targets: forgets that this ignores the time spent in each state
  - S7 false; targets: confuses the stationary probability with the exit rate
  - Explanation: $\pi$ is stationary when $\frac{d}{dt}\pi P(t)=\pi QP(t)=0$, i.e. $\pi Q=0$. The jump chain's stationary law must be reweighted by mean holding times $1/q_i$.

**Q7.6**: intended TRUE = S2, S7.
  - S1 false; targets: gives the mean holding time, which is not a fraction
  - S3 false; targets: uses a harmonic-style combination of the rates
  - S4 false; targets: inverts the correct ratio, giving a value above 1
  - S5 false; targets: assumes equal time in the two states
  - S6 false; targets: swaps the roles: a faster exit from 0 should mean less time in 0
  - Explanation: Balance: $\pi_0a=\pi_1b$ and $\pi_0+\pi_1=1$ give $\pi_0=b/(a+b)$.

**Q8.1**: intended TRUE = S1, S6.
  - S2 false; targets: describes a general continuous-time chain
  - S3 false; targets: describes a reset process, not a birth-death process
  - S4 false; targets: describes a pure birth process
  - S5 false; targets: allows batch arrivals or departures
  - S7 false; targets: restricts the jump structure to the boundary
  - Explanation: Neighbour-only jumps make the chain a skip-free path on the integers, which is why detailed balance can be solved one level at a time.

**Q8.2**: intended TRUE = S2, S6.
  - S1 false; targets: adds instead of multiplying
  - S3 false; targets: ignores the neighbouring levels and normalisation
  - S4 false; targets: uses the death rate of the wrong state
  - S5 false; targets: balances birth and death out of the same state
  - S7 false; targets: balances deaths against deaths
  - Explanation: Cutting the line between $n$ and $n+1$: the rate of crossing up is $\pi_n\lambda_n$, down is $\pi_{n+1}\mu_{n+1}$, and in equilibrium they match.

**Q8.3**: intended TRUE = S4, S7.
  - S1 false; targets: ignores the arrival rate
  - S2 false; targets: multiplies the rates instead of comparing them
  - S3 false; targets: thinks balance of the two rates is what makes it stable
  - S5 false; targets: allows equality, where the queue length is null recurrent and has no stationary law
  - S6 false; targets: reverses the inequality
  - Explanation: The normalising sum $\sum_n\rho^n$ converges exactly when $\rho<1$. At $\rho=1$ the queue is recurrent but with infinite mean return time.

**Q8.4**: intended TRUE = S3, S7.
  - S1 false; targets: invents a bounded uniform law
  - S2 false; targets: swaps the roles of $ho$ and $1-ho$
  - S4 false; targets: uses a continuous law for a count
  - S5 false; targets: forgets the factor $1-ho$, so the probabilities do not sum to 1
  - S6 false; targets: mixes up the M/M/1 queue length with the Poisson arrival counts
  - Explanation: Birth-death balance gives $\pi_n=\rho^n\pi_0$; normalisation $\sum_n\pi_n=1$ gives $\pi_0=1-\rho$.

**Q8.5**: intended TRUE = S4, S7.
  - S1 false; targets: swaps the roles of $L$ and $W$
  - S2 false; targets: adds instead of multiplying
  - S3 false; targets: thinks the law needs exponential service
  - S5 false; targets: inverts the relation
  - S6 false; targets: squares the arrival rate
  - Explanation: Little's law needs only stability and long-run averages, no distributional assumptions. In M/M/1: $L=\rho/(1-\rho)$ and $W=1/(\mu-\lambda)$, and indeed $L=\lambda W$.

**Q8.6**: intended TRUE = S2, S7.
  - S1 false; targets: multiplies the arrival rate by the number of servers
  - S3 false; targets: scrambles the three parameters
  - S4 false; targets: ignores the extra servers
  - S5 false; targets: divides capacity by the number of servers
  - S6 false; targets: adds the number of servers to a rate
  - Explanation: When all $c$ servers are busy, the departure rate is $c\mu$; the queue is stable when the arrival rate is smaller than this maximum departure rate.

**Q9.1**: intended TRUE = S3, S6.
  - S1 false; targets: thinks a particular distribution is required
  - S2 false; targets: drops the identical distribution requirement
  - S4 false; targets: confuses a renewal process with its Poisson special case
  - S5 false; targets: drops independence
  - S7 false; targets: treats the process as deterministic
  - Explanation: Renewal processes generalise the Poisson process by allowing any i.i.d. gap distribution. They are Markov only for exponential gaps.

**Q9.2**: intended TRUE = S4, S7.
  - S1 false; targets: squares the correct rate
  - S2 false; targets: uses the mean gap in place of the rate
  - S3 false; targets: squares the mean
  - S5 false; targets: confuses finite mean with infinite mean
  - S6 false; targets: brings in the variance, which does not affect the long-run rate
  - Explanation: If gaps average $\mu$ time units, renewals arrive at rate $1/\mu$ per unit time in the long run (strong law for renewal processes).

**Q9.3**: intended TRUE = S4, S6.
  - S1 false; targets: multiplies instead of dividing
  - S2 false; targets: ignores cycle length, so long cycles are not penalised
  - S3 false; targets: inverts the ratio
  - S5 false; targets: averages the ratio instead of taking the ratio of averages
  - S7 false; targets: uses the variance instead of the mean cycle length
  - Explanation: Over $n$ cycles total reward $\approx nE[R]$ and total time $\approx nE[T]$, so the rate is $E[R]/E[T]$, which differs from $E[R/T]$ in general.

**Q9.4**: intended TRUE = S1, S2.
  - S3 false; targets: invents a constant factor
  - S4 false; targets: ignores that choosing the interval by a time point is a biased selection
  - S5 false; targets: generalises the exponential case, where the mean is about doubled
  - S6 false; targets: applies a Poisson-specific constant
  - S7 false; targets: gets the direction of the bias wrong
  - Explanation: A fixed time $t$ falls in a long gap with probability proportional to its length. This is the inspection paradox.

**Q9.5**: intended TRUE = S1, S3.
  - S2 false; targets: thinks a smooth density is enough
  - S4 false; targets: picks a bounded distribution, which remembers elapsed time
  - S5 false; targets: confuses determinism with the Markov property
  - S6 false; targets: thinks renewals reset the memory, so all renewal processes are Markov
  - S7 false; targets: confuses a moment condition with memorylessness
  - Explanation: $N(t)$ alone forgets how long ago the last renewal was; the future depends on that elapsed time unless the gap is memoryless, i.e. exponential.

**Q10.1**: intended TRUE = S1, S3.
  - S2 false; targets: inverts the exponent
  - S4 false; targets: invents a factorial
  - S5 false; targets: counts parents as well as children in each generation
  - S6 false; targets: divides by the generation number
  - S7 false; targets: grows linearly instead of geometrically
  - Explanation: $E[Z_{n+1}\mid Z_n]=mZ_n$, so $E[Z_{n+1}]=mE[Z_n]$ and $E[Z_n]=m^n$.

**Q10.2**: intended TRUE = S5, S6.
  - S1 false; targets: forgets that the critical case $m=1$ also dies out
  - S2 false; targets: reverses the inequality and also drops the critical case
  - S3 false; targets: replaces the mean by one probability, which is neither necessary nor sufficient
  - S4 false; targets: uses a wrong threshold
  - S7 false; targets: reverses the inequality
  - Explanation: If $m\le1$ the smallest root of $G(s)=s$ is 1; if $m>1$ it is strictly below 1.

**Q10.3**: intended TRUE = S4, S7.
  - S1 false; targets: solves the wrong equation
  - S2 false; targets: confuses the extinction probability with the survival probability after one generation
  - S3 false; targets: picks the root $s=1$, which always solves the equation
  - S5 false; targets: mixes up the criticality condition with the fixed-point equation
  - S6 false; targets: evaluates the pgf at 1, which is always 1
  - Explanation: $\eta=\sum_k p_k\eta^k=G(\eta)$ by conditioning on the first generation; $s=1$ is always a root, and $\eta$ is the smallest one.

**Q10.4**: intended TRUE = S1, S7.
  - S2 false; targets: guesses a formula that holds only for special offspring laws
  - S3 false; targets: invents a formula that can exceed 1
  - S4 false; targets: ignores that survival means unbounded growth
  - S5 false; targets: confuses the mean with the random size
  - S6 false; targets: applies the subcritical or critical conclusion
  - Explanation: Supercritical: $G(s)=s$ has a root $\eta<1$. Only the mean $E[Z_n]=m^n$ is deterministic; the actual $Z_n$ is random and can be 0.

**Q10.5**: intended TRUE = S1, S4.
  - S2 false; targets: rescales the argument instead of composing
  - S3 false; targets: adds the pgf to itself
  - S5 false; targets: differentiates instead of composing
  - S6 false; targets: squares instead of composing
  - S7 false; targets: doubles the pgf
  - Explanation: Each generation-1 individual has an independent $G$-distributed number of children, so the pgf of the total is $G_1(G(s))=G(G(s))$.

**Q11.1**: intended TRUE = S2, S5.
  - S1 false; targets: thinks independent increments are enough, but a mean-zero condition is also needed
  - S3 false; targets: describes a non-decreasing process, not a martingale
  - S4 false; targets: replaces the current value by its average
  - S6 false; targets: mixes up a martingale with a mean-zero process
  - S7 false; targets: confuses the martingale property with constant variance
  - Explanation: Martingale means a fair game: conditionally on what has happened, the expected next value is the current value.

**Q11.2**: intended TRUE = S4, S7.
  - S1 false; targets: makes the mean grow with time
  - S2 false; targets: describes a submartingale
  - S3 false; targets: assumes the martingale starts at zero
  - S5 false; targets: describes a supermartingale
  - S6 false; targets: ignores the integrability condition
  - Explanation: Taking expectations of $E[M_{n+1}\mid\mathcal F_n]=M_n$ gives $E[M_{n+1}]=E[M_n]$ (tower property).

**Q11.3**: intended TRUE = S1, S4.
  - S2 false; targets: forgets that the square grows on average (submartingale)
  - S3 false; targets: gets the sign of the compensator wrong
  - S5 false; targets: thinks absolute value preserves the fair-game property (it is a submartingale)
  - S6 false; targets: subtracts $n^2$ instead of $n$
  - S7 false; targets: assumes any odd power is a martingale
  - Explanation: $E[S_{n+1}^2\mid S_n]=S_n^2+1$, so $S_n^2-n$ is a martingale. $E[S_{n+1}^3\mid S_n]=S_n^3+3S_n$, so $S_n^3$ is not.

**Q11.4**: intended TRUE = S2, S4.
  - S1 false; targets: forgets the doubling strategy: finite stopping time but $E[M_T]
e E[M_0]$
  - S3 false; targets: confuses the condition for being a martingale with conditions for stopping
  - S5 false; targets: uses future information, so $T$ is not a stopping time
  - S6 false; targets: forgets that $T$ must be decided using only information available so far
  - S7 false; targets: thinks positivity alone is enough, though stopping can still lose mass
  - Explanation: A bounded stopping time is the simplest sufficient condition. For unbounded $T$ one needs extra conditions such as bounded increments with $E[T]<\infty$, or uniform integrability.

**Q11.5**: intended TRUE = S1, S4.
  - S2 false; targets: ignores that the walk can also hit $0$
  - S3 false; targets: treats $S_n^2$ as a martingale, but its compensator is $S_n^2-n$
  - S5 false; targets: claims a false bound on $T$; the stopped martingale is bounded instead
  - S6 false; targets: applies symmetry while ignoring the starting point
  - S7 false; targets: misclassifies the fair walk
  - Explanation: $T$ is not bounded, but the stopped walk $S_{n\wedge T}$ stays in $[0,N]$, so optional stopping applies. Then $i=E[S_T]=N\,P(S_T=N)$.

## Part B key

**LQ1**
- (a) answer = 0.07. Working: Two-step probability = entry (4,4) of $P^2$, i.e. $\sum_k p_{4k}p_{k4}$ = 0.07.
- (b) answer = 3. Working: Classes are the sets of states that can reach each other. Here $2$ is absorbing (its own class) and $\{1,5\}$ is a closed class; states $4$ and $3$ form one class (they reach each other). Total: 3.
- (c) answer = 1. Working: State 1 has a self-loop ($p_{11}>0$), so a return in 1 step is possible and the gcd is 1.
- (d) answer = 0.54545455. Working: First-step analysis on the transient states $4$, $3$: $h_i=\sum_j p_{ij}h_j$ with $h_{2}=1$ and $h=0$ on the closed class $\{1,5\}$. Solving the 2x2 system gives 0.545455.
- (e) answer = 1.6666667. Working: $k_i=1+\sum_{j\in\{4,3\}}p_{ij}k_j$ for $i\in\{4,3\}$. Solving gives 1.666667.
- (f) answer = 0.5. Working: The chain stays in the closed class $\{1,5\}$. Balance gives $\pi_{1}p_{15}=\pi_{5}p_{51}$, so $\pi_{1}=p_{51}/(p_{15}+p_{51})$ = 0.5.

**LQ2**
- (a) answer = 0.4. Working: Two-step probability = entry (2,5) of $P^2$, i.e. $\sum_k p_{2k}p_{k5}$ = 0.4.
- (b) answer = 3. Working: Classes are the sets of states that can reach each other. Here $5$ is absorbing (its own class) and $\{4,3\}$ is a closed class; states $2$ and $1$ form one class (they reach each other). Total: 3.
- (c) answer = 1. Working: State 4 has a self-loop ($p_{44}>0$), so a return in 1 step is possible and the gcd is 1.
- (d) answer = 0.45588235. Working: First-step analysis on the transient states $2$, $1$: $h_i=\sum_j p_{ij}h_j$ with $h_{5}=1$ and $h=0$ on the closed class $\{4,3\}$. Solving the 2x2 system gives 0.455882.
- (e) answer = 1.6176471. Working: $k_i=1+\sum_{j\in\{2,1\}}p_{ij}k_j$ for $i\in\{2,1\}$. Solving gives 1.617647.
- (f) answer = 0.2. Working: The chain stays in the closed class $\{4,3\}$. Balance gives $\pi_{4}p_{43}=\pi_{3}p_{34}$, so $\pi_{4}=p_{34}/(p_{43}+p_{34})$ = 0.2.

**LQ3**
- (a) answer = 0.5. Working: Fair walk: $P=i/N=5/10$ = 0.5.
- (b) answer = 25. Working: $E[T]=i(N-i)=5\cdot5$ = 25.
- (c) answer = 0.77142857. Working: With $r=q/p=0.666667$: $P=\dfrac{1-r^{i}}{1-r^{N}}=\dfrac{1-r^{3}}{1-r^{6}}$ = 0.771429.
- (d) answer = 0.2962963. Working: $M$ is a martingale and the stopped process is bounded, so $E[M_T]=E[M_0]=r^{3}=0.666667^{3}$ = 0.296296. (Writing $E[M_T]=P(\text{ruin})+r^{N}P(\text{target})$ recovers the formula from the previous part.)
- (e) answer = 8.1428571. Working: $E[T]=\dfrac{i}{q-p}-\dfrac{N}{q-p}\cdot\dfrac{1-r^{i}}{1-r^{N}}$ with $q-p=-0.2$ gives 8.142857.

**LQ4**
- (a) answer = 0.46666667. Working: Fair walk: $P=i/N=7/15$ = 0.466667.
- (b) answer = 56. Working: $E[T]=i(N-i)=7\cdot8$ = 56.
- (c) answer = 0.22857143. Working: With $r=q/p=1.5$: $P=\dfrac{1-r^{i}}{1-r^{N}}=\dfrac{1-r^{3}}{1-r^{6}}$ = 0.228571.
- (d) answer = 3.375. Working: $M$ is a martingale and the stopped process is bounded, so $E[M_T]=E[M_0]=r^{3}=1.5^{3}$ = 3.375. (Writing $E[M_T]=P(\text{ruin})+r^{N}P(\text{target})$ recovers the formula from the previous part.)
- (e) answer = 8.1428571. Working: $E[T]=\dfrac{i}{q-p}-\dfrac{N}{q-p}\cdot\dfrac{1-r^{i}}{1-r^{N}}$ with $q-p=0.2$ gives 8.142857.

**LQ5**
- (a) answer = 0.17546737. Working: $N(t)\sim\mathrm{Poisson}(\lambda t)$ with mean $5$: $e^{-5}5^{5}/5!$ = 0.175467.
- (b) answer = 0.14285714. Working: The merged process has rate $1+6$, and each arrival independently comes from source 1 with probability $\lambda_1/(\lambda_1+\lambda_2)=1/7$ = 0.142857.
- (c) answer = 0.13533528. Working: Buyers form a thinned Poisson process with rate $0.4\cdot5=2$. $P(\text{none})=e^{-2\cdot1}$ = 0.135335.
- (d) answer = 0.14285714. Working: Mean life $\mu=(3+11)/2=7$. By the renewal theorem, replacements per day $\to1/\mu$ = 0.142857.
- (e) answer = 7.7142857. Working: Renewal reward theorem: $E[R]/E[T]$ with $E[R]=19+5\cdot7=54$ and $E[T]=7$, giving 7.714286 dollars per day.

**LQ6**
- (a) answer = 0.17082686. Working: $N(t)\sim\mathrm{Poisson}(\lambda t)$ with mean $4.5$: $e^{-4.5}4.5^{5}/5!$ = 0.170827.
- (b) answer = 0.42857143. Working: The merged process has rate $3+4$, and each arrival independently comes from source 1 with probability $\lambda_1/(\lambda_1+\lambda_2)=3/7$ = 0.428571.
- (c) answer = 0.40656966. Working: Buyers form a thinned Poisson process with rate $0.6\cdot3=1.8$. $P(\text{none})=e^{-1.8\cdot0.5}$ = 0.40657.
- (d) answer = 0.22222222. Working: Mean life $\mu=(2+7)/2=4.5$. By the renewal theorem, replacements per day $\to1/\mu$ = 0.222222.
- (e) answer = 2.5555556. Working: Renewal reward theorem: $E[R]/E[T]$ with $E[R]=7+1\cdot4.5=11.5$ and $E[T]=4.5$, giving 2.555556 dollars per day.

**LQ7**
- (a) answer = 0.75. Working: Jump chain: $q_{32}/q_{3}=3/4$ = 0.75.
- (b) answer = 0.33333333. Working: Solve $\pi Q=0$ with $\sum\pi_i=1$: $\pi=(0.333333,0.333333,0.333333)$, so $\pi_{1}=0.333333$.
- (c) answer = 4. Working: $\rho=\lambda/\mu=0.8$, and $\pi_n=(1-\rho)\rho^n$ gives $L=\rho/(1-\rho)$ = 4.
- (d) answer = 0.5. Working: Little's law $L=\lambda W$: $W=L/\lambda=4/8$ = 0.5 (also $1/(\mu-\lambda)$).
- (e) answer = 0.512. Working: $P(N\ge k)=\sum_{n\ge k}(1-\rho)\rho^n=\rho^{k}=0.8^{3}$ = 0.512.

**LQ8**
- (a) answer = 0.33333333. Working: Jump chain: $q_{12}/q_{1}=1/3$ = 0.333333.
- (b) answer = 0.2. Working: Solve $\pi Q=0$ with $\sum\pi_i=1$: $\pi=(0.4,0.2,0.4)$, so $\pi_{2}=0.2$.
- (c) answer = 3. Working: $\rho=\lambda/\mu=0.75$, and $\pi_n=(1-\rho)\rho^n$ gives $L=\rho/(1-\rho)$ = 3.
- (d) answer = 0.5. Working: Little's law $L=\lambda W$: $W=L/\lambda=3/6$ = 0.5 (also $1/(\mu-\lambda)$).
- (e) answer = 0.31640625. Working: $P(N\ge k)=\sum_{n\ge k}(1-\rho)\rho^n=\rho^{k}=0.75^{4}$ = 0.316406.

**LQ9**
- (a) answer = 1.3. Working: $m=0\cdot0.3+1\cdot0.1+2\cdot0.6$ = 1.3.
- (b) answer = 2.197. Working: $E[Z_n]=m^n$, so $1.3^3$ = 2.197.
- (c) answer = 0.384. Working: $P(Z_2=0)=G(G(0))$ with $G(s)=0.3+0.1s+0.6s^2$ and $G(0)=0.3$: 0.384.
- (d) answer = 0.5. Working: Solve $s=G(s)$, i.e. $0.6s^2-0.9s+0.3=0$. The roots are $1$ and $0.5$ (that is $p_0/p_2$); the extinction probability is the smaller one, capped at 1: 0.5.
- (e) answer = 0.76923077. Working: Martingale: $E[W_3\mid Z_1]=W_1=Z_1/m=1/1.3$ = 0.769231.

**LQ10**
- (a) answer = 0.3. Working: $m=0\cdot0.8+1\cdot0.1+2\cdot0.1$ = 0.3.
- (b) answer = 0.027. Working: $E[Z_n]=m^n$, so $0.3^3$ = 0.027.
- (c) answer = 0.944. Working: $P(Z_2=0)=G(G(0))$ with $G(s)=0.8+0.1s+0.1s^2$ and $G(0)=0.8$: 0.944.
- (d) answer = 1. Working: Solve $s=G(s)$, i.e. $0.1s^2-0.9s+0.8=0$. The roots are $1$ and $8$ (that is $p_0/p_2$); the extinction probability is the smaller one, capped at 1: 1 (here $m\le1$, so extinction is certain).
- (e) answer = 10. Working: Martingale: $E[W_3\mid Z_1]=W_1=Z_1/m=3/0.3$ = 10.
