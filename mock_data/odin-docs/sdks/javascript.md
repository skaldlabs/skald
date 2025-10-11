# Odin JavaScript SDK

The official JavaScript/Node.js SDK for the Odin API - your gateway to Nordic mythology, countries, and language learning.

## Installation

```bash
npm install @odin/sdk
# or
yarn add @odin/sdk
# or
pnpm add @odin/sdk
```

## Quick Start

```javascript
const { OdinClient } = require('@odin/sdk');

// Initialize the client
const client = new OdinClient({ apiKey: 'your_api_key_here' });

// Get a mythology story
const story = await client.mythology.getStory('creation-of-yggdrasil');
console.log(story.title);
console.log(story.content);

// Search for gods
const gods = await client.mythology.searchCharacters({
  query: 'thunder',
  type: 'god'
});
gods.forEach(god => {
  console.log(`${god.name}: ${god.domain.join(', ')}`);
});

// Learn Norwegian
const lesson = await client.languages.getLesson({
  language: 'norwegian',
  level: 'beginner',
  lessonId: 1
});
console.log(lesson.title);
lesson.exercises.forEach(exercise => {
  console.log(exercise.question);
});
```

## ES6 Modules

```javascript
import { OdinClient } from '@odin/sdk';

const client = new OdinClient({ apiKey: 'your_api_key' });
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { OdinClient, Story, Character, Lesson } from '@odin/sdk';

const client = new OdinClient({ apiKey: 'your_api_key' });

const story: Story = await client.mythology.getStory('thor-vs-jormungandr');
const characters: Character[] = await client.mythology.listCharacters({ type: 'god' });
```

## Authentication

```javascript
const { OdinClient } = require('@odin/sdk');

// Using API key directly
const client = new OdinClient({ apiKey: 'your_api_key' });

// Using environment variable
process.env.ODIN_API_KEY = 'your_api_key';
const client = new OdinClient(); // Automatically reads from environment

// Using OAuth2
const client = new OdinClient({
  authType: 'oauth2',
  clientId: 'your_client_id',
  clientSecret: 'your_client_secret'
});
```

## Mythology API

### Stories

```javascript
// Get a specific story
const story = await client.mythology.getStory('thor-vs-jormungandr');

// Story properties
console.log(story.id);              // Story ID
console.log(story.title);           // Story title
console.log(story.content);         // Full story text
console.log(story.difficulty);      // "beginner", "intermediate", "advanced"
console.log(story.category);        // Story category
console.log(story.characters);      // Array of character IDs
console.log(story.audioUrl);        // Audio narration URL
console.log(story.images);          // Array of illustration URLs

// List stories
const stories = await client.mythology.listStories({
  category: 'aesir-gods',
  difficulty: 'beginner',
  limit: 10,
  offset: 0
});

// Search stories
const results = await client.mythology.searchStories({
  query: 'ragnarok',
  includeText: true,  // Search in story text
  limit: 20
});

// Get story audio as buffer
const audioBuffer = await client.mythology.getStoryAudio('thor-vs-jormungandr');
const fs = require('fs');
fs.writeFileSync('story.mp3', audioBuffer);

// Stream story audio
const audioStream = await client.mythology.getStoryAudioStream('thor-vs-jormungandr');
audioStream.pipe(fs.createWriteStream('story.mp3'));
```

### Characters

```javascript
// Get character details
const thor = await client.mythology.getCharacter('thor');

// Character properties
console.log(thor.name);             // Character name
console.log(thor.type);             // "god", "giant", "hero", "creature"
console.log(thor.domain);           // Array of domains/areas of influence
console.log(thor.powers);           // Array of powers
console.log(thor.familyTree);       // Family relationships object
console.log(thor.symbols);          // Associated symbols
console.log(thor.stories);          // Array of story IDs
console.log(thor.etymology);        // Name origin and meaning

// List characters
const characters = await client.mythology.listCharacters({
  type: 'god',
  pantheon: 'aesir',
  limit: 50
});

// Search characters
const results = await client.mythology.searchCharacters({
  query: 'wisdom',
  type: 'god'
});

// Get character family tree
const family = await client.mythology.getCharacterFamily('odin', { depth: 2 });
console.log(family.parents);
console.log(family.children);
console.log(family.siblings);
```

### Nine Realms

```javascript
// Get realm information
const asgard = await client.mythology.getRealm('asgard');

// Realm properties
console.log(asgard.name);           // Realm name
console.log(asgard.description);    // Detailed description
console.log(asgard.inhabitants);    // Array of character types
console.log(asgard.locations);      // Famous locations
console.log(asgard.connectedTo);    // Connected realms

// List all realms
const realms = await client.mythology.listRealms();

// Get realm map
const mapData = await client.mythology.getRealmMap('asgard', { format: 'svg' });
```

