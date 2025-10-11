# Odin PHP SDK

The official PHP SDK for the Odin API - your gateway to Nordic mythology, countries, and language learning.

## Requirements

- PHP 7.4 or higher
- cURL extension
- JSON extension

## Installation

Install via Composer:

```bash
composer require odin/sdk
```

## Quick Start

```php
<?php

require 'vendor/autoload.php';

use Odin\Client;

// Initialize the client
$client = new Client(['api_key' => 'your_api_key_here']);

// Get a mythology story
$story = $client->mythology->getStory('creation-of-yggdrasil');
echo $story->title . "\n";
echo $story->content . "\n";

// Search for gods
$gods = $client->mythology->searchCharacters([
    'query' => 'thunder',
    'type' => 'god'
]);
foreach ($gods as $god) {
    echo "{$god->name}: " . implode(', ', $god->domain) . "\n";
}

// Learn Norwegian
$lesson = $client->languages->getLesson([
    'language' => 'norwegian',
    'level' => 'beginner',
    'lesson_id' => 1
]);
echo $lesson->title . "\n";
foreach ($lesson->exercises as $exercise) {
    echo $exercise->question . "\n";
}
```

## Authentication

```php
<?php

use Odin\Client;

// Using API key
$client = new Client(['api_key' => 'your_api_key']);

// Using environment variable
$client = new Client(['api_key' => getenv('ODIN_API_KEY')]);

// Using OAuth2
$client = new Client([
    'auth_type' => 'oauth2',
    'client_id' => 'your_client_id',
    'client_secret' => 'your_client_secret'
]);
```

## Mythology API

### Stories

```php
<?php

// Get a specific story
$story = $client->mythology->getStory('thor-vs-jormungandr');

// Story properties
echo $story->id;              // Story ID
echo $story->title;           // Story title
echo $story->content;         // Full story text
echo $story->difficulty;      // "beginner", "intermediate", "advanced"
echo $story->category;        // Story category
print_r($story->characters);  // Array of character IDs
echo $story->audio_url;       // Audio narration URL
print_r($story->images);      // Array of illustration URLs

// List stories
$stories = $client->mythology->listStories([
    'category' => 'aesir-gods',
    'difficulty' => 'beginner',
    'limit' => 10,
    'offset' => 0
]);

// Search stories
$results = $client->mythology->searchStories([
    'query' => 'ragnarok',
    'include_text' => true,  // Search in story text
    'limit' => 20
]);

// Get story audio
$audio = $client->mythology->getStoryAudio('thor-vs-jormungandr');
file_put_contents('story.mp3', $audio);

// Stream story audio
$client->mythology->streamStoryAudio('thor-vs-jormungandr', 'story.mp3');
```

### Characters

```php
<?php

// Get character details
$thor = $client->mythology->getCharacter('thor');

// Character properties
echo $thor->name;             // Character name
echo $thor->type;             // "god", "giant", "hero", "creature"
print_r($thor->domain);       // Array of domains/areas of influence
print_r($thor->powers);       // Array of powers
print_r($thor->family_tree);  // Associative array of family relationships
print_r($thor->symbols);      // Associated symbols
print_r($thor->stories);      // Array of story IDs
echo $thor->etymology;        // Name origin and meaning

// List characters
$characters = $client->mythology->listCharacters([
    'type' => 'god',
    'pantheon' => 'aesir',
    'limit' => 50
]);

// Search characters
$results = $client->mythology->searchCharacters([
    'query' => 'wisdom',
    'type' => 'god'
]);

// Get character family tree
$family = $client->mythology->getCharacterFamily('odin', ['depth' => 2]);
print_r($family->parents);
print_r($family->children);
print_r($family->siblings);
```

### Nine Realms

```php
<?php

// Get realm information
$asgard = $client->mythology->getRealm('asgard');

// Realm properties
echo $asgard->name;           // Realm name
echo $asgard->description;    // Detailed description
print_r($asgard->inhabitants);// Array of character types
print_r($asgard->locations);  // Famous locations
print_r($asgard->connected_to);// Connected realms

// List all realms
$realms = $client->mythology->listRealms();

// Get realm map
$mapData = $client->mythology->getRealmMap('asgard', ['format' => 'svg']);
```

