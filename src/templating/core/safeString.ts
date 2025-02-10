// -------------------------------
// 2. Safe String Implementation
// -------------------------------
// src/templating/core/safeString.ts

export class SafeString {
    constructor(public readonly value: string) {}
    toString() {
        return this.value;
    }
}
