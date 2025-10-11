# Odin Ruby SDK

The official Ruby SDK for the Odin API - your gateway to Nordic mythology, countries, and language learning.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'odin-sdk'
```

And then execute:

```bash
bundle install
```

Or install it yourself:

```bash
gem install odin-sdk
```

## Quick Start

```ruby
require 'odin'

# Initialize the client
client = Odin::Client.new(api_key: 'your_api_key_here')

# Get a mythology story
story = client.mythology.get_story('creation-of-yggdrasil')
puts story.title
puts story.content

# Search for gods
gods = client.mythology.search_characters(query: 'thunder', type: 'god')
gods.each do |god|
  puts "#{god.name}: #{god.domain.join(', ')}"
end

# Learn Norwegian
lesson = client.languages.get_lesson(
  language: 'norwegian',
  level: 'beginner',
  lesson_id: 1
)
puts lesson.title
lesson.exercises.each do |exercise|
  puts exercise.question
end
```

## Authentication

```ruby
require 'odin'

# Using API key
client = Odin::Client.new(api_key: 'your_api_key')

# Using environment variable
ENV['ODIN_API_KEY'] = 'your_api_key'
client = Odin::Client.new  # Automatically reads from environment

# Using OAuth2
client = Odin::Client.new(
  auth_type: :oauth2,
  client_id: 'your_client_id',
  client_secret: 'your_client_secret'
)
```

## Mythology API

### Stories

```ruby
# Get a specific story
story = client.mythology.get_story('thor-vs-jormungandr')

# Story attributes
puts story.id              # Story ID
puts story.title           # Story title
puts story.content         # Full story text
puts story.difficulty      # :beginner, :intermediate, :advanced
puts story.category        # Story category
puts story.characters      # Array of character IDs
puts story.audio_url       # Audio narration URL
puts story.images          # Array of illustration URLs

# List stories
stories = client.mythology.list_stories(
  category: 'aesir-gods',
  difficulty: :beginner,
  limit: 10,
  offset: 0
)

# Search stories
results = client.mythology.search_stories(
  query: 'ragnarok',
  include_text: true,  # Search in story text
  limit: 20
)

# Get story audio
audio = client.mythology.get_story_audio('thor-vs-jormungandr')
File.write('story.mp3', audio)

# Stream story audio to file
File.open('story.mp3', 'wb') do |file|
  client.mythology.stream_story_audio('thor-vs-jormungandr') do |chunk|
    file.write(chunk)
  end
end
```

### Characters

```ruby
# Get character details
thor = client.mythology.get_character('thor')

# Character attributes
puts thor.name             # Character name
puts thor.type             # :god, :giant, :hero, :creature
puts thor.domain           # Array of domains/areas of influence
puts thor.powers           # Array of powers
puts thor.family_tree      # Hash of family relationships
puts thor.symbols          # Associated symbols
puts thor.stories          # Array of story IDs
puts thor.etymology        # Name origin and meaning

# List characters
characters = client.mythology.list_characters(
  type: :god,
  pantheon: 'aesir',
  limit: 50
)

# Search characters
results = client.mythology.search_characters(
  query: 'wisdom',
  type: :god
)

# Get character family tree
family = client.mythology.get_character_family('odin', depth: 2)
puts family.parents
puts family.children
puts family.siblings
```

### Nine Realms

```ruby
# Get realm information
asgard = client.mythology.get_realm('asgard')

# Realm attributes
puts asgard.name           # Realm name
puts asgard.description    # Detailed description
puts asgard.inhabitants    # Array of character types
puts asgard.locations      # Famous locations
puts asgard.connected_to   # Connected realms

# List all realms
realms = client.mythology.list_realms

# Get realm map
map_data = client.mythology.get_realm_map('asgard', format: :svg)
```

### Timeline

```ruby
# Get mythological timeline
timeline = client.mythology.get_timeline(
  start_event: 'creation',
  end_event: 'ragnarok',
  source: 'prose-edda'
)

timeline.events.each do |event|
  puts "#{event.name}: #{event.description}"
  puts "Participants: #{event.characters.join(', ')}"
end

# Get specific event
event = client.mythology.get_event('binding-of-fenrir')
```

## Languages API

### Courses

```ruby
# List available languages
languages = client.languages.list_languages
# Returns: ["danish", "finnish", "icelandic", "norwegian", "swedish"]

# Get course information
course = client.languages.get_course('norwegian')
puts course.name
puts course.levels         # [:beginner, :intermediate, :advanced]
puts course.total_lessons
puts course.estimated_hours

