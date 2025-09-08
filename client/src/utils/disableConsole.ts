// Temporarily disable all console.log to fix React object rendering error
const originalConsoleLog = console.log;

// Override console.log to safely stringify any objects
console.log = (...args: any[]) => {
  const safeArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return '[Object - cannot stringify]';
      }
    }
    return arg;
  });
  originalConsoleLog.apply(console, safeArgs);
};

// Export original for restoration if needed
export { originalConsoleLog };