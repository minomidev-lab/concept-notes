---
title: 삼각함수
level: high
order: 1
prev:
  - math/middle/geometry/pythagorean-theorem
next:
  - math/high/geometry/trig-graphs
---

## 삼각비의 정의

직각삼각형에서 한 예각 $\theta$에 대해 변의 길이의 비를 다음과 같이 정의하고, 이를 통틀어 **삼각함수**라고 한다.

$$\sin\theta = \dfrac{\text{높이}}{\text{빗변}}, \quad \cos\theta = \dfrac{\text{밑변}}{\text{빗변}}, \quad \tan\theta = \dfrac{\text{높이}}{\text{밑변}}$$

## 특수각의 삼각비

자주 쓰이는 30°, 45°, 60°에 대한 삼각비의 값은 다음과 같다.

| $\theta$ | $30°$ | $45°$ | $60°$ |
|---|---|---|---|
| $\sin\theta$ | $\dfrac{1}{2}$ | $\dfrac{\sqrt{2}}{2}$ | $\dfrac{\sqrt{3}}{2}$ |
| $\cos\theta$ | $\dfrac{\sqrt{3}}{2}$ | $\dfrac{\sqrt{2}}{2}$ | $\dfrac{1}{2}$ |
| $\tan\theta$ | $\dfrac{\sqrt{3}}{3}$ | $1$ | $\sqrt{3}$ |

이렇게 정의된 삼각비는 예각의 범위를 넘어 **단위원**을 이용하면 0°부터 360°, 나아가 모든 실수 각으로 그 정의역을 확장할 수 있다.

## 피타고라스 정리와의 관계

단위원 위의 점의 좌표를 $(\cos\theta, \sin\theta)$로 나타내면, 반지름이 1인 원 위의 점이 원점으로부터 항상 거리 1을 유지한다는 사실로부터 다음 관계식이 성립한다.

$$\sin^2\theta + \cos^2\theta = 1$$

이는 직각삼각형에서 빗변을 1로 둔 피타고라스 정리 $a^2 + b^2 = c^2$를 삼각비로 다시 쓴 것과 같다. 즉 중학교에서 배운 변의 길이 사이의 관계가 고등학교에서는 각과 비율의 관계로 확장되어 이어진다.

## 예제와 풀이

**예제 1 (기본).** 빗변의 길이가 $13$, 밑변의 길이가 $5$, 높이가 $12$인 직각삼각형에서 예각 $\theta$에 대한 $\sin\theta$, $\cos\theta$, $\tan\theta$의 값을 구하시오.

**풀이.** 삼각비의 정의에 따라

$$\sin\theta=\dfrac{12}{13}, \quad \cos\theta=\dfrac{5}{13}, \quad \tan\theta=\dfrac{12}{5}$$

**예제 2 (응용).** 예각 $\theta$에 대해 $\sin\theta=\dfrac{3}{5}$일 때, $\cos\theta$와 $\tan\theta$의 값을 구하시오.

**풀이.** $\sin^2\theta+\cos^2\theta=1$이고 $\theta$가 예각이므로 $\cos\theta>0$이다.

$$\cos\theta = \sqrt{1-\left(\dfrac{3}{5}\right)^2} = \sqrt{\dfrac{16}{25}} = \dfrac{4}{5}$$

따라서

$$\tan\theta = \dfrac{\sin\theta}{\cos\theta} = \dfrac{3/5}{4/5} = \dfrac{3}{4}$$
