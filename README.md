# 數獨大師：解題與學習工作台 (Sudoku Master)

一個結合「遊玩」、「教學」與「邏輯推演」的現代化數獨網頁應用程式。這不只是一個數獨遊戲，更是一個能教你如何解題的智慧導師。

## 核心特色 (Features)

### 遊戲體驗

* **多種難度選擇**：提供簡單、中等、困難三種隨機生成的題目模式。
* **自訂題目功能**：支援手動輸入報紙或雜誌上的題目進行數位化解題。
* **挑戰計時模式**：開啟計時器，挑戰您的解題速度，完成後顯示總耗時。
* **RWD 響應式設計**：完美支援桌機（三欄式佈局）與手機（直式操作優化）。

### 智慧學習輔助

* **強大的筆記系統**：
  * 支援「筆記模式」與「輸入模式」切換。
  * **自動筆記**：一鍵填寫所有可能的候選數，省去繁瑣計算。
* **邏輯解題引擎**：
  * 這不是單純的暴力破解！系統內建邏輯演算法，模擬人類思維。
  * **逐步教學**：按下「顯示提示步驟」，系統會告訴您下一步該填哪裡，以及為什麼（例如：「因為行摒除法...」）。
  * **支援邏輯**：唯一候選數 (Naked Single)、摒除法 (Hidden Single)、區塊摒除 (Pointing Pairs)、顯性數對 (Naked Pairs)。
* **智慧驗證**：
  * **即時防呆**：輸入時若與現有行列衝突會立即提示。
  * **送出檢查**：完成後可檢查答案，錯誤格子會標示出來但不直接給答案，保留思考空間。

## 技術棧 (Tech Stack)

* **Frontend Framework**: React (Hooks, Functional Components)
* **Build Tool**: Vite
* **Styling**: Tailwind CSS (Responsive Design, Utility-first)
* **Icons**: Lucide React
* **Deployment**: Vercel / GitHub Pages

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
├── App.jsx           # 應用程式主入口
├── SudokuApp.jsx     # 數獨核心邏輯與 UI 組件 (單一檔案架構)
├── main.jsx          # React DOM 渲染
└── index.css         # Tailwind CSS 引入點
```

## 📝 License

[MIT License](LICENSE)