# Get user progress
progress = client.languages.get_progress('norwegian')
puts progress.completion_percentage
puts progress.current_level
puts progress.lessons_completed
```

### Lessons

```ruby
# Get a lesson
lesson = client.languages.get_lesson(
  language: 'norwegian',
  level: :beginner,
  lesson_id: 5
)

# Lesson attributes
puts lesson.title
puts lesson.grammar_points
puts lesson.vocabulary
puts lesson.exercises
puts lesson.audio_examples

# List lessons
lessons = client.languages.list_lessons(
  language: 'icelandic',
  level: :intermediate
)

# Complete a lesson
client.languages.complete_lesson(
  language: 'norwegian',
  lesson_id: 5,
  score: 85
)
```

### Vocabulary

```ruby
# Get vocabulary for a lesson
vocab = client.languages.get_vocabulary(
  language: 'swedish',
  lesson_id: 3
)

vocab.words.each do |word|
  puts "#{word.word}: #{word.translation}"
  puts "Pronunciation: #{word.pronunciation}"
  puts "Example: #{word.example_sentence}"
end

# Get vocabulary audio
audio = client.languages.get_word_audio('swedish', 'hej')

# Search vocabulary
results = client.languages.search_vocabulary(
  language: 'danish',
  query: 'food',
  category: 'nouns'
)
```

### Exercises

```ruby
# Get exercises for a lesson
exercises = client.languages.get_exercises(
  language: 'norwegian',
  lesson_id: 10
)

exercises.each do |exercise|
  puts "Type: #{exercise.type}"  # :translation, :multiple_choice, :listening
  puts "Question: #{exercise.question}"
  puts "Options: #{exercise.options}"
end

# Submit exercise answer
result = client.languages.submit_exercise(
  exercise_id: 'ex_12345',
  answer: 'Jeg snakker norsk'
)
puts result.correct        # true/false
puts result.explanation    # Explanation if wrong
puts result.score          # Points earned
```

## Countries API

### Country Information

```ruby
# Get country details
norway = client.countries.get_country('norway')

# Country attributes
puts norway.name
puts norway.capital
puts norway.population
puts norway.languages
puts norway.description
puts norway.history
puts norway.geography
puts norway.culture

# List all countries
countries = client.countries.list_countries
# Returns info for: Denmark, Finland, Iceland, Norway, Sweden

# Search country content
results = client.countries.search(
  query: 'vikings',
  country: 'norway',
  content_type: 'history'
)
```

### Regions and Cities

```ruby
# Get regions of a country
regions = client.countries.get_regions('sweden')

regions.each do |region|
  puts "#{region.name}: #{region.description}"
end

# Get city information
oslo = client.countries.get_city('oslo')
puts oslo.country
puts oslo.population
puts oslo.attractions
puts oslo.cultural_sites

# Get travel guide
guide = client.countries.get_travel_guide('iceland')
puts guide.best_time_to_visit
puts guide.must_see_locations
puts guide.cultural_etiquette
```

### Cultural Content

```ruby
# Get cultural articles
articles = client.countries.get_articles(
  country: 'denmark',
  category: 'traditions',
  limit: 10
)

# Get historical timeline
timeline = client.countries.get_history_timeline('finland')

timeline.events.each do |event|
  puts "#{event.year}: #{event.title}"
end
```

## User API

### Profile Management

```ruby
# Get user profile
profile = client.user.get_profile
puts profile.username
puts profile.email
puts profile.learning_preferences
puts profile.joined_date

# Update profile
client.user.update_profile(
  display_name: 'Nordic Learner',
  preferences: {
    difficulty: :intermediate,
    daily_goal_minutes: 30,
    notification_enabled: true
  }
)
```

### Progress Tracking

```ruby
# Get overall progress
progress = client.user.get_progress
puts progress.stories_read
puts progress.characters_studied
puts progress.total_learning_hours
puts progress.achievements

# Get achievements
achievements = client.user.get_achievements
achievements.each do |achievement|
  puts "#{achievement.name}: #{achievement.description}"
  puts "Earned: #{achievement.earned_date}"
end

# Get reading history
history = client.user.get_reading_history(limit: 20)
```

### Bookmarks and Notes

```ruby
# Add bookmark
client.user.add_bookmark(
  content_type: :story,
  content_id: 'thor-vs-jormungandr'
)

# Get bookmarks
bookmarks = client.user.get_bookmarks(content_type: :story)

