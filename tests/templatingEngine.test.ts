import { createDefaultEngine } from '../src/templating/core/engine';

describe('Template Engine', () => {
    const engine = createDefaultEngine();

    // Basic Functionality
    test('renders simple template with data', () => {
        const template = engine.createTemplate('Hello, @{name}!');
        expect(template({ name: 'Alice' }).value).toBe('Hello, Alice!');
    });

    test('uses default values when data missing', () => {
        const template = engine.createTemplate('Hello, @{name=Guest}!');
        expect(template({}).value).toBe('Hello, Guest!');
    });

    test('escapes HTML characters by default', () => {
        const template = engine.createTemplate('@{content}');
        expect(template({ content: '<script>alert(1)</script>' }).value)
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    // Nested Templates
    test('handles nested templates without data requirements', () => {
        const header = engine.createTemplate('<header>@{content}</header>');
        const main = engine.createTemplate('@{header} <main>@{body}</main>');

        const result = main({
            header: header({ content: 'Welcome' }),
            body: 'Main content'
        }).value;

        expect(result).toBe('<header>Welcome</header> <main>Main content</main>');
    });

    test('throws when nested template requires data', () => {
        const nested = engine.createTemplate('Hello @{name}!');
        const outer = engine.createTemplate('Message: @{content}');

        expect(() => outer({ content: nested }))
            .toThrow("Nested template for 'content' requires data");
    });

    // Error Handling
    test('throws on missing required value', () => {
        const template = engine.createTemplate('@{requiredKey}');
        expect(() => template({})).toThrow("Missing required key 'requiredKey'");
    });

    // Edge Cases
    test('handles empty template', () => {
        const template = engine.createTemplate('');
        expect(template({}).value).toBe('');
    });

    test('handles template with no placeholders', () => {
        const template = engine.createTemplate('Static content');
        expect(template({}).value).toBe('Static content');
    });

    test('handles extreme scale templates (debug with small size)', () => {
        const size = 100000;
        const { templateString, data } = generateMassiveTemplate(size);

        const template = engine.createTemplate(templateString);
        const start = performance.now();
        const result = template(data);
        const duration = performance.now() - start;

        // Calculate expected length assuming each placeholder produces "valueX " (minus one trailing space)
        const expectedLength = size * 'valueX '.length - 1;
        console.log(`[Extreme Debug] ${size} placeholders rendered in ${duration.toFixed(1)}ms`);
        if (result.value.length !== expectedLength) {
            console.warn("Length mismatch detected!");
            for (let i = 0; i < Math.min(expectedLength, result.value.length); i++) {
                if (result.value[i] !== 'valueX '[i % 7]) {
                    console.log(`Difference at index ${i}: got "${result.value[i]}"`);
                    break;
                }
            }
        }
        expect(result.value.length).toBe(expectedLength);
    });

    function generateMassiveTemplate(size: number) {
        const templateParts: string[] = [];
        const data = { value: "valueX" };

        for (let i = 0; i < size; i++) {
            templateParts.push(`@{value}`);
        }

        return {
            templateString: templateParts.join(' '),
            data
        };
    }

    test('handles concurrent rendering', async () => {
        const concurrencyLevel = 1000;
        const template = engine.createTemplate("@{value}");
        const promises = [];

        const start = performance.now();
        for (let i = 0; i < concurrencyLevel; i++) {
            promises.push(template({ value: i }));
        }

        const results = await Promise.all(promises);
        const duration = performance.now() - start;

        results.forEach((result, i) => {
            expect(result.value).toBe(String(i));
        });
        console.log(`[Concurrency] ${concurrencyLevel} renders: ${duration.toFixed(1)}ms`);
    });

    test('maintains stable memory footprint', () => {
        if (typeof global.gc !== 'function') {
            console.warn('Run with --expose-gc for accurate memory measurements');
            return;
        }

        const iterations = 100_000;
        const template = engine.createTemplate("@{a}@{b}@{c}");

        // Warm up
        template({ a: 0, b: 1, c: 2 });

        global.gc();
        const baseMemory = process.memoryUsage().heapUsed;

        for (let i = 0; i < iterations; i++) {
            template({ a: i, b: i + 1, c: i + 2 });
        }

        global.gc();
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryDelta = finalMemory - baseMemory;

        console.log(`[Memory] ${iterations} renders used ${formatBytes(memoryDelta)}`);
        expect(memoryDelta).toBeLessThan(1024 * 500); // <500KB acceptable
    });

    function formatBytes(bytes: number, decimals: number = 2): string {
        const negative = bytes < 0;
        const absBytes = Math.abs(bytes);
        if (absBytes === 0) return "0 Bytes";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(absBytes) / Math.log(k));
        const formattedNumber = parseFloat((absBytes / Math.pow(k, i)).toFixed(dm));
        return (negative ? "-" : "") + formattedNumber + " " + sizes[i];
    }

    test('renders a realistic template with lorem ipsum and multiple placeholders', () => {
        const templateString = `
      Lorem ipsum dolor sit amet, @{name} consectetur adipiscing elit.
      Vestibulum at @{location} libero ac ante ullamcorper tincidunt.
      Curabitur convallis, @{adjective} in finibus ultricies, nibh arcu auctor urna,
      a vestibulum nulla nibh in magna. Sed ut @{verb} lectus.
    `;
        const data = {
            name: "Alice",
            location: "the park",
            adjective: "vibrant",
            verb: "enjoy"
        };

        const template = engine.createTemplate(templateString);
        const result = template(data);
        const expectedOutput = `
      Lorem ipsum dolor sit amet, Alice consectetur adipiscing elit.
      Vestibulum at the park libero ac ante ullamcorper tincidunt.
      Curabitur convallis, vibrant in finibus ultricies, nibh arcu auctor urna,
      a vestibulum nulla nibh in magna. Sed ut enjoy lectus.
    `;
        expect(result.value.trim()).toBe(expectedOutput.trim());
    });

});
describe("Conditional Template Tests", () => {
    const engine = createDefaultEngine();

    it("should render the true branch when the condition is true", () => {
        const template = "@if{show}Hello @{name}!@endif";
        const render = engine.createTemplate(template);
        const result = render({ show: true, name: "Alice" });
console.log('Test data:', { show: true, name: "Alice" });

        expect(result.toString()).toBe("Hello Alice!"); // ✅ Passes
    });

    it("should render the false branch when the condition is false", () => {
        const template = "@if{show}Hello @{name}!@elseGoodbye!@endif";
        const render = engine.createTemplate(template);
console.log('Test data:', { show: false });
        const result = render({ show: false });
        expect(result.toString()).toBe("Goodbye!");
    });

    it("should render nothing when the condition is false and there is no else branch", () => {
        const template = "@if{show}Hello @{name}!@endif";
        const render = engine.createTemplate(template);
        const result = render({ show: false });
        expect(result.toString()).toBe("");
    });

    it("should handle nested conditionals", () => {
        const template = "@if{show}Hello @if{name}@{name}!@elseWorld!@endif@elseGoodbye!@endif";
console.log('Test data:', { show: true, name: "Alice" });
        const render = engine.createTemplate(template);
        const result1 = render({ show: true, name: "Alice" });
        const result2 = render({ show: true, name: "" });
        const result3 = render({ show: false });

        expect(result1.toString()).toBe("Hello Alice!");
        expect(result2.toString()).toBe("Hello World!");
        expect(result3.toString()).toBe("Goodbye!");
    });

    it("should throw an error for an unclosed @if", () => {
        const template = "@if{show}Hello @{name}!";
        expect(() => engine.createTemplate(template)).toThrow("Unclosed @if");
    });

    it("should throw an error for an @else without @if", () => {
        const template = "@elseGoodbye!@endif";
        expect(() => engine.createTemplate(template)).toThrow("@else without @if");
    });

    it("should throw an error for an @endif without @if", () => {
        const template = "@endif";
        expect(() => engine.createTemplate(template)).toThrow("@endif without @if");
    });

    it("should throw an error for multiple @else for the same @if", () => {
        const template = "@if{show}Hello @{name}!@elseGoodbye!@elseOops!@endif";
        expect(() => engine.createTemplate(template)).toThrow("Multiple @else for @if");
    });

    it("should handle conditionals with literals and placeholders", () => {
        const template = "@if{show}Hello @{name}!@elseGoodbye, @{name}!@endif";
        const render = engine.createTemplate(template);
        const result1 = render({ show: true, name: "Alice" });
        const result2 = render({ show: false, name: "Bob" });

        expect(result1.toString()).toBe("Hello Alice!");
        expect(result2.toString()).toBe("Goodbye, Bob!");
    });

    it("should handle conditionals with default values", () => {
        const template = "@if{show}Hello @{name=World}!@elseGoodbye, @{name=Stranger}!@endif";
        const render = engine.createTemplate(template);
        const result1 = render({ show: true });
        const result2 = render({ show: false });

        expect(result1.toString()).toBe("Hello World!");
        expect(result2.toString()).toBe("Goodbye, Stranger!");
    });

    it("should throw an error for unexpected keys in data", () => {
        const template = "@if{show}Hello @{name}!@endif";
        const render = engine.createTemplate(template);
        expect(() => render({ show: true, name: "Alice", extra: "oops" })).toThrow(
            "Unexpected key 'extra' in data"
        );
    });

    it("should handle empty conditionals", () => {
        const template = "@if{show}@endif";
        const render = engine.createTemplate(template);
        const result1 = render({ show: true });
        const result2 = render({ show: false });

        expect(result1.toString()).toBe("");
        expect(result2.toString()).toBe("");
    });

    it("should handle conditionals with falsy values", () => {
        const template = "@if{show}Hello @{name}!@elseGoodbye!@endif";
        const render = engine.createTemplate(template);
        const result1 = render({ show: 0 }); // falsy
        const result2 = render({ show: "" }); // falsy
        const result3 = render({ show: null }); // falsy
        const result4 = render({ show: undefined }); // falsy

        expect(result1.toString()).toBe("Goodbye!");
        expect(result2.toString()).toBe("Goodbye!");
        expect(result3.toString()).toBe("Goodbye!");
        expect(result4.toString()).toBe("Goodbye!");
    });

    it("should handle conditionals with truthy values", () => {
        const template = "@if{show}Hello @{name}!@elseGoodbye!@endif";
        const render = engine.createTemplate(template);
        const result1 = render({ show: 1 }); // truthy
        const result2 = render({ show: "true" }); // truthy
        const result3 = render({ show: {} }); // truthy
        const result4 = render({ show: [] }); // truthy

        expect(result1.toString()).toBe("Hello !");
        expect(result2.toString()).toBe("Hello !");
        expect(result3.toString()).toBe("Hello !");
        expect(result4.toString()).toBe("Hello !");
    });
});