import { ConditionalNode, ForLoopNode, TemplateNode, TemplateParser } from "../../core/types";

interface BlockStackEntry {
    parentNodes: TemplateNode[];
    node: ConditionalNode | ForLoopNode;
    branch?: 'trueBranch' | 'falseBranch';
}

export class PlaceholderParser implements TemplateParser<TemplateNode> {
    private readonly tagRegex = /@(if|for)\{([^{}]*)\}|@(else)|@(endif|endfor)|@\{([^{}]*)\}/g;

    parse(template: string): TemplateNode[] {
        const nodes: TemplateNode[] = [];
        let currentNodes: TemplateNode[] = nodes;
        const stack: BlockStackEntry[] = [];
        let lastIndex = 0;
        let match;
        this.tagRegex.lastIndex = 0;

        while ((match = this.tagRegex.exec(template)) !== null) {
            const tagStart = match.index;
            const tagEnd = this.tagRegex.lastIndex;

            if (tagStart > lastIndex) {
                currentNodes.push({
                    type: 'literal',
                    value: template.slice(lastIndex, tagStart)
                });
            }

            if (match[1]) { // @if{...} or @for{...}
                const keyword = match[1];
                const content = match[2].trim();
                if (keyword === 'if') {
                    const conditionalNode: ConditionalNode = {
                        type: 'conditional',
                        condition: content,
                        trueBranch: [],
                        falseBranch: undefined
                    };
                    currentNodes.push(conditionalNode);
                    stack.push({
                        parentNodes: currentNodes,
                        node: conditionalNode,
                        branch: 'trueBranch'
                    });
                    currentNodes = conditionalNode.trueBranch;
                } else if (keyword === 'for') {
                    const [iterator, collection] = this.parseForLoopContent(content);
                    const forLoopNode: ForLoopNode = {
                        type: 'for',
                        iterator,
                        collection,
                        body: []
                    };
                    currentNodes.push(forLoopNode);
                    stack.push({
                        parentNodes: currentNodes,
                        node: forLoopNode
                    });
                    currentNodes = forLoopNode.body;
                }
            } else if (match[3] === 'else') {
                if (stack.length === 0 || stack[stack.length - 1].node.type !== 'conditional') {
                    throw new Error('@else without matching @if');
                }
                const stackEntry = stack.pop()!;
                const conditionalNode = stackEntry.node;
                if (conditionalNode.falseBranch !== undefined) {
                    throw new Error('Multiple @else for @if');
                }
                conditionalNode.falseBranch = [];
                stack.push({
                    parentNodes: stackEntry.parentNodes,
                    node: conditionalNode,
                    branch: 'falseBranch'
                });
                currentNodes = conditionalNode.falseBranch;
            } else if (match[4]) { // @endif or @endfor
                const endToken = match[4];
                if (stack.length === 0) {
                    throw new Error(`${endToken} without opening block`);
                }
                const stackEntry = stack.pop()!;
                if (endToken === 'endif' && stackEntry.node.type !== 'conditional') {
                    throw new Error('@endif does not match a conditional block');
                }
                if (endToken === 'endfor' && stackEntry.node.type !== 'for') {
                    throw new Error('@endfor does not match a for loop block');
                }
                currentNodes = stackEntry.parentNodes;
            } else if (match[5]) { // Placeholder @{...}
                const content = match[5];
                const [key, defaultValue] = this.parsePlaceholderContent(content);
                currentNodes.push({
                    type: 'placeholder',
                    key,
                    defaultValue
                });
            }

            lastIndex = tagEnd;
        }

        if (lastIndex < template.length) {
            currentNodes.push({
                type: 'literal',
                value: template.slice(lastIndex)
            });
        }

        if (stack.length > 0) {
            throw new Error('Unclosed block');
        }

        return nodes;
    }

    private parsePlaceholderContent(content: string): [string, string?] {
        const equalsIndex = content.indexOf('=');
        if (equalsIndex === -1) {
            return [content];
        }

        const key = content.slice(0, equalsIndex).trim();
        const defaultValue = content.slice(equalsIndex + 1).trim();
        return [key, defaultValue];
    }

    private parseForLoopContent(content: string): [string, string] {
        const parts = content.split(/\s+in\s+/);
        if (parts.length !== 2) {
            throw new Error('Invalid for loop syntax. Expected format: @for{item in items}');
        }
        const iterator = parts[0].trim();
        const collection = parts[1].trim();
        return [iterator, collection];
    }
}