# Add note
client.user.add_note(
  content_type: :character,
  content_id: 'odin',
  note: 'Father of Thor and ruler of Asgard'
)

# Get notes
notes = client.user.get_notes(content_type: :character)
```

## Advanced Features

### Batch Operations

```ruby
# Get multiple stories at once
story_ids = ['story1', 'story2', 'story3']
stories = client.mythology.get_stories_batch(story_ids)

# Get multiple characters
character_ids = ['thor', 'odin', 'loki']
characters = client.mythology.get_characters_batch(character_ids)
```

### Pagination

```ruby
# Manual pagination
page1 = client.mythology.list_stories(limit: 20, offset: 0)
page2 = client.mythology.list_stories(limit: 20, offset: 20)

# Using enumerator
client.mythology.each_story(page_size: 50) do |story|
  puts story.title
  # Automatically handles pagination
end

# Get all pages as array
all_stories = client.mythology.all_stories(page_size: 100)
```

### Filtering and Sorting

```ruby
# Complex filtering
stories = client.mythology.list_stories(
  category: 'aesir-gods',
  difficulty: [:beginner, :intermediate],
  has_audio: true,
  min_length: 1000,  # words
  sort_by: 'popularity',
  order: :desc
)
```

### Caching

```ruby
# Enable caching
client = Odin::Client.new(
  api_key: 'your_api_key',
  cache: {
    enabled: true,
    ttl: 3600  # 1 hour
  }
)

# Subsequent calls use cache
story1 = client.mythology.get_story('thor-vs-jormungandr')  # API call
story2 = client.mythology.get_story('thor-vs-jormungandr')  # From cache

# Clear cache
client.clear_cache

# Disable cache for specific request
story3 = client.mythology.get_story('thor-vs-jormungandr', no_cache: true)
```

### Error Handling

```ruby
require 'odin'

client = Odin::Client.new(api_key: 'your_api_key')

begin
  story = client.mythology.get_story('invalid-story-id')
rescue Odin::NotFoundError => e
  puts "Story not found: #{e.message}"
rescue Odin::AuthenticationError => e
  puts "Auth failed: #{e.message}"
rescue Odin::RateLimitError => e
  puts "Rate limited. Retry after: #{e.retry_after}"
rescue Odin::ValidationError => e
  puts "Invalid parameters: #{e.errors}"
rescue Odin::APIError => e
  puts "API error: #{e.message}"
  puts "Status code: #{e.status_code}"
end
```

### Custom Error Classes

```ruby
module Odin
  class APIError < StandardError
    attr_reader :status_code, :response

    def initialize(message, status_code: nil, response: nil)
      super(message)
      @status_code = status_code
      @response = response
    end
  end

  class AuthenticationError < APIError; end
  class NotFoundError < APIError; end
  class RateLimitError < APIError
    attr_reader :retry_after

    def initialize(message, retry_after:)
      super(message)
      @retry_after = retry_after
    end
  end
  class ValidationError < APIError
    attr_reader :errors

    def initialize(message, errors:)
      super(message)
      @errors = errors
    end
  end
end
```

## Configuration

### Client Configuration

```ruby
client = Odin::Client.new(
  api_key: 'your_api_key',
  base_url: 'https://api.odin.com/v1',  # Custom API endpoint
  timeout: 30,                            # Request timeout in seconds
  max_retries: 3,                         # Retry failed requests
  cache: {
    enabled: true,                        # Enable response caching
    ttl: 3600                            # Cache TTL in seconds
  },
  user_agent: 'MyApp/1.0',               # Custom user agent
  debug: false                            # Enable debug logging
)
```

### Using Configuration Block

```ruby
client = Odin::Client.new do |config|
  config.api_key = 'your_api_key'
  config.timeout = 30
  config.max_retries = 3
  config.debug = true
end
```

### Logging

```ruby
require 'logger'

# Enable debug logging
logger = Logger.new(STDOUT)
logger.level = Logger::DEBUG

client = Odin::Client.new(
  api_key: 'your_api_key',
  logger: logger
)

# Custom log formatter
logger.formatter = proc do |severity, datetime, progname, msg|
  "[#{datetime}] #{severity}: #{msg}\n"
end
```

## Rails Integration

### Configuration

```ruby
# config/initializers/odin.rb
Odin.configure do |config|
  config.api_key = ENV['ODIN_API_KEY']
  config.timeout = 30
  config.cache = {
    enabled: Rails.env.production?,
    ttl: 3600
  }
  config.logger = Rails.logger
