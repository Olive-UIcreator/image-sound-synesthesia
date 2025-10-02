# 🎨🎵 圖像聲音聯覺器 | Image-Sound-Synesthesia

**讓圖片變成樂器！** 一個結合視覺圖像與聽覺體驗的互動式應用程式，讓您能夠「聽到」圖片的美妙。

## 🌐 立即體驗

**[🎮 點擊這裡開始體驗 →](https://olive-uicreator.github.io/image-sound-synesthesia)**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen)](https://olive-uicreator.github.io/image-sound-synesthesia)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ 什麼是圖像聲音聯覺器？

這是一個基於聯覺（Synesthesia）概念的互動式應用程式，讓每張圖片都擁有獨特的聲音。當您上傳圖片並點擊不同區域時，會聽到對應的音調，創造視覺與聽覺的完美融合體驗。

## 🎯 核心特色

- 🖼️ **圖片上傳** - 支援 JPG、PNG、GIF、WebP 格式
- 🎨 **即時像素化** - 可調整像素密度（10-100px）
- 🎵 **即時音頻反饋** - 每個像素對應獨特音調
- 🎹 **HSV 色彩映射** - 完整的色彩到聲音轉換系統
- 🎮 **雙模式互動** - 單點模式與掃描模式
- 📱 **響應式設計** - 支援桌面和移動設備

## 🚀 快速開始

### 基本操作
1. **上傳圖片** - 點擊「Upload Image」選擇圖片
2. **調整像素** - 使用滑桿改變像素大小（10-100）
3. **開始演奏** - 點擊「Start Playing」
4. **點擊彈奏** - 在圖片上點擊任何地方聽聲音
5. **掃描模式** - 切換到「Scan」模式，移動滑鼠創造連續音樂

### ⌨️ 快捷鍵
| 功能 | 按鍵 | 說明 |
|------|------|------|
| 音頻播放 | `Ctrl/Cmd + Space` | 開始/停止音頻播放 |
| 切換模式 | `Ctrl/Cmd + M` | 切換單點/掃描模式 |

## 🎨 兩種模式

### 🎯 單點模式 (Single Point Mode)
- 點擊任意像素播放對應的單一聲音
- 每個像素根據其 HSV 值產生獨特的音調
- 適合探索圖像中特定區域的聲音特徵

### 🎵 掃描模式 (Scan Mode) ⚠️
- 滑鼠移動時讀取垂直像素列的所有聲音
- 形成動態的音景和弦
- **⚠️ 注意：此模式目前仍在開發中，音頻同步與效能優化需要進一步調整**

## 🎵 聲音映射系統

基於 HSV 色彩空間，每個色彩位置直接映射到音樂參數：

- **色相 (H) → 音高**：0-360° 對應到 200-2000 Hz 頻率範圍
- **飽和度 (S) → 音色**：影響波形類型和攻擊時間  
- **亮度 (V) → 音量**：控制聲音的振幅和釋放時間

### 🎼 音樂理論基礎
- **音階系統**：使用五聲音階等音樂理論
- **和諧頻率**：避免不協和音程
- **動態範圍**：優化的音量控制

## 🛠️ 技術規格

- **前端**：純 JavaScript（ES6模組）
- **音頻**：Web Audio API + Tone.js
- **圖像處理**：Canvas API + p5.js
- **相容性**：Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 🎉 開始您的聯覺之旅

**[🎮 立即體驗圖像聲音聯覺器 →](https://olive-uicreator.github.io/image-sound-synesthesia)**

讓圖片與聲音的完美結合帶給您全新的感官體驗！ 🎨🎵✨