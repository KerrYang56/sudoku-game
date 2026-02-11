import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RotateCcw,
  Pencil,
  Play,
  Settings,
  Trash2,
  Brain,
  ChevronRight,
  Save,
  Edit3,
  Eye,
  X,
  Check,
  Menu,
  Timer,
  Trophy,
  Clock,
  List,
  CheckCircle,
  AlertCircle,
  Star,
} from "lucide-react";

// --- 數獨核心邏輯與工具函數 ---

const EMPTY = 0;
const SIZE = 9;

// 檢查數字放置是否合法
const isValid = (board, row, col, num) => {
  for (let x = 0; x < SIZE; x++) {
    if (board[row][x] === num && x !== col) return false;
  }
  for (let x = 0; x < SIZE; x++) {
    if (board[x][col] === num && x !== row) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (
        board[startRow + i][startCol + j] === num &&
        (startRow + i !== row || startCol + j !== col)
      ) {
        return false;
      }
    }
  }
  return true;
};

// 獲取格子的所有候選數
const getCandidates = (board, row, col) => {
  if (board[row][col] !== EMPTY) return [];
  const candidates = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
};

// 取得全盤候選數 Map
const getAllCandidatesMap = (board) => {
  const map = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(null));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY) {
        map[r][c] = getCandidates(board, r, c);
      } else {
        map[r][c] = [];
      }
    }
  }
  return map;
};

// 暴力解法 (用於生成題目或最終求解)
const solveSudokuBacktrack = (board) => {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (board[row][col] === EMPTY) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudokuBacktrack(board)) return true;
            board[row][col] = EMPTY;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// 生成數獨
const generateSudoku = (difficulty = 1) => {
  let board = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(EMPTY));

  // 隨機填充對角線上的三個 3x3 宮格
  for (let i = 0; i < SIZE; i = i + 3) {
    fillBox(board, i, i);
  }

  solveSudokuBacktrack(board);
  const solution = board.map((row) => [...row]);

  // Map numeric difficulty to removals count
  const attemptsMap = {
    1: 30, // Easy (入門)
    2: 40, // Medium (初級)
    3: 48, // Hard (中級)
    4: 55, // Expert (高級)
    5: 62, // Master (專家)
  };

  // Create a puzzle by removing numbers while ensuring unique solution
  let attempts = attemptsMap[difficulty] || 30;
  if (typeof difficulty === "string") {
    if (difficulty === "easy") attempts = 30;
    else if (difficulty === "medium") attempts = 40;
    else if (difficulty === "hard") attempts = 55;
  }

  const puzzle = board.map((row) => [...row]);

  // Create a list of all positions
  let positions = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      positions.push({ r, c });
    }
  }
  // Shuffle positions
  positions.sort(() => Math.random() - 0.5);

  let countRemoved = 0;
  for (let i = 0; i < positions.length && countRemoved < attempts; i++) {
    const { r, c } = positions[i];
    if (puzzle[r][c] !== EMPTY) {
      const removedVal = puzzle[r][c];
      puzzle[r][c] = EMPTY;

      // Check if key is still unique
      const solutions = countSolutions(puzzle.map((row) => [...row]));
      if (solutions !== 1) {
        // Not unique, put it back
        puzzle[r][c] = removedVal;
      } else {
        countRemoved++;
      }
    }
  }

  return { puzzle, solution };
};

// Helper: Check if placing num at board[row][col] is valid
const isSafe = (board, row, col, num) => {
  // Check row
  for (let x = 0; x < SIZE; x++) if (board[row][x] === num) return false;

  // Check col
  for (let x = 0; x < SIZE; x++) if (board[x][col] === num) return false;

  // Check 3x3 box
  const startRow = row - (row % 3),
    startCol = col - (col % 3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[i + startRow][j + startCol] === num) return false;

  return true;
};

// Helper: Count solutions (to ensure uniqueness)
const countSolutions = (board) => {
  let count = 0;

  const solve = (b) => {
    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (b[row][col] === EMPTY) {
          for (let num = 1; num <= 9; num++) {
            if (isSafe(b, row, col, num)) {
              b[row][col] = num;
              if (solve(b)) {
                count++;
                if (count > 1) return true; // More than 1 solution found
              }
              b[row][col] = EMPTY;
            }
          }
          return false;
        }
      }
    }
    return true; // Solved
  };

  solve(board);
  return count;
};

const fillBox = (board, row, col) => {
  let num;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeInBox(board, row, col, num));
      board[row + i][col + j] = num;
    }
  }
  return true;
};

const isSafeInBox = (board, rowStart, colStart, num) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};

// --- 座標轉換 ---
const getCoord = (r, c) => `${String.fromCharCode(65 + c)}${r + 1}`;