### Timeline

```php
<?php

// Get mythological timeline
$timeline = $client->mythology->getTimeline([
    'start_event' => 'creation',
    'end_event' => 'ragnarok',
    'source' => 'prose-edda'
]);

foreach ($timeline->events as $event) {
    echo "{$event->name}: {$event->description}\n";
    echo "Participants: " . implode(', ', $event->characters) . "\n";
}

// Get specific event
$event = $client->mythology->getEvent('binding-of-fenrir');
```

## Languages API

### Courses

```php
<?php

// List available languages
$languages = $client->languages->listLanguages();
// Returns: ["danish", "finnish", "icelandic", "norwegian", "swedish"]

// Get course information
$course = $client->languages->getCourse('norwegian');
echo $course->name;
print_r($course->levels);         // ["beginner", "intermediate", "advanced"]
echo $course->total_lessons;
echo $course->estimated_hours;

// Get user progress
$progress = $client->languages->getProgress('norwegian');
echo $progress->completion_percentage;
echo $progress->current_level;
echo $progress->lessons_completed;
```

### Lessons

```php
<?php

// Get a lesson
$lesson = $client->languages->getLesson([
    'language' => 'norwegian',
    'level' => 'beginner',
    'lesson_id' => 5
]);

// Lesson properties
echo $lesson->title;
print_r($lesson->grammar_points);
print_r($lesson->vocabulary);
print_r($lesson->exercises);
print_r($lesson->audio_examples);

// List lessons
$lessons = $client->languages->listLessons([
    'language' => 'icelandic',
    'level' => 'intermediate'
]);

// Complete a lesson
$client->languages->completeLesson([
    'language' => 'norwegian',
    'lesson_id' => 5,
    'score' => 85
]);
```

### Vocabulary

```php
<?php

// Get vocabulary for a lesson
$vocab = $client->languages->getVocabulary([
    'language' => 'swedish',
    'lesson_id' => 3
]);

foreach ($vocab->words as $word) {
    echo "{$word->word}: {$word->translation}\n";
    echo "Pronunciation: {$word->pronunciation}\n";
    echo "Example: {$word->example_sentence}\n";
}

// Get vocabulary audio
$audio = $client->languages->getWordAudio('swedish', 'hej');

// Search vocabulary
$results = $client->languages->searchVocabulary([
    'language' => 'danish',
    'query' => 'food',
    'category' => 'nouns'
]);
```

### Exercises

```php
<?php

// Get exercises for a lesson
$exercises = $client->languages->getExercises([
    'language' => 'norwegian',
    'lesson_id' => 10
]);

foreach ($exercises as $exercise) {
    echo "Type: {$exercise->type}\n";  // "translation", "multiple_choice", "listening"
    echo "Question: {$exercise->question}\n";
    print_r($exercise->options);
}

// Submit exercise answer
$result = $client->languages->submitExercise([
    'exercise_id' => 'ex_12345',
    'answer' => 'Jeg snakker norsk'
]);
echo $result->correct ? 'Correct' : 'Incorrect';  // boolean
echo $result->explanation;    // Explanation if wrong
echo $result->score;          // Points earned
```

## Countries API

### Country Information

```php
<?php

// Get country details
$norway = $client->countries->getCountry('norway');

// Country properties
echo $norway->name;
echo $norway->capital;
echo $norway->population;
print_r($norway->languages);
echo $norway->description;
echo $norway->history;
echo $norway->geography;
echo $norway->culture;

// List all countries
$countries = $client->countries->listCountries();
// Returns info for: Denmark, Finland, Iceland, Norway, Sweden

// Search country content
$results = $client->countries->search([
    'query' => 'vikings',
    'country' => 'norway',
    'content_type' => 'history'
]);
```

### Regions and Cities

```php
<?php

// Get regions of a country
$regions = $client->countries->getRegions('sweden');

foreach ($regions as $region) {
    echo "{$region->name}: {$region->description}\n";
}

// Get city information
$oslo = $client->countries->getCity('oslo');
echo $oslo->country;
echo $oslo->population;
print_r($oslo->attractions);
print_r($oslo->cultural_sites);

// Get travel guide
$guide = $client->countries->getTravelGuide('iceland');
echo $guide->best_time_to_visit;
print_r($guide->must_see_locations);
print_r($guide->cultural_etiquette);
```

