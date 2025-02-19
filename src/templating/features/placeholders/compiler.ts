//src/templating/features/placeholders/compiler.ts
import {
    LiteralNode,
    PlaceholderNode,
    ConditionalNode,
    TemplateNode,
    RenderFunction,
    TemplateCompiler,
    TemplateHelpers
} from "../../core/types";
import { SafeString } from "../../core/safe-string";

type LiteralToken = { t: 'L'; v: string };
type PlaceholderToken = { t: 'P'; k: string; d?: string };
type ConditionalToken = {
    t: 'C';
    cond: string;
    tn: RenderFunction;
    fe: RenderFunction | null
};

type Token = LiteralToken | PlaceholderToken | ConditionalToken;

export class Compiler implements TemplateCompiler<TemplateNode> {
    public compile(nodes: TemplateNode[], parentKeys: Set<string> = new Set<string>()): RenderFunction {
        // Collect local keys from these nodes
        const localKeys = this.collectPlaceholderKeys(nodes);
        // Merge with any parent keys so children won't reject the parent's condition keys
        const validKeys = new Set([...parentKeys, ...localKeys]);
        console.log('Valid keys set:', validKeys);

        // Build tokens
        const tokens: Token[] = nodes.map(node => {
            switch (node.type) {
                case 'literal': {
                    const n = node as LiteralNode;
                    return { t: 'L', v: n.value };
                }
                case 'placeholder': {
                    const n = node as PlaceholderNode;
                    return { t: 'P', k: n.key, d: n.defaultValue };
                }
                case 'conditional': {
                    const n = node as ConditionalNode;
                    // Compile the true/false branches, passing along the merged valid keys
                    return {
                        t: 'C',
                        cond: n.condition,
                        tn: this.compile(n.trueBranch, validKeys),
                        fe: n.falseBranch ? this.compile(n.falseBranch, validKeys) : null
                    };
                }
                default:
                    throw new Error(`Unknown node type: ${(node as any).type}`);
            }
        });

        return (data: Record<string, any>, helpers: TemplateHelpers) => {
            console.log('Data being validated:', data);

            // Validate that every key in the provided data is expected
            for (const key of Object.keys(data)) {
                if (!validKeys.has(key)) {
                    throw new Error(`Unexpected key '${key}' in data`);
                }
            }

            let output = '';

            // Process tokens
            for (const token of tokens) {
                if (token.t === 'L') {
                    output += token.v;
                } else if (token.t === 'P') {
                    let value = data[token.k];
                    if (value === undefined || value === null) {
                        if (token.d !== undefined) {
                            output += token.d;
                            continue;
                        }
                        throw new Error(`Missing required key '${token.k}'`);
                    }
                    output += this.processValue(value, token.k, helpers);
                } else if (token.t === 'C') {
                    const condition = Boolean(data[token.cond]);
                    if (condition) {
                        output += token.tn(data, helpers).toString();
                    } else if (token.fe) {
                        output += token.fe(data, helpers).toString();
                    }
                }
            }

            return new helpers.SafeString(output);
        };
    }

    private collectPlaceholderKeys(nodes: TemplateNode[]): Set<string> {
        const keys = new Set<string>();
        console.log('Entering collectPlaceholderKeys with nodes:', nodes);
        for (const node of nodes) {
            switch (node.type) {
                case 'placeholder': {
                    const n = node as PlaceholderNode;
                    keys.add(n.key);
                    break;
                }
                case 'conditional': {
                    const condNode = node as ConditionalNode;
                    // Add the condition key
                    keys.add(condNode.condition);
                    // Recursively collect from true/false branches
                    const trueBranchKeys = this.collectPlaceholderKeys(condNode.trueBranch);
                    trueBranchKeys.forEach(k => keys.add(k));
                    if (condNode.falseBranch) {
                        const falseBranchKeys = this.collectPlaceholderKeys(condNode.falseBranch);
                        falseBranchKeys.forEach(k => keys.add(k));
                    }
                    break;
                }
                default:
                    // literal or unknown
                    break;
            }
        }
        console.log('Collected keys:', keys);
        return keys;
    }

    private processValue(value: unknown, key: string, helpers: TemplateHelpers): string {
        // Handle nested templates.
        if (typeof value === 'function' && (value as any).__isTemplateInstance) {
            if ((value as any).__requiresData) {
                throw new Error(`Nested template for '${key}' requires data`);
            }
            return (value as () => SafeString)().toString();
        }

        // If already a SafeString, output it directly.
        if (value instanceof SafeString) {
            return value.toString();
        }

        // Otherwise, escape the primitive output.
        return helpers.escape(String(value));
    }
}