### Timeline

```javascript
// Get mythological timeline
const timeline = await client.mythology.getTimeline({
  startEvent: 'creation',
  endEvent: 'ragnarok',
  source: 'prose-edda'
});

timeline.events.forEach(event => {
  console.log(`${event.name}: ${event.description}`);
  console.log(`Participants: ${event.characters.join(', ')}`);
});

// Get specific event
const event = await client.mythology.getEvent('binding-of-fenrir');
```

## Languages API

### Courses

```javascript
// List available languages
const languages = await client.languages.listLanguages();
// Returns: ["danish", "finnish", "icelandic", "norwegian", "swedish"]

// Get course information
const course = await client.languages.getCourse('norwegian');
console.log(course.name);
console.log(course.levels);         // ["beginner", "intermediate", "advanced"]
console.log(course.totalLessons);
console.log(course.estimatedHours);

// Get user progress
const progress = await client.languages.getProgress('norwegian');
console.log(progress.completionPercentage);
console.log(progress.currentLevel);
console.log(progress.lessonsCompleted);
```

### Lessons

```javascript
// Get a lesson
const lesson = await client.languages.getLesson({
  language: 'norwegian',
  level: 'beginner',
  lessonId: 5
});

// Lesson properties
console.log(lesson.title);
console.log(lesson.grammarPoints);
console.log(lesson.vocabulary);
console.log(lesson.exercises);
console.log(lesson.audioExamples);

// List lessons
const lessons = await client.languages.listLessons({
  language: 'icelandic',
  level: 'intermediate'
});

// Complete a lesson
await client.languages.completeLesson({
  language: 'norwegian',
  lessonId: 5,
  score: 85
});
```

### Vocabulary

```javascript
// Get vocabulary for a lesson
const vocab = await client.languages.getVocabulary({
  language: 'swedish',
  lessonId: 3
});

vocab.words.forEach(word => {
  console.log(`${word.word}: ${word.translation}`);
  console.log(`Pronunciation: ${word.pronunciation}`);
  console.log(`Example: ${word.exampleSentence}`);
});

// Get vocabulary audio
const audio = await client.languages.getWordAudio('swedish', 'hej');

// Search vocabulary
const results = await client.languages.searchVocabulary({
  language: 'danish',
  query: 'food',
  category: 'nouns'
});
```

### Exercises

```javascript
// Get exercises for a lesson
const exercises = await client.languages.getExercises({
  language: 'norwegian',
  lessonId: 10
});

exercises.forEach(exercise => {
  console.log(`Type: ${exercise.type}`);  // "translation", "multiple_choice", "listening"
  console.log(`Question: ${exercise.question}`);
  console.log(`Options: ${exercise.options}`);
});

// Submit exercise answer
const result = await client.languages.submitExercise({
  exerciseId: 'ex_12345',
  answer: 'Jeg snakker norsk'
});
console.log(result.correct);        // true/false
console.log(result.explanation);    // Explanation if wrong
console.log(result.score);          // Points earned
```

## Countries API

### Country Information

```javascript
// Get country details
const norway = await client.countries.getCountry('norway');

// Country properties
console.log(norway.name);
console.log(norway.capital);
console.log(norway.population);
console.log(norway.languages);
console.log(norway.description);
console.log(norway.history);
console.log(norway.geography);
console.log(norway.culture);

// List all countries
const countries = await client.countries.listCountries();
// Returns info for: Denmark, Finland, Iceland, Norway, Sweden

// Search country content
const results = await client.countries.search({
  query: 'vikings',
  country: 'norway',
  contentType: 'history'
});
```

### Regions and Cities

```javascript
// Get regions of a country
const regions = await client.countries.getRegions('sweden');

regions.forEach(region => {
  console.log(`${region.name}: ${region.description}`);
});

// Get city information
const oslo = await client.countries.getCity('oslo');
console.log(oslo.country);
console.log(oslo.population);
console.log(oslo.attractions);
console.log(oslo.culturalSites);

// Get travel guide
const guide = await client.countries.getTravelGuide('iceland');
console.log(guide.bestTimeToVisit);
console.log(guide.mustSeeLocations);
console.log(guide.culturalEtiquette);
```

### Cultural Content

