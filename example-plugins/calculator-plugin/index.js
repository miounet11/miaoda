class CalculatorPlugin {
  constructor(api) {
    this.api = api
    this.name = 'Calculator Plugin'
  }

  async activate() {
    console.log(`${this.name} activated`)
    this.api.ui.showMessage(`${this.name} is now active!`, 'info')
  }

  async deactivate() {
    console.log(`${this.name} deactivated`)
  }

  getTools() {
    return [
      {
        name: 'calculate',
        description: 'Perform mathematical calculations',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Mathematical expression to evaluate'
            }
          },
          required: ['expression']
        }
      },
      {
        name: 'factorial',
        description: 'Calculate the factorial of a number',
        inputSchema: {
          type: 'object',
          properties: {
            n: {
              type: 'number',
              description: 'The number to calculate factorial for'
            }
          },
          required: ['n']
        }
      },
      {
        name: 'fibonacci',
        description: 'Calculate Fibonacci sequence',
        inputSchema: {
          type: 'object',
          properties: {
            n: {
              type: 'number',
              description: 'Number of Fibonacci numbers to generate'
            }
          },
          required: ['n']
        }
      },
      {
        name: 'prime_check',
        description: 'Check if a number is prime',
        inputSchema: {
          type: 'object',
          properties: {
            number: {
              type: 'number',
              description: 'Number to check for primality'
            }
          },
          required: ['number']
        }
      }
    ]
  }

  async executeTool(toolName, args) {
    switch (toolName) {
      case 'calculate':
        return this.calculate(args.expression)
      
      case 'factorial':
        return this.factorial(args.n)
      
      case 'fibonacci':
        return this.fibonacci(args.n)
      
      case 'prime_check':
        return this.isPrime(args.number)
      
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  }

  calculate(expression) {
    try {
      // Safe math evaluation using Function constructor
      // Only allow basic math operations and functions
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '')
      const result = Function('"use strict"; return (' + sanitized + ')')()
      
      return {
        expression,
        result,
        type: typeof result
      }
    } catch (error) {
      return {
        error: `Failed to evaluate: ${error.message}`,
        expression
      }
    }
  }

  factorial(n) {
    if (n < 0) {
      return { error: 'Factorial is not defined for negative numbers' }
    }
    
    if (n > 170) {
      return { error: 'Number too large, result would be Infinity' }
    }
    
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    
    return {
      input: n,
      factorial: result,
      formula: `${n}! = ${result}`
    }
  }

  fibonacci(n) {
    if (n < 1) {
      return { error: 'Please provide a positive number' }
    }
    
    if (n > 100) {
      return { error: 'Number too large, please use n <= 100' }
    }
    
    const sequence = [0, 1]
    for (let i = 2; i < n; i++) {
      sequence.push(sequence[i - 1] + sequence[i - 2])
    }
    
    return {
      count: n,
      sequence: sequence.slice(0, n),
      last: sequence[n - 1]
    }
  }

  isPrime(number) {
    if (number < 2) {
      return {
        number,
        isPrime: false,
        reason: 'Numbers less than 2 are not prime'
      }
    }
    
    if (number === 2) {
      return {
        number,
        isPrime: true,
        reason: '2 is the only even prime number'
      }
    }
    
    if (number % 2 === 0) {
      return {
        number,
        isPrime: false,
        reason: 'Even numbers (except 2) are not prime'
      }
    }
    
    const sqrt = Math.sqrt(number)
    for (let i = 3; i <= sqrt; i += 2) {
      if (number % i === 0) {
        return {
          number,
          isPrime: false,
          reason: `Divisible by ${i}`,
          factors: [i, number / i]
        }
      }
    }
    
    return {
      number,
      isPrime: true,
      reason: 'No divisors found'
    }
  }
}

module.exports = CalculatorPlugin