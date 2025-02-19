# Scriptor - A TypeScript Engine Emulating Blazor's Component Architecture

Scriptor is a cutting-edge templating engine built in TypeScript, designed to bring the intuitive component model and reactivity of Blazor to modern web development. By harnessing TypeScript's strengths, Scriptor transforms UI creation into a streamlined, maintainable, and dynamic experience.

## Overview

Emulating Blazor's familiar component-based paradigm, Scriptor provides:
- A declarative, intuitive syntax for assembling web interfaces.
- Reactive data-binding for automatic UI updates.
- A comprehensive component lifecycle, from initialization to disposal.
- Seamless integration with contemporary development tools and practices.

## Current Status

- **Foundation:** Basic project structure established with a focus on simplicity.
- **Parsing Mechanism:** A refined, robust template parser now supports placeholders, default values, conditional blocks (@if, @else, @endif), iteration blocks (@for, @endfor), and a configurable maximum nesting depth to prevent malicious or overly complex templates.
- **Error Handling:** Enhanced diagnostics for unclosed or mismatched tags and missing placeholders.
- **Component Framework:** An initial component system is operational, laying the groundwork for advanced features.
- **Testing:** Expanded test coverage covering normal, edge, and extreme cases to ensure reliability.

With these enhancements, Scriptor is closer to an MVP that mirrors many of Blazor's capabilities in a TypeScript environment.

## TODOs

- [x] **Enhance Template Parsing:**
  - Add support for dynamic expressions, conditional logic, and iteration constructs.
  - Improve error handling with detailed diagnostics, including nested structures.

- [ ] **Refine Component Lifecycle:**
  - Expand lifecycle management to cover initialization, rendering, and cleanup phases.
  - Integrate advanced reactive data-binding for seamless state management.

- [ ] **Augment Testing and Documentation:**
  - Increase unit and integration test coverage, especially around complex nesting.
  - Develop comprehensive documentation with rich examples and API references.

- [ ] **Optimize Engine Performance:**
  - Further upgrade the rendering pipeline to efficiently manage complex component trees and large-scale applications.

## Roadmap

### Phase 1: MVP

- Finalize core template parsing functionality (placeholders, conditionals, iteration, nesting checks).
- Enhance foundational component definitions and lifecycle management.
- Integrate continuous testing and CI tools.

### Phase 2: Feature Expansion

- Implement additional advanced templating constructs.
- Enhance reactive data-binding and state synchronization.
- Broaden documentation and testing coverage.

### Phase 3: Production Readiness

- Incorporate further TypeScript enhancements to fully emulate Blazor's feature set.
- Optimize performance and scalability.
- Prepare for a stable v1.0 release with detailed documentation and use cases.

## Future Directions

- Explore a customizable plugin architecture.
- Foster open-source contributions and community-driven improvements.
- Expand compatibility with other modern frontend frameworks.

## Contributing

Contributions are highly encouraged. Please adhere to our guidelines and open an issue before proposing significant changes.

## License

MIT License

*This README will be updated as Scriptor evolves and matures.*