### Cultural Content

```php
<?php

// Get cultural articles
$articles = $client->countries->getArticles([
    'country' => 'denmark',
    'category' => 'traditions',
    'limit' => 10
]);

// Get historical timeline
$timeline = $client->countries->getHistoryTimeline('finland');

foreach ($timeline->events as $event) {
    echo "{$event->year}: {$event->title}\n";
}
```

## User API

### Profile Management

```php
<?php

// Get user profile
$profile = $client->user->getProfile();
echo $profile->username;
echo $profile->email;
print_r($profile->learning_preferences);
echo $profile->joined_date;

// Update profile
$client->user->updateProfile([
    'display_name' => 'Nordic Learner',
    'preferences' => [
        'difficulty' => 'intermediate',
        'daily_goal_minutes' => 30,
        'notification_enabled' => true
    ]
]);
```

### Progress Tracking

```php
<?php

// Get overall progress
$progress = $client->user->getProgress();
echo $progress->stories_read;
echo $progress->characters_studied;
echo $progress->total_learning_hours;
print_r($progress->achievements);

// Get achievements
$achievements = $client->user->getAchievements();
foreach ($achievements as $achievement) {
    echo "{$achievement->name}: {$achievement->description}\n";
    echo "Earned: {$achievement->earned_date}\n";
}

// Get reading history
$history = $client->user->getReadingHistory(['limit' => 20]);
```

### Bookmarks and Notes

```php
<?php

// Add bookmark
$client->user->addBookmark([
    'content_type' => 'story',
    'content_id' => 'thor-vs-jormungandr'
]);

// Get bookmarks
$bookmarks = $client->user->getBookmarks(['content_type' => 'story']);

// Add note
$client->user->addNote([
    'content_type' => 'character',
    'content_id' => 'odin',
    'note' => 'Father of Thor and ruler of Asgard'
]);

// Get notes
$notes = $client->user->getNotes(['content_type' => 'character']);
```

## Advanced Features

### Batch Operations

```php
<?php

// Get multiple stories at once
$storyIds = ['story1', 'story2', 'story3'];
$stories = $client->mythology->getStoriesBatch($storyIds);

// Get multiple characters
$characterIds = ['thor', 'odin', 'loki'];
$characters = $client->mythology->getCharactersBatch($characterIds);
```

### Pagination

```php
<?php

// Manual pagination
$page1 = $client->mythology->listStories(['limit' => 20, 'offset' => 0]);
$page2 = $client->mythology->listStories(['limit' => 20, 'offset' => 20]);

// Using iterator
foreach ($client->mythology->iterStories(['page_size' => 50]) as $story) {
    echo $story->title . "\n";
    // Automatically handles pagination
}

// Get all pages as array
$allStories = $client->mythology->getAllStories(['page_size' => 100]);
```

### Filtering and Sorting

```php
<?php

// Complex filtering
$stories = $client->mythology->listStories([
    'category' => 'aesir-gods',
    'difficulty' => ['beginner', 'intermediate'],
    'has_audio' => true,
    'min_length' => 1000,  // words
    'sort_by' => 'popularity',
    'order' => 'desc'
]);
```

### Caching

```php
<?php

use Odin\Client;

// Enable caching
$client = new Client([
    'api_key' => 'your_api_key',
    'cache' => [
        'enabled' => true,
        'ttl' => 3600  // 1 hour
    ]
]);

// Subsequent calls use cache
$story1 = $client->mythology->getStory('thor-vs-jormungandr');  // API call
$story2 = $client->mythology->getStory('thor-vs-jormungandr');  // From cache

// Clear cache
$client->clearCache();

// Disable cache for specific request
$story3 = $client->mythology->getStory('thor-vs-jormungandr', ['no_cache' => true]);
```

### Error Handling

