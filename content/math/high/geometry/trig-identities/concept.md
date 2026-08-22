---
title: 삼각함수의 덧셈정리
level: high
order: 5
prev:
  - math/high/geometry/trig-graphs
---

## 덧셈정리

두 각의 합이나 차에 대한 삼각함수 값은 각각의 삼각함수 값으로 다음과 같이 나타낼 수 있다.

$$\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta$$

$$\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta$$

부호 $\pm$과 $\mp$는 서로 반대로 대응한다는 점에 주의해야 한다. 이 공식 덕분에 $15°, 75°$처럼 특수각이 아닌 각도라도 두 특수각의 합이나 차로 나타낼 수 있으면 정확한 값을 계산할 수 있다.

## 배각 공식

덧셈정리에서 $\beta=\alpha$를 대입하면 **배각 공식**을 얻는다.

$$\sin 2\theta = 2\sin\theta\cos\theta$$

$$\cos 2\theta = \cos^2\theta - \sin^2\theta = 2\cos^2\theta - 1 = 1 - 2\sin^2\theta$$

$\cos 2\theta$가 세 가지 형태로 표현되는 것은 $\sin^2\theta + \cos^2\theta = 1$을 이용해 서로 바꿔 쓸 수 있기 때문이며, 상황에 따라 편리한 형태를 골라 쓴다.

## 예제

$\sin 75°$의 값을 구해 보자. $75° = 45° + 30°$이므로 덧셈정리를 적용하면

$$\sin 75° = \sin 45°\cos 30° + \cos 45°\sin 30° = \dfrac{\sqrt{2}}{2}\cdot\dfrac{\sqrt{3}}{2} + \dfrac{\sqrt{2}}{2}\cdot\dfrac{1}{2} = \dfrac{\sqrt{6}+\sqrt{2}}{4}$$

삼각함수의 그래프가 주기 현상을 시각적으로 보여 주었다면, 덧셈정리는 그 값들 사이의 관계를 대수적으로 계산하는 도구다. 배각 공식은 이후 적분에서 $\sin^2\theta$, $\cos^2\theta$ 꼴을 처리할 때도 핵심적으로 쓰인다.
