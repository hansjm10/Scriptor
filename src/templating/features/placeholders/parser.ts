import { ConditionalNode, IterationNode, TemplateNode, TemplateParser } from "../../core/types";

interface ParserStackEntry {
  parentNodes: TemplateNode[];
  node: ConditionalNode | IterationNode;
}

export class PlaceholderParser implements TemplateParser<TemplateNode> {
  // Extended regex to handle @if, @else, @endif, @for, @endfor, and placeholders
  private readonly tagRegex = /@(if){([^{}]*)}|@(else)|@(endif)|@(for){([^{}]*)}|@(endfor)|@\{([^{}]*)\}/g;

  // Maximum permitted nesting depth (for extreme cases)
  private maxNestingDepth: number;

  // Track current parsing position for better error messages
  private line = 1;
  private col = 1;

  constructor(options?: { maxNestingDepth?: number }) {
    this.maxNestingDepth = options?.maxNestingDepth ?? 50;
  }

  private pushStack(stack: ParserStackEntry[], entry: ParserStackEntry) {
    if (stack.length >= this.maxNestingDepth) {
      this.throwError(`Maximum nesting depth of ${this.maxNestingDepth} exceeded.`);
    }
    stack.push(entry);
  }

  parse(template: string): TemplateNode[] {
    const nodes: TemplateNode[] = [];
    let currentNodes: TemplateNode[] = nodes;
    const stack: ParserStackEntry[] = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    this.tagRegex.lastIndex = 0;

    while ((match = this.tagRegex.exec(template)) !== null) {
      const tagStart = match.index;
      const tagEnd = this.tagRegex.lastIndex;

      // Update line/col for text before this tag
      this.updatePosition(template.slice(lastIndex, tagStart));

      // Add preceding literal
      if (tagStart > lastIndex) {
        currentNodes.push({
          type: "literal",
          value: template.slice(lastIndex, tagStart),
        });
      }

      // Process the tag
      if (match[1] === "if") {
        // @if{condition}
        const cond = match[2].trim();
        const conditionalNode: ConditionalNode = {
          type: "conditional",
          condition: cond,
          trueBranch: [],
        };
        currentNodes.push(conditionalNode);
        this.pushStack(stack, {
          parentNodes: currentNodes,
          node: conditionalNode,
        });
        currentNodes = conditionalNode.trueBranch;
      } else if (match[3] === "else") {
        // @else
        if (stack.length === 0) {
          this.throwError("@else without @if");
        }
        const top = stack.pop();
        if (!top || top.node.type !== "conditional") {
          this.throwError("@else without @if");
        }
        const conditionalNode = top.node as ConditionalNode;
        if (conditionalNode.falseBranch !== undefined) {
          this.throwError("Multiple @else for @if");
        }
        conditionalNode.falseBranch = [];
        this.pushStack(stack, {
          parentNodes: top.parentNodes,
          node: conditionalNode,
        });
        currentNodes = conditionalNode.falseBranch;
      } else if (match[4] === "endif") {
        // @endif
        if (stack.length === 0) {
          this.throwError("@endif without @if");
        }
        const top = stack.pop();
        if (!top || top.node.type !== "conditional") {
          this.throwError("@endif without @if");
        }
        currentNodes = top.parentNodes;
      } else if (match[5] === "for") {
        // @for{expression}
        const expression = match[6].trim();
        const iterationNode: IterationNode = {
          type: "iteration",
          expression,
          children: [],
        };
        currentNodes.push(iterationNode);
        this.pushStack(stack, {
          parentNodes: currentNodes,
          node: iterationNode,
        });
        currentNodes = iterationNode.children;
      } else if (match[7] === "endfor") {
        // @endfor
        if (stack.length === 0) {
          this.throwError("@endfor without @for");
        }
        const top = stack.pop();
        if (!top || top.node.type !== "iteration") {
          this.throwError("@endfor does not match an open @for");
        }
        currentNodes = top.parentNodes;
      } else {
        // Placeholder @{...}
        const content = match[8];
        const [key, defaultValue] = this.parsePlaceholderContent(content);
        currentNodes.push({
          type: "placeholder",
          key,
          defaultValue,
        });
      }

      // Update line/col for the tag itself
      this.updatePosition(template.slice(tagStart, tagEnd));
      lastIndex = tagEnd;
    }

    // Add remaining literal
    if (lastIndex < template.length) {
      // Update line/col for final text
      const finalText = template.slice(lastIndex);
      currentNodes.push({
        type: "literal",
        value: finalText,
      });
      this.updatePosition(finalText);
    }

    // Check for unclosed structures
    if (stack.length > 0) {
      const top = stack[stack.length - 1].node;
      if (top.type === "conditional") {
        this.throwError("Unclosed @if at end of template");
      } else {
        this.throwError("Unclosed @for at end of template");
      }
    }

    return nodes;
  }

  private parsePlaceholderContent(content: string): [string, string?] {
    const equalsIndex = content.indexOf("=");
    if (equalsIndex === -1) {
      return [content];
    }

    const key = content.slice(0, equalsIndex).trim();
    const defaultValue = content.slice(equalsIndex + 1).trim();
    return [key, defaultValue];
  }

  private updatePosition(fragment: string) {
    for (const char of fragment) {
      if (char === "\n") {
        this.line++;
        this.col = 1;
      } else {
        this.col++;
      }
    }
  }

  private throwError(message: string): never {
    throw new Error(`${message} (line: ${this.line}, col: ${this.col})`);
  }
}

