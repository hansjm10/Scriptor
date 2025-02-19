// -------------------------------
// 1. Core Types and Interfaces
// -------------------------------
// src/templating/core/types.ts

import { SafeString } from "./safe-string";

/**
 * Base type for all template nodes
 */
export type TemplateNode =
  | LiteralNode
  | PlaceholderNode
  | ConditionalNode
  | IterationNode;

export interface LiteralNode {
  type: "literal";
  value: string;
}

export interface PlaceholderNode {
  type: "placeholder";
  key: string;
  defaultValue?: string;
}

export interface ConditionalNode {
  type: "conditional";
  condition: string; // the property key for the condition in your data
  trueBranch: TemplateNode[];
  falseBranch?: TemplateNode[];
}

// New iteration node interface
export interface IterationNode {
  type: "iteration";
  expression: string; // e.g. "item in items"
  children: TemplateNode[];
}

/**
 * Fundamental template processing units
 */
export interface TemplateParser<T extends TemplateNode> {
  parse(input: string): T[];
}

export interface TemplateCompiler<T extends TemplateNode> {
  compile(nodes: T[]): RenderFunction;
}

export type RenderFunction = (
  data: Record<string, any>,
  helpers: TemplateHelpers
) => SafeString;

export interface TemplateHelpers {
  escape: (value: string) => string;
  SafeString: typeof SafeString;
}

