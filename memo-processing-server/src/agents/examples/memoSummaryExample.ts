/**
 * Example usage of the Memo Summary Agent
 * 
 * This demonstrates how to use the memo summary agent to generate summaries of memo content.
 */

import { memoSummaryAgent } from "../memoSummaryAgent";

async function exampleUsage() {
  // Example 1: Summarize a technical document
  const memoContent1 = `
    # Authentication System Design
    
    ## Overview
    We're building a new authentication system for our application using OAuth 2.0 and JWT tokens.
    
    ## Architecture
    - Frontend: React with TypeScript
    - Backend: Node.js with Express
    - Database: PostgreSQL for user data
    - Redis for session management
    
    ## Security Considerations
    - Tokens expire after 1 hour
    - Refresh tokens stored securely
    - Rate limiting on login attempts
    - HTTPS only for all requests
    
    ## Implementation Plan
    1. Set up OAuth providers (Google, GitHub)
    2. Implement JWT token generation
    3. Create middleware for authentication
    4. Build user management UI
    5. Add security monitoring
  `;

  const result1 = await memoSummaryAgent.summarize(memoContent1);
  console.log("Example 1 - Technical Document Summary:");
  console.log(result1.summary);
  console.log("\n---\n");

  // Example 2: Summarize a plain text memo
  const memoContent2 = `
    Had a productive meeting with the design team today. We discussed the new user onboarding flow
    and identified several areas for improvement. The main feedback was that the current flow is too
    long and users are dropping off at the third step. We decided to reduce the number of steps from
    five to three by combining some screens and making others optional. The team will create mockups
    by Friday, and we'll review them in next week's sprint planning. Also discussed the color palette
    update - moving to a more accessible scheme that meets WCAG AA standards. Sarah will lead the
    accessibility audit starting next week.
  `;

  const result2 = await memoSummaryAgent.summarize(memoContent2);
  console.log("Example 2 - Meeting Notes Summary:");
  console.log(result2.summary);
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => console.log("\n\nExample completed successfully!"))
    .catch((error) => console.error("Error:", error));
}

export { exampleUsage };

