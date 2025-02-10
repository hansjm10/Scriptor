import {ConditionalNode, TemplateNode, TemplateParser} from "../../core/types";

export class PlaceholderParser implements TemplateParser<TemplateNode> {
    private readonly tagRegex = /@(if){([^{}]*)}|@(else)|@(endif)|@\{([^{}]*)\}/g;

    parse(template: string): TemplateNode[] {
        const nodes: TemplateNode[] = [];
        let currentNodes: TemplateNode[] = nodes;
        const stack: Array<{
            parentNodes: TemplateNode[];
            conditionalNode: ConditionalNode;
        }> = [];

        let lastIndex = 0;
        let match;

        this.tagRegex.lastIndex = 0;

        while ((match = this.tagRegex.exec(template)) !== null) {
            const tagStart = match.index;
            const tagEnd = this.tagRegex.lastIndex;
            const tagContent = match[0];

            // Add preceding literal
            if (tagStart > lastIndex) {
                currentNodes.push({
                    type: 'literal',
                    value: template.slice(lastIndex, tagStart)
                });
            }

            // Process the tag
            if (match[1] === 'if') { // @if{condition}
                const cond = match[2].trim();
                const conditionalNode: ConditionalNode = {
                    type: 'conditional',
                    condition: cond,
                    trueBranch: [],
                    falseBranch: undefined
                };
                currentNodes.push(conditionalNode);
                stack.push({
                    parentNodes: currentNodes,
                    conditionalNode
                });
                currentNodes = conditionalNode.trueBranch;
            } else if (match[3] === 'else') { // @else
                if (stack.length === 0) {
                    throw new Error('@else without @if');
                }
                const stackEntry = stack.pop()!;
                const conditionalNode = stackEntry.conditionalNode;
                if (conditionalNode.falseBranch !== undefined) {
                    throw new Error('Multiple @else for @if');
                }
                conditionalNode.falseBranch = [];
                stack.push({
                    parentNodes: stackEntry.parentNodes,
                    conditionalNode
                });
                currentNodes = conditionalNode.falseBranch;
            } else if (match[4] === 'endif') { // @endif
                if (stack.length === 0) {
                    throw new Error('@endif without @if');
                }
                const stackEntry = stack.pop()!;
                currentNodes = stackEntry.parentNodes;
            } else { // Placeholder @{...}
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

        // Add remaining literal
        if (lastIndex < template.length) {
            currentNodes.push({
                type: 'literal',
                value: template.slice(lastIndex)
            });
        }

        // Check for unclosed conditionals
        if (stack.length > 0) {
            throw new Error('Unclosed @if');
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
}