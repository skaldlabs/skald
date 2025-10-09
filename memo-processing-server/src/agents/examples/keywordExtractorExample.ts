/**
 * Example usage of the Keyword Extractor Agent
 * 
 * This demonstrates how to use the keyword extractor agent to extract keywords from text chunks.
 */

import { keywordExtractorAgent } from "../keywordExtractorAgent";

async function exampleUsage() {
  // Example 1: Extract keywords from a technical code chunk
  const textChunk1 = `
    const userSchema = new Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      profile: {
        firstName: String,
        lastName: String,
        avatar: String
      },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      createdAt: { type: Date, default: Date.now }
    });
  `;

  const result1 = await keywordExtractorAgent.extractKeywords(textChunk1);
  console.log("Example 1 - Keywords from code chunk:");
  console.log(result1.keywords);
  console.log("\n---\n");

  // Example 2: Extract keywords from a documentation chunk
  const textChunk2 = `
    Authentication middleware is responsible for verifying JWT tokens in incoming requests.
    It checks the Authorization header, validates the token signature, and ensures the token
    hasn't expired. If validation fails, it returns a 401 Unauthorized response. The middleware
    also attaches the decoded user information to the request object for downstream route handlers.
  `;

  const result2 = await keywordExtractorAgent.extractKeywords(textChunk2);
  console.log("Example 2 - Keywords from documentation:");
  console.log(result2.keywords);
  console.log("\n---\n");

  // Example 3: Extract keywords from a meeting notes chunk
  const textChunk3 = `
    Discussed the database migration strategy. We'll use a blue-green deployment approach
    to minimize downtime. The PostgreSQL database will be replicated to a new instance,
    and we'll switch traffic once data consistency is verified. Rollback plan includes
    keeping the old database active for 48 hours.
  `;

  const result3 = await keywordExtractorAgent.extractKeywords(textChunk3);
  console.log("Example 3 - Keywords from meeting notes:");
  console.log(result3.keywords);
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage()
    .then(() => console.log("\n\nExample completed successfully!"))
    .catch((error) => console.error("Error:", error));
}

export { exampleUsage };

