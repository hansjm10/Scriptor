import { createDefaultEngine } from "../src/templating/core/engine";

describe("For Loop Rendering", () => {
    test("renders a loop over numbers", () => {
        const engine = createDefaultEngine();
        const template = "Numbers: @for{n in nums}@{n} @endfor";
        const render = engine.compile(template);
        const result = render({ nums: [1, 2, 3] });
        expect(result.toString()).toBe("Numbers: 1 2 3 ");
    });

    test("renders nothing for an empty array", () => {
        const engine = createDefaultEngine();
        const template = "Empty: @for{item in items}@{item}@endfor";
        const output = engine.compile(template)({ items: [] });
        expect(output.toString()).toBe("Empty: ");
    });

    test("renders a loop with surrounding literals", () => {
        const engine = createDefaultEngine();
        const template = "List: [@for{item in items}@{item}, @endfor] End.";
        const output = engine.compile(template)({ items: ['a', 'b'] });
        expect(output.toString()).toBe("List: [a, b, ] End.");
    });
});