// --- 邏輯解題引擎 (增強版：符合人類直覺) ---
const findNextLogicalStep = (board, currentNotes) => {
  const candidatesMap = getAllCandidatesMap(board);

  // 策略 1: 唯一候選數 (Naked Single)
  // 優先檢查唯一候選數，這是最直覺的解法
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY) {
        const candidates = candidatesMap[r][c];
        if (candidates.length === 1) {
          return {
            type: "naked-single",
            r,
            c,
            val: candidates[0],
            desc: `【唯一候選數】觀察 ${getCoord(r, c)} 這格。受到同行、同列與九宮格內現有數字的夾擊，這裡只剩下數字 ${candidates[0]} 是唯一合法的選擇。`,
          };
        }
      }
    }
  }

  // 策略 2: 摒除法 (Hidden Single)
  // 檢查九宮格 (Box)
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let num = 1; num <= 9; num++) {
        let possibleCells = [];
        let exists = false;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = br * 3 + i;
            const c = bc * 3 + j;
            if (board[r][c] === num) {
              exists = true;
              break;
            }
            if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num)) {
              possibleCells.push({ r, c });
            }
          }
        }
        if (!exists && possibleCells.length === 1) {
          const { r, c } = possibleCells[0];
          return {
            type: "hidden-single-box",
            r,
            c,
            val: num,
            desc: `【九宮格摒除法】觀察 ${getCoord(r, c)} 所在的九宮格。在這個區域內，數字 ${num} 唯一可能的落點就位於此格。`,
          };
        }
      }
    }
  }

  // 檢查行 (Row)
  for (let r = 0; r < SIZE; r++) {
    for (let num = 1; num <= 9; num++) {
      let possibleCols = [];
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === num) {
          possibleCols = [];
          break;
        }
        if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num))
          possibleCols.push(c);
      }
      if (possibleCols.length === 1) {
        return {
          type: "hidden-single-row",
          r,
          c: possibleCols[0],
          val: num,
          desc: `【行摒除法】觀察 ${getCoord(r, possibleCols[0])} 所在的第 ${r + 1} 橫列。數字 ${num} 在這一整列中，只有這格符合放置規則。`,
        };
      }
    }
  }
  // 檢查列 (Col)
  for (let c = 0; c < SIZE; c++) {
    for (let num = 1; num <= 9; num++) {
      let possibleRows = [];
      for (let r = 0; r < SIZE; r++) {
        if (board[r][c] === num) {
          possibleRows = [];
          break;
        }
        if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num))
          possibleRows.push(r);
      }
      if (possibleRows.length === 1) {
        return {
          type: "hidden-single-col",
          r: possibleRows[0],
          c,
          val: num,
          desc: `【列摒除法】觀察 ${getCoord(possibleRows[0], c)} 所在的第 ${String.fromCharCode(65 + c)} 直行。數字 ${num} 在這一整行中，只剩下這個位置可以容身。`,
        };
      }
    }
  }

  // 策略 3: 區塊摒除法 (Pointing Pairs/Triples)
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let num = 1; num <= 9; num++) {
        let cells = [];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = br * 3 + i;
            const c = bc * 3 + j;
            if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num)) {
              cells.push({ r, c });
            }
          }
        }

        if (cells.length > 1) {
          // Row Pointing
          const firstR = cells[0].r;
          if (cells.every((cell) => cell.r === firstR)) {
            let updates = [];
            for (let c = 0; c < SIZE; c++) {
              if (c >= bc * 3 && c < bc * 3 + 3) continue;
              if (
                board[firstR][c] === EMPTY &&
                currentNotes[firstR][c].has(num)
              ) {
                updates.push({ r: firstR, c, val: num });
              }
            }
            if (updates.length > 0) {
              return {
                type: "note-elimination",
                desc: `【區塊摒除】觀察 ${getCoord(cells[0].r, cells[0].c)} 所在的九宮格。數字 ${num} 在此宮格中只能出現在第 ${firstR + 1} 橫列，因此可以排除該列其他位置（${updates.map((u) => getCoord(u.r, u.c)).join(", ")}）的 ${num}。`,
                updates,
              };
            }
          }

          // Col Pointing
          const firstC = cells[0].c;
          if (cells.every((cell) => cell.c === firstC)) {
            let updates = [];
            for (let r = 0; r < SIZE; r++) {
              if (r >= br * 3 && r < br * 3 + 3) continue;
              if (
                board[r][firstC] === EMPTY &&
                currentNotes[r][firstC].has(num)
              ) {
                updates.push({ r, c: firstC, val: num });
              }
            }
            if (updates.length > 0) {
              return {
                type: "note-elimination",
                desc: `【區塊摒除】觀察 ${getCoord(cells[0].r, cells[0].c)} 所在的九宮格。數字 ${num} 在此宮格中只能出現在 ${String.fromCharCode(65 + firstC)} 直行，因此可以排除該行其他位置（${updates.map((u) => getCoord(u.r, u.c)).join(", ")}）的 ${num}。`,
                updates,
              };
            }
          }
        }
      }
    }
  }

  // 策略 4: 顯性數對 (Naked Pairs)
  for (let r = 0; r < SIZE; r++) {
    let rowCandidates = [];
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY)
        rowCandidates.push({ r, c, cands: candidatesMap[r][c] });
    }

    let pairs = rowCandidates.filter((item) => item.cands.length === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        let p1 = pairs[i];
        let p2 = pairs[j];
        if (p1.cands[0] === p2.cands[0] && p1.cands[1] === p2.cands[1]) {
          let updates = [];
          const numsToRemove = p1.cands;
          for (let k = 0; k < rowCandidates.length; k++) {
            let target = rowCandidates[k];
            if (target.c === p1.c || target.c === p2.c) continue;
            if (currentNotes[target.r][target.c].has(numsToRemove[0]))
              updates.push({ r: target.r, c: target.c, val: numsToRemove[0] });
            if (currentNotes[target.r][target.c].has(numsToRemove[1]))
              updates.push({ r: target.r, c: target.c, val: numsToRemove[1] });
          }

          if (updates.length > 0) {
            return {
              type: "note-elimination",
              desc: `【顯性數對】在第 ${r + 1} 列中，發現 ${getCoord(p1.r, p1.c)} 和 ${getCoord(p2.r, p2.c)} 這兩格都只剩下 [${numsToRemove.join(",")}] 這兩個候選數。這表示這兩個數字必然佔據這兩格，請刪除該列其他格子中的 [${numsToRemove.join(",")}] 筆記。`,
              updates,
            };
          }
        }
      }
    }
  }

  for (let c = 0; c < SIZE; c++) {
    let colCandidates = [];
    for (let r = 0; r < SIZE; r++) {
      if (board[r][c] === EMPTY)
        colCandidates.push({ r, c, cands: candidatesMap[r][c] });
    }

    let pairs = colCandidates.filter((item) => item.cands.length === 2);
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        let p1 = pairs[i];
        let p2 = pairs[j];
        if (p1.cands[0] === p2.cands[0] && p1.cands[1] === p2.cands[1]) {
          let updates = [];
          const numsToRemove = p1.cands;
          for (let k = 0; k < colCandidates.length; k++) {
            let target = colCandidates[k];
            if (target.r === p1.r || target.r === p2.r) continue;
            if (currentNotes[target.r][target.c].has(numsToRemove[0]))
              updates.push({ r: target.r, c: target.c, val: numsToRemove[0] });
            if (currentNotes[target.r][target.c].has(numsToRemove[1]))
              updates.push({ r: target.r, c: target.c, val: numsToRemove[1] });
          }

          if (updates.length > 0) {
            return {
              type: "note-elimination",
              desc: `【顯性數對】在 ${String.fromCharCode(65 + c)} 行中，發現 ${getCoord(p1.r, p1.c)} 和 ${getCoord(p2.r, p2.c)} 都只有 [${numsToRemove.join(",")}]。請刪除該行其他格子中的 [${numsToRemove.join(",")}] 筆記。`,
              updates,
            };
          }
        }
      }
    }
  }

  // 策略 5: 深度推導
  let copy = board.map((row) => [...row]);
  if (solveSudokuBacktrack(copy)) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY && copy[r][c] !== EMPTY) {
          return {
            type: "backtrack",
            r,
            c,
            val: copy[r][c],
            desc: `【進階連鎖推論】目前的局面需要更深層的邏輯串聯。鎖定 ${getCoord(r, c)} 這格，根據整合成熟的排除邏輯，此處應填入 ${copy[r][c]}。`,
          };
        }
      }
    }
  }
  return null;
};

