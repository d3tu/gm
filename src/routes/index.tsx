import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { isServer } from  "@builder.io/qwik/build"

export default component$(() => {
  const canvasEl = useSignal<HTMLCanvasElement>()

  useTask$(async ({ track, cleanup }) => {
    const canvas = track(() => canvasEl.value)
    if (isServer) return
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let running = true
    let fps = 0
    let showFPS = true
    let lastTime = 0
    let x = 0
    let y = 0
    const loadSprite = async (src: string) => {
      const img = new Image()
      img.src = src
      await img.decode()
      return img
    }
    const enemy = await loadSprite("/enemy.png")
    const projectil = await loadSprite("/projectil.png")
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    const renderFPS = () => {
      ctx.fillStyle = "white"
      ctx.font = "12px monospace"
      ctx.fillText(fps.toFixed(0) + "FPS", 12, 12)
    }
    const mouseMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      x = ev.clientX - rect.left
      y = ev.clientY - rect.top
    }
    const drawRotated = (img: HTMLImageElement, x: number, y: number, angle: number) => {
      ctx.setTransform(1, 0, 0, 1, x, y)
      ctx.rotate(angle)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
    class Tgt {
      constructor(public x: number, public y: number, public speed: number) {}
      moveTo(x: number, y: number) {
        var dx = x - this.x
        var dy = y - this.y
        var distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 1) {
          var angle = Math.atan2(dy, dx)
          this.x += Math.cos(angle) * this.speed
          this.y += Math.sin(angle) * this.speed
        }
      }
      draw() {
        drawRotated(projectil, this.x, this.y, Math.atan2(this.y, this.x))
      }
    }
    const tgt = new Tgt(100, 100, 10)
    document.addEventListener("mousemove", mouseMove)
    window.addEventListener("resize", resize)
    window.requestAnimationFrame(function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(enemy, 50, 50, 128, 128)
      // ctx.save()
      // ctx.translate(100, 100)
      // ctx.rotate(90 * Math.PI / 180)
      // ctx.translate(-100, -100)
      // ctx.drawImage(projectil, 100, 100, 64, 64)
      // ctx.restore()
      tgt.moveTo(x, y)
      tgt.draw()
      if (showFPS) {
        renderFPS()
        const time = performance.now()
        fps = 1 / ((time - lastTime) / 1000)
        lastTime = time
      }
      if (running) window.requestAnimationFrame(frame)
    })
    cleanup(() => {
      running = false
      window.removeEventListener("resize", resize)
      document.removeEventListener("mousemove", mouseMove)
    })
  }, { eagerness: "load" })

  return (
    <>
      <canvas ref={canvasEl}></canvas>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
