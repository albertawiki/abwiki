import '@testing-library/jest-dom';

// Recharts' ResponsiveContainer observes its container size. jsdom has no
// layout engine and no ResizeObserver, so we stub it: charts render at zero
// size in tests, which is fine because the tests assert on the scaffolding
// around the charts rather than on rendered geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;
