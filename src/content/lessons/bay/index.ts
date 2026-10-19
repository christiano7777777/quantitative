// Lessons for Bayesian Statistics, following the HKU STAT4610 lecture notes and tutorials (lectures 1-6), then the outline topics the notes
// have not reached yet (lectures 7-10). A lecture that merges two sections of the notes has one lesson part and one worked sample per section;
// its quiz draws its long question from one of them.
import type { Lesson } from '../../../lib/types'

const lessons: Lesson[] = [
  {
    // 1. Inference frameworks, likelihood, prior, posterior and prediction
    samples: [{"workedSeed":"bay-1-worked","lqId":"bay-lq-s-normalpost"}],
    teach: [
      "## The story the whole lecture is built on",
      "A laboratory measures a quantity $\\mu$ with an instrument whose readings are $N(\\mu,\\sigma^2)$ with $\\sigma^2$ known. Before measuring it already has a belief about $\\mu$, say $\\mu\\sim N(\\mu_0,\\sigma_0^2)$. After $n$ readings it wants to update that belief, say how much the old belief still matters, and predict the next reading. This is the whole Bayesian recipe in one example.",
      "## Two frameworks",
      "Both start from a parameter $\\theta$, i.i.d. observed data $X_1,\\dots,X_n$ and unobserved future data, and both want to infer $\\theta$ and to predict. In the frequentist framework $\\theta$ is a fixed unknown number and probability describes the randomness of the data under repeated sampling. In the Bayesian framework $\\theta$ also gets a probability distribution, which expresses what is believed about it; inference then means updating that distribution with the data.",
      "## Prior, likelihood, posterior",
      "The Bayesian model is a prior $\\pi(\\theta)$ and a likelihood $p(x_i\\mid\\theta)$ for i.i.d. data, so $p(\\theta,x_{1:n})=\\pi(\\theta)\\prod_ip(x_i\\mid\\theta)$. Once the data $y$ are observed, Bayes' theorem gives the posterior $$\\pi(\\theta\\mid y)=\\frac{p(y\\mid\\theta)\\,\\pi(\\theta)}{p(y)}\\propto p(y\\mid\\theta)\\,\\pi(\\theta),\\qquad p(y)=\\int p(y\\mid\\theta)\\pi(\\theta)\\,d\\theta,$$ with a sum for a discrete parameter. The marginal likelihood $p(y)$ does not depend on $\\theta$; it only normalises. The likelihood, read as a function of $\\theta$ for the observed data, is not a probability distribution for $\\theta$.",
      "## The normal model with known variance",
      "Let $\\sigma_n^2=\\sigma^2/n$ be the variance of the sample mean $\\bar y$. Multiplying the likelihood $N(\\bar y;\\mu,\\sigma_n^2)$ by the prior $N(\\mu;\\mu_0,\\sigma_0^2)$ and completing the square in $\\mu$ gives a normal posterior with $$m_n=\\frac{\\sigma_0^2\\bar y+\\sigma_n^2\\mu_0}{\\sigma_0^2+\\sigma_n^2},\\qquad s_n^2=\\frac{\\sigma_0^2\\sigma_n^2}{\\sigma_0^2+\\sigma_n^2}.$$ The posterior mean is a weighted average of the prior mean and the sample mean, with weights inversely proportional to their variances: the prior mean gets weight $w=\\sigma_n^2/(\\sigma_0^2+\\sigma_n^2)$. The posterior variance is smaller than both $\\sigma_0^2$ and $\\sigma_n^2$.",
      "In terms of precisions (inverse variances) the posterior precision is the sum $1/s_n^2=1/\\sigma_0^2+n/\\sigma^2=(n+n_0)/\\sigma^2$ with $n_0=\\sigma^2/\\sigma_0^2$. So the prior is worth $n_0$ extra observations; as $n$ grows its influence disappears.",
      "## Prediction and credible intervals",
      "A new reading is $\\tilde y=\\mu+\\varepsilon$ with $\\varepsilon\\sim N(0,\\sigma^2)$ independent of $\\mu$ given the data, so its posterior predictive distribution is $N(m_n,\\ \\sigma^2+s_n^2)$: the noise of one reading plus the remaining uncertainty about $\\mu$. A $95\\%$ credible interval for $\\mu$ is $m_n\\pm1.96\\,s_n$; it is a statement of posterior probability about $\\mu$ given the data, not about repeated samples.",
      "## How to work the whole problem",
      "1. Compute $\\sigma_n^2=\\sigma^2/n$.",
      "2. Posterior mean $m_n$ and variance $s_n^2$ from the two formulas.",
      "3. The prior weight is $w=\\sigma_n^2/(\\sigma_0^2+\\sigma_n^2)$; the prior is worth $n_0=\\sigma^2/\\sigma_0^2$ observations.",
      "4. Predictive variance: $\\sigma^2+s_n^2$.",
      "5. Credible interval: $m_n\\pm1.96\\,s_n$.",
      "## Typical mistakes",
      "Adding variances where precisions are needed; using $\\sigma^2$ instead of $\\sigma_n^2=\\sigma^2/n$ in the likelihood of the mean; forgetting $\\sigma^2$ in the predictive variance; and reading the likelihood as a probability distribution of $\\theta$."
    ],
  },
  {
    // 2. Conjugate models
    samples: [{"workedSeed":"bay-2-worked","lqId":"bay-lq-lec2"}],
    teach: [
      "## The story the whole lecture is built on",
      "The daily number of emails you receive is Poisson with an unknown rate $\\lambda$. You hold a prior belief about $\\lambda$, observe a few days of counts, and want the updated belief and a forecast for tomorrow, all in closed form. This works because the Gamma prior is conjugate to the Poisson likelihood.",
      "## Conjugacy",
      "A prior is conjugate to a likelihood if the posterior is in the same family. The posterior is proportional to likelihood times prior, so conjugacy means the product has the same functional form as the prior. Standard pairs: Beta prior with binomial data (posterior $\\mathrm{Beta}(a+k,b+n-k)$); Gamma prior with Poisson data; Normal prior for a normal mean with known variance; Dirichlet prior with multinomial data.",
      "## The Gamma-Poisson model",
      "With $X_i\\mid\\lambda\\sim\\mathrm{Poisson}(\\lambda)$ i.i.d. and $\\lambda\\sim\\mathrm{Gamma}(a,b)$ (shape $a$, rate $b$, density $\\propto\\lambda^{a-1}e^{-b\\lambda}$), the likelihood is $\\propto\\lambda^{\\sum x_i}e^{-n\\lambda}$, so $$\\lambda\\mid x\\sim\\mathrm{Gamma}\\Big(a+\\sum x_i,\\ b+n\\Big).$$ The shape adds the total count and the rate adds the number of days. The posterior mean $(a+\\sum x_i)/(b+n)$ is a weighted average of the prior mean $a/b$ and the sample mean $\\bar x$, with weights $b/(b+n)$ and $n/(b+n)$; the posterior variance is shape / rate$^2$.",
      "## Posterior predictive",
      "The predictive distribution of tomorrow's count $Y$ averages the Poisson over the posterior and is negative binomial with $P(Y=0\\mid x)=\\{B/(B+1)\\}^A$ for a $\\mathrm{Gamma}(A,B)$ posterior. Its mean is $A/B$ and its variance $A/B+A/B^2$ exceeds the mean: the uncertainty about $\\lambda$ makes the forecast over-dispersed compared with a Poisson at the posterior mean.",
      "## How to work the whole problem",
      "1. Posterior shape: $a+\\sum x_i$; posterior rate: $b+n$.",
      "2. Mean: shape / rate; variance: shape / rate$^2$.",
      "3. $P(Y=0)=\\{B/(B+1)\\}^A$.",
      "4. Predictive variance: mean + variance of the posterior.",
      "## Typical mistakes",
      "Adding $n$ to the shape or $\\sum x_i$ to the rate; mixing up the rate and scale parametrisations of the Gamma; reporting the Poisson variance (equal to the mean) for the predictive; and forgetting that the prior contributes like $a$ extra events and $b$ extra days."
    ],
  },
  {
    // 3. Posterior summaries, intervals and choosing priors
    samples: [{"workedSeed":"bay-3-worked","lqId":"bay-lq-lec3"}],
    teach: [
      "## The story the whole lecture is built on",
      "In a clinical trial $k$ of $n$ patients respond. With no strong prior knowledge, which prior should you use, how do you summarise the resulting posterior (a single number, an interval), and how much does the choice of prior matter? This lecture answers with one running example, the Beta-binomial model.",
      "## Posterior summaries",
      "A posterior can be summarised by its mean (the Bayes estimate under squared error loss), median (absolute error loss) or mode (the MAP estimate, the point of highest density). For a $\\mathrm{Beta}(A,B)$ posterior the mean is $A/(A+B)$, the mode is $(A-1)/(A+B-2)$ for $A,B>1$, and the standard deviation is $\\sqrt{AB/\\{(A+B)^2(A+B+1)\\}}$. For a skewed posterior the three differ.",
      "## Credible intervals",
      "A $95\\%$ credible interval is a set with posterior probability $0.95$. The equal-tailed interval cuts $2.5\\%$ from each tail; the highest posterior density (HPD) interval is the shortest set with probability $0.95$ and contains the values of highest density. For a roughly normal posterior, mean $\\pm1.96\\times$ sd is a good approximation. Unlike a confidence interval, it is a statement about the parameter given the data.",
      "## Choosing priors",
      "A prior can express genuine knowledge (informative), or be chosen to have little influence. The uniform prior $\\mathrm{Beta}(1,1)$ is flat but changes under reparametrisation. The Jeffreys prior $\\pi(\\theta)\\propto\\sqrt{I(\\theta)}$ is invariant to reparametrisation; for the binomial it is $\\mathrm{Beta}(\\tfrac12,\\tfrac12)$. A conjugate prior $\\mathrm{Beta}(a,b)$ acts like $a+b$ prior observations: the posterior mean is a weighted average of the prior mean $a/(a+b)$ and the sample proportion $k/n$, with weight $(a+b)/(a+b+n)$ on the prior. As $n$ grows the prior's influence vanishes. Always check sensitivity by trying another reasonable prior.",
      "## How to work the whole problem",
      "1. Posterior parameters $A=k+a$, $B=n-k+b$ (here $a=b=\\tfrac12$).",
      "2. Mean, mode and standard deviation from the Beta formulas.",
      "3. Approximate 95% interval: mean $\\pm1.96\\times$ sd.",
      "4. Sensitivity: recompute the mean under the uniform prior, $(k+1)/(n+2)$.",
      "5. Weight of the prior: $(a+b)/(a+b+n)$.",
      "## Typical mistakes",
      "Using the mode formula when a parameter is at most $1$; treating the Jeffreys prior as uninformative in every sense (it is still a prior); reading a credible interval as a confidence interval; and forgetting that the mean, median and mode differ for skewed posteriors."
    ],
  },
  {
    // 4. Monte Carlo basics and inverse transform sampling
    samples: [{"workedSeed":"bay-4-worked","lqId":"bay-lq-lec4"}],
    teach: [
      "## The story the whole lecture is built on",
      "Many posterior quantities are integrals with no closed form. Monte Carlo replaces an integral by an average over random draws. Here the target is simple, an exponential waiting time, so the whole pipeline can be followed by hand: turn uniform random numbers into draws, average them, and say how accurate the average is.",
      "## Monte Carlo estimation",
      "To approximate $E[h(X)]=\\int h(x)f(x)dx$ draw $x_1,\\dots,x_n$ i.i.d. from $f$ and use $\\hat\\mu_n=\\frac1n\\sum h(x_i)$. It is unbiased and, by the law of large numbers, consistent. A probability $P(X>c)$ is the case $h(x)=\\mathbf 1\\{x>c\\}$: the fraction of draws above $c$. The Monte Carlo standard error is $\\sigma_h/\\sqrt n$, estimated by $s/\\sqrt n$; it falls like $1/\\sqrt n$ whatever the dimension, so to halve the error you need four times as many draws. The number of draws needed for a target standard error $\\varepsilon$ is $n=(\\sigma_h/\\varepsilon)^2$.",
      "## Inverse transform sampling",
      "If $F$ is the cdf of $X$ and $U\\sim\\mathrm{Unif}(0,1)$ then $X=F^{-1}(U)$ has cdf $F$, because $P(F^{-1}(U)\\le x)=P(U\\le F(x))=F(x)$. For the exponential with rate $\\lambda$, $F(x)=1-e^{-\\lambda x}$ and $F^{-1}(u)=-\\ln(1-u)/\\lambda$. The method needs a tractable inverse cdf; otherwise use rejection sampling or importance sampling.",
      "## How to work the whole problem",
      "1. Transform each uniform: $x_i=-\\ln(1-u_i)/\\lambda$.",
      "2. Monte Carlo mean: the average of the draws; compare with the true mean $1/\\lambda$.",
      "3. Tail probability: the fraction of draws above the cut-off.",
      "4. Sample standard deviation $s$ (divisor $n-1$), then the standard error $s/\\sqrt n$.",
      "5. Draws needed for a target error: $(\\sigma/\\varepsilon)^2$ with $\\sigma=1/\\lambda$.",
      "## Typical mistakes",
      "Using $-\\ln(u)/\\lambda$ (valid, since $1-U$ is also uniform, but the draws then differ from those of $-\\ln(1-u)/\\lambda$); confusing the standard deviation of the draws with the standard error of their mean; and expecting a few draws to match the true value closely."
    ],
  },
  {
    // 5. Importance sampling
    samples: [{"workedSeed":"bay-5-worked","lqId":"bay-lq-lec5"}],
    teach: [
      "## The story the whole lecture is built on",
      "You want an expectation under a target density $p$ but you can only draw from a different density $q$ (or $p$ is known only up to a constant). Importance sampling reweights the draws from $q$ so that they stand in for draws from $p$. The running example estimates the mean of an $\\mathrm{Exp}(2)$ target from $\\mathrm{Exp}(1)$ draws.",
      "## Importance sampling",
      "Since $E_p[h(X)]=\\int h(x)\\frac{p(x)}{q(x)}q(x)dx=E_q[w(X)h(X)]$ with the weight $w=p/q$, draw $x_1,\\dots,x_n$ from $q$ and use $\\frac1n\\sum w(x_i)h(x_i)$. It needs $q>0$ wherever $p>0$ and is unbiased. The mean weight $\\frac1n\\sum w_i$ is an estimate of $1$ and is a useful diagnostic.",
      "## Self-normalised importance sampling",
      "When $p$ is known only up to a constant ($p=\\tilde p/Z$), the weights $\\tilde w=\\tilde p/q$ are also known only up to $Z$. The self-normalised estimator $\\sum\\tilde w_ih(x_i)/\\sum\\tilde w_i$ cancels $Z$. It is slightly biased but consistent, and it also gives an estimate of the normalising constant $Z\\approx\\frac1n\\sum\\tilde w_i$.",
      "## Effective sample size",
      "Very unequal weights make the estimate depend on a few draws. The effective sample size $\\mathrm{ESS}=(\\sum w_i)^2/\\sum w_i^2$ is the number of equally weighted draws with the same variance; it equals $n$ if all weights are equal and is close to $1$ if one weight dominates. A good proposal has heavier tails than the target, so the weights are bounded; with a lighter-tailed proposal the variance can be infinite.",
      "## How to work the whole problem",
      "1. Weights $w_i=p(x_i)/q(x_i)=2e^{-x_i}$.",
      "2. Mean weight $\\frac1n\\sum w_i$ (should be near $1$).",
      "3. Importance sampling estimate $\\frac1n\\sum w_ix_i$.",
      "4. Self-normalised estimate $\\sum w_ix_i/\\sum w_i$.",
      "5. $\\mathrm{ESS}=(\\sum w_i)^2/\\sum w_i^2$.",
      "## Typical mistakes",
      "Using $q/p$ instead of $p/q$; dividing the self-normalised estimate by $n$ instead of by $\\sum w_i$; applying the plain estimator when $p$ is only known up to a constant; and choosing a proposal with lighter tails than the target."
    ],
  },
  {
    // 6. Markov chains and Metropolis-Hastings
    samples: [{"workedSeed":"bay-6-worked","lqId":"bay-lq-lec6"}],
    teach: [
      "## The story the whole lecture is built on",
      "You want to sample from a distribution known only up to a constant, and independent draws are not available. The idea: build a Markov chain whose long-run distribution is the target. The running example is a distribution on three states with probabilities proportional to $(\\tilde\\pi_1,\\tilde\\pi_2,\\tilde\\pi_3)$.",
      "## Markov chains and stationarity",
      "A Markov chain moves according to transition probabilities $P(i\\to j)$ that depend only on the current state. A distribution $\\pi$ is stationary if $\\pi P=\\pi$. A sufficient condition is detailed balance: $\\pi(i)P(i\\to j)=\\pi(j)P(j\\to i)$ for all $i,j$. If the chain is irreducible and aperiodic, then the distribution of $X_t$ converges to the stationary distribution from any start, and averages along the chain converge to expectations under $\\pi$ (the ergodic theorem).",
      "## The Metropolis-Hastings algorithm",
      "From state $x$ propose $y$ from $q(y\\mid x)$ and accept it with probability $$\\alpha(x,y)=\\min\\left\\{1,\\frac{\\tilde\\pi(y)q(x\\mid y)}{\\tilde\\pi(x)q(y\\mid x)}\\right\\},$$ otherwise stay at $x$. The normalising constant cancels in the ratio. For a symmetric proposal ($q(y\\mid x)=q(x\\mid y)$, the Metropolis algorithm) $\\alpha=\\min\\{1,\\tilde\\pi(y)/\\tilde\\pi(x)\\}$: moves to more probable states are always accepted. The transition probability to a different state $y$ is $P(x\\to y)=q(y\\mid x)\\alpha(x,y)$ and the probability of staying is one minus the sum of the others. This chain satisfies detailed balance with respect to $\\pi$, so $\\pi$ is stationary.",
      "## How to work the whole problem",
      "1. Target probability: $\\tilde\\pi_j/\\sum\\tilde\\pi$.",
      "2. Acceptance: $\\min\\{1,\\tilde\\pi_j/\\tilde\\pi_i\\}$.",
      "3. Transition probability: proposal probability $\\tfrac12$ times the acceptance.",
      "4. Staying probability: one minus the two move probabilities.",
      "5. Detailed balance: the flow $\\pi(i)P(i\\to j)$ equals the flow back.",
      "## Typical mistakes",
      "Forgetting the proposal probability in $P(i\\to j)$; using the normalised probabilities in $\\alpha$ and then dividing by the constant twice; treating the rejection as a move to another state; and forgetting that the chain's draws are dependent, so the effective sample size is smaller than the number of iterations."
    ],
  },
  {
    // 7. MCMC in practice: Gibbs, diagnostics and HMC
    samples: [{"workedSeed":"bay-7-worked","lqId":"bay-lq-lec7"}],
    teach: [
      "## The story the whole lecture is built on",
      "Metropolis-Hastings works, but a real analysis needs three more things: a sampler that exploits the structure of the model (Gibbs), a way to tell whether the chain has run long enough and how many independent draws it is worth (diagnostics), and a faster sampler for hard posteriors (Hamiltonian Monte Carlo). The running example is a bivariate normal with correlation $\\rho$, where everything is available in closed form.",
      "## Gibbs sampling",
      "To sample $(X,Y)$, alternately draw each variable from its full conditional given the current value of the other. It is Metropolis-Hastings with acceptance probability $1$, and keeps the joint distribution stationary. For the standard bivariate normal with correlation $\\rho$, $X\\mid Y=y\\sim N(\\rho y,\\ 1-\\rho^2)$ and symmetrically for $Y\\mid X=x$. Strong dependence ($\\rho$ near $1$) makes the chain move in small steps.",
      "## Diagnostics",
      "Successive draws are dependent. For this Gibbs sampler the $X$-sequence is an AR(1) process with lag-1 autocorrelation $\\phi=\\rho^2$. The effective sample size of $N$ draws is $N/(1+2\\sum_{k\\ge1}\\phi_k)$, which for AR(1) is $N(1-\\phi)/(1+\\phi)$. To check convergence run several chains from dispersed starts. With $m$ chains of $n$ draws, within-chain variance $W$ (average of the chain variances) and between-chain variance $B=n\\,\\mathrm{Var}(\\text{chain means})$, the Gelman-Rubin statistic is $\\hat R=\\sqrt{\\{\\frac{n-1}nW+\\frac Bn\\}/W}$. It is close to $1$ when the chains agree; values above about $1.01$ to $1.1$ signal non-convergence. Discard an initial burn-in and inspect trace plots as well.",
      "## Hamiltonian Monte Carlo",
      "HMC adds a momentum $p$ and treats $-\\ln\\pi(q)=U(q)$ as a potential energy, simulating the dynamics with leapfrog steps of size $\\varepsilon$: $p\\leftarrow p-\\tfrac\\varepsilon2U'(q)$, then $q\\leftarrow q+\\varepsilon p$, then $p\\leftarrow p-\\tfrac\\varepsilon2U'(q)$. The end point is accepted with a Metropolis step based on the change in total energy, which is small if $\\varepsilon$ is small. Long, informed moves reduce autocorrelation compared with random-walk Metropolis.",
      "## How to work the whole problem",
      "1. Full conditional mean $\\rho y$ and variance $1-\\rho^2$.",
      "2. Lag-1 autocorrelation of the $X$ chain: $\\rho^2$.",
      "3. $\\mathrm{ESS}=N(1-\\rho^2)/(1+\\rho^2)$.",
      "4. $\\hat R$: $W=$ mean of the variances, $B=n(m_1-m_2)^2/2$, then the formula.",
      "5. HMC half step: $p-\\tfrac\\varepsilon2q$ when $U(q)=q^2/2$.",
      "## Typical mistakes",
      "Using $\\rho$ instead of $\\rho^2$ for the autocorrelation of the Gibbs chain; computing $B$ without the factor $n$; reading $\\hat R\\approx1$ as proof of convergence (the chains may all be stuck in one mode); and applying the full momentum step before the half step in leapfrog."
    ],
  },
  {
    // 8. Model evaluation and selection
    samples: [{"workedSeed":"bay-8-worked","lqId":"bay-lq-lec8"}],
    teach: [
      "## The story the whole lecture is built on",
      "Two models have been fitted to the same $n$ observations. Which one should you use? The lecture compares ways to answer, from penalised likelihoods (AIC, BIC) to the fully Bayesian answer through marginal likelihoods and Bayes factors.",
      "## Information criteria",
      "A model with more parameters always fits the data at least as well, so the maximised log-likelihood $\\ell$ is penalised by the number of parameters $k$: $$\\mathrm{AIC}=2k-2\\ell,\\qquad\\mathrm{BIC}=k\\ln n-2\\ell.$$ Smaller is better. AIC targets out-of-sample prediction; BIC approximates the log marginal likelihood and penalises complexity more once $n>7$ ($\\ln n>2$), so it prefers smaller models. For Bayesian models the deviance information criterion (DIC) and WAIC use posterior draws instead of maximum likelihood, and leave-one-out cross-validation estimates predictive accuracy directly.",
      "## The marginal likelihood and Bayes factors",
      "The evidence of model $M$ is $p(y\\mid M)=\\int p(y\\mid\\theta,M)\\pi(\\theta\\mid M)d\\theta$, the average of the likelihood over the prior. The Bayes factor of $A$ against $B$ is $B_{AB}=p(y\\mid A)/p(y\\mid B)$, and posterior odds equal the Bayes factor times the prior odds. With equal prior probabilities $P(A\\mid y)=B_{AB}/(1+B_{AB})$. The marginal likelihood automatically penalises complexity (a vague prior spreads probability over many data sets) but depends strongly on the prior, and is hard to compute (often via importance sampling or the Laplace approximation).",
      "## How to work the whole problem",
      "1. AIC $=2k-2\\ell$ for each model; BIC $=k\\ln n-2\\ell$.",
      "2. The preferred model has the smaller value.",
      "3. Bayes factor: $\\exp\\{\\ln p(y\\mid A)-\\ln p(y\\mid B)\\}$.",
      "4. Posterior model probability with equal priors: $B/(1+B)$.",
      "## Typical mistakes",
      "Picking the model with the larger information criterion; using $\\ell$ with the wrong sign; treating a Bayes factor of $3$ as strong evidence (it is slight to moderate); and forgetting that Bayes factors depend on the prior distributions."
    ],
  },
  {
    // 9. Laplace approximation and variational Bayes
    samples: [{"workedSeed":"bay-9-worked","lqId":"bay-lq-lec9"}],
    teach: [
      "## The story the whole lecture is built on",
      "When MCMC is too slow or too much work, the posterior can be approximated by a simple density. The lecture gives two approximations: Laplace (a normal fitted at the mode, which also approximates the marginal likelihood) and variational Bayes (the best member of a simple family, chosen by an optimisation). The running example is an unnormalised Gamma posterior $g(\\theta)=\\theta^{A-1}e^{-B\\theta}$, whose exact normalising constant is known for comparison.",
      "## The Laplace approximation",
      "Expand $\\ln g$ to second order around its mode $\\hat\\theta$: $\\ln g(\\theta)\\approx\\ln g(\\hat\\theta)-\\tfrac12c(\\theta-\\hat\\theta)^2$ with curvature $c=-(\\ln g)''(\\hat\\theta)$. This gives the normal approximation $N(\\hat\\theta,1/c)$ to the posterior and the approximation $$Z=\\int g(\\theta)d\\theta\\approx g(\\hat\\theta)\\sqrt{2\\pi/c}$$ to the marginal likelihood. For $g=\\theta^{A-1}e^{-B\\theta}$, the mode is $\\hat\\theta=(A-1)/B$ and $c=(A-1)/\\hat\\theta^2$. The approximation is good for large samples (the posterior is nearly normal) and poor for skewed or multimodal posteriors. In several dimensions $c$ becomes the Hessian matrix and $\\sqrt{2\\pi/c}$ becomes $(2\\pi)^{d/2}|H|^{-1/2}$.",
      "## Variational Bayes",
      "Choose the density $q$ in a simple family (for example a product of independent factors, the mean-field family) that minimises the Kullback-Leibler divergence $\\mathrm{KL}(q\\,\\|\\,\\pi(\\cdot\\mid y))$, equivalently maximises the evidence lower bound (ELBO) $E_q[\\ln p(y,\\theta)]-E_q[\\ln q(\\theta)]$, which is a lower bound on $\\ln p(y)$. Coordinate ascent updates one factor at a time, $\\ln q_j\\propto E_{q_{-j}}[\\ln p(y,\\theta)]$. It is fast and scales to large data, but because KL is taken in this direction it tends to underestimate posterior variances, especially when the true posterior has strongly correlated components.",
      "## How to work the whole problem",
      "1. Mode: solve $(\\ln g)'=0$, which gives $(A-1)/B$.",
      "2. Curvature: $c=-(\\ln g)''=(A-1)/\\hat\\theta^2$.",
      "3. Laplace standard deviation $1/\\sqrt c$.",
      "4. Laplace evidence: $g(\\hat\\theta)\\sqrt{2\\pi/c}$.",
      "5. Exact evidence $(A-1)!/B^A$ and the ratio of the two.",
      "## Typical mistakes",
      "Using the mean instead of the mode; forgetting the minus sign (the curvature must be positive); using $c$ instead of $1/\\sqrt c$ as the standard deviation; and expecting the Laplace approximation to be accurate for a heavily skewed posterior or small sample."
    ],
  },
  {
    // 10. Nonparametric Bayes
    samples: [{"workedSeed":"bay-10-worked","lqId":"bay-lq-lec10"}],
    teach: [
      "## The story the whole lecture is built on",
      "A parametric model fixes the number of components in advance. In a clustering problem you may not know how many clusters there are. Nonparametric Bayes puts a prior on the distribution itself, so the number of clusters is allowed to grow with the data. The running example is the Chinese restaurant process, a way of seeing a Dirichlet process.",
      "## The Dirichlet process",
      "A Dirichlet process $\\mathrm{DP}(\\alpha,H)$ with concentration $\\alpha>0$ and base distribution $H$ is a distribution over distributions: for every finite partition $(A_1,\\dots,A_k)$ the random probabilities are $\\mathrm{Dirichlet}(\\alpha H(A_1),\\dots,\\alpha H(A_k))$. Draws from it are discrete with probability one. Given $n$ observations $x_1,\\dots,x_n$ the posterior is again a Dirichlet process with concentration $\\alpha+n$ and base $\\frac{\\alpha H+\\sum\\delta_{x_i}}{\\alpha+n}$ (conjugacy).",
      "## Chinese restaurant process",
      "Integrating out the random distribution, observations are seated at tables (clusters): customer $m+1$ joins table $k$ with $n_k$ customers with probability $n_k/(\\alpha+m)$ and starts a new table with probability $\\alpha/(\\alpha+m)$. Big tables attract more customers (the rich get richer). The expected number of tables after $n$ customers is $\\sum_{i=1}^n\\alpha/(\\alpha+i-1)\\approx\\alpha\\ln(1+n/\\alpha)$: it grows without bound, but slowly.",
      "## Stick-breaking",
      "Another construction writes $G=\\sum_kw_k\\delta_{\\theta_k}$ with atoms $\\theta_k\\sim H$ and weights $w_k=v_k\\prod_{j<k}(1-v_j)$, where $v_k\\sim\\mathrm{Beta}(1,\\alpha)$: break off a fraction $v_1$ of a unit stick, then a fraction $v_2$ of what is left, and so on. $E[v_1]=1/(1+\\alpha)$, so a small $\\alpha$ puts most mass on few atoms (few clusters) and a large $\\alpha$ spreads it out. A DP mixture model uses the DP as the prior for the mixing distribution of a mixture of, for example, normals.",
      "## How to work the whole problem",
      "1. Probability of a new table: $\\alpha/(\\alpha+m)$.",
      "2. Probability of joining table $k$: $n_k/(\\alpha+m)$.",
      "3. Expected number of tables: add $\\alpha/(\\alpha+i-1)$ over $i=1,\\dots,n$.",
      "4. Stick-breaking weight $w_3=v_3(1-v_1)(1-v_2)$.",
      "5. $E[v_1]=1/(1+\\alpha)$.",
      "## Typical mistakes",
      "Dividing by $m$ instead of $\\alpha+m$; forgetting that the new-table probability uses $\\alpha$ and not a table size; using $(1-v_k)$ for the $k$th weight instead of $v_k$ times the product of earlier $(1-v_j)$; and thinking the DP prior fixes the number of clusters."
    ],
  },
]

export default lessons
