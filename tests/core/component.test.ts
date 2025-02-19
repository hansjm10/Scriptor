import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BaseComponent } from '../../src/templating/core/component';
import { createDefaultEngine } from '../../src/templating';

// A simple DOM mock using JSDOM (if needed), or minimal stubs.
// In a real Jest setup, you can configure testEnvironment: 'jsdom' in jest.config.js.

class TestComponent extends BaseComponent {
  public initCalled = false;
  public beforeRenderCalled = false;
  public afterRenderCalled = false;
  public cleanupCalled = false;

  protected onInit(): void {
    this.initCalled = true;
  }

  protected onBeforeRender(): void {
    this.beforeRenderCalled = true;
  }

  protected onAfterRender(): void {
    this.afterRenderCalled = true;
  }

  protected onCleanup(): void {
    this.cleanupCalled = true;
  }
}

describe('BaseComponent Lifecycle', () => {
  let containerDiv: HTMLElement;

  beforeEach(() => {
    // Create a temporary container in the DOM.
    containerDiv = document.createElement('div');
    containerDiv.id = 'test-container';
    document.body.appendChild(containerDiv);
  });

  afterEach(() => {
    // Cleanup DOM.
    document.body.removeChild(containerDiv);
  });

  it('should call onInit, onBeforeRender, onAfterRender when mounting', () => {
    const engine = createDefaultEngine();
    const comp = new TestComponent(engine, { count: 0 });

    comp.mount('<p>@count</p>', 'test-container');

    expect(comp.initCalled).toBe(true);
    expect(comp.beforeRenderCalled).toBe(true);
    expect(comp.afterRenderCalled).toBe(true);

    // Check if the container got rendered output.
    expect(containerDiv.innerHTML).toContain('0');
  });

  it('should call onCleanup when unmounted', () => {
    const engine = createDefaultEngine();
    const comp = new TestComponent(engine, { count: 5 });

    comp.mount('<p>@count</p>', 'test-container');
    comp.unmount();

    expect(comp.cleanupCalled).toBe(true);
    // Container should be cleared.
    expect(containerDiv.innerHTML).toBe('');
  });

  it('should update UI on state change and call watchers', () => {
    const engine = createDefaultEngine();
    const comp = new TestComponent(engine, { count: 10 });

    const watchSpy = jest.fn();
    comp.watch('count', watchSpy);

    comp.mount('<p>Value: @count</p>', 'test-container');
    expect(containerDiv.innerHTML).toContain('10');

    // Update state.
    comp.setState({ count: 42 });

    // Check if watcher fired.
    expect(watchSpy).toHaveBeenCalledWith(10, 42);

    // Check if UI updated.
    expect(containerDiv.innerHTML).toContain('42');
  });
});