// --- 格式化時間 ---
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// --- 主組件 ---

// --- 主組件 ---

export default function SudokuApp() {
  const [grid, setGrid] = useState(
    Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill(EMPTY)),
  );
  const [initialGrid, setInitialGrid] = useState(
    Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill(EMPTY)),
  );
  const [solutionGrid, setSolutionGrid] = useState(null);
  const [notes, setNotes] = useState(
    Array(SIZE)
      .fill()
      .map(() =>
        Array(SIZE)
          .fill()
          .map(() => new Set()),
      ),
  );
  const [history, setHistory] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [solveSteps, setSolveSteps] = useState([]);
  const [highlightNum, setHighlightNum] = useState(null);
  const [errorCells, setErrorCells] = useState(new Set()); // 儲存錯誤的格子座標 "r-c"

  // Modal 狀態
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  // RWD 設定面板
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 挑戰模式與計時器
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [isPlayingChallenge, setIsPlayingChallenge] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Persistence State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem("sudoku_last_difficulty");
    return saved ? parseInt(saved, 10) : 1;
  }); // Track difficulty (number 1-5) for save
  
  // Save difficulty to localStorage
  useEffect(() => {
    localStorage.setItem("sudoku_last_difficulty", difficulty);
  }, [difficulty]);

  const [isGameActive, setIsGameActive] = useState(false); // New flag to prevent premature saving

  // Difficulty Confirmation State
  const [showDiffConfirmModal, setShowDiffConfirmModal] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState(null);

  // 捲動 Ref
  const messagesEndRef = useRef(null);

  // 送出答案檢查
  const checkSubmission = () => {
    // 1. 檢查是否有空格
    let hasEmpty = false;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === EMPTY) {
          hasEmpty = true;
          break;
        }
      }
      if (hasEmpty) break;
    }

    if (hasEmpty) {
      setShowIncompleteModal(true);
      return;
    }

    // 2. 檢查正確性
    const newErrorCells = new Set();
    let isCorrect = true;
    if (solutionGrid) {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (grid[r][c] !== solutionGrid[r][c]) {
            newErrorCells.add(`${r}-${c}`);
            isCorrect = false;
          }
        }
      }
    }

    setErrorCells(newErrorCells);

    if (isCorrect) {
      if (isPlayingChallenge) {
        setIsPlayingChallenge(false);
      }
      setShowWinModal(true);
    }
  };

  const startNewGame = useCallback(
    (newDifficulty = 1) => {
      const { puzzle, solution } = generateSudoku(newDifficulty);
      setGrid(puzzle.map((row) => [...row]));
      setInitialGrid(puzzle.map((row) => [...row]));
      setSolutionGrid(solution);
      setNotes(
        Array(SIZE)
          .fill()
          .map(() =>
            Array(SIZE)
              .fill()
              .map(() => new Set()),
          ),
      );
      setHistory([]);
      setSolveSteps([]);
      setIsEditMode(false);
      setSelectedCell(null);
      setHighlightNum(null);
      setErrorCells(new Set());
      setShowConfirmModal(false);
      setShowWinModal(false);
      setShowIncompleteModal(false);
      setIsSettingsOpen(false);
      setDifficulty(newDifficulty); // Update difficulty state
      setIsGameActive(true); // Enable auto-save

      // 計時器設定
      setTimer(0);
      if (isChallengeMode) {
        setIsPlayingChallenge(true);
      } else {
        setIsPlayingChallenge(false);
      }
    },
    [isChallengeMode],
  );

  const startManualInput = () => {
    const emptyBoard = Array(SIZE)
      .fill()
      .map(() => Array(SIZE).fill(EMPTY));
    setGrid(emptyBoard);
    setInitialGrid(emptyBoard);
    setSolutionGrid(null);
    setNotes(
      Array(SIZE)
        .fill()
        .map(() =>
          Array(SIZE)
            .fill()
            .map(() => new Set()),
        ),
    );
    setHistory([]);
    setSolveSteps([]);
    setIsEditMode(true);
    setSelectedCell(null);
    setErrorCells(new Set());
    setShowConfirmModal(false);
    setIsSettingsOpen(false);
    setIsPlayingChallenge(false);
    setIsGameActive(true);
  };

  const finishManualInput = () => {
    setInitialGrid(grid.map((row) => [...row]));
    const tempGrid = grid.map((row) => [...row]);
    if (solveSudokuBacktrack(tempGrid)) {
      setSolutionGrid(tempGrid);
    } else {
      setSolutionGrid(null);
    }
    setIsEditMode(false);
    setHistory([]);

    if (isChallengeMode) {
      setTimer(0);
      setIsPlayingChallenge(true);
    }
  };

  const revealSolution = () => {
    if (solutionGrid) {
      setGrid(solutionGrid.map((row) => [...row]));
      setHistory([]);
      setSolveSteps((prev) => [
        ...prev,
        { desc: "已顯示完整解答。", type: "info" },
      ]);
      setHighlightNum(null);
      setErrorCells(new Set());
      setIsPlayingChallenge(false);
    }
    setShowConfirmModal(false);
  };

  const updateImplicitNotes = (currentNotes, r, c, num) => {
    for (let i = 0; i < SIZE; i++) currentNotes[r][i].delete(num);
    for (let i = 0; i < SIZE; i++) currentNotes[i][c].delete(num);
    const startRow = Math.floor(r / 3) * 3;
    const startCol = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        currentNotes[startRow + i][startCol + j].delete(num);
      }
    }
  };

  const handleNumberInput = useCallback(
    (num) => {
      if (!selectedCell) return;
      const { r, c } = selectedCell;

      if (!isEditMode && initialGrid[r][c] !== EMPTY) return;

      // 清除該格的錯誤標記，因為使用者正在修改
      if (errorCells.has(`${r}-${c}`)) {
        const newErrors = new Set(errorCells);
        newErrors.delete(`${r}-${c}`);
        setErrorCells(newErrors);
      }

      if (isNoteMode && num !== 0) {
        if (grid[r][c] === EMPTY) {
          setNotes((prevNotes) => {
            const newNotes = prevNotes.map((row) => row.map((s) => new Set(s)));
            const cellNotes = newNotes[r][c];
            if (cellNotes.has(num)) cellNotes.delete(num);
            else cellNotes.add(num);
            return newNotes;
          });
        }
      } else {
        if (grid[r][c] === num) return;

        setHistory((prev) => [
          ...prev,
          {
            grid: grid.map((row) => [...row]),
            notes: JSON.parse(
              JSON.stringify(notes.map((row) => row.map((s) => Array.from(s)))),
            ),
          },
        ]);

        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) => [...row]);
          newGrid[r][c] = num;
          return newGrid;
        });

        if (num !== 0) {
          setNotes((prevNotes) => {
            const newNotes = prevNotes.map((row) => row.map((s) => new Set(s)));
            newNotes[r][c] = new Set();
            updateImplicitNotes(newNotes, r, c, num);
            return newNotes;
          });
        }
      }
    },
    [
      selectedCell,
      isEditMode,
      initialGrid,
      errorCells,
      isNoteMode,
      grid,
      notes,
    ],
  );

  const toggleChallengeMode = () => {
    if (!isChallengeMode) {
      // Turning ON Challenge Mode
      // Reset grid to initial state (clear answers)
      const newGrid = initialGrid.map((row) => [...row]);
      setGrid(newGrid);
      setHistory([]);
      setErrorCells(new Set());
      setTimer(0);
      setIsChallengeMode(true);
      setIsPlayingChallenge(true); // Start timer immediately
    } else {
      // Turning OFF Challenge Mode
      setIsChallengeMode(false);
      setIsPlayingChallenge(false);
      setTimer(0);
    }
  };

  const handleDifficultyClick = (level) => {
    if (level === difficulty) return;

    // Prompt if a game is active
    if (isGameActive && !showWinModal) {
      setPendingDifficulty(level);
      setShowDiffConfirmModal(true);
    } else {
      startNewGame(level);
    }
  };

  const confirmDifficultyChange = () => {
    if (pendingDifficulty) {
      startNewGame(pendingDifficulty);
      setShowDiffConfirmModal(false);
      setPendingDifficulty(null);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setGrid(lastState.grid);
    const restoredNotes = lastState.notes.map((row) =>
      row.map((arr) => new Set(arr)),
    );
    setNotes(restoredNotes);
    setHistory((prev) => prev.slice(0, -1));
    setErrorCells(new Set()); // Undo 時清除錯誤標記，避免狀態不一致
  };

  const playNextStep = () => {
    const step = findNextLogicalStep(grid, notes);

    if (step) {
      setSolveSteps((prev) => [...prev, step]);
      setHistory((prev) => [
        ...prev,
        {
          grid: grid.map((row) => [...row]),
          notes: JSON.parse(
            JSON.stringify(notes.map((row) => row.map((s) => Array.from(s)))),
          ),
        },
      ]);

      if (step.type === "note-elimination") {
        setNotes((prevNotes) => {
          const newNotes = prevNotes.map((row) => row.map((s) => new Set(s)));
          step.updates.forEach((u) => {
            newNotes[u.r][u.c].delete(u.val);
          });
          return newNotes;
        });

        if (step.updates.length > 0) {
          setSelectedCell({ r: step.updates[0].r, c: step.updates[0].c });
        }
      } else {
        setGrid((prevGrid) => {
          const newGrid = prevGrid.map((row) => [...row]);
          newGrid[step.r][step.c] = step.val;
          return newGrid;
        });

        setNotes((prevNotes) => {
          const newNotes = prevNotes.map((row) => row.map((s) => new Set(s)));
          newNotes[step.r][step.c] = new Set();
          updateImplicitNotes(newNotes, step.r, step.c, step.val);
          return newNotes;
        });

        setSelectedCell({ r: step.r, c: step.c });
        setHighlightNum(step.val);
      }
    } else {
      setSolveSteps((prev) => [
        ...prev,
        { desc: "目前邏輯無法推導出下一步。", type: "info" },
      ]);
    }
  };

  const autoFillNotes = () => {
    setHistory((prev) => [
      ...prev,
      {
        grid: grid.map((row) => [...row]),
        notes: JSON.parse(
          JSON.stringify(notes.map((row) => row.map((s) => Array.from(s)))),
        ),
      },
    ]);
    const newNotes = notes.map((row) => row.map((s) => new Set(s)));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === EMPTY) {
          const candidates = getCandidates(grid, r, c);
          newNotes[r][c] = new Set(candidates);
        }
      }
    }
    setNotes(newNotes);
  };

  // --- Persistence Logic ---

  // Load Game Implementation
  const loadGame = useCallback(() => {
    try {
      const savedData = localStorage.getItem("sudoku-game-save");
      if (savedData) {
        const {
          grid: savedGrid,
          initialGrid: savedInitialGrid,
          solutionGrid: savedSolutionGrid,
          notes: savedNotes,
          history: savedHistory,
          timer: savedTimer,
          isChallengeMode: savedIsChallengeMode,
          isPlayingChallenge: savedIsPlayingChallenge,
          difficulty: savedDifficulty,
        } = JSON.parse(savedData);

        setGrid(savedGrid);
        setInitialGrid(savedInitialGrid);
        setSolutionGrid(savedSolutionGrid);
        // Convert notes back to Sets
        setNotes(savedNotes.map((row) => row.map((cell) => new Set(cell))));
        // Restore history notes as Sets
        setHistory(
          savedHistory.map((h) => ({
            ...h,
            notes: h.notes.map((r) => r.map((c) => new Set(c))),
          })),
        );

        // If resuming Challenge Mode, enforce reset behavior
        if (savedIsChallengeMode) {
          setTimer(0);
          setIsPlayingChallenge(true);
        } else {
          setTimer(savedTimer || 0);
          setIsPlayingChallenge(savedIsPlayingChallenge);
        }

        setIsChallengeMode(savedIsChallengeMode);

        // Handle legacy string difficulty or missing difficulty
        let loadedDifficulty = savedDifficulty;
        if (typeof savedDifficulty === "string") {
          if (savedDifficulty === "easy") loadedDifficulty = 1;
          else if (savedDifficulty === "medium") loadedDifficulty = 2;
          else if (savedDifficulty === "hard") loadedDifficulty = 4;
          else loadedDifficulty = 1;
        }
        setDifficulty(loadedDifficulty || 1);

        setShowResumeModal(false);
        setIsGameActive(true); // Enable auto-save after load
      }
    } catch (error) {
      console.error("Failed to load game:", error);
      startNewGame(difficulty);
    }
  }, [difficulty, startNewGame]);

  // Initialization Effect
  useEffect(() => {
    const savedData = localStorage.getItem("sudoku-game-save");
    if (savedData) {
      // Pause timer if it was running, to wait for user decision
      setIsPlayingChallenge(false);
      setShowResumeModal(true);
    } else {
      startNewGame(difficulty);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-Save Effect
  useEffect(() => {
    // Don't save if in resume modal, edit mode, or if game is not active yet
    if (showResumeModal || isEditMode || !initialGrid || !isGameActive) return;

    // Don't save if game is won
    if (showWinModal) {
      localStorage.removeItem("sudoku-game-save");
      return;
    }

    const saveData = {
      grid,
      initialGrid,
      solutionGrid,
      notes: notes.map((row) => row.map((cell) => Array.from(cell))), // Sets to Arrays
      history: history.map((h) => ({
        ...h,
        notes: h.notes.map((r) => r.map((c) => Array.from(c))),
      })),
      timer,
      isChallengeMode,
      isPlayingChallenge,
      difficulty,
    };

    // For Challenge Mode: Only save the initial state, not the progress
    if (isChallengeMode) {
      saveData.grid = initialGrid; // Reset grid to initial
      saveData.notes = Array(9)
        .fill()
        .map(() =>
          Array(9)
            .fill()
            .map(() => []),
        ); // Empty notes
      saveData.history = []; // Empty history
      saveData.timer = 0; // Reset timer (since we don't save time in challenge mode)
    }

    localStorage.setItem("sudoku-game-save", JSON.stringify(saveData));
  }, [
    grid,
    initialGrid,
    solutionGrid,
    notes,
    history,
    timer,
    isChallengeMode,
    isPlayingChallenge,
    difficulty,
    showResumeModal,
    isEditMode,
    showWinModal,
    isGameActive,
  ]);

  // 計時器邏輯
  useEffect(() => {
    if (isPlayingChallenge) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlayingChallenge]);

  // 自動捲動邏輯
  useEffect(() => {
    if (messagesEndRef.current && solveSteps.length > 0) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [solveSteps]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      if (showConfirmModal || showWinModal || showIncompleteModal) return;

      const { r, c } = selectedCell;

      if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleNumberInput(0);
      } else if (e.key === "ArrowUp")
        setSelectedCell({ r: Math.max(0, r - 1), c });
      else if (e.key === "ArrowDown")
        setSelectedCell({ r: Math.min(8, r + 1), c });
      else if (e.key === "ArrowLeft")
        setSelectedCell({ r, c: Math.max(0, c - 1) });
      else if (e.key === "ArrowRight")
        setSelectedCell({ r, c: Math.min(8, c + 1) });
      else if (e.key === "n" || e.key === "N") setIsNoteMode((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCell,
    isNoteMode,
    grid,
    notes,
    isEditMode,
    showConfirmModal,
    showWinModal,
    showIncompleteModal,
    isPlayingChallenge,
    handleNumberInput,
  ]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col items-center relative pb-20">
      {/* 確認 Modal (顯示答案) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Eye className="w-8 h-8" />
              <h3 className="text-xl font-bold">確認顯示解答？</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              這將會填入所有正確數字，結束目前的解謎挑戰。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={revealSolution}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium shadow-md"
              >
                確定顯示
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 恢復進度 Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 text-indigo-600 mb-4">
              <Save className="w-8 h-8" />
              <h3 className="text-xl font-bold">發現未完成的遊戲</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              您上次似乎還有沒解完的數獨，是否要繼續挑戰？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowResumeModal(false);
                  localStorage.removeItem("sudoku-game-save");
                  startNewGame(1);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                開新局
              </button>
              <button
                onClick={loadGame}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow-md hover:bg-indigo-700"
              >
                繼續遊玩
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未完成提示 Modal */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold">還有答案未填喔！</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              盤面上還有空格，請填寫完所有格子後再送出答案。
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow-md"
              >
                好，我再檢查
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 勝利 Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center transform scale-100">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Trophy className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">
              挑戰成功！
            </h3>
            <p className="text-slate-500 mb-6">恭喜你完成了這個數獨。</p>

            {isChallengeMode && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">
                  總耗時
                </span>
                <div className="text-4xl font-black text-indigo-600 font-mono mt-1">
                  {formatTime(timer)}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowWinModal(false)}
              className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 hover:scale-[1.02] transition"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}

      {/* 難度變更確認 Modal */}
      {showDiffConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 text-indigo-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold">重新開始新局？</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed text-center font-medium">
              {"確認要重新產生 "}
              <span className="text-indigo-600 font-bold">
                {"★".repeat(pendingDifficulty)}{" "}
                {
                  ["", "入門", "初級", "中級", "高級", "專家"][
                    pendingDifficulty
                  ]
                }{" "}
                (Lv.{pendingDifficulty})
              </span>
              {" 級題目嗎？"}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDiffConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                取消
              </button>
              <button
                onClick={confirmDifficultyChange}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow-md hover:bg-indigo-700"
              >
                確定產生
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 py-4 px-6 flex flex-col sm:flex-row items-center justify-between mb-6 md:mb-8 sticky top-0 z-30 transition-all duration-300">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100 animate-pulse-slow">
              <Brain className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-indigo-600 bg-clip-text text-transparent">
              數獨大師
            </h1>
          </div>
          {/* 手機版顯示計時器於 Header */}
          {(isPlayingChallenge || isChallengeMode) && (
            <div className="sm:hidden flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="font-mono font-bold text-indigo-700 tracking-tight">
                {formatTime(timer)}
              </span>
            </div>
          )}
        </div>

        {/* 桌面版計時器與標語 */}
        <div className="hidden sm:flex items-center gap-8">
          {(isPlayingChallenge || isChallengeMode) && (
            <div className="flex items-center gap-3 bg-indigo-50/50 backdrop-blur-sm px-5 py-2 rounded-full border border-indigo-100 shadow-inner group">
              <Clock className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-2xl font-black text-indigo-700 tracking-tighter">
                {formatTime(timer)}
              </span>
            </div>
          )}
          <p className="text-slate-400 text-sm font-medium tracking-wide italic">
            邏輯推演與解題教學
          </p>
        </div>
      </header>

      {/* Main Layout Container - 加寬到 max-w-[1700px] */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full max-w-[1600px] px-6 justify-center pb-12">
        {/* === 左欄: 設定面板 (Desktop: Left, Mobile: Middle) === */}
        <div
          className={`
                fixed inset-0 z-40 bg-white/95 backdrop-blur-xl p-6 transform transition-all duration-500 xl:relative xl:inset-auto xl:bg-transparent xl:backdrop-blur-none xl:p-0 xl:translate-x-0 xl:w-72 flex flex-col gap-6
                ${isSettingsOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 xl:opacity-100"}
            `}
        >
          {/* Mobile Header in Menu */}
          <div className="flex xl:hidden justify-between items-center mb-6">
            <span className="font-bold text-2xl text-slate-800">遊戲設定</span>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 挑戰模式卡片 */}
          <div className="glass-card p-4 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg transition-colors ${isChallengeMode ? "bg-amber-100" : "bg-slate-100"}`}
              >
                <Trophy
                  className={`w-5 h-5 ${isChallengeMode ? "text-amber-600" : "text-slate-400"}`}
                />
              </div>
              <div>
                <div
                  className={`font-bold text-base ${isChallengeMode ? "text-slate-800" : "text-slate-500"}`}
                >
                  挑戰計時模式
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                  紀錄最快解題速度
                </div>
              </div>
            </div>
            <button
              onClick={toggleChallengeMode}
              className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${isChallengeMode ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all transform ${isChallengeMode ? "translate-x-7" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* 難度選擇卡片 */}
          <div className="glass-card p-4 rounded-xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-slate-800">
                  難度設定
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 shadow-sm uppercase">
                {["", "入門", "初級", "中級", "高級", "專家"][difficulty]}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-white/50 shadow-inner">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => handleDifficultyClick(level)}
                  className="group relative focus:outline-none transition-all hover:scale-110 active:scale-95 p-1"
                >
                  <Star
                    className={`w-8 h-8 md:w-9 md:h-9 transition-all duration-300 ${
                      level <= difficulty
                        ? "text-brand-amber fill-brand-amber drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110"
                        : "text-slate-200 fill-slate-100 hover:text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 功能按鈕區 */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3">
              {!isEditMode ? (
                <button
                  onClick={startManualInput}
                  className="w-full py-4 rounded-xl glass-card border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <Edit3 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  自訂填寫題目
                </button>
              ) : (
                <div className="glass-card p-2 rounded-xl border-amber-200 bg-amber-50/50">
                  <button
                    onClick={finishManualInput}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 font-black tracking-wide transition-all active:scale-95"
                  >
                    <Save className="w-5 h-5" /> 鎖定並開始
                  </button>
                </div>
              )}
            </div>

            <div
              className={`space-y-3 transition-all duration-500 ${isChallengeMode ? "opacity-40 grayscale-[0.5] pointer-events-none blur-[1px]" : ""}`}
            >
              <button
                onClick={autoFillNotes}
                className="w-full glass-card hover:bg-indigo-50/50 text-indigo-600 px-5 py-4 rounded-xl font-bold flex items-center justify-center gap-3"
              >
                <Pencil className="w-5 h-5 text-indigo-500" />
                自動填寫筆記
              </button>

              <button
                onClick={playNextStep}
                className="w-full btn-electric px-5 py-4 rounded-xl font-bold flex items-center justify-center gap-3 overflow-hidden group relative"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Play className="w-5 h-5 fill-current relative z-10" />
                <span className="relative z-10">顯示提示步驟</span>
              </button>

              <button
                onClick={checkSubmission}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                送出答案
              </button>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full bg-white border border-red-100 text-red-500 px-5 py-4 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <Eye className="w-5 h-5" />
                直接顯示答案
              </button>
              {isChallengeMode && (
                <div className="text-[10px] text-center text-slate-400 font-bold mt-2 animate-pulse">
                  挑戰模式中，輔助功能已暫停
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === 中欄: 數獨盤面與輸入區 (Desktop: Center, Mobile: Top) === */}
        <div className="flex-1 flex flex-col items-center order-1 xl:order-2 w-full min-w-[300px]">
          {/* 盤面容器 */}
          <div className="w-full max-w-[540px] relative">
            {/* 座標 A-I */}
            <div className="grid grid-cols-9 ml-8 mb-2 text-center select-none">
              {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((char) => (
                <div
                  key={char}
                  className="text-xs md:text-sm font-bold text-slate-400"
                >
                  {char}
                </div>
              ))}
            </div>

            <div className="flex">
              {/* 座標 1-9 */}
              <div className="w-8 flex flex-col justify-around text-center select-none mr-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div
                    key={num}
                    className="text-xs md:text-sm font-bold text-slate-400 h-full flex items-center justify-center"
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 aspect-square grid grid-cols-9 grid-rows-[repeat(9,minmax(0,1fr))] border-2 md:border-4 border-slate-800 bg-slate-800 gap-[1px] select-none shadow-2xl rounded-sm overflow-hidden">
                {grid.map((row, r) =>
                  row.map((val, c) => {
                    const isInitial = initialGrid[r][c] !== EMPTY;
                    const isSelected =
                      selectedCell?.r === r && selectedCell?.c === c;
                    const isHighlighted =
                      highlightNum &&
                      (val === highlightNum || notes[r][c].has(highlightNum));
                    const cellNotes = Array.from(notes[r][c]).sort(
                      (a, b) => a - b,
                    );
                    const isError = errorCells.has(`${r}-${c}`);

                    return (
                      <div
                        key={`${r}-${c}`}
                        onClick={() => {
                          setSelectedCell({ r, c });
                          if (val !== EMPTY) setHighlightNum(val);
                        }}
                        className={`
                                            relative cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden
                                            ${(c + 1) % 3 === 0 && c !== 8 ? "mr-[2px]" : ""} 
                                            ${(r + 1) % 3 === 0 && r !== 8 ? "mb-[2px]" : ""}
                                            ${isSelected ? "ring-inset ring-4 ring-indigo-500/50 z-10 shadow-lg" : ""}
                                            
                                            ${
                                              isSelected
                                                ? "bg-indigo-100"
                                                : isError
                                                  ? "bg-red-50"
                                                  : isInitial
                                                    ? "bg-slate-100"
                                                    : isHighlighted
                                                      ? "bg-indigo-50/80 shadow-inner"
                                                      : "bg-white hover:bg-slate-50"
                                            }

                                            ${
                                              isInitial
                                                ? "text-slate-900 font-black"
                                                : isError
                                                  ? "text-red-500 font-bold"
                                                  : "text-brand-electric font-bold"
                                            }
                                        `}
                      >
                        {val === EMPTY && cellNotes.length > 0 && (
                          <div className="absolute inset-0 p-[2px] grid grid-cols-3 grid-rows-3 pointer-events-none opacity-80">
                            {cellNotes.map((n) => (
                              <div
                                key={n}
                                className="flex items-center justify-center text-[8px] sm:text-[10px] leading-none text-slate-400 font-bold"
                                style={{
                                  gridColumn: ((n - 1) % 3) + 1,
                                  gridRow: Math.floor((n - 1) / 3) + 1,
                                }}
                              >
                                {n}
                              </div>
                            ))}
                          </div>
                        )}
                        {val !== EMPTY && (
                          <span
                            className={`text-xl sm:text-2xl md:text-3xl leading-none transition-transform ${!isInitial ? "animate-number-pop" : ""}`}
                          >
                            {val}
                          </span>
                        )}
                        {/* Subtle Border Overlay */}
                        <div className="absolute inset-0 border border-slate-100/30 pointer-events-none" />
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

          {/* 輸入鍵盤 */}
          <div className="mt-6 w-full max-w-[540px]">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-xs sm:text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                {selectedCell
                  ? `位置: ${getCoord(selectedCell.r, selectedCell.c)}`
                  : "請點選格子"}
              </span>
              <button
                onClick={() => setIsNoteMode(!isNoteMode)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition shadow-sm ${isNoteMode ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">筆記: </span>
                <span>{isNoteMode ? "ON" : "OFF"}</span>
              </button>
            </div>

            <div className="grid grid-cols-9 gap-1.5 sm:gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  className="aspect-square flex items-center justify-center glass-card rounded-xl text-xl sm:text-2xl font-black text-slate-700 hover:bg-brand-electric hover:text-white active:scale-90 shadow-sm"
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                onClick={() => handleNumberInput(0)}
                className="py-3.5 flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold hover:bg-red-100 transition-all shadow-sm active:scale-95 group"
              >
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />{" "}
                清除
              </button>
              <button
                onClick={undo}
                disabled={history.length === 0}
                className="py-3.5 flex items-center justify-center gap-2 glass-card rounded-xl disabled:opacity-40 text-slate-700 font-bold active:scale-95"
              >
                <RotateCcw className="w-5 h-5" /> 上一步
              </button>
            </div>
          </div>
        </div>

        {/* === 右欄: 解題步驟提示 (Desktop: Right, Mobile: Bottom) === */}
        {/* 加寬至 w-[500px] 以減少換行 */}
        <div className="w-full xl:w-[500px] flex flex-col gap-4 order-3 xl:order-3 shrink-0 h-[400px] xl:h-auto xl:self-stretch">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col h-full overflow-hidden">
            <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 pb-2 border-b bg-white">
              <List className="w-4 h-4" /> 解題步驟提示
            </h3>

            <div className="flex-1 overflow-y-auto pr-2">
              {solveSteps.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic opacity-60">
                  <Brain className="w-8 h-8 mb-2" />
                  <p>
                    點擊左側「顯示提示步驟」
                    <br />
                    獲取AI解題思路
                  </p>
                </div>
              ) : (
                <div className="max-h-[min(510px,65vh)] overflow-y-auto pr-1.5 custom-scrollbar-thin">
                  <ul className="space-y-3">
                    {solveSteps.map((step, idx) => (
                      <li
                        key={idx}
                        className={`text-sm p-3 rounded-lg border ${step.type === "note-elimination" ? "bg-amber-50 border-amber-200" : step.type === "info" ? "bg-slate-50 border-slate-200" : step.type === "backtrack" ? "bg-red-50 border-red-200" : "bg-indigo-50 border-indigo-100 shadow-sm"}`}
                      >
                        {step.val && step.type !== "note-elimination" && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-indigo-700 bg-indigo-200 w-5 h-5 flex items-center justify-center rounded text-xs">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {getCoord(step.r, step.c)} 填入 {step.val}
                            </span>
                          </div>
                        )}
                        {step.type === "note-elimination" && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-amber-700 bg-amber-200 w-5 h-5 flex items-center justify-center rounded text-xs">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800">
                              排除候選數
                            </span>
                          </div>
                        )}
                        <p className="text-slate-600 leading-relaxed text-xs">
                          {step.desc}
                        </p>
                      </li>
                    ))}
                    <div ref={messagesEndRef} />
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
