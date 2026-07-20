/**
 * breathing-dot.js
 * -----------------------------------------------------------------------
 * 숨쉬는 듯 살아있는 유기적 점 애니메이션 (SVG, 의존성 없음)
 *
 * 사용법
 * ------
 *   <div id="breathing-dot" style="width:220px; height:220px;"></div>
 *   <script type="module">
 *     import { mountBreathingDot } from './breathing-dot.js';
 *
 *     const instance = mountBreathingDot(
 *       document.getElementById('breathing-dot'),
 *       { color: '#111111' }           // 옵션은 전부 선택사항, 아래 DEFAULTS 참고
 *     );
 *
 *     // 필요할 때 정지 + 정리 (예: SPA에서 페이지 전환 시)
 *     // instance.destroy();
 *   </script>
 *
 * 컨테이너 요소의 width/height(또는 CSS로 지정한 크기)에 맞춰
 * SVG가 자동으로 채워집니다. 반응형으로 쓰려면 컨테이너 크기만
 * %, vw 등으로 조절하면 됩니다.
 * -----------------------------------------------------------------------
 */

const DEFAULTS = {
  color: "#111111", // 점 색상
  ringColor1: "rgba(17,17,17,0.35)",
  ringColor2: "rgba(17,17,17,0.15)",

  baseRadius: 14, // 숨을 내쉬었을 때 반지름
  peakRadius: 27, // 숨을 들이쉬었을 때 반지름

  driftRangeX: 26, // 목표 지점이 좌우로 떠다니는 범위(px, viewBox 기준)
  driftRangeY: 20, // 목표 지점이 상하로 떠다니는 범위(px, viewBox 기준)

  noiseAmp: [0.045, 0.025, 0.015], // 블롭 울렁임 강도 (harmonic 3겹)

  lag: 0.06, // 실제 위치가 목표 지점을 따라가는 속도 (작을수록 무겁게 끌려감)
  stretchK: 0.3, // 이동 방향으로 늘어나는 정도 (0 = 끔)
  stretchMaxSpeed: 1.6, // 이 속도(px/frame) 이상부터 늘어남이 최대치로 고정

  viewBoxSize: 220, // 내부 좌표계 크기 (보통 안 건드려도 됨)
}

/**
 * @param {HTMLElement} container - 애니메이션을 렌더링할 빈 요소
 * @param {Partial<typeof DEFAULTS>} options - DEFAULTS 중 원하는 값만 덮어쓰기
 * @returns {{ destroy: () => void }}
 */
