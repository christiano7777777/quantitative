// Lessons for Nonparametric Statistics, following the HKU SDST3620/STAT3620 lecture notes (lectures 1-8), then the outline topics the
// notes have not reached yet (lectures 9-12). A lecture that merges two sections of the notes has one lesson part and one worked sample per
// section; its quiz draws its long question from one of them.
import type { Lesson } from '../../../lib/types'

const lessons: Lesson[] = [
  {
    // 1. Why nonparametric: the sign test and confidence intervals for the median and the cdf
    samples: [{"workedSeed":"np-1-worked","lqId":"np-lq-w-signci"}],
    teach: [
      "## The story the whole lecture is built on",
      "A courier firm claims that its median delivery time is $m_0$ minutes. You time $n$ parcels. Nothing says delivery times are normal; they are typically skewed, with a few very late parcels. The lecture asks three questions without assuming any distributional family: is the claim believable, how uncertain is a median estimated from $n$ parcels, and what fraction of parcels arrive within a given time?",
      "## Why nonparametric, and what it costs",
      "A distribution-free (nonparametric) method keeps its stated significance level for every continuous distribution, because it uses only the signs or the ranks of the data. It also resists outliers, and it works when the normality assumption of the $t$ test fails. The price is power. When the data really are normal the sign test has asymptotic relative efficiency $2/\\pi\\approx0.64$ against the $t$ test, so it needs about $1/0.64\\approx1.57$ times as many observations for the same power; the Wilcoxon signed-rank test costs much less, with efficiency $3/\\pi\\approx0.955$. For heavy-tailed data the efficiency can be above $1$.",
      "## The sign test for a median",
      "Let $\\theta$ be the population median and test $H_0:\\theta=m_0$. Let $B$ be the number of observations above $m_0$. An observation equal to $m_0$ says nothing about which side the median lies on, so drop it and let $n_0$ be the number of observations left. For continuous data each remaining observation is above $\\theta$ with probability exactly $\\tfrac12$ under $H_0$, so $B\\sim\\mathrm{Bin}(n_0,\\tfrac12)$ whatever the distribution. That is why the test is distribution-free.",
      "With $b$ the observed value of $B$, the exact one-sided p-value for $H_1:\\theta>m_0$ is $P(B\\ge b)=\\sum_{j\\ge b}\\binom{n_0}{j}/2^{n_0}$. The two-sided p-value is twice the smaller of the two tails, capped at $1$. For large $n_0$ use $Z=(B-n_0/2)/\\sqrt{n_0/4}\\approx N(0,1)$, with a continuity correction of $\\tfrac12$.",
      "## A confidence interval for the median from order statistics",
      "Let $X_{(1)}<\\dots<X_{(n)}$ be the order statistics. The number of observations below the true median $\\theta$ is $\\mathrm{Bin}(n,\\tfrac12)$, and $X_{(r)}<\\theta<X_{(n+1-r)}$ exactly when that number lies between $r$ and $n-r$. So $(X_{(r)},X_{(n+1-r)})$ is a confidence interval for $\\theta$ with exact coverage $1-2P(\\mathrm{Bin}(n,\\tfrac12)\\le r-1)$, whatever the distribution. The coverage takes only discrete values, so for a target level choose the largest $r$ whose coverage still reaches it. The same argument with $\\mathrm{Bin}(n,p)$ gives a distribution-free interval for the $p$-quantile.",
      "## A confidence interval for the cdf at a point",
      "For a fixed $x_0$ the number of observations at most $x_0$ is $\\mathrm{Bin}(n,F(x_0))$. The empirical cdf $\\hat F(x_0)=\\#\\{X_i\\le x_0\\}/n$ is therefore unbiased for $F(x_0)$ with standard error $\\sqrt{F(x_0)(1-F(x_0))/n}$, estimated by $\\sqrt{\\hat F(1-\\hat F)/n}$. An approximate $95\\%$ confidence interval is $\\hat F(x_0)\\pm1.96\\sqrt{\\hat F(1-\\hat F)/n}$.",
      "## How to work the whole problem",
      "1. Drop the observations equal to $m_0$ and count the rest, $n_0$.",
      "2. Count $B$, the observations above $m_0$.",
      "3. One-sided p-value: add the binomial terms $\\binom{n_0}{j}/2^{n_0}$ from $b$ up to $n_0$; two-sided: double the smaller tail.",
      "4. Interval for the median: coverage $=1-2P(\\mathrm{Bin}(n,\\tfrac12)\\le r-1)$ for the interval $(X_{(r)},X_{(n+1-r)})$.",
      "5. cdf at $x_0$: count the observations at most $x_0$, divide by $n$, then add $1.96$ standard errors for the upper limit.",
      "## Typical mistakes",
      "Keeping the observations equal to $m_0$ in $n_0$; using only the upper tail for a two-sided p-value; counting the interval $(X_{(r)},X_{(n+1-r)})$ as having coverage $1-P(\\mathrm{Bin}\\le r-1)$ and forgetting the factor $2$; using the sample size $n$ instead of $n_0$ in the sign test; and treating the efficiency $2/\\pi$ as if the sign test were wrong rather than only less powerful when the data are normal."
    ],
  },
  {
    // 2. Two-sample location: permutation, Wilcoxon rank-sum, Mann-Whitney and Hodges-Lehmann
    samples: [{"workedSeed":"np-2-worked","lqId":"np-lq-lec2"}],
    teach: [
      "## The story the whole lecture is built on",
      "A bakery bakes with a new recipe ($m$ trays, times $X_1,\\dots,X_m$) and an old recipe ($n$ trays, times $Y_1,\\dots,Y_n$). Is the new recipe slower? The lecture answers with tests that do not assume a normal shape, always on the same pooled data of size $N=m+n$.",
      "## The permutation test",
      "If the recipes make no difference the groups are exchangeable: every way of choosing which $m$ of the $N$ pooled values belong to $X$ is equally likely, and there are $\\binom Nm$ of them. Pick a statistic (the difference of means, or a rank sum), compute it for every choice, and the exact p-value is the fraction of choices at least as extreme as the observed one. When $\\binom Nm$ is too large, sample random choices instead (a Monte Carlo permutation test).",
      "## The Wilcoxon rank-sum statistic",
      "Rank the pooled values from $1$ to $N$ and let $W$ be the sum of the ranks of the $X$ values. Large $W$ means $X$ tends to be larger. Under $H_0$, $E[W]=m(N+1)/2$ and $\\mathrm{Var}(W)=mn(N+1)/12$, and the exact null distribution comes from the permutation argument applied to the ranks $1,\\dots,N$. Ties get the average of the ranks they occupy, which changes the variance slightly.",
      "## Mann-Whitney U and the normal approximation",
      "$U=W-m(m+1)/2$ counts the pairs $(X_i,Y_j)$ with $X_i>Y_j$, so $U/(mn)$ estimates $P(X>Y)$. Under $H_0$, $E[U]=mn/2$, $\\mathrm{Var}(U)=mn(N+1)/12$, and $$z=\\frac{U-mn/2}{\\sqrt{mn(N+1)/12}}\\approx N(0,1).$$ The rank-sum and Mann-Whitney tests are the same test.",
      "## Estimating the shift: Hodges-Lehmann",
      "If $Y$ has the same shape as $X$ shifted by $\\Delta$, the Hodges-Lehmann estimate of $\\Delta$ is the median of all $mn$ pairwise differences $X_i-Y_j$. A confidence interval for $\\Delta$ comes from an order-statistic interval of the sorted differences, with its cut-offs taken from the null distribution of $U$.",
      "## Why rank tests",
      "Rank tests need no normality, are not changed by outliers, and lose little power when the data are normal (the Wilcoxon test has efficiency $3/\\pi\\approx0.955$ against the $t$ test). The permutation test with a mean difference keeps the exact level but is sensitive to outliers.",
      "## How to work the whole problem",
      "1. Number of splits: $\\binom Nm$.",
      "2. Rank the pooled data; $W$ = sum of the ranks of $X$.",
      "3. $U=W-m(m+1)/2$.",
      "4. Exact p-value: count the choices of $m$ ranks with sum at least $W$, divide by $\\binom Nm$.",
      "5. $z=(U-mn/2)/\\sqrt{mn(N+1)/12}$.",
      "6. Hodges-Lehmann: list all $mn$ differences $X_i-Y_j$ and take the median.",
      "## Typical mistakes",
      "Ranking each group separately instead of the pooled data; using $W$ instead of $U$ in the $z$ formula; forgetting that with an even number of differences the median is the average of the two middle ones; and ignoring ties when ranking."
    ],
  },
  {
    // 3. Two-sample scale and distribution: Siegel-Tukey, Ansari-Bradley and Kolmogorov-Smirnov
    samples: [{"workedSeed":"np-3-worked","lqId":"np-lq-lec3"}],
    teach: [
      "## The story the whole lecture is built on",
      "Two machines fill packets. After removing any difference in centre, does one machine vary more than the other (a difference of scale), and do the two weight distributions differ at all (a difference of distribution)? The lecture gives rank tests for scale and the Kolmogorov-Smirnov test for the whole distribution, on the same two samples of sizes $m$ and $n$.",
      "## Rank tests for scale",
      "Both tests assume the two samples have the same centre. A scale difference then shows up as one sample sitting in the extremes of the pooled ordering. The rank scores reward extremes and penalise the middle.",
      "The Ansari-Bradley scores give $1$ to both the smallest and the largest value, $2$ to the next smallest and next largest, and so on up to the middle. The statistic $W_{AB}$ is the sum of the scores of the $X$ values; a small sum means $X$ is more spread out.",
      "The Siegel-Tukey scores alternate ends instead: $1$ to the smallest, $2$ and $3$ to the two largest, $4$ and $5$ to the next two smallest, and so on. The statistic $W_{ST}$ is the sum of the scores of $X$, and it is again a rank sum of the numbers $1,\\dots,N$, so the Wilcoxon null distribution applies. A small sum means $X$ is more spread out.",
      "A simple alternative is the ratio of mean absolute deviances $\\mathrm{RMD}=\\{\\sum|X_i-\\mathrm{med}(X)|/m\\}/\\{\\sum|Y_j-\\mathrm{med}(Y)|/n\\}$, whose null distribution is found by permuting the group labels.",
      "## Exact p-value by permutation",
      "Under $H_0$ every choice of $m$ of the scores for $X$ is equally likely, and there are $\\binom Nm$ choices. The exact p-value is the fraction of choices whose sum is at least as extreme as the observed $W_{ST}$.",
      "## The Kolmogorov-Smirnov statistic",
      "The empirical cdf $\\hat F(t)$ is the fraction of the sample at most $t$. The two-sample statistic is $D=\\max_t|\\hat F_X(t)-\\hat F_Y(t)|$, the largest vertical gap, which only needs checking at the pooled data values. Under $H_0$ the scaled statistic $\\sqrt{mn/(m+n)}\\,D$ approximately follows the Kolmogorov distribution (5% critical value $1.36$). The test detects any difference between the distributions, at the price of less power against a particular alternative. The Anderson-Darling and chi-square tests are alternatives for goodness of fit.",
      "## How to work the whole problem",
      "1. Sort the pooled data and assign Ansari-Bradley or Siegel-Tukey scores to the sorted positions.",
      "2. Add the scores of the $X$ values.",
      "3. RMD: median and mean absolute deviance of each sample, then the ratio.",
      "4. Exact p-value: count the choices of $m$ scores whose sum is at most the observed sum, over $\\binom Nm$.",
      "5. KS: compute $\\hat F_X$ and $\\hat F_Y$ at each pooled value, take the largest gap $D$, then scale by $\\sqrt{mn/(m+n)}$.",
      "## Typical mistakes",
      "Using the scale tests when the centres differ; scoring by the original values instead of the sorted positions; counting the Siegel-Tukey scores from the wrong end; checking the KS gap only at the $X$ values instead of every pooled value."
    ],
  },
  {
    // 4. K samples: Kruskal-Wallis, multiple comparisons and ordered alternatives
    samples: [{"workedSeed":"np-4-worked","lqId":"np-lq-lec4"}],
    teach: [
      "## The story the whole lecture is built on",
      "A farm tries three fertiliser doses on plots. Do the doses give different yields, which pairs differ, and do yields rise with the dose? With $K$ groups of sizes $n_1,\\dots,n_K$ and $N=\\sum n_k$ values, the lecture answers all three with rank methods on the same data.",
      "## Kruskal-Wallis: do the K groups differ?",
      "One-way ANOVA needs normal errors with equal variances. The Kruskal-Wallis test keeps the idea but works on ranks. Rank all $N$ values together and let $R_k$ be the rank sum of group $k$. Then $$H=\\frac{12}{N(N+1)}\\sum_{k=1}^K\\frac{R_k^2}{n_k}-3(N+1).$$ Under $H_0$ (all groups have the same distribution) $H$ is approximately $\\chi^2_{K-1}$ when the groups are not tiny; reject when $H$ is large. With $K=3$ there are two degrees of freedom and $P(\\chi^2_2>h)=e^{-h/2}$. Ties use average ranks and a correction that increases $H$ slightly. A permutation F test gives an exact version.",
      "## Multiple comparisons",
      "If the overall test rejects, compare pairs, but running every pairwise test at level $\\alpha$ inflates the chance of at least one false rejection (the family-wise error rate). Bonferroni tests each of the $\\binom K2$ pairs at $\\alpha/\\binom K2$. Fisher's LSD compares pairs at level $\\alpha$ only after a significant overall test. Tukey's HSD controls the family-wise error exactly for normal data, and has rank versions. For rank methods compare the mean ranks: groups $i$ and $j$ differ if $|\\bar R_i-\\bar R_j|$ exceeds $z\\sqrt{\\frac{N(N+1)}{12}\\left(\\frac1{n_i}+\\frac1{n_j}\\right)}$ with $z$ the adjusted normal cut-off.",
      "## Ordered alternatives: Jonckheere-Terpstra",
      "If the alternative is that the groups are ordered ($F_1\\ge F_2\\ge\\dots$ in location), Kruskal-Wallis wastes power. The Jonckheere-Terpstra statistic $J$ counts, over all pairs of groups $i<j$, the pairs $(a,b)$ with $a$ from group $i$, $b$ from group $j$ and $b>a$ (the sum of the Mann-Whitney counts). Under $H_0$, $E[J]=\\dfrac{N^2-\\sum n_k^2}{4}$ and $\\mathrm{Var}(J)=\\dfrac{N^2(2N+3)-\\sum n_k^2(2n_k+3)}{72}$, and $z=(J-E[J])/\\sqrt{\\mathrm{Var}(J)}$ is approximately normal. A large $z$ supports an increasing trend.",
      "## How to work the whole problem",
      "1. Rank all $N$ values together and add up the ranks by group, $R_k$.",
      "2. $H$ from the formula; the p-value is $e^{-H/2}$ for three groups.",
      "3. Pairwise comparison: difference of mean ranks $|R_i/n_i-R_j/n_j|$, compared with an adjusted critical value.",
      "4. $J$: for each pair of groups count the pairs with the later group larger.",
      "5. $z$ for $J$ from $E[J]$ and $\\mathrm{Var}(J)$.",
      "## Typical mistakes",
      "Ranking within each group; using $K$ instead of $K-1$ degrees of freedom; running all pairwise tests at the unadjusted level; counting the Jonckheere-Terpstra pairs in the wrong direction; and using Kruskal-Wallis when the alternative is ordered."
    ],
  },
  {
    // 5. Paired samples and blocks: signed-rank, Friedman, Page, Cochran and Kendall
    samples: [{"workedSeed":"np-5-worked","lqId":"np-lq-lec5"}],
    teach: [
      "## The story the whole lecture is built on",
      "A clinic measures the recovery score of $n$ patients under several treatments. Each patient is a block: patients differ a lot, so comparisons are made within a patient. With two treatments the data are paired; with $k$ treatments they are a randomised block design. The lecture gives rank tests for both, on the same patients.",
      "## Two treatments: sign test and Wilcoxon signed-rank",
      "Take differences $d_i$ (second minus first) and drop zeros. The sign test counts the positive differences, $\\mathrm{Bin}(n,\\tfrac12)$ under no effect. The Wilcoxon signed-rank test also uses the sizes: rank the $|d_i|$ from $1$ to $n$ and let $T^+$ be the sum of the ranks of the positive $d_i$. Under $H_0$ (differences symmetric about $0$) $E[T^+]=n(n+1)/4$ and $\\mathrm{Var}(T^+)=n(n+1)(2n+1)/24$, with $z=(T^+-E[T^+])/\\sqrt{\\mathrm{Var}(T^+)}\\approx N(0,1)$. The exact null distribution comes from the $2^n$ equally likely sign patterns. Ties in $|d_i|$ use average ranks.",
      "## Several treatments: the Friedman test",
      "Rank the $k$ scores within each block from $1$ to $k$ and let $R_j$ be the rank sum of treatment $j$ over the $n$ blocks. Then $$FM=\\frac{12}{nk(k+1)}\\sum_jR_j^2-3n(k+1)$$ is approximately $\\chi^2_{k-1}$ under no treatment difference; for $k=3$, $P(\\chi^2_2>h)=e^{-h/2}$. Kendall's coefficient of concordance $W=FM/\\{n(k-1)\\}$ measures how much the blocks agree on the ordering of treatments, from $0$ (none) to $1$ (identical rankings).",
      "## Other tests for blocks",
      "Page's test uses $PG=\\sum_jjR_j$ and is more powerful against the ordered alternative $t_1\\le\\dots\\le t_k$. Cochran's Q test is the Friedman test for $0/1$ responses; McNemar's test is its version for two treatments. They all follow the same logic of comparing within blocks.",
      "## How to work the whole problem",
      "1. Differences $d_i$ of the first two treatments, ranks of $|d_i|$, then $T^+$.",
      "2. $z=(T^+-n(n+1)/4)/\\sqrt{n(n+1)(2n+1)/24}$.",
      "3. Rank the three scores inside each patient; add up the ranks per treatment.",
      "4. $FM$ from the formula, then $W=FM/\\{n(k-1)\\}$.",
      "5. For $k=3$ the approximate p-value is $e^{-FM/2}$.",
      "## Typical mistakes",
      "Ranking across blocks instead of within blocks in the Friedman test; keeping zero differences in the signed-rank test; ranking the signed differences instead of their absolute values; and using $n$ blocks as the sample size in the degrees of freedom (it is $k-1$)."
    ],
  },
  {
    // 6. Association and trend: Pearson, Spearman and Kendall
    samples: [{"workedSeed":"np-6-worked","lqId":"np-lq-lec6"}],
    teach: [
      "## The story the whole lecture is built on",
      "A teacher records weekly study hours $x_i$ and the test score $y_i$ of $n$ students. Is there an association, and is the score trending up with hours? The lecture measures it three ways on the same data and shows when each is appropriate.",
      "## Pearson correlation",
      "$r=\\dfrac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum(x_i-\\bar x)^2\\sum(y_i-\\bar y)^2}}$ measures linear association. It is sensitive to outliers, only detects linear patterns, and its exact test needs bivariate normality.",
      "## Spearman rank correlation",
      "Rank the $x$ values and the $y$ values separately and let $d_i$ be the difference of the two ranks of student $i$. With no ties $$r_S=1-\\frac{6\\sum d_i^2}{n(n^2-1)},$$ which is Pearson's correlation of the ranks. It measures monotone association (any increasing relation gives $r_S=1$) and is not affected by outliers. A test of independence uses its exact permutation distribution, or $z=r_S\\sqrt{n-1}$ for large $n$.",
      "## Kendall's tau and the trend test",
      "Compare every pair of students $i<j$. The pair is concordant if $(x_i-x_j)(y_i-y_j)>0$ and discordant if it is $<0$. With $C$ and $D$ the counts, $$\\tau=\\frac{C-D}{n(n-1)/2}.$$ The Mann-Kendall trend statistic is $S=C-D$; under no association $E[S]=0$ and $\\mathrm{Var}(S)=n(n-1)(2n+5)/18$ (no ties), and $z=S/\\sqrt{\\mathrm{Var}(S)}$ is approximately normal. Kendall's $\\tau$ has a direct probability meaning, $P(\\text{concordant})-P(\\text{discordant})$, and for bivariate normal data $\\rho=\\sin(\\pi\\tau/2)$.",
      "## How to work the whole problem",
      "1. Pearson $r$ from the three sums $S_{xy},S_{xx},S_{yy}$.",
      "2. Rank $x$ and $y$ separately, take differences, square and add: $\\sum d_i^2$; then $r_S$.",
      "3. List all pairs and count the concordant ($C$) and discordant ($D$) ones.",
      "4. $\\tau=(C-D)/\\{n(n-1)/2\\}$.",
      "5. $z=(C-D)/\\sqrt{n(n-1)(2n+5)/18}$.",
      "## Typical mistakes",
      "Ranking the pairs together instead of $x$ and $y$ separately; using the Spearman formula when there are many ties; dividing by $n^2$ instead of $n(n-1)/2$ for $\\tau$; and reading a small Pearson correlation as no association when the relation is monotone but curved."
    ],
  },
  {
    // 7. The bootstrap: standard errors, bias and simple intervals
    samples: [{"workedSeed":"np-7-worked","lqId":"np-lq-lec7"}],
    teach: [
      "## The story the whole lecture is built on",
      "A statistician computes an estimate $\\hat\\theta$ (here a median) from one sample and needs its standard error, its bias and a confidence interval, but there is no simple formula. The bootstrap supplies them by simulation, using only the data.",
      "## The plug-in principle and resampling",
      "The unknown distribution $F$ is replaced by the empirical cdf $\\hat F_n$, which puts mass $1/n$ on each observation. A bootstrap sample draws $n$ observations from the data with replacement, and the estimate recomputed on it is a bootstrap replicate $\\theta^*$. Repeating $B$ times gives $\\theta^*_1,\\dots,\\theta^*_B$, whose spread imitates the sampling distribution of $\\hat\\theta$.",
      "## Standard error and bias",
      "The bootstrap standard error is the sample standard deviation of the replicates, $\\widehat{\\mathrm{SE}}=\\sqrt{\\frac1{B-1}\\sum(\\theta^*_b-\\overline{\\theta^*})^2}$. The bootstrap bias is $\\overline{\\theta^*}-\\hat\\theta$, and the bias-corrected estimate is $\\hat\\theta-\\widehat{\\mathrm{bias}}=2\\hat\\theta-\\overline{\\theta^*}$.",
      "## Simple intervals",
      "The normal interval is $\\hat\\theta\\pm z\\,\\widehat{\\mathrm{SE}}$ and assumes $\\hat\\theta$ is roughly normal. The percentile interval uses the $\\alpha/2$ and $1-\\alpha/2$ percentiles of the replicates directly; with $B$ replicates the $q$-th percentile is the order statistic number $(B+1)q$ when that is a whole number (for $B=19$, the 5th and 95th percentiles are the smallest and the largest). The basic (residual) interval uses the distribution of $\\theta^*-\\hat\\theta$ to approximate that of $\\hat\\theta-\\theta$: $(2\\hat\\theta-\\theta^*_{(1-\\alpha/2)},\\ 2\\hat\\theta-\\theta^*_{(\\alpha/2)})$. The percentile interval is simple but can be biased; the basic interval corrects for bias and skewness to first order.",
      "## How to work the whole problem",
      "1. Mean and standard deviation of the replicates: the standard error.",
      "2. Bias $=\\overline{\\theta^*}-\\hat\\theta$, corrected estimate $\\hat\\theta-$ bias.",
      "3. Normal interval: $\\hat\\theta\\pm1.645\\,\\widehat{\\mathrm{SE}}$ for 90%.",
      "4. Sort the replicates; read the percentile endpoints.",
      "5. Basic interval: reflect the percentile endpoints about $\\hat\\theta$.",
      "## Typical mistakes",
      "Dividing by $B$ instead of $B-1$ in the standard error; subtracting the bias twice or with the wrong sign; swapping the endpoints in the basic interval; and resampling without replacement."
    ],
  },
  {
    // 8. Bootstrap intervals (bootstrap-t, BCa), bootstrap for regression and tests
    samples: [{"workedSeed":"np-8-worked","lqId":"np-lq-lec8"}],
    teach: [
      "## The story the whole lecture is built on",
      "A regression slope $\\hat\\beta$ has a standard error $\\widehat{\\mathrm{SE}}$ from the usual formula, but its sampling distribution may be skewed. The lecture improves the simple bootstrap intervals, uses the bootstrap for regression and for testing, and shows a case where the bootstrap breaks.",
      "## Bootstrap-t",
      "Studentise each replicate: $t^*=(\\hat\\beta^*-\\hat\\beta)/\\widehat{\\mathrm{SE}}^*$, with $\\widehat{\\mathrm{SE}}^*$ computed from the resample. The percentiles of $t^*$ replace the normal ones: the $1-\\alpha$ interval is $(\\hat\\beta-t^*_{(1-\\alpha/2)}\\widehat{\\mathrm{SE}},\\ \\hat\\beta-t^*_{(\\alpha/2)}\\widehat{\\mathrm{SE}})$, which is not symmetric. It is second-order accurate because $t^*$ is a pivot.",
      "## BCa",
      "The bias-corrected and accelerated interval adjusts the percentile levels: it uses the percentiles at $\\Phi\\big(z_0+\\frac{z_0+z_\\alpha}{1-a(z_0+z_\\alpha)}\\big)$ for $\\alpha$ and $1-\\alpha$, where $z_0=\\Phi^{-1}(\\#\\{\\theta^*<\\hat\\theta\\}/B)$ is the bias constant and $a$ the acceleration constant (from jackknife values, measuring how the standard error changes with the parameter). With $z_0=a=0$ it reduces to the percentile interval.",
      "## Bootstrap for regression and for tests",
      "In a paired (case) bootstrap whole observations $(x_i,y_i)$ are resampled; in a residual bootstrap the fitted line is kept and the residuals are resampled. For a test of $H_0:\\beta=0$ the bootstrap-t p-value is the fraction of replicates with $|t^*|\\ge|t_{\\text{obs}}|$, where $t_{\\text{obs}}=\\hat\\beta/\\widehat{\\mathrm{SE}}$ and the replicates are generated centred at $\\hat\\beta$ (so they imitate the null).",
      "## When the bootstrap fails",
      "In one resample of size $n$ a given observation is missed with probability $(1-1/n)^n\\to e^{-1}\\approx0.368$, so about $63.2\\%$ of the original observations appear. For the sample maximum of a $U(0,\\theta)$ sample the resample maximum equals the sample maximum with probability $1-(1-1/n)^n\\approx0.632$: the bootstrap distribution has a large atom, while the true distribution of the maximum is continuous, so the bootstrap is inconsistent.",
      "## How to work the whole problem",
      "1. Sort the $t^*$ values; take the extremes (for 90% with $B=19$) as the percentiles.",
      "2. Interval: $(\\hat\\beta-t^*_{\\max}\\widehat{\\mathrm{SE}},\\ \\hat\\beta-t^*_{\\min}\\widehat{\\mathrm{SE}})$.",
      "3. $t_{\\text{obs}}=\\hat\\beta/\\widehat{\\mathrm{SE}}$; p-value $=\\#\\{|t^*|\\ge t_{\\text{obs}}\\}/B$.",
      "4. Resample facts: $(1-1/n)^n$ and $1-(1-1/n)^n$.",
      "## Typical mistakes",
      "Using $\\hat\\beta+t^*\\widehat{\\mathrm{SE}}$ instead of subtracting (the percentiles swap sides); testing with the uncentred replicates; resampling residuals when the errors are heteroskedastic; and using the bootstrap for the sample maximum."
    ],
  },
  {
    // 9. Jackknife and statistical functionals
    samples: [{"workedSeed":"np-9-worked","lqId":"np-lq-lec9"}],
    teach: [
      "## The story the whole lecture is built on",
      "You have $n$ measurements and an estimator that is easy to compute but has no simple formula for its bias or standard error (here the variance with divisor $n$). The jackknife answers by recomputing the estimator $n$ times, each time leaving one observation out. The second half of the lecture explains what the estimator really estimates: a functional of the distribution.",
      "## The jackknife",
      "Let $\\hat\\theta$ be computed from all $n$ observations and $\\hat\\theta_{(i)}$ from the sample without observation $i$; let $\\bar\\theta_{(\\cdot)}$ be the mean of the $\\hat\\theta_{(i)}$. Then $$\\widehat{\\mathrm{bias}}_{\\text{jack}}=(n-1)(\\bar\\theta_{(\\cdot)}-\\hat\\theta),\\qquad \\widehat{\\mathrm{SE}}_{\\text{jack}}=\\sqrt{\\frac{n-1}{n}\\sum_i(\\hat\\theta_{(i)}-\\bar\\theta_{(\\cdot)})^2},$$ and the bias-corrected estimate is $\\hat\\theta-\\widehat{\\mathrm{bias}}_{\\text{jack}}=n\\hat\\theta-(n-1)\\bar\\theta_{(\\cdot)}$. For the plug-in variance this correction gives exactly the unbiased variance with divisor $n-1$. The jackknife works for smooth statistics (means, variances, correlations) but fails for non-smooth ones such as the median or the maximum.",
      "## Statistical functionals and the empirical cdf",
      "A parameter is a functional $\\theta=T(F)$ of the distribution (the mean $\\int x\\,dF$, the variance, a quantile). The plug-in estimator is $T(\\hat F_n)$ with $\\hat F_n(t)=\\#\\{x_i\\le t\\}/n$ the empirical cdf. The influence function $L_F(x)=\\lim_{\\varepsilon\\to0}\\{T((1-\\varepsilon)F+\\varepsilon\\delta_x)-T(F)\\}/\\varepsilon$ measures how much one observation at $x$ moves the estimate; for the mean it is $x-\\mu$. It gives the approximation $\\mathrm{Var}(T(\\hat F_n))\\approx E[L_F(X)^2]/n$.",
      "The Dvoretzky-Kiefer-Wolfowitz inequality gives a distribution-free confidence band: with probability at least $1-\\alpha$, $\\sup_t|\\hat F_n(t)-F(t)|\\le\\varepsilon_n=\\sqrt{\\ln(2/\\alpha)/(2n)}$, so the band is $\\hat F_n(t)\\pm\\varepsilon_n$ (clipped to $[0,1]$).",
      "## How to work the whole problem",
      "1. Compute $\\hat\\theta$ from all the data.",
      "2. Compute the $n$ leave-one-out estimates and their mean $\\bar\\theta_{(\\cdot)}$.",
      "3. Bias $=(n-1)(\\bar\\theta_{(\\cdot)}-\\hat\\theta)$; standard error from the formula; corrected estimate $\\hat\\theta-$ bias.",
      "4. DKW half-width: $\\sqrt{\\ln(2/\\alpha)/(2n)}$, with $\\ln 40\\approx3.689$ for $\\alpha=0.05$.",
      "## Typical mistakes",
      "Using the divisor $n$ instead of $n-1$ in the leave-one-out samples' own estimators by mistake (each leave-one-out estimate uses the same formula as $\\hat\\theta$, on $n-1$ points); forgetting the factor $n-1$ in the bias; using the jackknife for the median; and reading the DKW band as pointwise rather than simultaneous."
    ],
  },
  {
    // 10. Kernel density estimation
    samples: [{"workedSeed":"np-10-worked","lqId":"np-lq-lec10"}],
    teach: [
      "## The story the whole lecture is built on",
      "You have a handful of observations and want to draw the density they came from without assuming a family. A histogram depends on bin edges and is jagged; a kernel density estimate places a small bump on every observation and adds them up.",
      "## The estimator",
      "$$\\hat f_h(t)=\\frac1{nh}\\sum_{i=1}^nK\\!\\left(\\frac{t-x_i}{h}\\right),$$ where the kernel $K$ is a density (Gaussian $K(u)=e^{-u^2/2}/\\sqrt{2\\pi}$, box $\\tfrac12\\mathbf 1\\{|u|\\le1\\}$, Epanechnikov $\\tfrac34(1-u^2)$ on $|u|\\le1$) and $h>0$ is the bandwidth. The estimate is itself a density: it integrates to $1$. The choice of kernel matters little; the bandwidth matters a lot.",
      "## Bias-variance trade-off",
      "A small $h$ follows the data closely (low bias, high variance, wiggly); a large $h$ smooths too much (high bias, low variance). The asymptotic mean integrated squared error is $\\mathrm{AMISE}(h)=\\frac{R(K)}{nh}+\\frac{h^4\\sigma_K^4R(f'')}{4}$, minimised at $h\\propto n^{-1/5}$ with AMISE of order $n^{-4/5}$ (slower than the parametric rate $n^{-1}$).",
      "## Choosing the bandwidth",
      "Silverman's rule of thumb for a Gaussian kernel is $h=1.06\\,s\\,n^{-1/5}$ (with $s$ the sample standard deviation; a robust version replaces $s$ by $\\min(s,\\mathrm{IQR}/1.34)$); it is optimal if the data are normal and oversmooths for multimodal data. Cross-validation chooses $h$ to minimise an estimate of the integrated squared error, using only the data. Near the boundary of a bounded support the estimator is biased downwards because part of each bump falls outside; a boundary correction or a reflection fixes it.",
      "## How to work the whole problem",
      "1. Sample standard deviation $s$ (divisor $n-1$), then $h=1.06\\,s\\,n^{-1/5}$.",
      "2. Gaussian kernel: compute $(t-x_i)/h$ for each point, evaluate $K$ and average, dividing by $h$.",
      "3. Box kernel: count the points within $h$ of $t$ and divide by $2nh$.",
      "4. New sample size: scale the bandwidth by $(n/n')^{1/5}$.",
      "## Typical mistakes",
      "Forgetting the division by $h$ (the estimate would not integrate to $1$); using the box kernel's height as $1$ instead of $\\tfrac12$; applying Silverman's rule to strongly bimodal data; and thinking a smaller bandwidth is always better."
    ],
  },
  {
    // 11. Nonparametric regression
    samples: [{"workedSeed":"np-11-worked","lqId":"np-lq-lec11"}],
    teach: [
      "## The story the whole lecture is built on",
      "A scientist has responses $y_i$ at settings $x_i$ and wants the mean response at a new setting $x_0$ without committing to a straight line or a polynomial. The idea is to average (or fit a line to) the responses at nearby settings only.",
      "## Nadaraya-Watson (local constant)",
      "$$\\hat m(x_0)=\\frac{\\sum_iK\\big(\\frac{x_i-x_0}{h}\\big)y_i}{\\sum_iK\\big(\\frac{x_i-x_0}{h}\\big)}$$ is a weighted average of the $y_i$ with weights that decrease with distance from $x_0$. With a box kernel it is the plain average of the $y_i$ in the window $[x_0-h,x_0+h]$; with a Gaussian kernel every point contributes, with weight $e^{-(x_i-x_0)^2/(2h^2)}$.",
      "## Local linear and LOESS",
      "The local linear estimator fits a weighted straight line around $x_0$, minimising $\\sum_iK(\\frac{x_i-x_0}{h})\\{y_i-a-b(x_i-x_0)\\}^2$, and takes $\\hat m(x_0)=\\hat a$. It removes the first-order bias that the local average has when the design is uneven or $x_0$ is near the boundary. LOESS is local linear (or quadratic) regression with a nearest-neighbour window and the tricube weights $w_i=(1-|u_i|^3)^3$ for $|u_i|=|x_i-x_0|/h<1$.",
      "## Bandwidth and dimension",
      "The bandwidth plays the role it has in density estimation: small $h$ gives low bias and high variance, large $h$ the reverse; it is chosen by cross-validation. The rate of convergence worsens with the number of predictors $d$ (the optimal MSE is of order $n^{-4/(4+d)}$): the curse of dimensionality, which makes local averaging useless in high dimension.",
      "## How to work the whole problem",
      "1. Find the points with $|x_i-x_0|\\le h$.",
      "2. Box-kernel Nadaraya-Watson: average their $y_i$.",
      "3. Local linear: least-squares line through those points, evaluated at $x_0$ ($\\hat y=\\bar y+b(x_0-\\bar x)$).",
      "4. Gaussian kernel: compute all weights $e^{-(x_i-x_0)^2/(2h^2)}$ and take $\\sum w_iy_i/\\sum w_i$.",
      "5. Tricube weight of a point: $(1-u^3)^3$ with $u=|x_i-x_0|/h$.",
      "## Typical mistakes",
      "Dividing the weighted sum by $n$ instead of by the sum of weights; evaluating the local line at the window mean instead of at $x_0$; using a window that contains only one distinct $x$; and picking $h$ by looking at the fit rather than by cross-validation."
    ],
  },
  {
    // 12. Statistical modelling for ranking data
    samples: [{"workedSeed":"np-12-worked","lqId":"np-lq-lec12"}],
    teach: [
      "## The story the whole lecture is built on",
      "A taste panel ranks four drinks. Each panelist gives a complete ranking, so the data are permutations. We want a model for how rankings arise, a way to measure how much two rankings disagree, and a rule to turn the panel's rankings into one consensus ranking.",
      "## Distance between rankings",
      "The Kendall distance between two rankings is the number of pairs of items they put in opposite order. It is $0$ for identical rankings and $\\binom m2$ for reversed rankings of $m$ items. It is a metric on permutations and is related to Kendall's $\\tau$ by $\\tau=1-2d/\\binom m2$.",
      "## Plackett-Luce",
      "Give each item a strength $w_i>0$. A ranking is built from the top: choose the best among all items with probability proportional to strength, then the second best among those left, and so on, so $$P(\\pi_1>\\pi_2>\\dots>\\pi_m)=\\prod_{i=1}^{m-1}\\frac{w_{\\pi_i}}{\\sum_{j\\ge i}w_{\\pi_j}}.$$ The strengths are estimated by maximum likelihood. The Thurstone model instead ranks latent scores $U_i=\\mu_i+\\varepsilon_i$ with normal noise.",
      "## Mallows",
      "A distance-based model: with a centre ranking $\\pi_0$ and a dispersion $\\theta>0$, $P(\\pi)=e^{-\\theta d(\\pi,\\pi_0)}/Z(\\theta)$. Rankings far from the centre are less likely. Write $q=e^{-\\theta}$; for three items the six rankings are at Kendall distances $0,1,1,2,2,3$ from the centre, so $Z=1+2q+2q^2+q^3$ and a ranking at distance $d$ has probability $q^d/Z$.",
      "## Borda count",
      "To combine the rankings into one, give an item $m-1$ points for each first place, $m-2$ for each second place, and so on, and add up over the panel; rank the items by their totals. The totals always add up to the number of panelists times $\\binom m2$.",
      "## How to work the whole problem",
      "1. Kendall distance: count the pairs of items ordered differently by the two rankings.",
      "2. Plackett-Luce: multiply the successive choice probabilities $w/\\text{(sum of strengths of the items left)}$ down the ranking.",
      "3. Mallows: compute $Z=\\sum_\\pi q^{d(\\pi,\\pi_0)}$, then $q^d/Z$ for the ranking of interest.",
      "4. Borda: points by position, added over the panel; the largest total wins.",
      "## Typical mistakes",
      "Counting positions that differ instead of pairs in opposite order; including the last choice (probability $1$) incorrectly in the Plackett-Luce product; forgetting that several rankings share a distance when computing $Z$; and giving Borda points in the wrong direction."
    ],
  },
]

export default lessons
