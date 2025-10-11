# Odin Python SDK

The official Python SDK for the Odin API - your gateway to Nordic mythology, countries, and language learning.

## Installation

```bash
pip install odin-sdk
```

## Quick Start

```python
from odin import OdinClient

# Initialize the client
client = OdinClient(api_key="your_api_key_here")

# Get a mythology story
story = client.mythology.get_story("creation-of-yggdrasil")
print(story.title)
print(story.content)

# Search for gods
gods = client.mythology.search_characters(query="thunder", type="god")
for god in gods:
    print(f"{god.name}: {god.domain}")

# Learn Norwegian
lesson = client.languages.get_lesson("norwegian", level="beginner", lesson_id=1)
print(lesson.title)
for exercise in lesson.exercises:
    print(exercise.question)
```

## Authentication

```python
from odin import OdinClient

# Using API key
client = OdinClient(api_key="your_api_key")

# Using environment variable
import os
os.environ["ODIN_API_KEY"] = "your_api_key"
client = OdinClient()  # Automatically reads from environment

# Using OAuth2
client = OdinClient(
    auth_type="oauth2",
    client_id="your_client_id",
    client_secret="your_client_secret"
)
```

## Mythology API

### Stories

```python
# Get a specific story
story = client.mythology.get_story("thor-vs-jormungandr")

# Story attributes
print(story.id)              # Story ID
print(story.title)           # Story title
print(story.content)         # Full story text
print(story.difficulty)      # "beginner", "intermediate", "advanced"
print(story.category)        # Story category
print(story.characters)      # List of character IDs
print(story.audio_url)       # Audio narration URL
print(story.images)          # List of illustration URLs

# List stories
stories = client.mythology.list_stories(
    category="aesir-gods",
    difficulty="beginner",
    limit=10,
    offset=0
)

# Search stories
results = client.mythology.search_stories(
    query="ragnarok",
    include_text=True,  # Search in story text
    limit=20
)

# Get story audio
audio = client.mythology.get_story_audio("thor-vs-jormungandr")
with open("story.mp3", "wb") as f:
    f.write(audio)
```

### Characters

```python
# Get character details
thor = client.mythology.get_character("thor")

# Character attributes
print(thor.name)             # Character name
print(thor.type)             # "god", "giant", "hero", "creature"
print(thor.domain)           # Domain/areas of influence
print(thor.powers)           # List of powers
print(thor.family_tree)      # Family relationships
print(thor.symbols)          # Associated symbols
print(thor.stories)          # List of story IDs
print(thor.etymology)        # Name origin and meaning

# List characters
characters = client.mythology.list_characters(
    type="god",
    pantheon="aesir",
    limit=50
)

# Search characters
results = client.mythology.search_characters(
    query="wisdom",
    type="god"
)

# Get character family tree
family = client.mythology.get_character_family("odin", depth=2)
print(family.parents)
print(family.children)
print(family.siblings)
```

### Nine Realms

```python
# Get realm information
asgard = client.mythology.get_realm("asgard")

# Realm attributes
print(asgard.name)           # Realm name
print(asgard.description)    # Detailed description
print(asgard.inhabitants)    # List of character types
print(asgard.locations)      # Famous locations
print(asgard.connected_to)   # Connected realms

# List all realms
realms = client.mythology.list_realms()

# Get realm map
map_data = client.mythology.get_realm_map("asgard", format="svg")
```

### Timeline

```python
# Get mythological timeline
timeline = client.mythology.get_timeline(
    start_event="creation",
    end_event="ragnarok",
    source="prose-edda"
)

for event in timeline.events:
    print(f"{event.name}: {event.description}")
    print(f"Participants: {event.characters}")

# Get specific event
event = client.mythology.get_event("binding-of-fenrir")
```

## Languages API

### Courses

```python
# List available languages
languages = client.languages.list_languages()
# Returns: ["danish", "finnish", "icelandic", "norwegian", "swedish"]

# Get course information
course = client.languages.get_course("norwegian")
print(course.name)
print(course.levels)         # ["beginner", "intermediate", "advanced"]
print(course.total_lessons)
print(course.estimated_hours)

# Get user progress
progress = client.languages.get_progress("norwegian")
print(progress.completion_percentage)
print(progress.current_level)
print(progress.lessons_completed)
```