```php
<?php

use Odin\Client;
use Odin\Exceptions\OdinAPIException;
use Odin\Exceptions\AuthenticationException;
use Odin\Exceptions\NotFoundException;
use Odin\Exceptions\RateLimitException;
use Odin\Exceptions\ValidationException;

$client = new Client(['api_key' => 'your_api_key']);

try {
    $story = $client->mythology->getStory('invalid-story-id');
} catch (NotFoundException $e) {
    echo "Story not found: {$e->getMessage()}\n";
} catch (AuthenticationException $e) {
    echo "Auth failed: {$e->getMessage()}\n";
} catch (RateLimitException $e) {
    echo "Rate limited. Retry after: {$e->getRetryAfter()}\n";
} catch (ValidationException $e) {
    echo "Invalid parameters: " . json_encode($e->getErrors()) . "\n";
} catch (OdinAPIException $e) {
    echo "API error: {$e->getMessage()}\n";
    echo "Status code: {$e->getStatusCode()}\n";
}
```

## Configuration

### Client Configuration

```php
<?php

use Odin\Client;

$client = new Client([
    'api_key' => 'your_api_key',
    'base_url' => 'https://api.odin.com/v1',  // Custom API endpoint
    'timeout' => 30,                            // Request timeout in seconds
    'max_retries' => 3,                         // Retry failed requests
    'cache' => [
        'enabled' => true,                      // Enable response caching
        'ttl' => 3600                          // Cache TTL in seconds
    ],
    'user_agent' => 'MyApp/1.0',               // Custom user agent
    'debug' => false                            // Enable debug logging
]);
```

### Logging

```php
<?php

use Odin\Client;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Create logger
$logger = new Logger('odin');
$logger->pushHandler(new StreamHandler('path/to/odin.log', Logger::DEBUG));

// Use with client
$client = new Client([
    'api_key' => 'your_api_key',
    'logger' => $logger,
    'debug' => true
]);
```

## Laravel Integration

### Configuration

```php
<?php

// config/odin.php
return [
    'api_key' => env('ODIN_API_KEY'),
    'timeout' => 30,
    'cache' => [
        'enabled' => env('APP_ENV') === 'production',
        'ttl' => 3600
    ]
];
```

### Service Provider

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Odin\Client;

class OdinServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Client::class, function ($app) {
            return new Client([
                'api_key' => config('odin.api_key'),
                'timeout' => config('odin.timeout'),
                'cache' => config('odin.cache')
            ]);
        });
    }
}
```

### Using in Controllers

```php
<?php

namespace App\Http\Controllers;

use Odin\Client;
use Odin\Exceptions\NotFoundException;

class StoryController extends Controller
{
    protected $odin;

    public function __construct(Client $odin)
    {
        $this->odin = $odin;
    }

    public function show($id)
    {
        try {
            $story = $this->odin->mythology->getStory($id);
            return view('stories.show', compact('story'));
        } catch (NotFoundException $e) {
            abort(404);
        }
    }
}
```

### Facade

```php
<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;
use Odin\Client;

class Odin extends Facade
{
    protected static function getFacadeAccessor()
    {
        return Client::class;
    }
}

// Usage
use App\Facades\Odin;

$story = Odin::mythology()->getStory('thor-vs-jormungandr');
```

### Queue Jobs

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Odin\Client;

class FetchStoryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    protected $storyId;

    public function __construct($storyId)
    {
        $this->storyId = $storyId;
    }

    public function handle(Client $odin)
    {
        $story = $odin->mythology->getStory($this->storyId);

        // Process story
        \App\Models\Story::create([
            'external_id' => $story->id,
            'title' => $story->title,
            'content' => $story->content
        ]);
    }
}
```

## WordPress Integration

### Plugin Setup

```php
<?php

/*
Plugin Name: Odin Integration
Description: Integrate Odin API with WordPress
Version: 1.0.0
*/

require_once plugin_dir_path(__FILE__) . 'vendor/autoload.php';

use Odin\Client;

function odin_client() {
    static $client = null;
    if ($client === null) {
        $client = new Client([
            'api_key' => get_option('odin_api_key')
        ]);
    }
    return $client;
}

// Shortcode: [odin_story id="thor-vs-jormungandr"]
add_shortcode('odin_story', function($atts) {
    $atts = shortcode_atts(['id' => ''], $atts);

    if (empty($atts['id'])) {
        return 'Story ID required';
    }

    try {
        $story = odin_client()->mythology->getStory($atts['id']);
        return "<div class='odin-story'>
                    <h2>{$story->title}</h2>
                    <div class='content'>{$story->content}</div>
                </div>";
    } catch (Exception $e) {
        return 'Story not found';
    }
});
```

