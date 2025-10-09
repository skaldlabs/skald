/**
 * Example usage of the Memo Tags Agent
 * 
 * This demonstrates how to use the memo tags agent to extract tags from memo content.
 */

import { memoTagsAgent } from "../memoTagsAgent";

async function exampleUsage() {
  // Example 1: Extract tags without existing tags
  const memoContent1 = `
    Building a new React component library for our design system.
    We're using TypeScript, Tailwind CSS, and Storybook for documentation.
    The components will be published to npm and used across all our web applications.
  `;

  const result1 = await memoTagsAgent.extractTags(memoContent1);
  console.log("Example 1 - Tags extracted:", result1.tags);

  // Example 2: Extract tags with existing tags to encourage reuse
  const existingTags = [
    "react",
    "typescript",
    "documentation",
    "web-development",
    "ui-components"
  ];

  const memoContent2 = `
    Implementing user authentication using OAuth 2.0 and JWT tokens.
    The backend is built with Node.js and Express, with PostgreSQL for data storage.
  `;

  const result2 = await memoTagsAgent.extractTags(memoContent2, existingTags);
  console.log("\nExample 2 - Tags extracted with existing tags:", result2.tags);
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => console.log("\nExample completed successfully!"))
    .catch((error) => console.error("Error:", error));
}

export { exampleUsage };

