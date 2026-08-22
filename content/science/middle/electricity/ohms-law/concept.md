---
title: 옴의 법칙
level: middle
order: 3
prev:
  - science/middle/electricity/current-and-voltage
next:
  - science/high/electromagnetism/electromagnetic-induction
---

## 법칙

전류는 전압에 비례하고 저항에 반비례한다.

$$V = IR \quad (V: \text{전압},\ I: \text{전류},\ R: \text{저항})$$

**저항**은 전류의 흐름을 방해하는 정도로, 단위는 옴($\Omega$)이다. 같은 전압이라도 저항이 크면 전류가 적게 흐른다.

## 저항의 연결

- **직렬 연결**: 전체 저항이 커진다 — $R = R_1 + R_2$
- **병렬 연결**: 전체 저항이 작아진다 — $\dfrac{1}{R} = \dfrac{1}{R_1} + \dfrac{1}{R_2}$

## 왜 중요한가

회로 계산의 뼈대가 되는 식이다. 그래프로 그리면 전압–전류 관계가 **원점을 지나는 직선**(기울기 = $\dfrac{1}{R}$)이 되는데, 수학의 일차함수가 과학에서 그대로 쓰이는 대표적인 장면이다.

## 예제와 풀이

**예제 1 (기본).** 저항이 10 $\Omega$인 전구에 5 V의 전압을 걸었다. 이때 전구에 흐르는 전류의 세기를 구하시오.

**풀이.** $V = IR$에서

$$I = \dfrac{V}{R} = \dfrac{5}{10} = 0.5\ \text{A}$$

전류의 세기는 0.5 A이다.

**예제 2 (응용).** 저항 6 $\Omega$과 3 $\Omega$을 병렬로 연결하고 전체에 6 V의 전압을 걸었다. 전체 저항과 회로에 흐르는 전체 전류를 구하시오.

**풀이.** 병렬 연결이므로

$$\dfrac{1}{R} = \dfrac{1}{6} + \dfrac{1}{3} = \dfrac{1}{6} + \dfrac{2}{6} = \dfrac{3}{6} = \dfrac{1}{2}$$

따라서 전체 저항은 $R = 2\ \Omega$이다.

전체 전류는 $I = \dfrac{V}{R} = \dfrac{6}{2} = 3\ \text{A}$이다.

검산: 각 저항에 걸리는 전압은 병렬이므로 모두 6 V로 같다. $I_1 = \dfrac{6}{6} = 1\ \text{A}$, $I_2 = \dfrac{6}{3} = 2\ \text{A}$이고, $I_1 + I_2 = 1 + 2 = 3\ \text{A}$로 전체 전류와 일치한다.
