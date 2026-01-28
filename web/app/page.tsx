"use client";

import { useState, useCallback } from "react";

// 生成1-13的随机数
function getRandomCard(): number {
  return Math.floor(Math.random() * 13) + 1;
}

// 生成4张牌
function generateCards(): number[] {
  return [getRandomCard(), getRandomCard(), getRandomCard(), getRandomCard()];
}

// 检查是否有解（穷举所有可能）
function hasSolution(cards: number[]): boolean {
  const ops = ["+", "-", "*", "/"];
  const permutations = getPermutations(cards);

  for (const perm of permutations) {
    for (const op1 of ops) {
      for (const op2 of ops) {
        for (const op3 of ops) {
          // ((a op1 b) op2 c) op3 d
          const r1 = calc(calc(calc(perm[0], op1, perm[1]), op2, perm[2]), op3, perm[3]);
          if (Math.abs(r1 - 24) < 0.0001) return true;

          // (a op1 (b op2 c)) op3 d
          const r2 = calc(calc(perm[0], op1, calc(perm[1], op2, perm[2])), op3, perm[3]);
          if (Math.abs(r2 - 24) < 0.0001) return true;

          // (a op1 b) op2 (c op3 d)
          const r3 = calc(calc(perm[0], op1, perm[1]), op2, calc(perm[2], op3, perm[3]));
          if (Math.abs(r3 - 24) < 0.0001) return true;

          // a op1 ((b op2 c) op3 d)
          const r4 = calc(perm[0], op1, calc(calc(perm[1], op2, perm[2]), op3, perm[3]));
          if (Math.abs(r4 - 24) < 0.0001) return true;

          // a op1 (b op2 (c op3 d))
          const r5 = calc(perm[0], op1, calc(perm[1], op2, calc(perm[2], op3, perm[3])));
          if (Math.abs(r5 - 24) < 0.0001) return true;
        }
      }
    }
  }
  return false;
}

// 计算两个数的运算结果
function calc(a: number, op: string, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b !== 0 ? a / b : Infinity;
    default: return 0;
  }
}

