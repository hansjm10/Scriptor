# Scriptor - Blazor-Inspired Templating Engine

Scriptor is a project dedicated to building a templating engine for C# that brings a component-based, reactive development style similar to Blazor. The goal is to make it easier to build modern, modular UI components with a natural developer experience.

## Overview

Scriptor aims to provide:

- A simple, declarative syntax for defining UI components and templates.
- Built-in support for data-binding and reactive updates.
- A component lifecycle management similar to Blazor's model.
- Flexibility to extend and integrate with existing C# applications.

## Current Status

- **Initial Setup:** Basic project scaffolding is in place.
- **Template Parsing:** Early-stage implementation of the template parser has been developed. It handles basic tags and expressions.
- **Component Model:** A preliminary component model exists, laying the groundwork for more advanced features.
- **Testing:** Initial tests have been written to validate parts of the parsing logic.

While the current implementation is rudimentary, it provides a foundation for expanding into a full-featured, Blazor-like templating engine.

## TODOs

- [ ] **Enhanced Template Parser:**
  - Implement support for dynamic expressions, conditionals, and loops.
  - Improve error handling and provide better diagnostics for syntax errors.

- [ ] **Component Lifecycle and State Management:**
  - Develop a robust system for component initialization, rendering, and disposal.
  - Integrate reactive data-binding to automatically update the UI on state changes.

- [ ] **Testing and Documentation:**
  - Expand unit and integration tests to cover new functionalities.
  - Improve documentation and add usage examples for better clarity.

- [ ] **Performance Optimizations:**
  - Optimize the rendering engine for large-scale templates and complex component trees.

## Roadmap

### Phase 1: Minimum Viable Product (MVP)

- Complete the core template parser.
- Refine the basic component model.
- Establish a stable development framework with continuous integration.

### Phase 2: Feature Expansion

- Introduce advanced templating features (dynamic expressions, conditionals, loops).
- Enhance data-binding and reactive update mechanisms.
- Expand the test suite and refine documentation.

### Phase 3: Integration and Refinement

- Integrate additional C# components to offer features similar to Blazor.
- Improve performance and scalability for production use.
- Prepare for version 1.0 release with comprehensive documentation and community examples.

### Future Directions

- Explore plugin and extension systems for greater customization.
- Foster community contributions and gather feedback for continuous improvement.
- Enhance integration options with other C# UI frameworks.

## Contributing

Contributions are welcome! Please adhere to our coding standards and guidelines. For major changes, open an issue first to discuss what you would like to change.

## License

MIT License

*This README will be regularly updated as the project evolves.*
