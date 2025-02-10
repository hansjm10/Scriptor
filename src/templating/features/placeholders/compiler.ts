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
import { SafeString } from "../../core/safeString";

type LiteralToken = { t: 'L'; v: string };
type PlaceholderToken = { t: 'P'; k: string; d?: string };
type ConditionalToken = { t: 'C';
    cond: string;
    tn: RenderFunction;
    fe: RenderFunction | null };

type Token = LiteralToken | PlaceholderToken | ConditionalToken;

export class Compiler implements TemplateCompiler<TemplateNode> {
    compile(nodes: TemplateNode[]): RenderFunction {
        // Precompile tokens for each node type.
        const tokens: Token[] = nodes.map(node => {
            switch (node.type) {
                case 'literal':
                    return { t: 'L', v: (node as LiteralNode).value };
                case 'placeholder': {
                    const n = node as PlaceholderNode;
                    return { t: 'P', k: n.key, d: n.defaultValue };
                }
                case 'conditional': {
                    const n = node as ConditionalNode;
                    // Conditionally compile each branch. Note: We still use the "condition" property
                    // for evaluating the branch; however, it is not considered a complete key.
                    return {
                        t: 'C',
                        cond: n.condition,
                        tn: this.compile(n.trueBranch),
                        fe: n.falseBranch ? this.compile(n.falseBranch) : null
                    };
                }
                default:
                    throw new Error(`Unknown node type: ${(node as any).type}`);
            }
        });

        // Only collect valid keys from placeholder nodes (ignoring conditional keys).
        const validKeys = this.collectPlaceholderKeys(nodes);

        return (data: Record<string, any>, helpers: TemplateHelpers) => {
            let output = '';

            // Validate that every key in the provided data is expected (only placeholders count)
            for (const key of Object.keys(data)) {
                if (!validKeys.has(key)) {
                    throw new Error(`Unexpected key '${key}' in data`);
                }
            }

            // Process tokens.
            for (const token of tokens) {
                if (token.t === 'L') {
                    output += token.v;
                    continue;
                }

                if (token.t === 'P') {
                    let value = data[token.k];
                    if (value === undefined || value === null) {
                        if (token.d !== undefined) {
                            output += token.d;
                            continue;
                        }
                        throw new Error(`Missing required key '${token.k}'`);
                    }
                    output += this.processValue(value, token.k, helpers);
                    continue;
                }

                if (token.t === 'C') {
                    // Evaluate condition using the designated key's value.
                    const condition = Boolean(data[token.cond]);
                    if (condition) {
                        output += token.tn(data, helpers).toString();
                    } else if (token.fe) {
                        output += token.fe(data, helpers).toString();
                    }
                    continue;
                }
            }
            return new helpers.SafeString(output);
        };
    }

    // In src/templating/features/placeholders/compiler.ts
    private collectPlaceholderKeys(nodes: TemplateNode[], keys: Set<string> = new Set()): Set<string> {
        for (const node of nodes) {
            switch (node.type) {
                case 'placeholder':
                    keys.add((node as PlaceholderNode).key);
                    break;
                case 'conditional': {
                    const condNode = node as ConditionalNode;
                    // Add the condition key (e.g., "show")
                    keys.add(condNode.condition);
                    // Recursively process branches WITH THE SAME KEY SET
                    this.collectPlaceholderKeys(condNode.trueBranch, keys);
                    if (condNode.falseBranch) {
                        this.collectPlaceholderKeys(condNode.falseBranch, keys);
                    }
                    break;
                }
                default:
                    // Ignore literals
                    break;
            }
        }
        return keys;
    }

    private processValue(value: unknown, key: string, helpers: TemplateHelpers): string {
        // Handle nested templates.
        if (typeof value === "function" && (value as any).__isTemplateInstance) {
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