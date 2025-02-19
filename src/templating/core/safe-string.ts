// -------------------------------
// 2. Safe String Implementation
// -------------------------------
// src/templating/core/safe-string.ts

export class SafeString {
    constructor(public readonly value: string) {}
    toString() {
        return this.value;
    }
}
