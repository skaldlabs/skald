# Sagas API

Access Nordic sagas, Eddas, and historical narratives.

## Endpoints

### GET /sagas

Get a list of sagas and epic narratives.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Type (saga, edda, skaldic_poem) |
| `period` | string | No | Historical period |
| `region` | string | No | Geographic region (iceland, norway, sweden, etc.) |
| `characters` | string | No | Filter by character names |
| `limit` | integer | No | Number of results (default: 20) |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/sagas?type=saga&region=iceland" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "sagas": [
      {
        "id": "saga_egils",
        "title": "Egil's Saga",
        "original_title": "Egils saga Skallagrímssonar",
        "type": "saga",
        "category": "Icelandic family saga",
        "date_written": "~1230 CE",
        "period_depicted": "10th century",
        "region": "iceland",
        "length_chapters": 87,
        "main_characters": [
          {
            "name": "Egill Skallagrímsson",
            "role": "Protagonist, warrior-poet",
            "description": "Complex character, skilled warrior and skaldic poet"
          }
        ],
        "themes": ["poetry", "viking_warfare", "family_honor", "paganism_vs_christianity"],
        "summary": "Chronicles the life of Egill Skallagrímsson, a viking warrior and one of the greatest skaldic poets",
        "historical_accuracy": "Based on historical figure but contains legendary elements",
        "language": "Old Icelandic",
        "available_translations": ["english", "norwegian", "danish", "german"]
      }
    ],
    "total": 47,
    "count": 1
  }
}
```

### GET /sagas/{saga_id}

Get detailed information about a specific saga.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saga_id` | string | Yes | Saga identifier |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `include_text` | boolean | No | Include full text (default: false) |
| `translation` | string | No | Translation language (default: english) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "saga": {
      "id": "saga_volsunga",
      "title": "Völsunga Saga",
      "original_title": "Völsunga saga",
      "type": "legendary_saga",
      "date_written": "~1270 CE",
      "period_depicted": "Legendary past, ~4th-6th century",
      "summary": "Epic tale of the Völsung family, including the hero Sigurd and the Valkyrie Brynhildr",
      "structure": {
        "total_chapters": 44,
        "chapter_groups": [
          {
            "chapters": "1-8",
            "description": "Ancestry and early Völsungs"
          },
          {
            "chapters": "9-31",
            "description": "Sigurd's story"
          },
          {
            "chapters": "32-44",
            "description": "Aftermath and revenge"
          }
        ]
      },
      "major_characters": [
        {
          "name": "Sigurd",
          "role": "Dragon-slayer, hero",
          "notable_deeds": [
            "Slaying the dragon Fafnir",
            "Awakening Brynhildr",
            "Acquiring the cursed gold"
          ]
        },
        {
          "name": "Brynhildr",
          "role": "Valkyrie, tragic heroine"
        }
      ],
      "artifacts": [
        {
          "name": "Gram",
          "type": "sword",
          "description": "Legendary sword of Sigurd"
        },
        {
          "name": "Andvaranaut",
          "type": "ring",
          "description": "Cursed ring from Andvari's gold"
        }
      ],
      "themes": ["fate", "revenge", "cursed_treasure", "heroism", "tragedy"],
      "cultural_influence": "Basis for Wagner's Ring Cycle and major influence on fantasy literature",
      "related_works": ["Poetic Edda", "Nibelungenlied", "Thidreks saga"]
    }
  }
}
```

### GET /sagas/{saga_id}/chapters/{chapter_number}

Get a specific chapter from a saga.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `saga_id` | string | Yes | Saga identifier |
| `chapter_number` | integer | Yes | Chapter number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `translation` | string | No | Translation language |
| `include_notes` | boolean | No | Include scholarly notes |
| `include_original` | boolean | No | Include original Old Norse text |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "chapter": {
      "saga_id": "saga_egils",
      "chapter_number": 55,
      "title": "The Ransom of the Head",
      "original_text": "Nú er þar til máls at taka...",
      "translation": "Now there is something to relate...",
      "summary": "Egill composes a praise poem to save his life",
      "characters_appearing": ["Egill", "King Eirik", "Queen Gunnhild"],
      "locations": ["York"],
      "events": [
        "Egill is captured by his enemy King Eirik",
        "Egill composes 'Höfuðlausn' (Head-Ransom) overnight",
        "The king spares Egill's life due to the poem's excellence"
      ],
      "poems": [
        {
          "title": "Höfuðlausn",
          "type": "drápa",
          "stanzas": 20,
          "description": "Praise poem composed to save Egill's life"
        }
      ],
      "notes": [
        "This chapter showcases the power of skaldic poetry in Viking society",
        "The poem's preservation in the saga suggests its historical authenticity"
      ]
    }
  }
}
```

### GET /sagas/eddas

Get information about the Poetic and Prose Eddas.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | poetic or prose |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "eddas": [
      {
        "id": "edda_poetic",
        "title": "Poetic Edda",
        "original_title": "Eddukvæði",
        "type": "poetic",
        "date": "~1270 CE (manuscript), poems much older",
        "manuscript": "Codex Regius",
        "description": "Collection of Old Norse poems from earlier oral tradition",
        "sections": [
          {
            "name": "Mythological Poems",
            "poems": [
              {
                "title": "Völuspá",
                "description": "The prophecy of the seeress - creation and Ragnarök",
                "stanzas": 66
              },
              {
                "title": "Hávamál",
                "description": "Sayings of the High One (Odin) - wisdom poetry",
                "stanzas": 164
              },
              {
                "title": "Þrymskviða",
                "description": "Thor's hammer is stolen by the giant Thrym",
                "stanzas": 32
              }
            ]
          },
          {
            "name": "Heroic Poems",
            "poems": [
              {
                "title": "Atlakviða",
                "description": "Lay of Atli - Story of Atli (Attila the Hun)"
              }
            ]
          }
        ],
        "significance": "Primary source for Norse mythology",
        "language": "Old Norse"
      }
    ]
  }
}
```

### GET /sagas/characters

Search for characters across sagas.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | Character name search |
| `role` | string | No | Character role (hero, king, poet, etc.) |
| `saga_id` | string | No | Filter by saga |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "char_ragnar",
        "name": "Ragnar Lodbrok",
        "alternate_names": ["Ragnar Lothbrok", "Ragnar Hairy-Breeches"],
        "appears_in": [
          "saga_ragnar",
          "saga_volsunga",
          "tale_ragnar_sons"
        ],
        "role": "Legendary Viking king and hero",
        "period": "9th century (legendary)",
        "family": {
          "wives": ["Thora", "Aslaug"],
          "sons": ["Ivar the Boneless", "Bjorn Ironside", "Hvitserk", "Sigurd Snake-in-the-Eye"]
        },
        "notable_deeds": [
          "Slaying a giant serpent",
          "Raids across Europe",
          "Death in the snake pit of King Ælla"
        ],
        "historical_basis": "Possibly composite of several historical figures",
        "cultural_impact": "Major figure in Viking legend, subject of modern TV series"
      }
    ]
  }
}
```

### POST /sagas/search

Full-text search across all sagas.

**Request Body:**

```json
{
  "query": "dragon gold",
  "sagas": ["saga_volsunga", "saga_beowulf"],
  "search_fields": ["text", "summary", "character_descriptions"],
  "limit": 10
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "saga_id": "saga_volsunga",
        "chapter": 18,
        "relevance_score": 0.95,
        "snippet": "...Sigurd slew the dragon Fafnir who guarded the gold...",
        "context": "Chapter 18: Sigurd Slays Fafnir"
      }
    ],
    "total_matches": 23
  }
}
```
