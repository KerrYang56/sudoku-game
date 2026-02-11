# 數獨大師 (Sudoku Master)

現代化的數獨網頁應用，結合遊玩、教學與邏輯推演。

## 核心特色 (Features)

- **五星難度系統**：提供 1-5 星（入門至專家）難度選擇。
- **唯一解保證**：內建回溯校驗引擎，確保題目具備唯一邏輯解。
- **智慧教學系統**：模擬人類思維的逐步邏輯教學，非暴力破解。
- **強化筆記功能**：支援手動與自動筆記，省去繁瑣紀錄。
- **持久化挑戰模式**：支援進度存檔與計時挑戰（MM:ss）。
- **RWD 響應式佈局**：完美配適桌機與行動裝置。

## 技術棧 (Tech Stack)

- **核心**: React, Vite
- **樣式**: Tailwind CSS
- **圖示**: Lucide React

## 快速開始 (Getting Started)

如果您想在本地端運行此專案，請按照以下步驟操作：

1. **複製專案 (Clone)**

    ```bash
    git clone https://github.com/KerrYang56/sudoku-game.git
    cd sudoku-game
    ```

2. **安裝依賴 (Install Dependencies)**

    ```bash
    npm install
    ```

3. **啟動開發伺服器 (Run)**

    ```bash
    npm run dev
    ```

4. 打開瀏覽器前往 <http://localhost:5173> 即可開始遊玩。

### 部署到 Vercel (Optional)

本專案支援一鍵部署到 Vercel：

1. 將專案推送到 GitHub。
2. 前往 [Vercel](https://vercel.com) 並登入。
3. 點擊 **"Add New..."** -> **"Project"**。
4. 選擇您的 `sudoku-game` repository 並點擊 **"Import"**。
5. Framework Preset 應會自動偵測為 `Vite`。
6. 點擊 **"Deploy"**，等待約 1 分鐘即可完成！

## 專案結構

```txt
src/
├── App.jsx           # 應用程式入口
├── SudokuApp.jsx     # 核心邏輯與 UI (單一檔案)
├── main.jsx          # DOM 渲染
└── index.css         # Tailwind 配置
```

## 📝 License

[MIT License](LICENSE)