export function mountBreathingDot(container, options = {}) {
  const cfg = { ...DEFAULTS, ...options }
  const V = cfg.viewBoxSize
  const CX = V / 2,
    CY = V / 2

  const svgNS = "http://www.w3.org/2000/svg"
  const svg = document.createElementNS(svgNS, "svg")
  svg.setAttribute("viewBox", `0 0 ${V} ${V}`)
  svg.setAttribute("width", "100%")
  svg.setAttribute("height", "100%")
  svg.setAttribute("role", "img")
  svg.setAttribute("aria-label", "breathing dot animation")
  svg.style.display = "block"

  const ring2 = document.createElementNS(svgNS, "circle")
  const ring1 = document.createElementNS(svgNS, "circle")
  const blob = document.createElementNS(svgNS, "path")

  ring2.setAttribute("fill", "none")
  ring2.setAttribute("stroke", cfg.ringColor2)
  ring2.setAttribute("stroke-width", "1")
  ring1.setAttribute("fill", "none")
  ring1.setAttribute("stroke", cfg.ringColor1)
  ring1.setAttribute("stroke-width", "1")
  blob.setAttribute("fill", cfg.color)

  svg.append(ring2, ring1, blob)
  container.innerHTML = ""
  container.appendChild(svg)

  // ---- 내부 헬퍼 ----
  const jitter = () => 1 + (Math.random() - 0.5) * 0.06
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  function noise(angle, t, seed) {
    return (
      cfg.noiseAmp[0] * Math.sin(angle * 3 + t * 0.6 + seed) +
      cfg.noiseAmp[1] * Math.sin(angle * 5 - t * 0.9 + seed * 1.7) +
      cfg.noiseAmp[2] * Math.sin(angle * 7 + t * 0.35 + seed * 2.3)
    )
  }

  // 완전한 원이 아닌, 8개 제어점을 노이즈로 흔든 유기적 블롭 경로.
  // stretchAngle/stretchAmount로 이동 방향 squash & stretch 적용.
  function blobPath(cx, cy, r, t, seed, stretchAngle, stretchAmount) {
    const n = 8
    const pts = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const base = r * (1 + noise(a, t, seed))
      const stretch = 1 + stretchAmount * Math.cos(2 * (a - stretchAngle))
      const rad = Math.max(base * stretch, 0)
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad])
    }
    const start = mid(pts[n - 1], pts[0])
    let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`
    for (let i = 0; i < n; i++) {
      const p = pts[i]
      const nx = pts[(i + 1) % n]
      const m = mid(p, nx)
      d += ` Q ${p[0].toFixed(2)} ${p[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`
    }
    return d + " Z"
  }

  // ---- 호흡 상태 (in -> hold -> out -> pause, 매 사이클 길이가 살짝 달라짐) ----
  let phase = "in"
  let phaseStart = performance.now()
  let inDur = 2600 * jitter()
  let holdDur = 300 * jitter()
  let outDur = 1900 * jitter()
  let pauseDur = 450 * jitter()

  // ---- 목표 지점 드리프트 ----
  const mainDrift = { x: [0, 0], y: [0, 0], start: performance.now(), dur: 3000 }
  function retarget(d, rx, ry) {
    d.x = [d.x[1] || 0, (Math.random() - 0.5) * rx]
    d.y = [d.y[1] || 0, (Math.random() - 0.5) * ry]
    d.start = performance.now()
    d.dur = 2600 + Math.random() * 2200
  }
  retarget(mainDrift, cfg.driftRangeX, cfg.driftRangeY)
  retarget(mainDrift, cfg.driftRangeX, cfg.driftRangeY)
  function driftPos(d, now, cx0, cy0, rx, ry) {
    const p = Math.min((now - d.start) / d.dur, 1)
    const e = easeInOut(p)
    const x = cx0 + d.x[0] + (d.x[1] - d.x[0]) * e
    const y = cy0 + d.y[0] + (d.y[1] - d.y[0]) * e
    if (p >= 1) retarget(d, rx, ry)
    return [x, y]
  }

  const seed = Math.random() * 1000
  let renderX = CX,
    renderY = CY
  let prevX = CX,
    prevY = CY
  let rafId = null

  function frame(now) {
    const t = now / 1000

    // 호흡: 반지름 + 링 투명도
    const el = now - phaseStart
    let r, op1, op2
    if (phase === "in") {
      const p = Math.min(el / inDur, 1),
        e = easeInOut(p)
      r = cfg.baseRadius + e * (cfg.peakRadius - cfg.baseRadius)
      op1 = e * 0.55
      op2 = e * 0.28
      if (p >= 1) {
        phase = "hold"
        phaseStart = now
        holdDur = 300 * jitter()
      }
    } else if (phase === "hold") {
      const p2 = Math.min(el / holdDur, 1)
      r = cfg.peakRadius + Math.sin(p2 * Math.PI * 3) * 0.6
      op1 = 0.55 + Math.sin(p2 * Math.PI * 3) * 0.05
      op2 = 0.28
      if (p2 >= 1) {
        phase = "out"
        phaseStart = now
        outDur = 1900 * jitter()
      }
    } else if (phase === "out") {
      const p3 = Math.min(el / outDur, 1),
        e3 = easeInOut(p3)
      r = cfg.peakRadius - e3 * (cfg.peakRadius - cfg.baseRadius)
      op1 = 0.55 - e3 * 0.55
      op2 = 0.28 - e3 * 0.28
      if (p3 >= 1) {
        phase = "pause"
        phaseStart = now
        pauseDur = 450 * jitter()
      }
    } else {
      const p4 = Math.min(el / pauseDur, 1)
      r = cfg.baseRadius + Math.sin(p4 * Math.PI * 2) * 0.4
      op1 = 0
      op2 = 0
      if (p4 >= 1) {
        phase = "in"
        phaseStart = now
        inDur = 2600 * jitter()
      }
    }

    // 목표 지점 + 지연 추적(끌려가는 모션)
    const [tx, ty] = driftPos(mainDrift, now, CX, CY, cfg.driftRangeX, cfg.driftRangeY)
    prevX = renderX
    prevY = renderY
    renderX += (tx - renderX) * cfg.lag
    renderY += (ty - renderY) * cfg.lag

    const vx = renderX - prevX,
      vy = renderY - prevY
    const speed = Math.sqrt(vx * vx + vy * vy)
    const speedNorm = Math.min(speed / cfg.stretchMaxSpeed, 1)
    const stretchAngle = speed > 0.001 ? Math.atan2(vy, vx) : 0
    const stretchAmount = cfg.stretchK * speedNorm

    blob.setAttribute("d", blobPath(renderX, renderY, r, t, seed, stretchAngle, stretchAmount))

    ring1.setAttribute("cx", renderX.toFixed(2))
    ring1.setAttribute("cy", renderY.toFixed(2))
    ring1.setAttribute("r", (r + 6).toFixed(2))
    ring1.style.opacity = op1.toFixed(2)

    ring2.setAttribute("cx", renderX.toFixed(2))
    ring2.setAttribute("cy", renderY.toFixed(2))
    ring2.setAttribute("r", (r + 13).toFixed(2))
    ring2.style.opacity = op2.toFixed(2)

    rafId = requestAnimationFrame(frame)
  }
  rafId = requestAnimationFrame(frame)

  return {
    destroy() {
      if (rafId !== null) cancelAnimationFrame(rafId)
      container.innerHTML = ""
    },
  }
}
