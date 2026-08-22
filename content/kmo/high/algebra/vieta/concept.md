---
title: 다항식과 비에타 정리
level: high
order: 4
prev:
  - kmo/middle/algebra/identities
---

## 이차방정식의 근과 계수

이차방정식 $ax^2+bx+c=0$ ($a\neq0$)의 두 근을 $\alpha,\beta$라 하면

$$\alpha+\beta = -\dfrac{b}{a}, \qquad \alpha\beta = \dfrac{c}{a}$$

가 성립한다. 이를 **비에타 정리**(근과 계수의 관계)라 한다. 근을 직접 구하지 않아도 두 근의 대칭식은 $\alpha+\beta$와 $\alpha\beta$만으로 표현할 수 있는데, 대표적으로

$$\alpha^2+\beta^2 = (\alpha+\beta)^2 - 2\alpha\beta$$

가 있다. 두 근의 곱과 합만 알면 제곱합, 세제곱합 같은 대칭식의 값을 방정식을 풀지 않고 계산할 수 있다는 것이 비에타 정리의 실전적 가치다.

## 삼차방정식으로의 확장

삼차방정식 $ax^3+bx^2+cx+d=0$의 세 근을 $\alpha,\beta,\gamma$라 하면

$$\alpha+\beta+\gamma = -\dfrac{b}{a}, \qquad \alpha\beta+\beta\gamma+\gamma\alpha = \dfrac{c}{a}, \qquad \alpha\beta\gamma = -\dfrac{d}{a}$$

가 성립한다. 세 값 $\sum\alpha,\ \sum\alpha\beta,\ \alpha\beta\gamma$는 각각 세 근의 **기본 대칭식**(elementary symmetric polynomial)이며, 근의 개수가 늘어나도 부호가 교대로 바뀌며 같은 패턴으로 이어진다.

**예제.** $x^3-6x^2+11x-6=0$의 세 근 $\alpha,\beta,\gamma$에 대해 $\alpha^2+\beta^2+\gamma^2$의 값을 구하여라.

**풀이 스케치.** 비에타 정리에서 $\alpha+\beta+\gamma=6$, $\alpha\beta+\beta\gamma+\gamma\alpha=11$이다. 제곱합은 기본 대칭식으로

$$\alpha^2+\beta^2+\gamma^2 = (\alpha+\beta+\gamma)^2 - 2(\alpha\beta+\beta\gamma+\gamma\alpha) = 6^2 - 2\cdot11 = 36-22=14$$

로 계산된다. 실제로 $x^3-6x^2+11x-6=(x-1)(x-2)(x-3)$이므로 세 근은 $1,2,3$이고 $1^2+2^2+3^2=1+4+9=14$로 검산이 일치한다.

인수분해 항등식이 특정한 식의 변형을 다뤘다면, 비에타 정리는 방정식의 계수만으로 근들의 대칭식 전체를 통제하는 더 일반적인 도구다.