```javascript
// Get cultural articles
const articles = await client.countries.getArticles({
  country: 'denmark',
  category: 'traditions',
  limit: 10
});

// Get historical timeline
const timeline = await client.countries.getHistoryTimeline('finland');

timeline.events.forEach(event => {
  console.log(`${event.year}: ${event.title}`);
});
```

## User API

### Profile Management

```javascript
// Get user profile
const profile = await client.user.getProfile();
console.log(profile.username);
console.log(profile.email);
console.log(profile.learningPreferences);
console.log(profile.joinedDate);

// Update profile
await client.user.updateProfile({
  displayName: 'Nordic Learner',
  preferences: {
    difficulty: 'intermediate',
    dailyGoalMinutes: 30,
    notificationEnabled: true
  }
});
```

### Progress Tracking

```javascript
// Get overall progress
const progress = await client.user.getProgress();
console.log(progress.storiesRead);
console.log(progress.charactersStudied);
console.log(progress.totalLearningHours);
console.log(progress.achievements);

// Get achievements
const achievements = await client.user.getAchievements();
achievements.forEach(achievement => {
  console.log(`${achievement.name}: ${achievement.description}`);
  console.log(`Earned: ${achievement.earnedDate}`);
});

// Get reading history
const history = await client.user.getReadingHistory({ limit: 20 });
```

### Bookmarks and Notes

```javascript
// Add bookmark
await client.user.addBookmark({
  contentType: 'story',
  contentId: 'thor-vs-jormungandr'
});

// Get bookmarks
const bookmarks = await client.user.getBookmarks({ contentType: 'story' });

// Add note
await client.user.addNote({
  contentType: 'character',
  contentId: 'odin',
  note: 'Father of Thor and ruler of Asgard'
});

// Get notes
const notes = await client.user.getNotes({ contentType: 'character' });
```

## Advanced Features

### Batch Operations

```javascript
// Get multiple stories at once
const storyIds = ['story1', 'story2', 'story3'];
const stories = await client.mythology.getStoriesBatch(storyIds);

// Get multiple characters
const characterIds = ['thor', 'odin', 'loki'];
const characters = await client.mythology.getCharactersBatch(characterIds);
```

### Pagination

```javascript
// Manual pagination
const page1 = await client.mythology.listStories({ limit: 20, offset: 0 });
const page2 = await client.mythology.listStories({ limit: 20, offset: 20 });

// Using async iterator
for await (const story of client.mythology.iterStories({ pageSize: 50 })) {
  console.log(story.title);
  // Automatically handles pagination
}

// Get all pages at once
const allStories = await client.mythology.listAllStories({ pageSize: 100 });
```

### Filtering and Sorting

```javascript
// Complex filtering
const stories = await client.mythology.listStories({
  category: 'aesir-gods',
  difficulty: ['beginner', 'intermediate'],
  hasAudio: true,
  minLength: 1000,  // words
  sortBy: 'popularity',
  order: 'desc'
});
```

### Caching

```javascript
const { OdinClient } = require('@odin/sdk');

// Enable caching
const client = new OdinClient({
  apiKey: 'your_api_key',
  cache: {
    enabled: true,
    ttl: 3600  // 1 hour in seconds
  }
});

// Subsequent calls use cache
const story1 = await client.mythology.getStory('thor-vs-jormungandr');  // API call
const story2 = await client.mythology.getStory('thor-vs-jormungandr');  // From cache

// Clear cache
client.clearCache();

// Disable cache for specific request
const story3 = await client.mythology.getStory('thor-vs-jormungandr', { noCache: true });
```

### Error Handling

