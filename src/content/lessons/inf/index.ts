// Lessons for Statistical Inference, following the HKU STAT3602 lecture notes (lectures 1-7), then the outline topics the notes have not
// reached yet (lectures 8-11). A lecture that merges two sections of the notes has one lesson part and one worked sample per section; its quiz
// draws its long question from one of them.
import type { Lesson } from '../../../lib/types'

const lessons: Lesson[] = [
  {
    // 1. The decision problem, admissibility and minimax rules
    samples: [{"workedSeed":"inf-1-worked","lqId":"inf-lq-u-decision"}],
    teach: [
      "## The story the whole lecture is built on",
      "A machine is either in a good state $\\theta_1$ or a bad state $\\theta_2$, and you do not know which. You may run one cheap test whose outcome $X\\in\\{0,1\\}$ is more likely to be $1$ when the machine is bad. After seeing $X$ you must take one of several actions (keep it running, service it, replace it), and the cost of an action depends on the true state. The question of the lecture is: which rule for turning $X$ into an action is good, and how do we compare rules when their costs depend on the unknown state?",
      "## The ingredients",
      "Every decision problem has the same six ingredients: a parameter space $\\Theta$ (the possible states $\\theta$); a sample space $S$ (the possible outcomes $x$ of the data); a statistical model $f(x\\mid\\theta)$ linking them, here the table of $P(X=x\\mid\\theta)$; an action space $A$; a loss function $L(\\theta,a)\\ge0$, the cost of taking action $a$ when $\\theta$ is true; and decision rules $d:S\\to A$, one action for each possible outcome.",
      "A rule is written $d=(d(0),d(1))$ for a binary outcome. Because each outcome can be sent to any action there are $|A|^{|S|}$ non-randomised rules: with two outcomes and three actions, $3^2=9$ rules, among them the constant rules that ignore the data.",
      "## Risk: the cost of a rule at each state",
      "The loss depends on the random outcome, so a rule is judged by its expected loss when the data come from $\\theta$, the risk function",
      "$$R(\\theta,d)=E_\\theta L\\big(\\theta,d(X)\\big)=\\sum_xL\\big(\\theta,d(x)\\big)f(x\\mid\\theta).$$",
      "For a binary outcome $R(\\theta,d)=L(\\theta,d(0))\\,P(X=0\\mid\\theta)+L(\\theta,d(1))\\,P(X=1\\mid\\theta)$. Each rule therefore has two risks, one per state, written as a risk pair $(R(\\theta_1,d),R(\\theta_2,d))$. For an estimator under squared error loss the risk splits as $R(\\theta,\\delta)=\\mathrm{Var}_\\theta(\\delta)+\\{\\mathrm{bias}_\\theta(\\delta)\\}^2$.",
      "## Comparing rules: dominance and admissibility",
      "Rule $d$ strictly dominates $d'$ if $R(\\theta,d)\\le R(\\theta,d')$ at every state and $R(\\theta,d)<R(\\theta,d')$ at at least one. Choosing $d'$ is then obviously foolish, and $d'$ is called inadmissible. A rule that is not strictly dominated is admissible. Admissibility is only a weak filter: a constant rule can be admissible, and many admissible rules still do badly at the state that actually occurs.",
      "## Minimax: guarding against the worst state",
      "Two admissible rules usually cross: one is better in the good state and the other in the bad state. The minimax criterion compares rules by their worst case, $\\max_\\theta R(\\theta,d)$, and picks the rule with the smallest worst case; that smallest value is the minimax risk. It protects against the worst state even if that state is unlikely, so it can be pessimistic.",
      "## How to work the whole problem",
      "1. Count the rules: $|A|^{|S|}$.",
      "2. For a given rule read off, for each outcome, the loss of the action it takes in each state.",
      "3. Weight those losses by the outcome probabilities of that state and add: the two risks of the rule.",
      "4. Repeat for every rule you must compare, to get a list of risk pairs.",
      "5. Dominance: look for a rule whose two risks are both no larger than another's, and smaller in at least one. The other rule is inadmissible.",
      "6. Minimax: for each rule take the larger of its two risks, then choose the rule with the smallest of these maxima.",
      "## A continuous example to remember",
      "Let $\\bar X\\sim N(\\theta,v)$ and consider the shrinkage rules $\\delta_a=a\\bar X$. Then $R(\\theta,\\delta_a)=a^2v+(1-a)^2\\theta^2$ while $R(\\theta,\\bar X)=v$, so $\\delta_a$ beats $\\bar X$ exactly when $\\theta^2<v(1+a)/(1-a)$ for $0<a<1$: shrinkage helps when $\\theta$ is small and hurts when it is large, so neither dominates the other.",
      "## Typical mistakes",
      "Weighting the losses by the probabilities of the wrong state; counting rules as $|S||A|$ instead of $|A|^{|S|}$; declaring dominance after comparing the risks at only one state; and confusing the loss (one outcome) with the risk (an average over the outcomes)."
    ],
  },
  {
    // 2. Unbiased and Bayes rules, randomised rules and the risk set
    samples: [{"workedSeed":"inf-2-worked","lqId":"inf-lq-v-bayesrisk"}],
    teach: [
      "## The story the whole lecture is built on",
      "The machine of lecture 1 is good ($\\theta_1$) or bad ($\\theta_2$), and one test result $X\\in\\{0,1\\}$ is available. This time you also hold a prior belief: the machine is good with probability $\\pi(\\theta_1)$. Replacing a good machine costs $a$ and keeping a bad one costs $b$. Two rules often cross, one better at $\\theta_1$ and the other at $\\theta_2$. The lecture shows three ways to choose among them: average the risk with the prior (Bayes), take the best worst case (minimax, helped by randomising), or require the rule to be unbiased.",
      "## Bayes risk and the Bayes rule",
      "With a prior $\\pi$ the risk function $R(\\theta,d)$ is reduced to one number, the Bayes risk $$r(\\pi,d)=\\sum_\\theta\\pi(\\theta)R(\\theta,d).$$ The Bayes rule is the rule with the smallest Bayes risk. Different priors give different Bayes rules.",
      "## Finding the Bayes rule one outcome at a time",
      "Swapping the order of summation gives $r(\\pi,d)=\\sum_x\\sum_\\theta L(\\theta,d(x))\\,\\pi(\\theta)f(x\\mid\\theta)$, so each $x$ can be treated separately. First get the posterior $\\pi(\\theta\\mid x)=\\pi(\\theta)f(x\\mid\\theta)/\\sum_{\\theta'}\\pi(\\theta')f(x\\mid\\theta')$. Then the Bayes rule takes at each $x$ the action with the smallest posterior expected loss $\\sum_\\theta L(\\theta,a)\\pi(\\theta\\mid x)$. The Bayes risk of that rule is $\\sum_xP(X=x)\\times(\\text{smallest posterior expected loss at }x)$.",
      "## Randomised rules and the risk set",
      "A randomised rule uses rule $d_i$ with probability $p_i$. Its risk is the mixture $R(\\theta,d)=\\sum_ip_iR(\\theta,d_i)$ at every $\\theta$. With two states the risk set is the set of points $(R(\\theta_1,d),R(\\theta_2,d))$ over all rules; it is convex because a mixture of two rules has the mixture of their risk points. Admissible rules lie on its lower-left boundary.",
      "Mixing two rules whose risks cross can lower the worst case. If rule $A$ has risks $(A_1,A_2)$ and rule $C$ has $(C_1,C_2)$, then using $A$ with probability $q$ gives risks $qA_i+(1-q)C_i$. Solving $qA_1+(1-q)C_1=qA_2+(1-q)C_2$ gives the equalising probability $q^*$, and the common value there is the largest risk of this mixture. A minimax rule is found by pushing the risk point down until the larger of its two coordinates is as small as possible, which on the lower boundary happens where the two coordinates are equal (or at a vertex).",
      "## Unbiased rules",
      "A rule $d$ is unbiased if $E_{\\theta'}L(\\theta,d(X))\\ge R(\\theta,d)$ for all $\\theta,\\theta'$: the loss measured against the true $\\theta$ is smallest when the data actually come from $\\theta$. For squared error loss this is the usual unbiasedness of an estimator. Unbiasedness is a restriction on the class of rules, not a way of comparing them; it can be combined with a risk criterion.",
      "## How to work the whole problem",
      "1. Posterior: $P(\\theta_1\\mid x)=\\pi(\\theta_1)f(x\\mid\\theta_1)/\\{\\pi(\\theta_1)f(x\\mid\\theta_1)+\\pi(\\theta_2)f(x\\mid\\theta_2)\\}$.",
      "2. For each action compute the posterior expected loss and take the smaller: that is the Bayes action at $x$.",
      "3. Risks of a rule: weight its losses by the probabilities of $x$ under each state. Bayes risk: weight the two risks by the prior.",
      "4. Smallest Bayes risk: compare the Bayes risks of all rules, or add up $P(x)\\times$ smallest posterior expected loss over $x$.",
      "5. Randomised rule: its risk at each state is the mixture; set the two mixture risks equal to find $q^*$ and read off the common value.",
      "## Typical mistakes",
      "Using prior probabilities where the posterior is needed; forgetting to normalise the posterior; averaging the risks with the wrong weights (the prior weights go on the states, not on the outcomes); and mixing the risk points with $q$ in one coordinate and $1-q$ in the other."
    ],
  },
  {
    // 3. The Bayesian approach: prior to posterior, estimation and testing
    samples: [{"workedSeed":"inf-3-worked","lqId":"inf-lq-lec3"}],
    teach: [
      "## The story the whole lecture is built on",
      "A coin has an unknown probability $\\theta$ of heads. You start with a prior belief $\\pi(\\theta)$, toss the coin $n$ times, and update the belief into a posterior. From the posterior you read off an estimate of $\\theta$ and a decision about a hypothesis, both of which come from minimising the posterior expected loss.",
      "## From prior to posterior",
      "The posterior is $\\pi(\\theta\\mid x)=\\dfrac{\\pi(\\theta)f(x\\mid\\theta)}{\\int\\pi(\\theta')f(x\\mid\\theta')d\\theta'}\\propto\\pi(\\theta)f(x\\mid\\theta)$. A prior is conjugate if the posterior stays in the same family. For $k$ successes in $n$ Bernoulli trials and a $\\mathrm{Beta}(a,b)$ prior, the posterior is $\\mathrm{Beta}(a+k,\\ b+n-k)$; for a flat improper prior $\\pi(\\theta)\\propto1$ and normal data with known variance the posterior is normal centred at the sample mean. The Bayesian decision at the observed $x$ is the action minimising the posterior expected loss $\\int L(\\theta,a)\\pi(\\theta\\mid x)d\\theta$, and this gives the Bayes rule.",
      "## Bayesian estimation",
      "Under squared error loss the Bayes estimate is the posterior mean; under absolute error loss it is the posterior median. For a $\\mathrm{Beta}(A,B)$ posterior the mean is $A/(A+B)$ and the variance is $AB/\\{(A+B)^2(A+B+1)\\}$. For a nonlinear function of $\\theta$ the Bayes estimate is the posterior mean of that function: the posterior mean of the odds $\\theta/(1-\\theta)$ is $A/(B-1)$ (for $B>1$), which differs from the odds of the posterior mean.",
      "## Bayesian testing",
      "To test $H_0:\\theta\\in\\Theta_0$ against $H_1$, compute $P(H_0\\mid x)$ from the posterior. For integer Beta shapes, $P(\\mathrm{Beta}(A,B)\\le\\tfrac12)=P(\\mathrm{Bin}(A+B-1,\\tfrac12)\\ge A)$. With loss $L_0$ for wrongly rejecting $H_0$ and $L_1$ for wrongly accepting it, reject $H_0$ when its posterior expected loss of rejecting is smaller: $L_0P(H_0\\mid x)<L_1P(H_1\\mid x)$, that is $P(H_0\\mid x)<L_1/(L_0+L_1)$. The posterior odds $P(H_0\\mid x)/P(H_1\\mid x)$ compare the two hypotheses directly.",
      "## How to work the whole problem",
      "1. Posterior: add $k$ to the first Beta parameter and $n-k$ to the second.",
      "2. Mean $A/(A+B)$ and variance $AB/\\{(A+B)^2(A+B+1)\\}$.",
      "3. $P(H_0\\mid x)$: binomial tail with $A+B-1$ trials at $\\tfrac12$.",
      "4. Posterior odds: $P/(1-P)$; posterior mean of the odds: $A/(B-1)$.",
      "5. Bayes test threshold: $c=L_1/(L_0+L_1)$; reject when $P(H_0\\mid x)<c$.",
      "## Typical mistakes",
      "Adding $n$ instead of $n-k$ to the second Beta parameter; reporting the odds of the posterior mean as the posterior mean of the odds; swapping $L_0$ and $L_1$ in the threshold; and treating the prior parameters as extra data without noticing that they change the answer."
    ],
  },
  {
    // 4. Bayesian intervals, prediction and nuisance parameters
    samples: [{"workedSeed":"inf-4-worked","lqId":"inf-lq-lec4"}],
    teach: [
      "## The story the whole lecture is built on",
      "After seeing the data you hold a joint posterior for a parameter of interest $\\theta$ and a nuisance parameter $\\phi$ that you must estimate but do not care about. The lecture shows how to get posterior statements about $\\theta$ alone, how to build a credible set, and how to predict a future observation, all from the joint posterior.",
      "## Nuisance parameters",
      "In the Bayesian approach a nuisance parameter is simply integrated (or summed) out: the marginal posterior of $\\phi$ is $\\pi(\\phi\\mid x)=\\sum_\\theta\\pi(\\theta,\\phi\\mid x)$. No special device is needed, unlike the frequentist approaches (conditioning, profiling) the later lectures will discuss. A conditional posterior such as $\\pi(\\phi\\mid\\theta,x)=\\pi(\\theta,\\phi\\mid x)/\\pi(\\theta\\mid x)$ answers questions given a fixed value of the other parameter.",
      "## Credible sets",
      "A $1-\\alpha$ credible set $C$ has posterior probability $P(\\phi\\in C\\mid x)\\ge1-\\alpha$. It is a probability statement about the parameter given the data, unlike a confidence interval. Among sets with this probability the shortest (smallest) one is the highest posterior density set, built by adding the values with the largest posterior probability (or density) until the total reaches $1-\\alpha$. For a unimodal continuous posterior this is an interval whose endpoints have equal density.",
      "## Posterior predictive distribution",
      "To predict a future observation $Y$ whose distribution depends on $\\theta$, average its distribution over the posterior: $P(Y=y\\mid x)=\\sum_\\theta P(Y=y\\mid\\theta)\\pi(\\theta\\mid x)$. For a success with probability $\\theta$, $P(\\text{success}\\mid x)=E[\\theta\\mid x]$. The predictive distribution is wider than the distribution at the posterior mean because it includes the uncertainty about $\\theta$. The Bernstein-von Mises theorem says that in regular models the posterior is approximately normal around the MLE for large $n$, so credible and confidence intervals nearly agree.",
      "## How to work the whole problem",
      "1. Marginals: add the table over the other parameter.",
      "2. Credible set: sort the marginal probabilities, add from the largest down until the total reaches the target; count the values used.",
      "3. Posterior mean: $\\sum$ value $\\times$ marginal probability.",
      "4. Conditional: the cell divided by the marginal of the conditioning value.",
      "5. Predictive: average the success probability $\\theta$ over its marginal posterior.",
      "## Typical mistakes",
      "Reading a joint cell as a marginal; building the credible set by adding the values in numerical order instead of by probability; conditioning on the wrong parameter; and using the posterior mean of $\\theta$ in place of the full average over its posterior when the prediction is nonlinear in $\\theta$."
    ],
  },
  {
    // 5. Exponential families and their natural statistic
    samples: [{"workedSeed":"inf-5-worked","lqId":"inf-lq-lec5"}],
    teach: [
      "## The story the whole lecture is built on",
      "A shop's daily customer counts are Poisson, with one rate on ordinary days and another on sale days. Writing the Poisson density in a special form reveals a statistic (the total) that carries all the information about the rate, whose mean and variance come from one function, and which turns a comparison of two rates into a binomial problem.",
      "## Exponential families",
      "A family $\\{f(x\\mid\\theta)\\}$ is a (one-parameter) exponential family if $f(x\\mid\\theta)=h(x)\\exp\\{\\eta(\\theta)T(x)-A(\\theta)\\}$ with the support not depending on $\\theta$. $T$ is the natural statistic and $\\eta$ the natural parameter. Poisson($\\lambda$): $\\frac1{x!}\\exp\\{x\\ln\\lambda-\\lambda\\}$, so $T=x$, $\\eta=\\ln\\lambda$. Normal $N(\\mu,\\sigma^2)$: $T=(x^2,x)$ and $\\eta=(-1/(2\\sigma^2),\\mu/\\sigma^2)$. The uniform $U(0,\\theta)$ and the Cauchy family are not exponential families (the support depends on $\\theta$; the Cauchy density cannot be written in this form).",
      "## Moments of the natural statistic",
      "For an i.i.d. sample of size $n$ the natural statistic is $T=\\sum T(x_i)$ and its log partition function is $A_n(\\eta)=nA(\\eta)$. Then $E[T]=A_n'(\\eta)$ and $\\mathrm{Var}(T)=A_n''(\\eta)$. For Poisson, $A_n(\\eta)=ne^\\eta$, so $E[T]=\\mathrm{Var}(T)=n\\lambda$. In a full-rank family $T$ is sufficient and complete.",
      "## Conditional laws",
      "Conditional on part of the natural statistic, the rest has an exponential-family law that no longer involves the nuisance parameter. For independent Poisson totals $S\\sim\\mathrm{Poisson}(\\mu_1)$ and $U\\sim\\mathrm{Poisson}(\\mu_2)$, $S\\mid S+U=t$ is $\\mathrm{Bin}(t,\\mu_1/(\\mu_1+\\mu_2))$. This lets us test whether two Poisson rates are equal using an exact binomial test.",
      "## How to work the whole problem",
      "1. The natural statistic of the sample is the total of the counts.",
      "2. The natural parameter is $\\ln\\lambda$.",
      "3. $E[T]=n\\lambda$ from $A_n'(\\eta)=ne^\\eta$ (and the variance is the same).",
      "4. The binomial success probability is $p=\\mu_1/(\\mu_1+\\mu_2)$ with $\\mu_1=n\\lambda_1$ and $\\mu_2=n_2\\lambda_2$.",
      "5. $P(S=k\\mid S+U=t)=\\binom tkp^k(1-p)^{t-k}$.",
      "## Typical mistakes",
      "Using the rate $\\lambda$ instead of the natural parameter $\\ln\\lambda$; forgetting the sample size in $A_n(\\eta)$; building $p$ from the rates per day instead of from the totals' means; and calling a family exponential when its support depends on the parameter."
    ],
  },
  {
    // 6. Sufficiency, minimal sufficiency and the likelihood principle
    samples: [{"workedSeed":"inf-6-worked","lqId":"inf-lq-lec6"}],
    teach: [
      "## The story the whole lecture is built on",
      "A machine produces good or bad parts and you inspect $n$ of them. The raw record is a long sequence of results, but the total number of good parts seems to be all that matters about the success probability $\\theta$. The lecture makes this precise: what it means to keep all the information about $\\theta$ in a summary, how small a summary can be, and whether the way the experiment was stopped changes the evidence.",
      "## Sufficiency",
      "A statistic $T(X)$ is sufficient for $\\theta$ if the conditional distribution of the data given $T$ does not depend on $\\theta$. Equivalent criterion (Fisher-Neyman factorisation): $f(x\\mid\\theta)=g(T(x),\\theta)\\,h(x)$. For Bernoulli trials, given $T=\\sum X_i=k$ all $\\binom nk$ arrangements of the results are equally likely whatever $\\theta$ is, so the total is sufficient and the order of the results is irrelevant. The full sample is always sufficient but useless as a summary.",
      "## Minimal sufficiency and ancillarity",
      "A sufficient statistic is minimal if it is a function of every other sufficient statistic; it is characterised by $x$ and $y$ having the same value of $T$ exactly when $f(x\\mid\\theta)/f(y\\mid\\theta)$ does not depend on $\\theta$. A statistic whose distribution does not depend on $\\theta$ is ancillary; for $N(\\theta,1)$ samples, $X_1-X_2$ is ancillary.",
      "## The likelihood principle",
      "All the evidence about $\\theta$ in the data is in the likelihood function $L(\\theta)=f(x\\mid\\theta)$, up to a constant factor not involving $\\theta$. Likelihood ratios $L(\\theta_1)/L(\\theta_2)$ and the maximum likelihood estimate are unchanged by such a factor. If a binomial design (fixed $n$ trials, $k$ good) and a negative binomial design (stop at the $k$th good part, which took $n$ trials) give likelihoods proportional in $\\theta$, the principle says they carry the same evidence about $\\theta$, even though their sampling distributions, and so frequentist p-values, differ.",
      "## How to work the whole problem",
      "1. Number of sequences with the given total: $\\binom nk$.",
      "2. Likelihood at a value: $\\theta^k(1-\\theta)^{n-k}$.",
      "3. Likelihood ratio between two values: raise each ratio to its exponent.",
      "4. MLE: $k/n$.",
      "5. Binomial versus negative binomial likelihood: the ratio $\\binom nk/\\binom{n-1}{k-1}=n/k$ does not depend on $\\theta$.",
      "## Typical mistakes",
      "Using the binomial probability (with $\\binom nk$) as the likelihood of one specific sequence; calling a statistic sufficient because it is a function of the data; confusing ancillary with irrelevant; and thinking the likelihood principle says the stopping rule never matters for frequentist error rates."
    ],
  },
  {
    // 7. Completeness, UMVU estimation and the information inequality
    samples: [{"workedSeed":"inf-7-worked","lqId":"inf-lq-lec7"}],
    teach: [
      "## The story the whole lecture is built on",
      "A call centre counts calls per hour and models them as Poisson($\\lambda$). Many unbiased estimators of $\\lambda$ (or of $e^{-\\lambda}$, the chance of a quiet hour) exist. Which is best, and how good can any unbiased estimator be? The lecture answers with complete sufficient statistics and with the Cramer-Rao bound.",
      "## Completeness and the Lehmann-Scheffe theorem",
      "A statistic $T$ is complete if $E_\\theta[g(T)]=0$ for all $\\theta$ implies $g(T)=0$ almost surely. For a full-rank exponential family the natural statistic is complete and sufficient. Lehmann-Scheffe: if $T$ is complete and sufficient and $h(T)$ is unbiased for $g(\\theta)$, then $h(T)$ is the unique UMVUE (uniformly minimum variance unbiased estimator) of $g(\\theta)$. Basu's theorem: a complete sufficient statistic is independent of every ancillary statistic.",
      "## Rao-Blackwell",
      "Starting from any unbiased estimator $\\delta(X)$, the estimator $E[\\delta(X)\\mid T]$ is still unbiased and has variance at most as large; when $T$ is complete and sufficient it is the UMVUE. For Poisson data, $\\mathbf 1\\{X_1=0\\}$ is unbiased for $e^{-\\lambda}$, and since $X_1\\mid T=t$ is $\\mathrm{Bin}(t,1/n)$ the UMVUE is $P(X_1=0\\mid T)=(1-1/n)^T$. The UMVUE of $\\lambda$ is $\\bar X=T/n$.",
      "## Fisher information and the Cramer-Rao bound",
      "Under regularity conditions the Fisher information of one observation is $I(\\theta)=E[\\{\\partial_\\theta\\ln f(X\\mid\\theta)\\}^2]=-E[\\partial_\\theta^2\\ln f(X\\mid\\theta)]$, and for $n$ i.i.d. observations $I_n(\\theta)=nI(\\theta)$; for Poisson, $I(\\lambda)=1/\\lambda$. Any unbiased estimator $\\delta$ of $g(\\theta)$ has $\\mathrm{Var}(\\delta)\\ge\\{g'(\\theta)\\}^2/I_n(\\theta)$. The bound is attained at every $\\theta$ only when $\\delta$ is an affine function of the score, as for $\\bar X$ in the Poisson model. The UMVUE of $e^{-\\lambda}$ does not attain it, but is still best among unbiased estimators.",
      "## How to work the whole problem",
      "1. Total $T=\\sum x_i$ (complete and sufficient).",
      "2. UMVUE of $\\lambda$: $T/n$; UMVUE of $e^{-\\lambda}$: $(1-1/n)^T$.",
      "3. Fisher information $I_n(\\lambda)=n/\\lambda$.",
      "4. Cramer-Rao bound for $g(\\lambda)=e^{-\\lambda}$: $\\{g'(\\lambda)\\}^2/I_n(\\lambda)=\\lambda e^{-2\\lambda}/n$.",
      "5. Crude estimator $\\mathbf 1\\{X_1=0\\}$: variance $p(1-p)$ with $p=e^{-\\lambda}$.",
      "## Typical mistakes",
      "Forgetting the square on $g'(\\theta)$; using the information of one observation instead of $n$; calling any unbiased function of the data the UMVUE (it must be a function of a complete sufficient statistic); and expecting the bound to be attained when it need not be."
    ],
  },
  {
    // 8. Likelihood and large-sample theory of the MLE
    samples: [{"workedSeed":"inf-8-worked","lqId":"inf-lq-lec8"}],
    teach: [
      "## The story the whole lecture is built on",
      "The waiting times of $n$ customers are modelled as exponential with rate $\\theta$. The MLE is easy, but its exact distribution is awkward. Large-sample theory gives an approximate normal law for it, which yields standard errors, intervals and three tests of the same hypothesis.",
      "## The MLE and asymptotic normality",
      "The log-likelihood is $\\ell(\\theta)=\\sum\\ln f(x_i\\mid\\theta)$ and the MLE $\\hat\\theta$ maximises it (for the exponential, $\\hat\\theta=n/\\sum x_i$). Under regularity conditions $\\sqrt n(\\hat\\theta-\\theta)\\to N(0,1/I(\\theta))$, so $\\hat\\theta\\approx N(\\theta,1/\\{nI(\\theta)\\})$ with $I(\\theta)=1/\\theta^2$ here and standard error $\\hat\\theta/\\sqrt n$. For a smooth function $g$, the delta method gives $g(\\hat\\theta)\\approx N(g(\\theta),g'(\\theta)^2/\\{nI(\\theta)\\})$. The MLE can fail to be consistent when the number of parameters grows with $n$ (Neyman-Scott: the MLE of the common variance converges to half its value).",
      "## Wald, score and likelihood ratio tests",
      "To test $H_0:\\theta=\\theta_0$ three statistics are approximately $\\chi^2_1$ under $H_0$:",
      "- Wald: $W=(\\hat\\theta-\\theta_0)^2\\,nI(\\hat\\theta)$, which uses the MLE and gives the Wald interval $\\hat\\theta\\pm z\\,\\widehat{\\mathrm{SE}}$;",
      "- score: $S=U(\\theta_0)^2/\\{nI(\\theta_0)\\}$ with $U(\\theta)=\\ell'(\\theta)$, which needs only $\\theta_0$ and no MLE;",
      "- likelihood ratio: $-2\\ln\\Lambda=2\\{\\ell(\\hat\\theta)-\\ell(\\theta_0)\\}$.",
      "They are asymptotically equivalent but can differ clearly in small samples, and only the likelihood ratio statistic is invariant to reparametrisation.",
      "## How to work the whole problem",
      "1. MLE $\\hat\\theta=n/\\sum x_i$.",
      "2. Standard error $\\hat\\theta/\\sqrt n$; Wald upper limit $\\hat\\theta+1.96\\,\\widehat{\\mathrm{SE}}$.",
      "3. Wald statistic $((\\hat\\theta-\\theta_0)/\\widehat{\\mathrm{SE}})^2$.",
      "4. Score statistic: $U(\\theta_0)=n/\\theta_0-\\sum x_i$, divide $U^2$ by $n/\\theta_0^2$.",
      "5. Likelihood ratio: $2\\{n\\ln(\\hat\\theta/\\theta_0)-(\\hat\\theta-\\theta_0)\\sum x_i\\}$.",
      "6. Compare with the $\\chi^2_1$ 5% point $3.841$.",
      "## Typical mistakes",
      "Using the information at $\\theta_0$ in the Wald statistic or at $\\hat\\theta$ in the score statistic; forgetting to square the score; dropping the factor $n$ from the information; and expecting the three statistics to be equal."
    ],
  },
  {
    // 9. UMP, UMP unbiased and conditional tests
    samples: [{"workedSeed":"inf-9-worked","lqId":"inf-lq-lec9"}],
    teach: [
      "## The story the whole lecture is built on",
      "A supplier claims that at most a fraction $\\theta_0$ of its items are defective. You inspect $n$ items and count the defectives $X\\sim\\mathrm{Bin}(n,\\theta)$. Which test of $H_0:\\theta\\le\\theta_0$ against $H_1:\\theta>\\theta_0$ is best, and how are its critical value, size and power found? The lecture builds the theory of best tests in three steps.",
      "## Neyman-Pearson and UMP tests",
      "For two simple hypotheses $f_0$ and $f_1$, the Neyman-Pearson lemma says the most powerful level-$\\alpha$ test rejects when the likelihood ratio $f_1(x)/f_0(x)$ is large (randomising on the boundary if needed so that the size is exactly $\\alpha$). A test is uniformly most powerful (UMP) for a composite alternative if it is most powerful against every $\\theta_1\\in\\Theta_1$. If the family has a monotone likelihood ratio in $T(X)$ (a one-parameter exponential family with increasing natural parameter has it), the test that rejects for large $T$ is UMP for $H_0:\\theta\\le\\theta_0$ against $H_1:\\theta>\\theta_0$. Its rejection probability increases in $\\theta$, so its size is attained at $\\theta=\\theta_0$.",
      "## Discreteness and randomised tests",
      "For discrete $X$ the exact size $P_{\\theta_0}(X\\ge c)$ is generally below $\\alpha$. A randomised test also rejects with probability $\\gamma$ when $X=c-1$, with $\\gamma=\\{\\alpha-P_{\\theta_0}(X\\ge c)\\}/P_{\\theta_0}(X=c-1)$, so that the size is exactly $\\alpha$.",
      "## Two-sided problems, unbiased and conditional tests",
      "No UMP test exists for the two-sided alternative $H_1:\\theta\\ne\\theta_0$. A level-$\\alpha$ test is unbiased if its power is at least $\\alpha$ at every alternative; a UMP test, when it exists, is automatically unbiased (it beats the trivial test). In a one-parameter exponential family the UMP unbiased test for a two-sided alternative rejects for $T$ far from its centre in both tails with total size $\\alpha$ and a balancing condition on the tails. With a nuisance parameter, conditioning on a sufficient statistic for it gives a test whose conditional size does not depend on the nuisance: for a $2\\times2$ table with fixed margins one cell count is hypergeometric under independence (Fisher's exact test).",
      "## How to work the whole problem",
      "1. Find the smallest $c$ with $P_{\\theta_0}(X\\ge c)\\le\\alpha$.",
      "2. Size: that tail probability at $\\theta_0$; power: the same tail at $\\theta_1$.",
      "3. Randomisation: $\\gamma=\\{\\alpha-\\text{size}\\}/P_{\\theta_0}(X=c-1)$.",
      "4. Likelihood ratio at the observed $x$: $(\\theta_1/\\theta_0)^x\\{(1-\\theta_1)/(1-\\theta_0)\\}^{n-x}$, increasing in $x$.",
      "## Typical mistakes",
      "Taking the critical value from the wrong end (the first $c$ whose tail is below $\\alpha$ is the smallest, not the largest); evaluating the size at $\\theta_1$; forgetting the factor $\\binom nx$ cancels in a likelihood ratio; and assuming a UMP test exists for a two-sided alternative."
    ],
  },
  {
    // 10. Large-sample likelihood ratio tests and confidence sets
    samples: [{"workedSeed":"inf-10-worked","lqId":"inf-lq-lec10"}],
    teach: [
      "## The story the whole lecture is built on",
      "In a survey of $n$ people, $k$ prefer product A. Does the preference rate differ from a claimed $\\theta_0$, and which values of the rate are compatible with the data? The lecture turns the large-sample likelihood ratio into a test and then inverts the test into a confidence set.",
      "## The likelihood ratio test",
      "For $H_0:\\theta=\\theta_0$ the likelihood ratio is $\\Lambda=L(\\theta_0)/L(\\hat\\theta)$ with $\\hat\\theta$ the MLE. Under regularity conditions and an interior true parameter, $-2\\ln\\Lambda\\to\\chi^2_d$, where $d$ is the difference in the number of free parameters between the full model and $H_0$ (here $d=1$). Reject at level $\\alpha$ when $-2\\ln\\Lambda$ exceeds the $\\chi^2_d$ point (3.841 for $d=1$, 5%). For $d=1$, $P(\\chi^2_1>s)=2\\{1-\\Phi(\\sqrt s)\\}$. The approximation can fail when the null value is on the boundary of the parameter space, when the model is not regular, or when the sample is small.",
      "For the binomial, $-2\\ln\\Lambda=2\\{k\\ln(\\hat\\theta/\\theta_0)+(n-k)\\ln\\frac{1-\\hat\\theta}{1-\\theta_0}\\}$ with $\\hat\\theta=k/n$. The Wald statistic $(\\hat\\theta-\\theta_0)^2/\\{\\hat\\theta(1-\\hat\\theta)/n\\}$ and the score statistic are asymptotically equivalent to it.",
      "## Confidence sets by inverting tests",
      "A $1-\\alpha$ confidence set for $\\theta$ is the set of all $\\theta_0$ that the level-$\\alpha$ test does not reject. Inverting the likelihood ratio test gives $\\{\\theta:-2\\ln\\Lambda(\\theta)\\le\\chi^2_{d,\\alpha}\\}$, which is invariant to reparametrisation and need not be symmetric around $\\hat\\theta$. The Wald interval $\\hat\\theta\\pm1.96\\sqrt{\\hat\\theta(1-\\hat\\theta)/n}$ is symmetric and can be poor near $0$ or $1$. For a vector parameter of dimension $d$ the set is an ellipsoid-like region from $\\chi^2_d$. Inverting a UMP test gives an optimal one-sided confidence bound. A $95\\%$ confidence set means that the procedure covers the true value in $95\\%$ of repeated samples, not that this particular set contains it with probability $0.95$.",
      "## How to work the whole problem",
      "1. MLE $k/n$.",
      "2. $-2\\ln\\Lambda=2\\{k\\ln(\\hat\\theta/\\theta_0)+(n-k)\\ln\\frac{1-\\hat\\theta}{1-\\theta_0}\\}$.",
      "3. p-value $=2\\{1-\\Phi(\\sqrt{-2\\ln\\Lambda})\\}$ (one degree of freedom).",
      "4. Wald statistic and the Wald interval limit.",
      "5. Is $\\theta_0$ in the confidence set? Yes if $-2\\ln\\Lambda\\le3.841$.",
      "## Typical mistakes",
      "Forgetting the factor $2$ in $-2\\ln\\Lambda$; using the wrong degrees of freedom; reading the p-value from the wrong tail; and interpreting a confidence set as a probability statement about the parameter."
    ],
  },
  {
    // 11. Bootstrap
    samples: [{"workedSeed":"inf-11-worked","lqId":"inf-lq-lec11"}],
    teach: [
      "## The story the whole lecture is built on",
      "You have an estimator of some parameter but no formula for its standard error, bias or confidence interval. The bootstrap approximates the sampling distribution of the estimator by resampling the data themselves, with no mathematics beyond recomputing the estimator.",
      "## The plug-in principle",
      "The unknown distribution $F$ is replaced by the empirical distribution $\\hat F_n$, which puts mass $1/n$ on each observation. A bootstrap sample is $n$ draws with replacement from the data, and the estimator recomputed on it is a bootstrap replicate $\\theta^*$. With $B$ replicates $\\theta^*_1,\\dots,\\theta^*_B$, the distribution of $\\theta^*-\\hat\\theta$ imitates that of $\\hat\\theta-\\theta$.",
      "## Standard error, bias and intervals",
      "The bootstrap standard error is the sample standard deviation of the replicates (divisor $B-1$). The bootstrap bias is $\\overline{\\theta^*}-\\hat\\theta$, giving the corrected estimate $\\hat\\theta-\\widehat{\\mathrm{bias}}$. The percentile interval uses the $\\alpha/2$ and $1-\\alpha/2$ percentiles of the replicates (for $B=19$ and $90\\%$, the smallest and largest). The basic interval reflects them about $\\hat\\theta$: $(2\\hat\\theta-\\theta^*_{(1-\\alpha/2)},\\ 2\\hat\\theta-\\theta^*_{(\\alpha/2)})$. For the sample mean with finite variance the bootstrap is consistent: $\\sqrt n(\\bar X^*-\\bar X)$ has the same limit law as $\\sqrt n(\\bar X-\\mu)$.",
      "## When the bootstrap fails",
      "For the maximum of a $U(0,\\theta)$ sample the nonparametric bootstrap is inconsistent. A given observation, in particular the sample maximum, is drawn at least once in a resample with probability $1-(1-1/n)^n\\to1-e^{-1}\\approx0.632$, so the bootstrap distribution of the maximum has an atom of mass about $0.632$ at the observed maximum, while the true distribution of the maximum is continuous. The same happens for other non-smooth statistics, and a parametric bootstrap or subsampling is used instead.",
      "## How to work the whole problem",
      "1. Standard error: standard deviation of the replicates (divisor $B-1$).",
      "2. Bias: mean of the replicates minus $\\hat\\theta$; corrected estimate: $\\hat\\theta-$ bias.",
      "3. Percentile interval: sort the replicates and read the ends.",
      "4. Basic interval: reflect the ends about $\\hat\\theta$.",
      "5. Failure for the maximum: $1-(1-1/n)^n$.",
      "## Typical mistakes",
      "Dividing by $B$ instead of $B-1$ in the standard error; swapping the sign of the bias correction; swapping the ends of the basic interval; resampling without replacement; and trusting the bootstrap for the sample maximum."
    ],
  },
]

export default lessons
