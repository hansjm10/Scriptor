import {SafeString} from "../../core/safeString";

export class ConditionalSafeString extends SafeString {
    constructor(
        public readonly value: string,
        public readonly condition: boolean
    ) {
        super(value);
    }

    /**
     * If the condition is true, return the inner string;
     * otherwise return an empty string.
     */
    toString() {
        return this.condition ? this.value : "";
    }

}
/**
 * Helper function to easily render conditionals.
 * Given a condition and two result strings (true and false branches),
 * it returns a SafeString with the result of the appropriate branch.
 */
export function renderConditional(
    condition: boolean,
    trueResult: string,
    falseResult: string = ""
): SafeString {
    return new SafeString(condition ? trueResult : falseResult);
}