```javascript
const {
  OdinClient,
  OdinAPIError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError
} = require('@odin/sdk');

const client = new OdinClient({ apiKey: 'your_api_key' });

try {
  const story = await client.mythology.getStory('invalid-story-id');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error(`Story not found: ${error.message}`);
  } else if (error instanceof AuthenticationError) {
    console.error(`Auth failed: ${error.message}`);
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after: ${error.retryAfter}`);
  } else if (error instanceof ValidationError) {
    console.error(`Invalid parameters: ${JSON.stringify(error.errors)}`);
  } else if (error instanceof OdinAPIError) {
    console.error(`API error: ${error.message}`);
    console.error(`Status code: ${error.statusCode}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Promises and Async/Await

```javascript
// Using async/await (recommended)
async function getStory() {
  const story = await client.mythology.getStory('thor-vs-jormungandr');
  return story;
}

// Using promises
client.mythology.getStory('thor-vs-jormungandr')
  .then(story => {
    console.log(story.title);
  })
  .catch(error => {
    console.error(error);
  });

// Promise.all for concurrent requests
const [story1, story2, story3] = await Promise.all([
  client.mythology.getStory('story1'),
  client.mythology.getStory('story2'),
  client.mythology.getStory('story3')
]);
```

## Browser Usage

The SDK works in both Node.js and browser environments:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Odin SDK Browser Example</title>
</head>
<body>
  <script type="module">
    import { OdinClient } from 'https://cdn.jsdelivr.net/npm/@odin/sdk/dist/browser.js';

    const client = new OdinClient({ apiKey: 'your_api_key' });

    // Use the SDK
    const story = await client.mythology.getStory('thor-vs-jormungandr');
    document.body.innerHTML = `<h1>${story.title}</h1><p>${story.content}</p>`;
  </script>
</body>
</html>
```

### Using with Webpack/Vite

```javascript
import { OdinClient } from '@odin/sdk';

const client = new OdinClient({ apiKey: process.env.ODIN_API_KEY });
```

## Configuration

### Client Configuration

```javascript
const { OdinClient } = require('@odin/sdk');

const client = new OdinClient({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.odin.com/v1',  // Custom API endpoint
  timeout: 30000,                        // Request timeout in milliseconds
  maxRetries: 3,                         // Retry failed requests
  cache: {
    enabled: true,                       // Enable response caching
    ttl: 3600                           // Cache TTL in seconds
  },
  userAgent: 'MyApp/1.0',               // Custom user agent
  debug: false                           // Enable debug logging
});
```

### Logging

```javascript
const { OdinClient } = require('@odin/sdk');

// Enable debug logging
const client = new OdinClient({
  apiKey: 'your_api_key',
  debug: true,
  logger: console  // Custom logger
});

// Custom logger
const customLogger = {
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`)
};

const client = new OdinClient({
  apiKey: 'your_api_key',
  logger: customLogger
});
```

## TypeScript Types

```typescript
import {
  OdinClient,
  Story,
  Character,
  Realm,
  Lesson,
  VocabularyWord,
  Exercise,
  Country,
  UserProfile,
  Achievement,
  Timeline,
  Event
} from '@odin/sdk';

// Story type
interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  characters: string[];
  audioUrl?: string;
  images: string[];
  readingTime: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Character type
interface Character {
  id: string;
  name: string;
  type: 'god' | 'giant' | 'hero' | 'creature';
  domain: string[];
  powers: string[];
  familyTree: Record<string, string[]>;
  symbols: string[];
  stories: string[];
  etymology: string;
  description: string;
  imageUrl?: string;
}

// Lesson type
interface Lesson {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string;
  grammarPoints: string[];
  vocabulary: VocabularyWord[];
  exercises: Exercise[];
  audioExamples: string[];
  estimatedTime: number;
  order: number;
}
```

## Rate Limiting

The Odin API has the following rate limits:

- **Free tier**: 100 requests/hour
- **Basic tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

```javascript
// Check rate limit status
const client = new OdinClient({ apiKey: 'your_api_key' });

// Rate limit info is available after any request
const story = await client.mythology.getStory('thor-vs-jormungandr');

console.log(client.rateLimit.limit);       // Total limit
console.log(client.rateLimit.remaining);   // Remaining requests
console.log(client.rateLimit.resetAt);     // Reset timestamp

// Handle rate limiting
try {
  const story = await client.mythology.getStory('some-id');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
    const story = await client.mythology.getStory('some-id');
  }
}
```

## Testing

```javascript
const { MockOdinClient } = require('@odin/sdk/testing');

// Use mock client for testing
const client = new MockOdinClient();

// Mock client returns sample data
const story = await client.mythology.getStory('any-id');
expect(story.title).toBeDefined();

// Set custom mock data
client.setMockStory({
  id: 'test-story',
  title: 'Test Story',
  content: 'Test content'
});

const story2 = await client.mythology.getStory('test-story');
expect(story2.title).toBe('Test Story');
```

## Examples

### Example 1: Daily Learning Session (Node.js)

```javascript
const { OdinClient } = require('@odin/sdk');

async function dailyLesson() {
  const client = new OdinClient({ apiKey: process.env.ODIN_API_KEY });

  // Get user's current lesson
  const progress = await client.languages.getProgress('norwegian');
  const nextLesson = await client.languages.getLesson({
    language: 'norwegian',
    level: progress.currentLevel,
    lessonId: progress.nextLessonId
  });

  console.log(`Today's lesson: ${nextLesson.title}`);

  // Study the lesson
  for (const exercise of nextLesson.exercises) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      readline.question(`${exercise.question}: `, resolve);
    });
    readline.close();

    const result = await client.languages.submitExercise({
      exerciseId: exercise.id,
      answer
    });

    if (result.correct) {
      console.log('Correct!');
    } else {
      console.log(`Incorrect. ${result.explanation}`);
    }
  }

  // Mark lesson complete
  await client.languages.completeLesson({
    language: 'norwegian',
    lessonId: nextLesson.id,
    score: 85
  });
}