### Lessons

```python
# Get a lesson
lesson = client.languages.get_lesson(
    language="norwegian",
    level="beginner",
    lesson_id=5
)

# Lesson attributes
print(lesson.title)
print(lesson.grammar_points)
print(lesson.vocabulary)
print(lesson.exercises)
print(lesson.audio_examples)

# List lessons
lessons = client.languages.list_lessons(
    language="icelandic",
    level="intermediate"
)

# Complete a lesson
client.languages.complete_lesson(
    language="norwegian",
    lesson_id=5,
    score=85
)
```

### Vocabulary

```python
# Get vocabulary for a lesson
vocab = client.languages.get_vocabulary(
    language="swedish",
    lesson_id=3
)

for word in vocab.words:
    print(f"{word.word}: {word.translation}")
    print(f"Pronunciation: {word.pronunciation}")
    print(f"Example: {word.example_sentence}")

# Get vocabulary audio
audio = client.languages.get_word_audio("swedish", "hej")

# Search vocabulary
results = client.languages.search_vocabulary(
    language="danish",
    query="food",
    category="nouns"
)
```

### Exercises

```python
# Get exercises for a lesson
exercises = client.languages.get_exercises(
    language="norwegian",
    lesson_id=10
)

for exercise in exercises:
    print(f"Type: {exercise.type}")  # "translation", "multiple_choice", "listening"
    print(f"Question: {exercise.question}")
    print(f"Options: {exercise.options}")

# Submit exercise answer
result = client.languages.submit_exercise(
    exercise_id="ex_12345",
    answer="Jeg snakker norsk"
)
print(result.correct)        # True/False
print(result.explanation)    # Explanation if wrong
print(result.score)          # Points earned
```

## Countries API

### Country Information

```python
# Get country details
norway = client.countries.get_country("norway")

# Country attributes
print(norway.name)
print(norway.capital)
print(norway.population)
print(norway.languages)
print(norway.description)
print(norway.history)
print(norway.geography)
print(norway.culture)

# List all countries
countries = client.countries.list_countries()
# Returns info for: Denmark, Finland, Iceland, Norway, Sweden

# Search country content
results = client.countries.search(
    query="vikings",
    country="norway",
    content_type="history"
)
```

### Regions and Cities

```python
# Get regions of a country
regions = client.countries.get_regions("sweden")

for region in regions:
    print(f"{region.name}: {region.description}")

# Get city information
oslo = client.countries.get_city("oslo")
print(oslo.country)
print(oslo.population)
print(oslo.attractions)
print(oslo.cultural_sites)

# Get travel guide
guide = client.countries.get_travel_guide("iceland")
print(guide.best_time_to_visit)
print(guide.must_see_locations)
print(guide.cultural_etiquette)
```

### Cultural Content

```python
# Get cultural articles
articles = client.countries.get_articles(
    country="denmark",
    category="traditions",
    limit=10
)

# Get historical timeline
timeline = client.countries.get_history_timeline("finland")

for event in timeline.events:
    print(f"{event.year}: {event.title}")
```

## User API

### Profile Management

```python
# Get user profile
profile = client.user.get_profile()
print(profile.username)
print(profile.email)
print(profile.learning_preferences)
print(profile.joined_date)

# Update profile
client.user.update_profile(
    display_name="Nordic Learner",
    preferences={
        "difficulty": "intermediate",
        "daily_goal_minutes": 30,
        "notification_enabled": True
    }
)
```

### Progress Tracking

```python
# Get overall progress
progress = client.user.get_progress()
print(progress.stories_read)
print(progress.characters_studied)
print(progress.total_learning_hours)
print(progress.achievements)

# Get achievements
achievements = client.user.get_achievements()
for achievement in achievements:
    print(f"{achievement.name}: {achievement.description}")
    print(f"Earned: {achievement.earned_date}")

# Get reading history
history = client.user.get_reading_history(limit=20)
```