## Models and Data Types

### Story Model

```php
<?php

namespace Odin\Models;

class Story
{
    public $id;
    public $title;
    public $content;
    public $difficulty;      // "beginner", "intermediate", "advanced"
    public $category;
    public $characters;      // array
    public $audio_url;
    public $images;          // array
    public $reading_time;    // minutes
    public $word_count;
    public $created_at;      // DateTime
    public $updated_at;      // DateTime

    public function __construct(array $data)
    {
        $this->id = $data['id'] ?? null;
        $this->title = $data['title'] ?? null;
        $this->content = $data['content'] ?? null;
        $this->difficulty = $data['difficulty'] ?? null;
        $this->category = $data['category'] ?? null;
        $this->characters = $data['characters'] ?? [];
        $this->audio_url = $data['audio_url'] ?? null;
        $this->images = $data['images'] ?? [];
        $this->reading_time = $data['reading_time'] ?? 0;
        $this->word_count = $data['word_count'] ?? 0;
        $this->created_at = isset($data['created_at'])
            ? new \DateTime($data['created_at'])
            : null;
        $this->updated_at = isset($data['updated_at'])
            ? new \DateTime($data['updated_at'])
            : null;
    }

    public function isBeginner(): bool
    {
        return $this->difficulty === 'beginner';
    }

    public function isIntermediate(): bool
    {
        return $this->difficulty === 'intermediate';
    }

    public function isAdvanced(): bool
    {
        return $this->difficulty === 'advanced';
    }
}
```

### Character Model

```php
<?php

namespace Odin\Models;

class Character
{
    public $id;
    public $name;
    public $type;            // "god", "giant", "hero", "creature"
    public $domain;          // array
    public $powers;          // array
    public $family_tree;     // array
    public $symbols;         // array
    public $stories;         // array
    public $etymology;
    public $description;
    public $image_url;

    public function __construct(array $data)
    {
        $this->id = $data['id'] ?? null;
        $this->name = $data['name'] ?? null;
        $this->type = $data['type'] ?? null;
        $this->domain = $data['domain'] ?? [];
        $this->powers = $data['powers'] ?? [];
        $this->family_tree = $data['family_tree'] ?? [];
        $this->symbols = $data['symbols'] ?? [];
        $this->stories = $data['stories'] ?? [];
        $this->etymology = $data['etymology'] ?? null;
        $this->description = $data['description'] ?? null;
        $this->image_url = $data['image_url'] ?? null;
    }

    public function isGod(): bool
    {
        return $this->type === 'god';
    }

    public function isGiant(): bool
    {
        return $this->type === 'giant';
    }

    public function isHero(): bool
    {
        return $this->type === 'hero';
    }

    public function isCreature(): bool
    {
        return $this->type === 'creature';
    }
}
```

## Rate Limiting

The Odin API has the following rate limits:

- **Free tier**: 100 requests/hour
- **Basic tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

```php
<?php

// Check rate limit status
$client = new Client(['api_key' => 'your_api_key']);

// Rate limit info is available after any request
$story = $client->mythology->getStory('thor-vs-jormungandr');

echo $client->getRateLimit()->limit;       // Total limit
echo $client->getRateLimit()->remaining;   // Remaining requests
echo $client->getRateLimit()->resetAt;     // Reset timestamp

// Handle rate limiting
use Odin\Exceptions\RateLimitException;

try {
    $story = $client->mythology->getStory('some-id');
} catch (RateLimitException $e) {
    echo "Rate limited. Retry after {$e->getRetryAfter()} seconds\n";
    sleep($e->getRetryAfter());
    $story = $client->mythology->getStory('some-id');
}
```

## Testing

### PHPUnit Integration

