// -------------------------------
// 4. Core Template Engine
// -------------------------------
// src/templating/core/engine.ts

import {RenderFunction, TemplateCompiler, TemplateHelpers, TemplateNode, TemplateParser} from "./types";
import {SafeString} from "./safeString";
import {PlaceholderParser} from "../features/placeholders/parser";
import {Compiler} from "../features/placeholders/compiler";

export class TemplateEngine {
    private readonly parser: TemplateParser<TemplateNode>;
    private readonly compiler: TemplateCompiler<TemplateNode>;
    private readonly helpers: TemplateHelpers;

    constructor(
        parser: TemplateParser<TemplateNode>,
        compiler: TemplateCompiler<TemplateNode>,
        helpers: TemplateHelpers
    ) {
        this.parser = parser;
        this.compiler = compiler;
        this.helpers = helpers;
    }

    compile(template: string): RenderFunction {
        const nodes = this.parser.parse(template);
console.log('Nodes:', nodes);
        return this.compiler.compile(nodes);
    }

    createTemplate(template: string) {
        const renderFn = this.compile(template);
        const nodes = this.parser.parse(template);

        // Determine if template requires data
        const requiresData = nodes.some(node =>
            (node.type === 'placeholder' && node.defaultValue === undefined)
            || (node.type === 'conditional')
        );

        const templateFunction = (data: Record<string, any> = {}) => {
            return renderFn(data, this.helpers);
        };

        // Add template instance markers
        Object.defineProperties(templateFunction, {
            __isTemplateInstance: {
                value: true,
                enumerable: false
            },
            __requiresData: {
                value: requiresData,
                enumerable: false
            },
            template: {
                value: template,
                enumerable: false
            }
        });

        return templateFunction;
    }

}

// -------------------------------
// 5. Default Instance Factory
// -------------------------------
// src/templating/index.ts

export function createDefaultEngine() {
    // Default HTML escaping
    const defaultEscape = (value: string) =>
        value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    return new TemplateEngine(
        new PlaceholderParser(),
        new Compiler(),
        {
            escape: defaultEscape,
            SafeString: SafeString
        }
    );
}