### Bookmarks and Notes

```python
# Add bookmark
client.user.add_bookmark(
    content_type="story",
    content_id="thor-vs-jormungandr"
)

# Get bookmarks
bookmarks = client.user.get_bookmarks(content_type="story")

# Add note
client.user.add_note(
    content_type="character",
    content_id="odin",
    note="Father of Thor and ruler of Asgard"
)

# Get notes
notes = client.user.get_notes(content_type="character")
```

## Advanced Features

### Batch Operations

```python
# Get multiple stories at once
story_ids = ["story1", "story2", "story3"]
stories = client.mythology.get_stories_batch(story_ids)

# Get multiple characters
character_ids = ["thor", "odin", "loki"]
characters = client.mythology.get_characters_batch(character_ids)
```

### Pagination

```python
# Manual pagination
page1 = client.mythology.list_stories(limit=20, offset=0)
page2 = client.mythology.list_stories(limit=20, offset=20)

# Using iterator
for story in client.mythology.iter_stories(page_size=50):
    print(story.title)
    # Automatically handles pagination
```

### Filtering and Sorting

```python
# Complex filtering
stories = client.mythology.list_stories(
    category="aesir-gods",
    difficulty=["beginner", "intermediate"],
    has_audio=True,
    min_length=1000,  # words
    sort_by="popularity",
    order="desc"
)
```

### Caching

```python
from odin import OdinClient

# Enable caching
client = OdinClient(
    api_key="your_api_key",
    cache_enabled=True,
    cache_ttl=3600  # 1 hour
)

# Subsequent calls use cache
story1 = client.mythology.get_story("thor-vs-jormungandr")  # API call
story2 = client.mythology.get_story("thor-vs-jormungandr")  # From cache
```

### Error Handling

```python
from odin import OdinClient
from odin.exceptions import (
    OdinAPIError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ValidationError
)

client = OdinClient(api_key="your_api_key")

try:
    story = client.mythology.get_story("invalid-story-id")
except NotFoundError as e:
    print(f"Story not found: {e.message}")
except AuthenticationError as e:
    print(f"Auth failed: {e.message}")
except RateLimitError as e:
    print(f"Rate limited. Retry after: {e.retry_after}")
except ValidationError as e:
    print(f"Invalid parameters: {e.errors}")
except OdinAPIError as e:
    print(f"API error: {e.message}")
    print(f"Status code: {e.status_code}")
```

### Async Support

```python
import asyncio
from odin import AsyncOdinClient

async def main():
    client = AsyncOdinClient(api_key="your_api_key")

    # Async API calls
    story = await client.mythology.get_story("thor-vs-jormungandr")

    # Concurrent requests
    stories = await asyncio.gather(
        client.mythology.get_story("story1"),
        client.mythology.get_story("story2"),
        client.mythology.get_story("story3")
    )

    await client.close()

asyncio.run(main())

# Or use async context manager
async def main():
    async with AsyncOdinClient(api_key="your_api_key") as client:
        story = await client.mythology.get_story("thor-vs-jormungandr")
```

## Configuration

### Client Configuration

```python
from odin import OdinClient

client = OdinClient(
    api_key="your_api_key",
    base_url="https://api.odin.com/v1",  # Custom API endpoint
    timeout=30,                            # Request timeout in seconds
    max_retries=3,                         # Retry failed requests
    cache_enabled=True,                    # Enable response caching
    cache_ttl=3600,                        # Cache TTL in seconds
    user_agent="MyApp/1.0",               # Custom user agent
    debug=False                            # Enable debug logging
)
```

### Logging

```python
import logging
from odin import OdinClient

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
client = OdinClient(api_key="your_api_key", debug=True)

# Custom logger
import logging
logger = logging.getLogger("my_app")
client = OdinClient(api_key="your_api_key", logger=logger)
```

## Models and Data Types

### Story Model

