// Stopwatch UI: neon digital readout, last-lap sub-display, 4-row lap list.
// Local only, no network. Uses setInterval for the running timer.
import * as hmUI from '@zos/ui'
import { DEVICE_WIDTH, DEVICE_HEIGHT } from '../utils/config/device'

const MARGIN = 24
const BTN_GAP = 21
const BTN_W = Math.floor((DEVICE_WIDTH - 2 * MARGIN - 2 * BTN_GAP) / 3)
const BTN_H = 60
const ROW_H = 55

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
    this.lastLapMs = 0
    this.tickHandle = null
    this.lastTs = 0

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0, y: 0, w: DEVICE_WIDTH, h: DEVICE_HEIGHT, color: 0x0a0a0c,
    })

    // Main MM:SS readout, neon green
    this.timeMainText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 30, y: 40, w: 240, h: 70,
      color: 0x39ff14, text_size: 60,
      align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V, text: '00:00',
    })

    // Hundredths, smaller, left-aligned right after the main readout
    this.timeMsText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 275, y: 54, w: 120, h: 50,
      color: 0x39ff14, text_size: 38,
      align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V, text: '.00',
    })

    // Sub-display: status / last lap
    this.subText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0, y: 115, w: DEVICE_WIDTH, h: 30,
      color: 0x8e8e93, text_size: 20,
      align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text: 'BEREIT',
    })

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: MARGIN, y: 155, w: DEVICE_WIDTH - 2 * MARGIN, h: 1, color: 0x222228,
    })

    const btnY = 175
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: MARGIN, y: btnY, w: BTN_W, h: BTN_H, radius: 14,
      normal_color: 0x2c1d1f, press_color: 0x4a2528,
      text: 'RESET', text_size: 19, color: 0xff453a,
      click_func: () => this.reset(),
    })

    this.btnStart = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: MARGIN + BTN_W + BTN_GAP, y: btnY, w: BTN_W, h: BTN_H, radius: 14,
      normal_color: 0x30d158, press_color: 0x249641,
      text: 'START', text_size: 20, color: 0x000000,
      click_func: () => this.toggle(),
    })

    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: MARGIN + 2 * (BTN_W + BTN_GAP), y: btnY, w: BTN_W, h: BTN_H, radius: 14,
      normal_color: 0x1c2b3a, press_color: 0x263f57,
      text: 'LAP', text_size: 19, color: 0x0a84ff,
      click_func: () => this.lap(),
    })

    // 4-row lap list
    this.lapRows = []
    const listStartY = 255
    for (let i = 0; i < 4; i++) {
      const y = listStartY + i * ROW_H
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: MARGIN, y, w: DEVICE_WIDTH - 2 * MARGIN, h: ROW_H - 6,
        radius: 8, color: 0x151518,
      })
      const lapNumber = hmUI.createWidget(hmUI.widget.TEXT, {
        x: MARGIN + 16, y, w: 80, h: ROW_H - 6,
        color: 0x8e8e93, text_size: 18,
        align_h: hmUI.align.LEFT, align_v: hmUI.align.CENTER_V, text: '',
      })
      const lapTime = hmUI.createWidget(hmUI.widget.TEXT, {
        x: DEVICE_WIDTH - MARGIN - 156, y, w: 140, h: ROW_H - 6,
        color: 0xffffff, text_size: 18,
        align_h: hmUI.align.RIGHT, align_v: hmUI.align.CENTER_V, text: '',
      })
      this.lapRows.push({ lapNumber, lapTime })
    }
  },

  toggle() {
    if (this.running) this.pause()
    else this.start()
  },

  start() {
    this.running = true
    this.lastTs = Date.now()
    this.tickHandle = setInterval(() => this.tick(), 40)
    this.btnStart.setProperty(hmUI.prop.TEXT, 'STOP')
    this.btnStart.setProperty(hmUI.prop.NORMAL_COLOR, 0xff453a)
    this.btnStart.setProperty(hmUI.prop.COLOR, 0xffffff)
  },

  pause() {
    this.running = false
    if (this.tickHandle) clearInterval(this.tickHandle)
    this.tickHandle = null
    this.btnStart.setProperty(hmUI.prop.TEXT, 'START')
    this.btnStart.setProperty(hmUI.prop.NORMAL_COLOR, 0x30d158)
    this.btnStart.setProperty(hmUI.prop.COLOR, 0x000000)
  },

  reset() {
    if (this.running) return
    this.ms = 0
    this.lastLapMs = 0
    this.laps = []
    this.timeMainText.setProperty(hmUI.prop.TEXT, '00:00')
    this.timeMsText.setProperty(hmUI.prop.TEXT, '.00')
    this.subText.setProperty(hmUI.prop.TEXT, 'BEREIT')
    for (const row of this.lapRows) {
      row.lapNumber.setProperty(hmUI.prop.TEXT, '')
      row.lapTime.setProperty(hmUI.prop.TEXT, '')
    }
  },

  lap() {
    if (!this.running) return
    const lapDuration = this.ms - this.lastLapMs
    this.lastLapMs = this.ms
    const lapNum = this.laps.length + 1
    const split = this.fmt(lapDuration)
    this.laps.unshift({ num: lapNum, split })

    this.subText.setProperty(hmUI.prop.TEXT, 'LAP ' + lapNum + '  +' + split)
    for (let i = 0; i < this.lapRows.length; i++) {
      const l = this.laps[i]
      this.lapRows[i].lapNumber.setProperty(hmUI.prop.TEXT, l ? 'Lap ' + l.num : '')
      this.lapRows[i].lapTime.setProperty(hmUI.prop.TEXT, l ? l.split : '')
    }
  },

  tick() {
    const now = Date.now()
    this.ms += now - this.lastTs
    this.lastTs = now
    const full = this.fmt(this.ms)
    const dot = full.indexOf('.')
    this.timeMainText.setProperty(hmUI.prop.TEXT, full.slice(0, dot))
    this.timeMsText.setProperty(hmUI.prop.TEXT, full.slice(dot))
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

  onDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle)
  },
})
