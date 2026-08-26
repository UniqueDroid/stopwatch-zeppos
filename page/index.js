// Local stopwatch. No network. Uses setInterval for the running timer and
// tracks laps in memory (a lap list would need scrolling UI, kept simple).
import * as hmUI from '@zos/ui'
import { DEVICE_WIDTH, DEVICE_HEIGHT } from '../utils/config/device'

Page({
  state: {},
  build() {
    try { this.buildUi() } catch (e) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 10, y: 10, w: DEVICE_WIDTH - 20, h: DEVICE_HEIGHT - 20,
        color: 0xff5555, text_size: 22, text_style: hmUI.text_style.WRAP,
        text: 'build() error:\n' + (e && (e.stack || e.message) || String(e)),
      })
    }
  },

  buildUi() {
    this.running = false
    this.ms = 0
    this.laps = []
    this.lapLines = []
    this.tickHandle = null
    this.lastTs = 0

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 20, y: 30, w: DEVICE_WIDTH - 40, h: 40,
      color: 0xffffff, text_size: 28, align_h: hmUI.align.CENTER_H, text: 'Stopwatch',
    })

    this.timeText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 20, y: 90, w: DEVICE_WIDTH - 40, h: 80,
      color: 0x00e5ff, text_size: 56, align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V, text: '00:00.00',
    })

    this.lapText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 20, y: 175, w: DEVICE_WIDTH - 40, h: 70,
      color: 0xcccccc, text_size: 18, text_style: hmUI.text_style.WRAP, text: '',
    })

    this.makeButton('Start', 250, () => this.toggle())
    this.makeButton('Lap', 330, () => this.lap())
    this.makeButton('Reset', 410, () => this.reset())
  },

  makeButton(label, y, onClick) {
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: (DEVICE_WIDTH - 300) / 2, y, w: 300, h: 60, radius: 12,
      normal_color: 0x3a3a3a, press_color: 0x555555,
      text_size: 26, color: 0xffffff, text: label, click_func: onClick,
    })
  },

  toggle() {
    if (this.running) this.pause()
    else this.start()
  },

  start() {
    this.running = true
    this.lastTs = Date.now()
    this.tickHandle = setInterval(() => this.tick(), 50)
  },

  pause() {
    this.running = false
    if (this.tickHandle) clearInterval(this.tickHandle)
    this.tickHandle = null
  },

  reset() {
    this.pause()
    this.ms = 0
    this.laps = []
    this.render()
    this.lapText.setProperty(hmUI.prop.TEXT, '')
  },

  lap() {
    if (!this.running) return
    this.laps.push(this.ms)
    const n = this.laps.length
    const prev = n > 1 ? this.laps[n - 2] : 0
    const line = 'L' + n + '  ' + this.fmt(this.ms - prev)
    this.lapLines.unshift(line)
    if (this.lapLines.length > 3) this.lapLines.pop()
    this.lapText.setProperty(hmUI.prop.TEXT, this.lapLines.join('\n'))
  },

  tick() {
    const now = Date.now()
    this.ms += now - this.lastTs
    this.lastTs = now
    this.render()
  },

  fmt(ms) {
    const totalCs = Math.floor(ms / 10)
    const cs = totalCs % 100
    const totalS = Math.floor(totalCs / 100)
    const s = totalS % 60
    const m = Math.floor(totalS / 60)
    const p = (v, l) => (v < 10 ? '0'.repeat(l - 1) : '') + v
    return p(m, 2) + ':' + p(s, 2) + '.' + p(cs, 2)
  },

  render() {
    this.timeText.setProperty(hmUI.prop.TEXT, this.fmt(this.ms))
  },

  onDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle)
  },
})
