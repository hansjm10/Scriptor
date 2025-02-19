import { TemplateEngine } from './engine';

/**
 * BaseComponent now provides refined lifecycle hooks:
 *  - onInit(), onBeforeRender(), onAfterRender(), onCleanup()
 *  as well as a watch() mechanism for advanced reactive data-binding.
 */
export abstract class BaseComponent {
  private proxyData: Record<string, any>;
  private container: HTMLElement | null = null;
  private templateFn: ((data: Record<string, any>) => string) | null = null;
  private isMounted = false;

  // Map of watchers keyed by property name; each property can have multiple callbacks.
  private watchers: Map<string, Array<(oldVal: any, newVal: any) => void>> = new Map();

  constructor(
    private engine: TemplateEngine,
    initialData: Record<string, any> = {}
  ) {
    // Create a proxy to intercept state changes.
    this.proxyData = new Proxy(initialData, {
      set: (target, prop: string, value) => {
        const oldValue = target[prop];
        target[prop] = value;
        // Fire watchers.
        if (this.isMounted) {
          const propWatchers = this.watchers.get(prop);
          if (propWatchers) {
            propWatchers.forEach((callback) => callback(oldValue, value));
          }
          // Trigger re-render if component is mounted.
          this.onStateChange();
        }
        return true;
      }
    });
  }

  /**
   * Lifecycle hook: called once when the component is first mounted.
   */
  protected onInit(): void {}

  /**
   * Lifecycle hook: called immediately before rendering.
   */
  protected onBeforeRender(): void {}

  /**
   * Lifecycle hook: called immediately after each render operation.
   */
  protected onAfterRender(): void {}

  /**
   * Lifecycle hook: called once before the component unmounts.
   */
  protected onCleanup(): void {}

  /**
   * Called whenever state changes occur.
   * Default implementation re-renders the component.
   */
  protected onStateChange(): void {
    this.onBeforeRender();
    this.render();
    this.onAfterRender();
  }

  /**
   * Allows registering callbacks that run whenever a specific state property changes.
   */
  public watch(
    propKey: string,
    callback: (oldVal: any, newVal: any) => void
  ): void {
    if (!this.watchers.has(propKey)) {
      this.watchers.set(propKey, []);
    }
    this.watchers.get(propKey)!.push(callback);
  }

  /**
   * Mounts the component by compiling the template, appending to container,
   * and calling lifecycle hooks.
   */
  public mount(templateStr: string, containerId: string): void {
    this.onInit();

    // Compile the template into a render function.
    this.templateFn = this.engine.createTemplate(templateStr);

    // Locate container.
    this.container = document.getElementById(containerId);

    // Mark component as mounted.
    this.isMounted = true;

    // Initial render.
    this.onBeforeRender();
    this.render();
    this.onAfterRender();
  }

  /**
   * Re-renders the component if it's mounted.
   */
  private render(): void {
    if (this.isMounted && this.container && this.templateFn) {
      this.container.innerHTML = this.templateFn(this.proxyData);
    }
  }

  /**
   * Unmounts the component: calls onCleanup, clears container.
   */
  public unmount(): void {
    if (!this.isMounted) {
      return;
    }
    this.onCleanup();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isMounted = false;
  }

  /**
   * Merge new state into the existing data.
   * This triggers a re-render if the component is mounted.
   */
  public setState(newState: Record<string, any>): void {
    for (const key of Object.keys(newState)) {
      this.proxyData[key] = newState[key];
    }
  }

  /**
   * Retrieve the current state.
   */
  public get state(): Record<string, any> {
    return this.proxyData;
  }
}

