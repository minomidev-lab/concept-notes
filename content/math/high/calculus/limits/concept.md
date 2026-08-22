---
title: 함수의 극한
level: high
order: 1
prev:
  - math/middle/functions/quadratic-function
next:
  - math/high/calculus/derivative
  - math/high/sequences/series
---

## 직관적 정의

$x$가 $a$에 한없이 가까워질 때 $f(x)$가 일정한 값 $L$에 가까워지면,

$$\lim_{x \to a} f(x) = L$$

이라 쓰고 "$x \to a$일 때 $f(x)$의 극한값은 $L$"이라고 한다.

## 예

$f(x) = x^2$에서 $x \to 2$이면 $f(x) \to 4$:

$$\lim_{x \to 2} x^2 = 4$$

## 왜 배우나

중학교에서 배운 일차·이차함수는 "값을 넣으면 값이 나오는" 대응이었다. 극한은 여기에 **"한없이 가까워진다"**는 관점을 더해, 순간변화율(미분)과 넓이(적분)로 가는 문을 연다.

## 예제와 풀이

**예제 1 (기본).** $\displaystyle\lim_{x \to 3} (2x+1)$의 값을 구하시오.

**풀이.** $f(x) = 2x+1$은 모든 실수에서 연속이므로 $x=3$을 그대로 대입할 수 있다. $2 \times 3 + 1 = 7$. 답: $7$.

**예제 2 (응용).** $\displaystyle\lim_{x \to 1} \dfrac{x^2-1}{x-1}$의 값을 구하시오.

**풀이.** $x=1$을 그대로 대입하면 $\dfrac{0}{0}$ 꼴이 되어 인수분해가 필요하다. $x^2-1 = (x-1)(x+1)$이므로

$$\dfrac{x^2-1}{x-1} = \dfrac{(x-1)(x+1)}{x-1} = x+1 \quad (x \neq 1)$$

따라서 $\displaystyle\lim_{x \to 1} \dfrac{x^2-1}{x-1} = \lim_{x \to 1}(x+1) = 2$. 답: $2$.
