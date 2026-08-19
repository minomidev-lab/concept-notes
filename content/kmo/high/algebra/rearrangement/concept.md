---
title: 재배열 부등식
level: high
order: 3
prev:
  - kmo/high/algebra/cauchy-schwarz
---

## 정리

실수열 $a_1 \le a_2 \le \cdots \le a_n$과 $b_1 \le b_2 \le \cdots \le b_n$이 주어졌을 때, $b$의 임의의 순열 $b_{\sigma(1)}, \ldots, b_{\sigma(n)}$에 대해

$$\sum_{i=1}^n a_i b_{n+1-i} \;\le\; \sum_{i=1}^n a_i b_{\sigma(i)} \;\le\; \sum_{i=1}^n a_i b_i$$

가 성립한다. 즉 **같은 순서로 짝지을 때 곱의 합이 최대**가 되고, **역순으로 짝지을 때 최소**가 된다는 것이 **재배열 부등식**이다. 인접한 두 항을 맞바꾸면 곱의 합이 늘거나 줄지 않는다는 사실로 증명되며, 임의의 순열은 인접한 항끼리의 교환을 반복해 얻을 수 있으므로 정렬된 배치가 양 끝의 극값을 준다.

같은 정렬 조건 아래에서는 평균의 곱보다 곱의 평균이 크다는 **체비쇼프 부등식** $\dfrac{1}{n}\sum a_i b_i \ge \left(\dfrac1n\sum a_i\right)\left(\dfrac1n\sum b_i\right)$도 재배열 부등식으로부터 유도된다.

## 언제 쓰는가

AM-GM은 합과 곱을 오가는 부등식이고, 코시-슈바르츠는 제곱합 사이의 관계를 다룬다. 이에 비해 재배열 부등식은 **항을 짝짓는 순서 자체가 변수**인 문제, 특히 순환 형태의 분수식이나 순열이 관여하는 부등식에서 위력을 발휘한다.

**예제.** $a,b,c>0$일 때 $\dfrac{a}{b}+\dfrac{b}{c}+\dfrac{c}{a} \ge 3$임을 보여라.

**풀이 스케치.** (AM-GM) 세 양수의 산술평균은 기하평균 이상이므로

$$\frac{a}{b}+\frac{b}{c}+\frac{c}{a} \ge 3\sqrt[3]{\frac{a}{b}\cdot\frac{b}{c}\cdot\frac{c}{a}} = 3\sqrt[3]{1} = 3.$$

(재배열) 일반성을 잃지 않고 $a\ge b\ge c$라 하면 $\dfrac1a \le \dfrac1b \le \dfrac1c$이므로 $(a,b,c)$와 $\left(\dfrac1a,\dfrac1b,\dfrac1c\right)$는 서로 반대 순서로 정렬돼 있다. 이 경우 두 수열을 그대로 짝지은 합 $a\cdot\frac1a+b\cdot\frac1b+c\cdot\frac1c=3$이 어떤 순열로 짝지어도 나오는 곱의 합 중 **최솟값**이므로, 순환 짝짓기에 해당하는 $\dfrac{a}{b}+\dfrac{b}{c}+\dfrac{c}{a}$ 역시 이 값 이상이다.

코시-슈바르츠가 제곱합의 곱에서 하한을 끌어냈다면, 재배열 부등식은 **정렬 순서 자체에서 오는 극값**을 직접 포착한다. 두 부등식과 AM-GM 중 무엇을 꺼낼지 가늠하는 감각이 KMO 대수 부등식 문제 풀이의 절반을 차지한다.