```php
<?php

use PHPUnit\Framework\TestCase;
use Odin\Client;
use Odin\Testing\MockClient;

class StoryTest extends TestCase
{
    protected $client;

    protected function setUp(): void
    {
        $this->client = new MockClient();
    }

    public function testFetchStory()
    {
        $this->client->stubStory([
            'id' => 'test-story',
            'title' => 'Test Story',
            'content' => 'Test content'
        ]);

        $story = $this->client->mythology->getStory('test-story');

        $this->assertEquals('Test Story', $story->title);
    }

    public function testStoryNotFound()
    {
        $this->expectException(\Odin\Exceptions\NotFoundException::class);
        $this->client->mythology->getStory('nonexistent-story');
    }
}
```

## Examples

### Example 1: Daily Learning Session

```php
<?php

require 'vendor/autoload.php';

use Odin\Client;

$client = new Client(['api_key' => getenv('ODIN_API_KEY')]);

// Get user's current lesson
$progress = $client->languages->getProgress('norwegian');
$nextLesson = $client->languages->getLesson([
    'language' => 'norwegian',
    'level' => $progress->current_level,
    'lesson_id' => $progress->next_lesson_id
]);

echo "Today's lesson: {$nextLesson->title}\n\n";

// Study the lesson
foreach ($nextLesson->exercises as $exercise) {
    echo "{$exercise->question}: ";
    $answer = trim(fgets(STDIN));

    $result = $client->languages->submitExercise([
        'exercise_id' => $exercise->id,
        'answer' => $answer
    ]);

    if ($result->correct) {
        echo "Correct!\n";
    } else {
        echo "Incorrect. {$result->explanation}\n";
    }
}

// Mark lesson complete
$client->languages->completeLesson([
    'language' => 'norwegian',
    'lesson_id' => $nextLesson->id,
    'score' => 85
]);
```

### Example 2: REST API with Slim Framework

```php
<?php

require 'vendor/autoload.php';

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Odin\Client;

$app = AppFactory::create();

$odin = new Client(['api_key' => getenv('ODIN_API_KEY')]);

$app->get('/api/stories/{id}', function (Request $request, Response $response, $args) use ($odin) {
    try {
        $story = $odin->mythology->getStory($args['id']);
        $response->getBody()->write(json_encode($story));
        return $response->withHeader('Content-Type', 'application/json');
    } catch (\Odin\Exceptions\NotFoundException $e) {
        $response->getBody()->write(json_encode(['error' => 'Story not found']));
        return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
    }
});

$app->get('/api/characters', function (Request $request, Response $response) use ($odin) {
    $params = $request->getQueryParams();
    $characters = $odin->mythology->listCharacters([
        'type' => $params['type'] ?? null,
        'limit' => $params['limit'] ?? 20
    ]);

    $response->getBody()->write(json_encode($characters));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();
```

### Example 3: CLI Tool

```php
<?php

#!/usr/bin/env php

require 'vendor/autoload.php';

use Odin\Client;

$client = new Client(['api_key' => getenv('ODIN_API_KEY')]);

$command = $argv[1] ?? null;
$id = $argv[2] ?? null;

switch ($command) {
    case 'story':
        if (!$id) {
            echo "Usage: odin-cli story <id>\n";
            exit(1);
        }
        try {
            $story = $client->mythology->getStory($id);
            echo "\n{$story->title}\n\n";
            echo $story->content . "\n";
        } catch (\Odin\Exceptions\NotFoundException $e) {
            echo "Story not found\n";
            exit(1);
        }
        break;

    case 'character':
        if (!$id) {
            echo "Usage: odin-cli character <id>\n";
            exit(1);
        }
        try {
            $char = $client->mythology->getCharacter($id);
            echo "\nName: {$char->name}\n";
            echo "Type: {$char->type}\n";
            echo "Domain: " . implode(', ', $char->domain) . "\n";
            echo "\n{$char->description}\n";
        } catch (\Odin\Exceptions\NotFoundException $e) {
            echo "Character not found\n";
            exit(1);
        }
        break;

    default:
        echo "Usage: odin-cli <command> <id>\n";
        echo "Commands: story, character\n";
        exit(1);
}
```

## Support

- **Documentation**: https://docs.odin.com
- **API Reference**: https://api.odin.com/docs
- **GitHub**: https://github.com/odin/php-sdk
- **Packagist**: https://packagist.org/packages/odin/sdk
- **Issues**: https://github.com/odin/php-sdk/issues
- **Email**: support@odin.com

## License

MIT License - see LICENSE file for details