end
```

### Using in Controllers

```ruby
class StoriesController < ApplicationController
  def show
    @story = odin_client.mythology.get_story(params[:id])
  rescue Odin::NotFoundError
    render status: :not_found
  end

  private

  def odin_client
    @odin_client ||= Odin::Client.new
  end
end
```

### Caching with Rails Cache

```ruby
# config/initializers/odin.rb
Odin.configure do |config|
  config.cache_store = Rails.cache
end

# Now the SDK will use Rails cache
client = Odin::Client.new
story = client.mythology.get_story('thor-vs-jormungandr')  # Cached in Rails cache
```

### Background Jobs

```ruby
class FetchStoryJob < ApplicationJob
  queue_as :default

  def perform(story_id)
    client = Odin::Client.new
    story = client.mythology.get_story(story_id)

    # Process story
    Story.create!(
      external_id: story.id,
      title: story.title,
      content: story.content
    )
  end
end
```

## Models and Data Types

### Story Model

```ruby
module Odin
  class Story
    attr_reader :id, :title, :content, :difficulty, :category,
                :characters, :audio_url, :images, :reading_time,
                :word_count, :created_at, :updated_at

    def initialize(attributes = {})
      @id = attributes[:id]
      @title = attributes[:title]
      @content = attributes[:content]
      @difficulty = attributes[:difficulty]&.to_sym
      @category = attributes[:category]
      @characters = attributes[:characters] || []
      @audio_url = attributes[:audio_url]
      @images = attributes[:images] || []
      @reading_time = attributes[:reading_time]
      @word_count = attributes[:word_count]
      @created_at = parse_time(attributes[:created_at])
      @updated_at = parse_time(attributes[:updated_at])
    end

    def beginner?
      difficulty == :beginner
    end

    def intermediate?
      difficulty == :intermediate
    end

    def advanced?
      difficulty == :advanced
    end

    private

    def parse_time(time)
      return nil if time.nil?
      time.is_a?(Time) ? time : Time.parse(time)
    end
  end
end
```

### Character Model

```ruby
module Odin
  class Character
    attr_reader :id, :name, :type, :domain, :powers, :family_tree,
                :symbols, :stories, :etymology, :description, :image_url

    def initialize(attributes = {})
      @id = attributes[:id]
      @name = attributes[:name]
      @type = attributes[:type]&.to_sym
      @domain = attributes[:domain] || []
      @powers = attributes[:powers] || []
      @family_tree = attributes[:family_tree] || {}
      @symbols = attributes[:symbols] || []
      @stories = attributes[:stories] || []
      @etymology = attributes[:etymology]
      @description = attributes[:description]
      @image_url = attributes[:image_url]
    end

    def god?
      type == :god
    end

    def giant?
      type == :giant
    end

    def hero?
      type == :hero
    end

    def creature?
      type == :creature
    end
  end
end
```

## Rate Limiting

The Odin API has the following rate limits:

- **Free tier**: 100 requests/hour
- **Basic tier**: 1,000 requests/hour
- **Pro tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

```ruby
# Check rate limit status
client = Odin::Client.new(api_key: 'your_api_key')

# Rate limit info is available after any request
story = client.mythology.get_story('thor-vs-jormungandr')

puts client.rate_limit.limit       # Total limit
puts client.rate_limit.remaining   # Remaining requests
puts client.rate_limit.reset_at    # Reset timestamp

# Handle rate limiting
begin
  story = client.mythology.get_story('some-id')
rescue Odin::RateLimitError => e
  puts "Rate limited. Retry after #{e.retry_after} seconds"
  sleep e.retry_after
  retry
end
```

## Testing

### RSpec Integration

```ruby
# spec/spec_helper.rb
require 'odin/testing'

RSpec.configure do |config|
  config.before(:each) do
    Odin::Testing.mock!
  end

  config.after(:each) do
    Odin::Testing.unmock!
  end
end

# spec/models/story_spec.rb
RSpec.describe Story do
  it 'fetches story from Odin API' do
    Odin::Testing.stub_story(
      id: 'test-story',
      title: 'Test Story',
      content: 'Test content'
    )

    client = Odin::Client.new
    story = client.mythology.get_story('test-story')

    expect(story.title).to eq('Test Story')
  end
end
```

### Minitest Integration

```ruby
require 'minitest/autorun'
require 'odin/testing'

class StoryTest < Minitest::Test
  def setup
    Odin::Testing.mock!
  end

  def teardown
    Odin::Testing.unmock!
  end

  def test_fetch_story
    Odin::Testing.stub_story(
      id: 'test-story',
      title: 'Test Story'
    )

    client = Odin::Client.new
    story = client.mythology.get_story('test-story')

    assert_equal 'Test Story', story.title
  end
