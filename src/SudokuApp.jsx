import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';

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
      if (board[startRow + i][startCol + j] === num && (startRow + i !== row || startCol + j !== col)) {
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
  const map = Array(SIZE).fill().map(() => Array(SIZE).fill(null));
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
const generateSudoku = (difficulty = 'medium') => {
  let board = Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY));
  
  // 隨機填充對角線上的三個 3x3 宮格
  for (let i = 0; i < SIZE; i = i + 3) {
    fillBox(board, i, i);
  }
  
  solveSudokuBacktrack(board);
  const solution = board.map(row => [...row]);
  
  let attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
  const puzzle = board.map(row => [...row]);
  
  while (attempts > 0) {
    let row = Math.floor(Math.random() * SIZE);
    let col = Math.floor(Math.random() * SIZE);
    if (puzzle[row][col] !== EMPTY) {
      puzzle[row][col] = EMPTY;
      attempts--;
    }
  }
  return { puzzle, solution };
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

  // 策略 1: 摒除法 (Hidden Single)
  // 檢查宮 (Box)
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let num = 1; num <= 9; num++) {
        let possibleCells = [];
        let exists = false;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = br * 3 + i;
            const c = bc * 3 + j;
            if (board[r][c] === num) { exists = true; break; }
            if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num)) {
              possibleCells.push({r, c});
            }
          }
        }
        if (!exists && possibleCells.length === 1) {
          const {r, c} = possibleCells[0];
          return {
             type: 'hidden-single-box',
             r, c, val: num,
             desc: `【宮摒除法】觀察 ${getCoord(br * 3, bc * 3)} 所在的九宮格。數字 ${num} 在此宮格內受到其他行列的限制，只剩下 ${getCoord(r, c)} 這個位置可以填入。`
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
        if (board[r][c] === num) { possibleCols = []; break; }
        if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num)) possibleCols.push(c);
      }
      if (possibleCols.length === 1) {
        return {
          type: 'hidden-single-row',
          r, c: possibleCols[0],
          val: num,
          desc: `【行摒除法】檢查第 ${r + 1} 列 (Row ${r + 1})。數字 ${num} 在這一橫列中，只有 ${getCoord(r, possibleCols[0])} 這格沒有衝突，必須填入。`
        };
      }
    }
  }
  // 檢查列 (Col)
  for (let c = 0; c < SIZE; c++) {
    for (let num = 1; num <= 9; num++) {
      let possibleRows = [];
      for (let r = 0; r < SIZE; r++) {
        if (board[r][c] === num) { possibleRows = []; break; }
        if (board[r][c] === EMPTY && candidatesMap[r][c].includes(num)) possibleRows.push(r);
      }
      if (possibleRows.length === 1) {
        return {
          type: 'hidden-single-col',
          r: possibleRows[0], c,
          val: num,
          desc: `【列摒除法】檢查第 ${String.fromCharCode(65 + c)} 直行。數字 ${num} 在這一整行中，只剩下 ${getCoord(possibleRows[0], c)} 這個空位可以容身。`
        };
      }
    }
  }

  // 策略 2: 唯一候選數 (Naked Single)
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === EMPTY) {
        const candidates = candidatesMap[r][c];
        if (candidates.length === 1) {
          return {
            type: 'naked-single',
            r, c,
            val: candidates[0],
            desc: `【唯一候選數】觀察 ${getCoord(r, c)} 這格。受到同行、同列與九宮格內現有數字的夾擊，這裡只剩下數字 ${candidates[0]} 是唯一合法的選擇。`
          };
        }
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
               cells.push({r, c});
             }
          }
        }
        
        if (cells.length > 1) {
            // Row Pointing
            const firstR = cells[0].r;
            if (cells.every(cell => cell.r === firstR)) {
                let updates = [];
                for(let c = 0; c < SIZE; c++) {
                    if (c >= bc * 3 && c < bc * 3 + 3) continue;
                    if (board[firstR][c] === EMPTY && currentNotes[firstR][c].has(num)) {
                        updates.push({r: firstR, c, val: num});
                    }
                }
                if (updates.length > 0) {
                    return {
                        type: 'note-elimination',
                        desc: `【區塊摒除】觀察 ${getCoord(br * 3, bc * 3)} 所在的宮格，數字 ${num} 只能出現在第 ${firstR + 1} 列。因此該列的「其他位置」不可能再有 ${num}，請刪除 ${updates.map(u => getCoord(u.r, u.c)).join(', ')} 的 ${num} 號筆記。`,
                        updates
                    };
                }
            }

            // Col Pointing
            const firstC = cells[0].c;
            if (cells.every(cell => cell.c === firstC)) {
                let updates = [];
                for(let r = 0; r < SIZE; r++) {
                    if (r >= br * 3 && r < br * 3 + 3) continue;
                    if (board[r][firstC] === EMPTY && currentNotes[r][firstC].has(num)) {
                        updates.push({r, c: firstC, val: num});
                    }
                }
                if (updates.length > 0) {
                    return {
                        type: 'note-elimination',
                        desc: `【區塊摒除】觀察 ${getCoord(br * 3, bc * 3)} 所在的宮格，數字 ${num} 只能出現在 ${String.fromCharCode(65 + firstC)} 行。因此該行的「其他位置」不可能再有 ${num}，請刪除 ${updates.map(u => getCoord(u.r, u.c)).join(', ')} 的 ${num} 號筆記。`,
                        updates
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
      for(let c=0; c<SIZE; c++) {
          if(board[r][c] === EMPTY) rowCandidates.push({r,c, cands: candidatesMap[r][c]});
      }
      
      let pairs = rowCandidates.filter(item => item.cands.length === 2);
      for(let i=0; i<pairs.length; i++) {
          for(let j=i+1; j<pairs.length; j++) {
              let p1 = pairs[i];
              let p2 = pairs[j];
              if (p1.cands[0] === p2.cands[0] && p1.cands[1] === p2.cands[1]) {
                  let updates = [];
                  const numsToRemove = p1.cands;
                  for(let k=0; k<rowCandidates.length; k++) {
                      let target = rowCandidates[k];
                      if (target.c === p1.c || target.c === p2.c) continue;
                      if (currentNotes[target.r][target.c].has(numsToRemove[0])) updates.push({r: target.r, c: target.c, val: numsToRemove[0]});
                      if (currentNotes[target.r][target.c].has(numsToRemove[1])) updates.push({r: target.r, c: target.c, val: numsToRemove[1]});
                  }

                  if(updates.length > 0) {
                      return {
                          type: 'note-elimination',
                          desc: `【顯性數對】在第 ${r+1} 列中，發現 ${getCoord(p1.r, p1.c)} 和 ${getCoord(p2.r, p2.c)} 這兩格都只剩下 [${numsToRemove.join(',')}] 這兩個候選數。這表示這兩個數字必然佔據這兩格，請刪除該列其他格子中的 [${numsToRemove.join(',')}] 筆記。`,
                          updates
                      };
                  }
              }
          }
      }
  }

  for (let c = 0; c < SIZE; c++) {
      let colCandidates = [];
      for(let r=0; r<SIZE; r++) {
          if(board[r][c] === EMPTY) colCandidates.push({r,c, cands: candidatesMap[r][c]});
      }
      
      let pairs = colCandidates.filter(item => item.cands.length === 2);
      for(let i=0; i<pairs.length; i++) {
          for(let j=i+1; j<pairs.length; j++) {
              let p1 = pairs[i];
              let p2 = pairs[j];
              if (p1.cands[0] === p2.cands[0] && p1.cands[1] === p2.cands[1]) {
                  let updates = [];
                  const numsToRemove = p1.cands;
                  for(let k=0; k<colCandidates.length; k++) {
                      let target = colCandidates[k];
                      if (target.r === p1.r || target.r === p2.r) continue;
                      if (currentNotes[target.r][target.c].has(numsToRemove[0])) updates.push({r: target.r, c: target.c, val: numsToRemove[0]});
                      if (currentNotes[target.r][target.c].has(numsToRemove[1])) updates.push({r: target.r, c: target.c, val: numsToRemove[1]});
                  }

                  if(updates.length > 0) {
                      return {
                          type: 'note-elimination',
                          desc: `【顯性數對】在 ${String.fromCharCode(65 + c)} 行中，發現 ${getCoord(p1.r, p1.c)} 和 ${getCoord(p2.r, p2.c)} 都只有 [${numsToRemove.join(',')}]。請刪除該行其他格子中的 [${numsToRemove.join(',')}] 筆記。`,
                          updates
                      };
                  }
              }
          }
      }
  }

  // 策略 5: 深度推導
  let copy = board.map(row => [...row]);
  if (solveSudokuBacktrack(copy)) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY && copy[r][c] !== EMPTY) {
          return {
            type: 'backtrack',
            r, c,
            val: copy[r][c],
            desc: `【深度推導】目前的盤面比較複雜，基礎邏輯無法直接突破。經過深度計算（假設驗證），${getCoord(r, c)} 是突破口，正確答案是 ${copy[r][c]}。`
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
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- 主組件 ---

  // --- 主組件 ---
  
  export default function SudokuApp() {
    const [grid, setGrid] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY)));
    const [initialGrid, setInitialGrid] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY)));
    const [solutionGrid, setSolutionGrid] = useState(null);
    const [notes, setNotes] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill().map(() => new Set())));
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
  
    // 捲動 Ref
    const messagesEndRef = useRef(null);
  
    // 送出答案檢查
    const checkSubmission = () => {
      // 1. 檢查是否有空格
      let hasEmpty = false;
      for(let r=0; r<SIZE; r++) {
          for(let c=0; c<SIZE; c++) {
              if (grid[r][c] === EMPTY) {
                  hasEmpty = true;
                  break;
              }
          }
          if(hasEmpty) break;
      }
  
      if (hasEmpty) {
          setShowIncompleteModal(true);
          return;
      }
  
      // 2. 檢查正確性
      const newErrorCells = new Set();
      let isCorrect = true;
      if (solutionGrid) {
          for(let r=0; r<SIZE; r++) {
              for(let c=0; c<SIZE; c++) {
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
  
    const startNewGame = useCallback((difficulty) => {
      const { puzzle, solution } = generateSudoku(difficulty);
      setGrid(puzzle.map(row => [...row]));
      setInitialGrid(puzzle.map(row => [...row]));
      setSolutionGrid(solution);
      setNotes(Array(SIZE).fill().map(() => Array(SIZE).fill().map(() => new Set())));
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
  
      // 計時器設定
      setTimer(0);
      if (isChallengeMode) {
          setIsPlayingChallenge(true);
      } else {
          setIsPlayingChallenge(false);
      }
    }, [isChallengeMode]);
  
    const startManualInput = () => {
      const emptyBoard = Array(SIZE).fill().map(() => Array(SIZE).fill(EMPTY));
      setGrid(emptyBoard);
      setInitialGrid(emptyBoard);
      setSolutionGrid(null);
      setNotes(Array(SIZE).fill().map(() => Array(SIZE).fill().map(() => new Set())));
      setHistory([]);
      setSolveSteps([]);
      setIsEditMode(true);
      setSelectedCell(null);
      setErrorCells(new Set());
      setShowConfirmModal(false);
      setIsSettingsOpen(false);
      setIsPlayingChallenge(false); 
    };
  
    const finishManualInput = () => {
      setInitialGrid(grid.map(row => [...row]));
      const tempGrid = grid.map(row => [...row]);
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
          setGrid(solutionGrid.map(row => [...row]));
          setHistory([]);
          setSolveSteps(prev => [...prev, { desc: "已顯示完整解答。", type: 'info' }]);
          setHighlightNum(null);
          setErrorCells(new Set());
          setIsPlayingChallenge(false);
      }
      setShowConfirmModal(false);
    };
  
    const updateImplicitNotes = (currentNotes, r, c, num) => {
      for(let i=0; i<SIZE; i++) currentNotes[r][i].delete(num);
      for(let i=0; i<SIZE; i++) currentNotes[i][c].delete(num);
      const startRow = Math.floor(r / 3) * 3;
      const startCol = Math.floor(c / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          currentNotes[startRow + i][startCol + j].delete(num);
        }
      }
    };
  
    const handleNumberInput = useCallback((num) => {
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
          setNotes(prevNotes => {
              const newNotes = prevNotes.map(row => row.map(s => new Set(s)));
              const cellNotes = newNotes[r][c];
              if (cellNotes.has(num)) cellNotes.delete(num);
              else cellNotes.add(num);
              return newNotes;
          });
        }
      } else {
        if (grid[r][c] === num) return;
  
        setHistory(prev => [...prev, { grid: grid.map(row => [...row]), notes: JSON.parse(JSON.stringify(notes.map(row => row.map(s => Array.from(s))))) }]);
  
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[r][c] = num;
            return newGrid;
        });
  
        if (num !== 0) {
          setNotes(prevNotes => {
              const newNotes = prevNotes.map(row => row.map(s => new Set(s)));
              newNotes[r][c] = new Set();
              updateImplicitNotes(newNotes, r, c, num);
              return newNotes;
          });
        }
      }
    }, [selectedCell, isEditMode, initialGrid, errorCells, isNoteMode, grid, notes]);
  
    const undo = () => {
      if (history.length === 0) return;
      const lastState = history[history.length - 1];
      setGrid(lastState.grid);
      const restoredNotes = lastState.notes.map(row => row.map(arr => new Set(arr)));
      setNotes(restoredNotes);
      setHistory(prev => prev.slice(0, -1));
      setErrorCells(new Set()); // Undo 時清除錯誤標記，避免狀態不一致
    };
  
    const playNextStep = () => {
      const step = findNextLogicalStep(grid, notes);
      
      if (step) {
          setSolveSteps(prev => [...prev, step]);
          setHistory(prev => [...prev, { grid: grid.map(row => [...row]), notes: JSON.parse(JSON.stringify(notes.map(row => row.map(s => Array.from(s))))) }]);
          
          if (step.type === 'note-elimination') {
              setNotes(prevNotes => {
                  const newNotes = prevNotes.map(row => row.map(s => new Set(s)));
                  step.updates.forEach(u => {
                      newNotes[u.r][u.c].delete(u.val);
                  });
                  return newNotes;
              });
              
              if (step.updates.length > 0) {
                 setSelectedCell({r: step.updates[0].r, c: step.updates[0].c});
              }
          } else {
              setGrid(prevGrid => {
                  const newGrid = prevGrid.map(row => [...row]);
                  newGrid[step.r][step.c] = step.val;
                  return newGrid;
              });
              
              setNotes(prevNotes => {
                  const newNotes = prevNotes.map(row => row.map(s => new Set(s)));
                  newNotes[step.r][step.c] = new Set();
                  updateImplicitNotes(newNotes, step.r, step.c, step.val);
                  return newNotes;
              });
              
              setSelectedCell({ r: step.r, c: step.c });
              setHighlightNum(step.val);
          }
  
      } else {
          setSolveSteps(prev => [...prev, { desc: "目前邏輯無法推導出下一步。", type: 'info' }]);
      }
    };
  
    const autoFillNotes = () => {
        setHistory(prev => [...prev, { grid: grid.map(row => [...row]), notes: JSON.parse(JSON.stringify(notes.map(row => row.map(s => Array.from(s))))) }]);
        const newNotes = notes.map(row => row.map(s => new Set(s)));
        for(let r=0; r<SIZE; r++){
            for(let c=0; c<SIZE; c++){
                if(grid[r][c] === EMPTY) {
                    const candidates = getCandidates(grid, r, c);
                    newNotes[r][c] = new Set(candidates);
                }
            }
        }
        setNotes(newNotes);
    };
  
    useEffect(() => {
      startNewGame('easy');
      return () => clearInterval(timerRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
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
          messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [solveSteps]);
  
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!selectedCell) return;
        if (showConfirmModal || showWinModal || showIncompleteModal) return;
  
        const { r, c } = selectedCell;
  
        if (e.key >= '1' && e.key <= '9') {
          handleNumberInput(parseInt(e.key));
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          handleNumberInput(0);
        } else if (e.key === 'ArrowUp') setSelectedCell({ r: Math.max(0, r - 1), c });
        else if (e.key === 'ArrowDown') setSelectedCell({ r: Math.min(8, r + 1), c });
        else if (e.key === 'ArrowLeft') setSelectedCell({ r, c: Math.max(0, c - 1) });
        else if (e.key === 'ArrowRight') setSelectedCell({ r, c: Math.min(8, c + 1) });
        else if (e.key === 'n' || e.key === 'N') setIsNoteMode(prev => !prev);
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, isNoteMode, grid, notes, isEditMode, showConfirmModal, showWinModal, showIncompleteModal, isPlayingChallenge, handleNumberInput]);

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
                      <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium">取消</button>
                      <button onClick={revealSolution} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium shadow-md">確定顯示</button>
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
                      <button onClick={() => setShowIncompleteModal(false)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow-md">好，我再檢查</button>
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
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-2">挑戰成功！</h3>
                  <p className="text-slate-500 mb-6">恭喜你完成了這個數獨。</p>
                  
                  {isChallengeMode && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                        <span className="text-slate-400 text-sm uppercase tracking-wider font-bold">總耗時</span>
                        <div className="text-4xl font-black text-indigo-600 font-mono mt-1">{formatTime(timer)}</div>
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

      {/* Header */}
      <header className="w-full bg-white shadow-sm border-b border-slate-200 py-3 px-4 flex flex-col sm:flex-row items-center justify-between mb-4 md:mb-6 sticky top-0 z-30">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                <h1 className="text-xl md:text-2xl font-bold text-slate-700">數獨大師</h1>
            </div>
            {/* 手機版顯示計時器於 Header */}
            {isPlayingChallenge && (
                <div className="sm:hidden flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="font-mono font-bold text-indigo-700">{formatTime(timer)}</span>
                </div>
            )}
        </div>
        
        {/* 桌面版計時器與標語 */}
        <div className="hidden sm:flex items-center gap-6">
            {isPlayingChallenge && (
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-inner">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="font-mono text-xl font-bold text-indigo-700">{formatTime(timer)}</span>
                </div>
            )}
            <p className="text-slate-400 text-xs">邏輯推演與解題教學</p>
        </div>
      </header>

      {/* Main Layout Container - 加寬到 max-w-[1600px] */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full max-w-[1600px] px-4 justify-center">
        
        {/* === 左欄: 設定面板 (Desktop: Left, Mobile: Middle) === */}
        {/* 縮減左側寬度至 72 (288px) */}
        <div className="w-full xl:w-72 flex flex-col gap-4 order-2 xl:order-1 shrink-0">
          
          <div className="lg:hidden w-full">
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700 font-medium">
                <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> 遊戲選單 & 設定</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          <div className={`${isSettingsOpen ? 'block' : 'hidden'} lg:block bg-white p-4 rounded-xl shadow-sm border border-slate-200`}>
            
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
               <Settings className="w-4 h-4" /> 遊戲設定
            </h3>

            {/* 挑戰模式開關 */}
            <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className={`w-5 h-5 ${isChallengeMode ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="text-sm font-bold text-slate-700">挑戰計時模式</span>
                    </div>
                    <button 
                        onClick={() => setIsChallengeMode(!isChallengeMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isChallengeMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isChallengeMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                {isChallengeMode && <p className="text-xs text-indigo-600 mt-2">完成題目後將自動停止計時並顯示成績。</p>}
            </div>
            
            {!isEditMode ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={() => startNewGame('easy')} className="px-3 py-2 bg-green-50 text-green-700 border border-green-100 rounded-lg text-sm hover:bg-green-100 transition">簡單</button>
                    <button onClick={() => startNewGame('medium')} className="px-3 py-2 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-lg text-sm hover:bg-yellow-100 transition">中等</button>
                    <button onClick={() => startNewGame('hard')} className="px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm hover:bg-red-100 transition">困難</button>
                    <button onClick={startManualInput} className="px-3 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm hover:bg-slate-100 transition flex items-center justify-center gap-1"><Edit3 className="w-3 h-3"/> 自訂</button>
                </div>
            ) : (
                <div className="mb-4">
                     <p className="text-xs text-orange-600 mb-2">輸入題目後鎖定。</p>
                     <button onClick={finishManualInput} className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2">
                         <Save className="w-4 h-4" /> 鎖定並開始
                     </button>
                </div>
            )}
            
            <hr className="my-3 border-slate-100"/>
            
            <div className="space-y-2">
                <button onClick={autoFillNotes} disabled={isEditMode} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm">
                    <Pencil className="w-3 h-3" /> 自動填寫筆記
                </button>
                <button onClick={playNextStep} disabled={isEditMode} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md disabled:opacity-50 disabled:shadow-none">
                    <Play className="w-4 h-4" /> 顯示提示步驟
                </button>
                
                {/* 新增: 送出答案按鈕 */}
                <button onClick={checkSubmission} disabled={isEditMode || !solutionGrid} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md disabled:opacity-50 disabled:shadow-none mt-2">
                    <CheckCircle className="w-4 h-4" /> 送出答案
                </button>

                <button onClick={() => setShowConfirmModal(true)} disabled={isEditMode || !solutionGrid} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 shadow-sm disabled:opacity-50 disabled:shadow-none transition">
                    <Eye className="w-4 h-4" /> 直接顯示答案
                </button>
            </div>
          </div>
        </div>

        {/* === 中欄: 數獨盤面與輸入區 (Desktop: Center, Mobile: Top) === */}
        <div className="flex-1 flex flex-col items-center order-1 xl:order-2 w-full min-w-[300px]">
            
            {/* 盤面容器 */}
            <div className="w-full max-w-[450px] relative">
                
                {/* 座標 A-I */}
                <div className="grid grid-cols-9 ml-6 mb-1 text-center select-none">
                    {['A','B','C','D','E','F','G','H','I'].map(char => (
                        <div key={char} className="text-[10px] md:text-xs font-bold text-slate-400">{char}</div>
                    ))}
                </div>

                <div className="flex">
                    {/* 座標 1-9 */}
                    <div className="w-6 flex flex-col justify-around text-center select-none mr-0.5">
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                            <div key={num} className="text-[10px] md:text-xs font-bold text-slate-400 h-full flex items-center justify-center">{num}</div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex-1 aspect-square grid grid-cols-9 grid-rows-[repeat(9,minmax(0,1fr))] border-2 md:border-4 border-slate-800 bg-slate-800 gap-[1px] select-none shadow-lg">
                        {grid.map((row, r) => (
                            row.map((val, c) => {
                                const isInitial = initialGrid[r][c] !== EMPTY;
                                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                                const isHighlighted = highlightNum && (val === highlightNum || notes[r][c].has(highlightNum));
                                const cellNotes = Array.from(notes[r][c]).sort((a,b)=>a-b);
                                const isError = errorCells.has(`${r}-${c}`);

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => {
                                            setSelectedCell({ r, c });
                                            if(val !== EMPTY) setHighlightNum(val);
                                        }}
                                        className={`
                                            relative cursor-pointer transition-colors duration-75 flex items-center justify-center
                                            ${(c + 1) % 3 === 0 && c !== 8 ? 'mr-[2px]' : ''} 
                                            ${(r + 1) % 3 === 0 && r !== 8 ? 'mb-[2px]' : ''}
                                            ${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}
                                            
                                            ${isSelected ? 'bg-indigo-200' : 
                                              isError ? 'bg-red-100' : 
                                              isInitial ? 'bg-slate-200' : 
                                              isHighlighted ? 'bg-indigo-50' : 
                                              'bg-white'
                                            }

                                            ${isInitial ? 'text-slate-900 font-extrabold' : 
                                              isError ? 'text-red-600 font-bold' : 
                                              'text-blue-600 font-medium'
                                            }
                                        `}
                                    >
                                        {val === EMPTY && cellNotes.length > 0 && (
                                            <div className="absolute top-0 left-0 w-full h-full p-[1px] grid grid-cols-3 grid-rows-3 pointer-events-none">
                                                {cellNotes.map(n => (
                                                   <div key={n} className="flex items-center justify-center text-[7px] sm:text-[9px] md:text-[10px] leading-none text-slate-500 font-medium" style={{ gridColumn: ((n-1)%3)+1, gridRow: Math.floor((n-1)/3)+1 }}>{n}</div>
                                                ))}
                                            </div>
                                        )}
                                        {val !== EMPTY && (
                                            <span className="text-xl sm:text-2xl md:text-3xl leading-none">{val}</span>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>

            {/* 輸入鍵盤 */}
            <div className="mt-4 w-full max-w-[450px]">
                <div className="flex justify-between items-center mb-2 px-1">
                     <span className="text-xs sm:text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                         {selectedCell ? `位置: ${getCoord(selectedCell.r, selectedCell.c)}` : '請點選格子'}
                     </span>
                     <button onClick={() => setIsNoteMode(!isNoteMode)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition shadow-sm ${isNoteMode ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" /> 
                        <span className="hidden sm:inline">筆記: </span>
                        <span>{isNoteMode ? 'ON' : 'OFF'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-9 gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleNumberInput(num)} className="aspect-square flex items-center justify-center bg-white border border-slate-200 shadow-sm rounded-lg text-lg sm:text-xl md:text-2xl font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95 transition touch-manipulation">
                            {num}
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                     <button onClick={() => handleNumberInput(0)} className="py-2.5 sm:py-3 flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-lg text-red-600 hover:bg-red-100 transition shadow-sm active:scale-95">
                        <Trash2 className="w-4 h-4" /> 清除
                    </button>
                     <button onClick={undo} disabled={history.length === 0} className="py-2.5 sm:py-3 flex items-center justify-center gap-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-700 shadow-sm active:scale-95">
                        <RotateCcw className="w-4 h-4" /> 復原
                    </button>
                </div>
            </div>
        </div>

        {/* === 右欄: 解題過程 (Desktop: Right, Mobile: Bottom) === */}
        {/* 加寬至 w-[500px] 以減少換行 */}
        <div className="w-full xl:w-[500px] flex flex-col gap-4 order-3 xl:order-3 shrink-0 h-[400px] xl:h-auto xl:self-stretch">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col h-full overflow-hidden">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 pb-2 border-b bg-white">
                    <List className="w-4 h-4" /> 解題過程
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2">
                    {solveSteps.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic opacity-60">
                            <Brain className="w-8 h-8 mb-2" />
                            <p>點擊左側「顯示提示步驟」<br/>獲取AI解題思路</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {solveSteps.map((step, idx) => (
                                <li key={idx} className={`text-sm p-3 rounded-lg border ${step.type === 'note-elimination' ? 'bg-amber-50 border-amber-200' : step.type === 'info' ? 'bg-slate-50 border-slate-200' : step.type === 'backtrack' ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100 shadow-sm'}`}>
                                    {step.val && step.type !== 'note-elimination' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-indigo-700 bg-indigo-200 w-5 h-5 flex items-center justify-center rounded text-xs">{idx + 1}</span>
                                            <span className="font-semibold text-slate-800">{getCoord(step.r, step.c)} 填入 {step.val}</span>
                                        </div>
                                    )}
                                    {step.type === 'note-elimination' && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-amber-700 bg-amber-200 w-5 h-5 flex items-center justify-center rounded text-xs">{idx + 1}</span>
                                            <span className="font-semibold text-slate-800">排除候選數</span>
                                        </div>
                                    )}
                                    <p className="text-slate-600 leading-relaxed text-xs">{step.desc}</p>
                                </li>
                            ))}
                            <div ref={messagesEndRef} />
                        </ul>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