// 获取数组的所有排列
function getPermutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(rest);
    for (const perm of perms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

// 安全地计算表达式（只允许数字和基本运算符）
function safeEvaluate(expression: string): number | null {
  // 移除空格
  const cleaned = expression.replace(/\s/g, "");

  // 只允许数字、运算符和括号
  if (!/^[\d+\-*/().]+$/.test(cleaned)) {
    return null;
  }

  // 检查括号匹配
  let depth = 0;
  for (const char of cleaned) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (depth < 0) return null;
  }
  if (depth !== 0) return null;

  try {
    // 使用 Function 构造函数安全计算
    const result = new Function(`return (${cleaned})`)();
    if (typeof result === "number" && isFinite(result)) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

// 从表达式中提取使用的数字
function extractNumbers(expression: string): number[] {
  const matches = expression.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

// 检查是否使用了正确的数字
function usesCorrectNumbers(expression: string, cards: number[]): boolean {
  const usedNumbers = extractNumbers(expression);
  if (usedNumbers.length !== 4) return false;

  const sortedUsed = [...usedNumbers].sort((a, b) => a - b);
  const sortedCards = [...cards].sort((a, b) => a - b);

  return sortedUsed.every((num, i) => num === sortedCards[i]);
}

// 获取扑克牌显示名称
function getCardDisplay(num: number): string {
  switch (num) {
    case 1: return "A";
    case 11: return "J";
    case 12: return "Q";
    case 13: return "K";
    default: return num.toString();
  }
}

// 获取随机花色
function getRandomSuit(): string {
  const suits = ["♠", "♥", "♦", "♣"];
  return suits[Math.floor(Math.random() * suits.length)];
}

// 扑克牌组件
function Card({ value, suit }: { value: number; suit: string }) {
  const isRed = suit === "♥" || suit === "♦";
  return (
    <div className="relative w-20 h-28 bg-white rounded-lg shadow-lg border-2 border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow select-none">
      <span className={`absolute top-2 left-2 text-sm font-bold ${isRed ? "text-red-500" : "text-gray-800"}`}>
        {getCardDisplay(value)}
      </span>
      <span className={`text-3xl ${isRed ? "text-red-500" : "text-gray-800"}`}>
        {suit}
      </span>
      <span className={`absolute bottom-2 right-2 text-sm font-bold rotate-180 ${isRed ? "text-red-500" : "text-gray-800"}`}>
        {getCardDisplay(value)}
      </span>
    </div>
  );
}

export default function Game24() {
  const [cards, setCards] = useState<number[]>(() => {
    let newCards = generateCards();
    while (!hasSolution(newCards)) {
      newCards = generateCards();
    }
    return newCards;
  });
  const [suits, setSuits] = useState<string[]>(() => [
    getRandomSuit(),
    getRandomSuit(),
    getRandomSuit(),
    getRandomSuit(),
  ]);
  const [expression, setExpression] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const newGame = useCallback(() => {
    let newCards = generateCards();
    while (!hasSolution(newCards)) {
      newCards = generateCards();
    }
    setCards(newCards);
    setSuits([getRandomSuit(), getRandomSuit(), getRandomSuit(), getRandomSuit()]);
    setExpression("");
    setMessage("");
    setShowHint(false);
  }, []);

  const checkAnswer = useCallback(() => {
    if (!expression.trim()) {
      setMessage("请输入表达式");
      setMessageType("error");
      return;
    }

    if (!usesCorrectNumbers(expression, cards)) {
      setMessage("请使用给定的4张牌，每张牌只能用一次");
      setMessageType("error");
      return;
    }

    const result = safeEvaluate(expression);
    if (result === null) {
      setMessage("表达式格式错误");
      setMessageType("error");
      return;
    }

    if (Math.abs(result - 24) < 0.0001) {
      setMessage(`正确！${expression} = 24`);
      setMessageType("success");
      setScore((s) => s + 1);
      setTimeout(newGame, 1500);
    } else {
      setMessage(`结果是 ${result}，不等于 24`);
      setMessageType("error");
    }
  }, [expression, cards, newGame]);

  const skipRound = useCallback(() => {
    setMessage("跳过本轮");
    setMessageType("info");
    newGame();
  }, [newGame]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        checkAnswer();
      }
    },
    [checkAnswer]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">24 点游戏</h1>
        <p className="text-center text-gray-600 mb-6">
          使用 + - * / 和括号，让4张牌的计算结果等于24
        </p>

        {/* 得分 */}
        <div className="text-center mb-6">
          <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold">
            得分: {score}
          </span>
        </div>

        {/* 扑克牌 */}
        <div className="flex justify-center gap-3 mb-6">
          {cards.map((card, index) => (
            <Card key={index} value={card} suit={suits[index]} />
          ))}
        </div>

        {/* 数字提示 */}
        <div className="text-center text-gray-600 mb-4">
          可用数字: {cards.join(", ")}
        </div>

        {/* 输入框 */}
        <div className="mb-4">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入表达式，如: (1+2+3)*4"
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-800"
          />
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`text-center p-3 rounded-lg mb-4 font-medium ${
              messageType === "success"
                ? "bg-green-100 text-green-700"
                : messageType === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* 按钮组 */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={checkAnswer}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            验证
          </button>
          <button
            onClick={newGame}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            新游戏
          </button>
          <button
            onClick={skipRound}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            跳过
          </button>
        </div>

        {/* 提示按钮 */}
        <div className="text-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            {showHint ? "隐藏提示" : "需要提示？"}
          </button>
        </div>

        {showHint && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
            <p className="font-bold mb-2">提示：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>每张牌必须且只能使用一次</li>
              <li>可以使用 +、-、*、/ 四种运算</li>
              <li>可以使用括号改变运算顺序</li>
              <li>例如：(6-2)*(9-3)=24</li>
            </ul>
          </div>
        )}

        {/* 规则说明 */}
        <div className="mt-6 text-center text-xs text-gray-400">
          A=1, J=11, Q=12, K=13
        </div>
      </div>
    </div>
  );
}