end
```

## Examples

### Example 1: Daily Learning Session

```ruby
require 'odin'

client = Odin::Client.new(api_key: ENV['ODIN_API_KEY'])

# Get user's current lesson
progress = client.languages.get_progress('norwegian')
next_lesson = client.languages.get_lesson(
  language: 'norwegian',
  level: progress.current_level,
  lesson_id: progress.next_lesson_id
)

puts "Today's lesson: #{next_lesson.title}"

# Study the lesson
next_lesson.exercises.each do |exercise|
  print "#{exercise.question}: "
  answer = gets.chomp

  result = client.languages.submit_exercise(
    exercise_id: exercise.id,
    answer: answer
  )

  if result.correct
    puts 'Correct!'
  else
    puts "Incorrect. #{result.explanation}"
  end
end

# Mark lesson complete
client.languages.complete_lesson(
  language: 'norwegian',
  lesson_id: next_lesson.id,
  score: 85
)
```

### Example 2: Mythology Explorer

```ruby
require 'odin'

client = Odin::Client.new(api_key: ENV['ODIN_API_KEY'])

# Get random story from beginner category
stories = client.mythology.list_stories(
  difficulty: :beginner,
  has_audio: true,
  limit: 10
)

story = stories.sample

puts "Story: #{story.title}"
puts "Characters: #{story.characters.join(', ')}"

# Get character details
story.characters.each do |char_id|
  char = client.mythology.get_character(char_id)
  puts "\n#{char.name}"
  puts "Type: #{char.type}"
  puts "Domain: #{char.domain.join(', ')}"
end

# Bookmark the story
client.user.add_bookmark(content_type: :story, content_id: story.id)
```

### Example 3: Sinatra API

```ruby
require 'sinatra'
require 'odin'
require 'json'

client = Odin::Client.new(api_key: ENV['ODIN_API_KEY'])

get '/api/stories/:id' do
  content_type :json

  begin
    story = client.mythology.get_story(params[:id])
    story.to_json
  rescue Odin::NotFoundError
    status 404
    { error: 'Story not found' }.to_json
  end
end

get '/api/characters' do
  content_type :json

  characters = client.mythology.list_characters(
    type: params[:type]&.to_sym,
    limit: params[:limit]&.to_i || 20
  )

  characters.to_json
end
```

### Example 4: CLI Tool

```ruby
#!/usr/bin/env ruby

require 'odin'
require 'thor'

class OdinCLI < Thor
  def initialize(*args)
    super
    @client = Odin::Client.new(api_key: ENV['ODIN_API_KEY'])
  end

  desc 'story ID', 'Get a mythology story'
  def story(id)
    story = @client.mythology.get_story(id)
    puts "\n#{story.title}\n\n"
    puts story.content
  rescue Odin::NotFoundError
    puts 'Story not found'
    exit 1
  end

  desc 'character ID', 'Get character information'
  def character(id)
    char = @client.mythology.get_character(id)
    puts "\nName: #{char.name}"
    puts "Type: #{char.type}"
    puts "Domain: #{char.domain.join(', ')}"
    puts "\n#{char.description}"
  rescue Odin::NotFoundError
    puts 'Character not found'
    exit 1
  end

  desc 'search QUERY', 'Search stories and characters'
  def search(query)
    stories = @client.mythology.search_stories(query: query, limit: 5)
    characters = @client.mythology.search_characters(query: query, limit: 5)

    puts "\nStories:"
    stories.each { |s| puts "  - #{s.title}" }

    puts "\nCharacters:"
    characters.each { |c| puts "  - #{c.name}" }
  end
end

OdinCLI.start(ARGV)
```

## Thread Safety

The Odin SDK is thread-safe. You can share a single client instance across multiple threads:

```ruby
client = Odin::Client.new(api_key: ENV['ODIN_API_KEY'])

threads = 10.times.map do |i|
  Thread.new do
    story = client.mythology.get_story("story-#{i}")
    puts story.title
  end
end

threads.each(&:join)
```

## Support

- **Documentation**: https://docs.odin.com
- **API Reference**: https://api.odin.com/docs
- **GitHub**: https://github.com/odin/ruby-sdk
- **RubyGems**: https://rubygems.org/gems/odin-sdk
- **Issues**: https://github.com/odin/ruby-sdk/issues
- **Email**: support@odin.com

## License

MIT License - see LICENSE file for details
