"use client";

import { useState, useCallback } from "react";

// 生成1-13的随机数（代表扑克牌A-K）
function generateCards(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
}

// 检查表达式是否等于24
function evaluateExpression(expr: string): number | null {
  try {
    // 只允许数字、运算符、括号和空格
    if (!/^[\d+\-*/().\s]+$/.test(expr)) {
      return null;
    }
    const result = Function(`"use strict"; return (${expr})`)();
    return typeof result === "number" && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// 检查表达式是否使用了正确的4张牌
function checkUsedCards(expr: string, cards: number[]): boolean {
  const numbersInExpr = expr.match(/\d+/g)?.map(Number) || [];
  if (numbersInExpr.length !== 4) return false;

  const sortedCards = [...cards].sort((a, b) => a - b);
  const sortedExpr = [...numbersInExpr].sort((a, b) => a - b);

  return sortedCards.every((card, i) => card === sortedExpr[i]);
}

// 获取牌面显示（A, 2-10, J, Q, K）
function getCardDisplay(num: number): string {
  if (num === 1) return "A";
  if (num === 11) return "J";
  if (num === 12) return "Q";
  if (num === 13) return "K";
  return num.toString();
}

// 求解24点的算法
function solve24(cards: number[]): string | null {
  const ops = ["+", "-", "*", "/"];

  function calc(a: number, b: number, op: string): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : NaN;
      default:
        return NaN;
    }
  }

  function permute(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of permute(rest)) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  for (const perm of permute(cards)) {
    const [a, b, c, d] = perm;

    for (const op1 of ops) {
      for (const op2 of ops) {
        for (const op3 of ops) {
          // ((a op1 b) op2 c) op3 d
          let result = calc(calc(calc(a, b, op1), c, op2), d, op3);
          if (Math.abs(result - 24) < 0.0001) {
            return `((${a} ${op1} ${b}) ${op2} ${c}) ${op3} ${d}`;
          }

          // (a op1 (b op2 c)) op3 d
          result = calc(calc(a, calc(b, c, op2), op1), d, op3);
          if (Math.abs(result - 24) < 0.0001) {
            return `(${a} ${op1} (${b} ${op2} ${c})) ${op3} ${d}`;
          }

          // (a op1 b) op2 (c op3 d)
          result = calc(calc(a, b, op1), calc(c, d, op3), op2);
          if (Math.abs(result - 24) < 0.0001) {
            return `(${a} ${op1} ${b}) ${op2} (${c} ${op3} ${d})`;
          }

          // a op1 ((b op2 c) op3 d)
          result = calc(a, calc(calc(b, c, op2), d, op3), op1);
          if (Math.abs(result - 24) < 0.0001) {
            return `${a} ${op1} ((${b} ${op2} ${c}) ${op3} ${d})`;
          }

          // a op1 (b op2 (c op3 d))
          result = calc(a, calc(b, calc(c, d, op3), op2), op1);
          if (Math.abs(result - 24) < 0.0001) {
            return `${a} ${op1} (${b} ${op2} (${c} ${op3} ${d}))`;
          }
        }
      }
    }
  }

  return null;
}

export default function Game24() {
  const [cards, setCards] = useState<number[]>(generateCards);
  const [expression, setExpression] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const newGame = useCallback(() => {
    setCards(generateCards());
    setExpression("");
    setMessage("");
    setMessageType("");
    setShowAnswer(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!expression.trim()) {
      setMessage("请输入表达式");
      setMessageType("error");
      return;
    }

    if (!checkUsedCards(expression, cards)) {
      setMessage("请使用所有4张牌，每张牌只能用一次");
      setMessageType("error");
      return;
    }

    const result = evaluateExpression(expression);
    if (result === null) {
      setMessage("表达式无效");
      setMessageType("error");
      return;
    }

    if (Math.abs(result - 24) < 0.0001) {
      setMessage(`正确！${expression} = ${result}`);
      setMessageType("success");
      setScore((s) => s + 1);
    } else {
      setMessage(`结果是 ${result}，不等于24`);
      setMessageType("error");
    }
  }, [expression, cards]);

  const handleShowAnswer = useCallback(() => {
    const answer = solve24(cards);
    if (answer) {
      setMessage(`答案：${answer} = 24`);
      setMessageType("success");
    } else {
      setMessage("这组牌无解");
      setMessageType("error");
    }
    setShowAnswer(true);
  }, [cards]);

  const handleCardClick = useCallback((num: number) => {
    setExpression((prev) => prev + num);
  }, []);

  const handleOperatorClick = useCallback((op: string) => {
    setExpression((prev) => prev + ` ${op} `);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-700 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center text-emerald-800 mb-2">
          24点游戏
        </h1>
        <p className="text-center text-gray-500 mb-6">
          使用四则运算使结果等于24
        </p>

        <div className="text-center mb-4">
          <span className="text-lg font-semibold text-emerald-700">
            得分: {score}
          </span>
        </div>

        {/* 卡片显示区域 */}
        <div className="flex justify-center gap-3 mb-6">
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(card)}
              className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg shadow-md
                         flex items-center justify-center text-2xl font-bold text-red-600
                         hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer
                         active:scale-95"
            >
              {getCardDisplay(card)}
            </button>
          ))}
        </div>

        {/* 运算符按钮 */}
        <div className="flex justify-center gap-2 mb-4">
          {["+", "-", "*", "/", "(", ")"].map((op) => (
            <button
              key={op}
              onClick={() => handleOperatorClick(op)}
              className="w-12 h-12 bg-emerald-100 rounded-lg text-xl font-bold text-emerald-800
                         hover:bg-emerald-200 transition-colors active:scale-95"
            >
              {op}
            </button>
          ))}
        </div>

        {/* 输入框 */}
        <div className="mb-4">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="输入表达式，如：(1 + 2) * 3 + 4"
            className="w-full p-3 border-2 border-gray-300 rounded-lg text-lg text-center
                       focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setExpression("")}
            className="flex-1 py-3 bg-gray-200 rounded-lg font-semibold text-gray-700
                       hover:bg-gray-300 transition-colors"
          >
            清空
          </button>
          <button
            onClick={() => setExpression((prev) => prev.slice(0, -1))}
            className="flex-1 py-3 bg-orange-100 rounded-lg font-semibold text-orange-700
                       hover:bg-orange-200 transition-colors"
          >
            退格
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-semibold
                       hover:bg-emerald-700 transition-colors"
          >
            提交
          </button>
          <button
            onClick={handleShowAnswer}
            disabled={showAnswer}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold
                       hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            查看答案
          </button>
        </div>

        <button
          onClick={newGame}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold
                     hover:bg-purple-700 transition-colors"
        >
          换一组牌
        </button>

        {/* 消息显示 */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-semibold ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {/* 游戏规则 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">游戏规则：</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 使用给定的4张牌</li>
            <li>• 每张牌必须且只能使用一次</li>
            <li>• 可以使用 +、-、*、/ 和括号</li>
            <li>• 使计算结果等于24</li>
            <li>• 点击卡片可快速输入数字</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