dailyLesson();
```

### Example 2: Mythology Explorer (React)

```javascript
import React, { useState, useEffect } from 'react';
import { OdinClient } from '@odin/sdk';

function MythologyExplorer() {
  const [story, setStory] = useState(null);
  const [characters, setCharacters] = useState([]);
  const client = new OdinClient({ apiKey: process.env.REACT_APP_ODIN_API_KEY });

  useEffect(() => {
    async function loadStory() {
      const stories = await client.mythology.listStories({
        difficulty: 'beginner',
        hasAudio: true,
        limit: 10
      });

      const randomStory = stories[Math.floor(Math.random() * stories.length)];
      setStory(randomStory);

      // Load characters
      const charData = await Promise.all(
        randomStory.characters.map(id => client.mythology.getCharacter(id))
      );
      setCharacters(charData);
    }

    loadStory();
  }, []);

  if (!story) return <div>Loading...</div>;

  return (
    <div>
      <h1>{story.title}</h1>
      <p>{story.content}</p>

      <h2>Characters</h2>
      {characters.map(char => (
        <div key={char.id}>
          <h3>{char.name}</h3>
          <p>Type: {char.type}</p>
          <p>Domain: {char.domain.join(', ')}</p>
        </div>
      ))}
    </div>
  );
}

export default MythologyExplorer;
```

### Example 3: Build a Quiz (Express.js)

```javascript
const express = require('express');
const { OdinClient } = require('@odin/sdk');

const app = express();
const client = new OdinClient({ apiKey: process.env.ODIN_API_KEY });

app.get('/api/quiz', async (req, res) => {
  try {
    // Get random characters for quiz
    const characters = await client.mythology.listCharacters({
      type: 'god',
      limit: 20
    });

    // Shuffle and take 10
    const shuffled = characters.sort(() => 0.5 - Math.random());
    const quizCharacters = shuffled.slice(0, 10);

    // Format quiz questions
    const questions = quizCharacters.map(char => ({
      id: char.id,
      question: `What is ${char.name} the god of?`,
      answer: char.domain
    }));

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Quiz API running on port 3000');
});
```

### Example 4: CLI Tool

```javascript
#!/usr/bin/env node

const { OdinClient } = require('@odin/sdk');
const { program } = require('commander');

const client = new OdinClient({ apiKey: process.env.ODIN_API_KEY });

program
  .name('odin-cli')
  .description('CLI tool for Odin API')
  .version('1.0.0');

program
  .command('story <id>')
  .description('Get a mythology story')
  .action(async (id) => {
    const story = await client.mythology.getStory(id);
    console.log(`\n${story.title}\n`);
    console.log(story.content);
  });

program
  .command('character <id>')
  .description('Get character information')
  .action(async (id) => {
    const char = await client.mythology.getCharacter(id);
    console.log(`\nName: ${char.name}`);
    console.log(`Type: ${char.type}`);
    console.log(`Domain: ${char.domain.join(', ')}`);
    console.log(`\n${char.description}`);
  });

program.parse();
```

## Framework Integrations

### Next.js

```javascript
// pages/api/story/[id].js
import { OdinClient } from '@odin/sdk';

const client = new OdinClient({ apiKey: process.env.ODIN_API_KEY });

export default async function handler(req, res) {
  const { id } = req.query;
  const story = await client.mythology.getStory(id);
  res.status(200).json(story);
}
```

### Express Middleware

```javascript
const { OdinClient } = require('@odin/sdk');

function odinMiddleware(apiKey) {
  const client = new OdinClient({ apiKey });

  return (req, res, next) => {
    req.odin = client;
    next();
  };
}

app.use(odinMiddleware(process.env.ODIN_API_KEY));

app.get('/story/:id', async (req, res) => {
  const story = await req.odin.mythology.getStory(req.params.id);
  res.json(story);
});
```

## Support

- **Documentation**: https://docs.odin.com
- **API Reference**: https://api.odin.com/docs
- **GitHub**: https://github.com/odin/javascript-sdk
- **NPM**: https://www.npmjs.com/package/@odin/sdk
- **Issues**: https://github.com/odin/javascript-sdk/issues
- **Email**: support@odin.com

## License

MIT License - see LICENSE file for details
