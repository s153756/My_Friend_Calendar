import '@testing-library/jest-dom';

if (typeof document !== 'undefined') {
  document.elementFromPoint = (x: number, y: number) => {

    return document.body; 
  };
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;
