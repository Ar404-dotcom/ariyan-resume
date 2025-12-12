(function () {
  'use strict';

  function isDigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const ch = expr[i];

      if (ch === ' ' || ch === '\t' || ch === '\n') {
        i++;
        continue;
      }

      // Number (with optional decimal)
      if (isDigit(ch) || ch === '.') {
        let start = i;
        let dotCount = ch === '.' ? 1 : 0;
        i++;
        while (i < expr.length) {
          const c = expr[i];
          if (isDigit(c)) {
            i++;
            continue;
          }
          if (c === '.') {
            dotCount++;
            if (dotCount > 1) {
              throw new Error('Invalid number');
            }
            i++;
            continue;
          }
          break;
        }
        const raw = expr.slice(start, i);
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new Error('Invalid number');
        }
        tokens.push({ type: 'number', value: num, raw });
        continue;
      }

      // Operators and parens
      if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%' || ch === '(' || ch === ')') {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }

      throw new Error('Invalid character');
    }

    return tokens;
  }

  function toRpn(tokens) {
    const output = [];
    const ops = [];

    const precedence = {
      'u-': 3,
      '*': 2,
      '/': 2,
      '%': 2,
      '+': 1,
      '-': 1
    };

    const rightAssoc = {
      'u-': true
    };

    function isOperator(op) {
      return op === '+' || op === '-' || op === '*' || op === '/' || op === '%' || op === 'u-';
    }

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.type === 'number') {
        output.push(t);
        continue;
      }

      const v = t.value;

      if (v === '(') {
        ops.push(v);
        continue;
      }

      if (v === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') {
          output.push({ type: 'op', value: ops.pop() });
        }
        if (!ops.length) {
          throw new Error('Mismatched parentheses');
        }
        ops.pop();
        continue;
      }

      // unary minus detection
      let op = v;
      if (op === '-') {
        const prev = tokens[i - 1];
        const isUnary = i === 0 || (prev && prev.type === 'op' && prev.value !== ')');
        if (isUnary) op = 'u-';
      }

      if (!isOperator(op)) {
        throw new Error('Invalid operator');
      }

      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === '(') break;

        const pTop = precedence[top];
        const pOp = precedence[op];

        if (
          (rightAssoc[op] && pOp < pTop) ||
          (!rightAssoc[op] && pOp <= pTop)
        ) {
          output.push({ type: 'op', value: ops.pop() });
          continue;
        }
        break;
      }

      ops.push(op);
    }

    while (ops.length) {
      const op = ops.pop();
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses');
      }
      output.push({ type: 'op', value: op });
    }

    return output;
  }

  function evalRpn(rpn) {
    const stack = [];

    for (const t of rpn) {
      if (t.type === 'number') {
        stack.push(t.value);
        continue;
      }

      const op = t.value;

      if (op === 'u-') {
        if (stack.length < 1) throw new Error('Invalid expression');
        stack.push(-stack.pop());
        continue;
      }

      if (stack.length < 2) throw new Error('Invalid expression');
      const b = stack.pop();
      const a = stack.pop();

      let res;
      switch (op) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) throw new Error('Division by zero');
          res = a / b;
          break;
        case '%':
          if (b === 0) throw new Error('Division by zero');
          res = a % b;
          break;
        default:
          throw new Error('Invalid operator');
      }

      if (!Number.isFinite(res)) throw new Error('Invalid result');
      stack.push(res);
    }

    if (stack.length !== 1) throw new Error('Invalid expression');
    return stack[0];
  }

  function formatNumber(n) {
    // Keep it readable; avoid scientific notation for typical results
    const rounded = Math.round((n + Number.EPSILON) * 1e12) / 1e12;
    const asString = String(rounded);
    return asString.length > 16 ? String(Number(rounded.toPrecision(12))) : asString;
  }

  const CalculatorService = {
    evaluate(expression) {
      const expr = String(expression || '').trim();
      if (!expr) throw new Error('Empty expression');
      const tokens = tokenize(expr);
      const rpn = toRpn(tokens);
      const value = evalRpn(rpn);
      return formatNumber(value);
    }
  };

  window.CalculatorService = CalculatorService;
})();
