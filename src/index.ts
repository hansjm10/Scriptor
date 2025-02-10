import {createDefaultEngine} from "./templating/core/engine";

const engine = createDefaultEngine();

const outerTemplate = engine.createTemplate("Today is @{day}. @{message}");
const nestedMessageTemplate = engine.createTemplate("Have a nice day, @{user=Visitor}!");
// Render the nested template as part of the outer template.
const renderedNested = outerTemplate({
    day: "Monday",
    message: nestedMessageTemplate, // Passing the nested template
});
console.log(renderedNested.toString());