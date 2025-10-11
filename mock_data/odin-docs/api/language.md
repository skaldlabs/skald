# Language API

Tools for learning and translating Nordic languages (Old Norse, Icelandic, Norwegian, Swedish, Danish, Finnish).

## Endpoints

### POST /language/translate

Translate text between Nordic languages and other languages.

**Request Body:**

```json
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "no",
  "dialect": "bokmål"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to translate (max 5000 characters) |
| `source_language` | string | Yes | Source language code (en, no, sv, da, is, fi, non) |
| `target_language` | string | Yes | Target language code |
| `dialect` | string | No | Dialect variant (bokmål, nynorsk for Norwegian) |

**Supported Languages:**

- `non` - Old Norse
- `is` - Icelandic
- `no` - Norwegian
- `sv` - Swedish
- `da` - Danish
- `fi` - Finnish
- `en` - English

**Example Response:**

```json
{
  "success": true,
  "data": {
    "translation": "Hei, hvordan har du det?",
    "source_language": "en",
    "target_language": "no",
    "dialect": "bokmål",
    "confidence": 0.98,
    "alternatives": [
      "Hallo, hvordan går det?"
    ]
  }
}
```

### GET /language/vocabulary

Get vocabulary words and phrases for learning.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | Yes | Language code (no, sv, da, is, fi, non) |
| `category` | string | No | Category (greetings, numbers, food, etc.) |
| `difficulty` | string | No | Difficulty level (beginner, intermediate, advanced) |
| `limit` | integer | No | Number of words (default: 20) |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/language/vocabulary?language=non&category=greetings" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "vocabulary": [
      {
        "id": "word_non_heill",
        "word": "heill",
        "pronunciation": "hayl",
        "translation": "hale, healthy, hello",
        "part_of_speech": "adjective/greeting",
        "examples": [
          {
            "old_norse": "Heill ok sæll!",
            "english": "Hale and happy! (greeting)",
            "context": "Common greeting"
          }
        ],
        "etymology": "Proto-Germanic *hailaz",
        "modern_cognates": {
          "english": "hale",
          "german": "heil",
          "icelandic": "heill"
        }
      }
    ]
  }
}
```

### GET /language/grammar

Get grammar rules and explanations.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | Yes | Language code |
| `topic` | string | No | Grammar topic (cases, conjugation, declension, etc.) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "grammar_rules": [
      {
        "id": "grammar_non_cases",
        "topic": "Old Norse Cases",
        "description": "Old Norse has four grammatical cases",
        "cases": [
          {
            "name": "Nominative",
            "function": "Subject of sentence",
            "example": "Þórr er sterkr (Thor is strong)"
          },
          {
            "name": "Accusative",
            "function": "Direct object",
            "example": "Ek sé Þór (I see Thor)"
          },
          {
            "name": "Genitive",
            "function": "Possession",
            "example": "Hamarr Þórs (Thor's hammer)"
          },
          {
            "name": "Dative",
            "function": "Indirect object",
            "example": "Ek gef Þór hamar (I give Thor a hammer)"
          }
        ]
      }
    ]
  }
}
```

### POST /language/pronunciation

Get pronunciation guide for Nordic text.

**Request Body:**

```json
{
  "text": "Mjölnir",
  "language": "non",
  "format": "ipa"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "text": "Mjölnir",
    "language": "non",
    "ipa": "ˈmjœlnir",
    "simple": "MYOL-nir",
    "audio_url": "https://cdn.odin.io/audio/mjolnir.mp3",
    "syllables": ["mjöl", "nir"]
  }
}
```

### GET /language/lessons

Get structured language lessons.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | Yes | Language code |
| `level` | string | No | Difficulty level |
| `lesson_id` | string | No | Specific lesson ID |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "lesson_non_01",
        "title": "Introduction to Old Norse",
        "level": "beginner",
        "duration_minutes": 30,
        "topics": ["alphabet", "pronunciation", "basic_greetings"],
        "exercises": 12,
        "completion_rate": 0.65
      }
    ]
  }
}
```