```python
class Story:
    id: str
    title: str
    content: str
    difficulty: str  # "beginner", "intermediate", "advanced"
    category: str
    characters: List[str]
    audio_url: Optional[str]
    images: List[str]
    reading_time: int  # minutes
    word_count: int
    created_at: datetime
    updated_at: datetime
```

### Character Model

```python
class Character:
    id: str
    name: str
    type: str  # "god", "giant", "hero", "creature"
    domain: List[str]
    powers: List[str]
    family_tree: Dict[str, List[str]]
    symbols: List[str]
    stories: List[str]
    etymology: str
    description: str
    image_url: Optional[str]
```

### Lesson Model

```python
class Lesson:
    id: str
    language: str
    level: str
    title: str
    description: str
    grammar_points: List[str]
    vocabulary: List[VocabularyWord]
    exercises: List[Exercise]
    audio_examples: List[str]
    estimated_time: int  # minutes
    order: int
```

## Rate Limiting

The Odin API has the following rate limits:

- **Free tier**: 100 requests/hour
- **Basic tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

```python
# Check rate limit status
client = OdinClient(api_key="your_api_key")

# Rate limit info is available after any request
story = client.mythology.get_story("thor-vs-jormungandr")

print(client.rate_limit.limit)       # Total limit
print(client.rate_limit.remaining)   # Remaining requests
print(client.rate_limit.reset_at)    # Reset timestamp
```

## Testing

```python
from odin.testing import MockOdinClient

# Use mock client for testing
client = MockOdinClient()

# Mock client returns sample data
story = client.mythology.get_story("any-id")
assert story.title is not None

# Set custom mock data
client.set_mock_story({
    "id": "test-story",
    "title": "Test Story",
    "content": "Test content"
})
```

## Examples

### Example 1: Daily Learning Session

```python
from odin import OdinClient

client = OdinClient(api_key="your_api_key")

# Get user's current lesson
progress = client.languages.get_progress("norwegian")
next_lesson = client.languages.get_lesson(
    language="norwegian",
    level=progress.current_level,
    lesson_id=progress.next_lesson_id
)

# Study the lesson
print(f"Today's lesson: {next_lesson.title}")
for exercise in next_lesson.exercises:
    answer = input(f"{exercise.question}: ")
    result = client.languages.submit_exercise(exercise.id, answer)
    if result.correct:
        print("Correct!")
    else:
        print(f"Incorrect. {result.explanation}")

# Mark lesson complete
client.languages.complete_lesson("norwegian", next_lesson.id, score=85)
```

### Example 2: Explore Mythology

```python
from odin import OdinClient

client = OdinClient(api_key="your_api_key")

# Get random story from beginner category
stories = client.mythology.list_stories(
    difficulty="beginner",
    has_audio=True,
    limit=10
)

import random
story = random.choice(stories)

print(f"Story: {story.title}")
print(f"Characters: {', '.join(story.characters)}")

# Get character details
for char_id in story.characters:
    char = client.mythology.get_character(char_id)
    print(f"\n{char.name}")
    print(f"Type: {char.type}")
    print(f"Domain: {', '.join(char.domain)}")

# Bookmark the story
client.user.add_bookmark("story", story.id)
```

### Example 3: Build a Quiz App

```python
from odin import OdinClient
import random

client = OdinClient(api_key="your_api_key")

# Create mythology quiz
characters = client.mythology.list_characters(type="god", limit=20)
random.shuffle(characters)

score = 0
for char in characters[:10]:
    print(f"\nWhat is {char.name} the god of?")
    print(f"Answer: {', '.join(char.domain)}")

    user_answer = input("Your answer: ")
    if any(domain.lower() in user_answer.lower() for domain in char.domain):
        print("Correct!")
        score += 1
    else:
        print(f"Not quite. {char.name} is associated with: {', '.join(char.domain)}")

print(f"\nFinal score: {score}/10")
```

## Support

- **Documentation**: https://docs.odin.com
- **API Reference**: https://api.odin.com/docs
- **GitHub**: https://github.com/odin/python-sdk
- **Issues**: https://github.com/odin/python-sdk/issues
- **Email**: support@odin.com

## License

MIT License - see LICENSE file for details
