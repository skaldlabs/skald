# Mythology API

Access comprehensive information about Nordic gods, goddesses, creatures, and mythological tales.

## Endpoints

### GET /mythology/deities

Retrieve a list of Nordic deities.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pantheon` | string | No | Filter by pantheon (aesir, vanir, jotnar) |
| `domain` | string | No | Filter by domain (war, wisdom, sea, etc.) |
| `limit` | integer | No | Number of results (default: 20, max: 100) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/mythology/deities?pantheon=aesir&limit=5" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "deities": [
      {
        "id": "deity_odin",
        "name": "Odin",
        "alternate_names": ["Wotan", "Woden", "Allfather"],
        "pantheon": "aesir",
        "domains": ["wisdom", "war", "death", "poetry"],
        "attributes": {
          "weapon": "Gungnir",
          "mount": "Sleipnir",
          "halls": ["Valhalla", "Valaskjalf"]
        },
        "description": "Chief of the Aesir gods, seeker of wisdom and knowledge"
      }
    ],
    "total": 47,
    "count": 5
  }
}
```

### GET /mythology/deities/{deity_id}

Retrieve detailed information about a specific deity.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deity_id` | string | Yes | Unique deity identifier |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/mythology/deities/deity_thor" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "deity_thor",
    "name": "Thor",
    "alternate_names": ["Þórr", "Donar"],
    "pantheon": "aesir",
    "domains": ["thunder", "strength", "protection"],
    "family": {
      "father": "deity_odin",
      "mother": "deity_jord",
      "spouse": "deity_sif",
      "children": ["deity_magni", "deity_modi", "deity_thrud"]
    },
    "attributes": {
      "weapon": "Mjolnir",
      "belt": "Megingjord",
      "gloves": "Járngreipr"
    },
    "description": "God of thunder, protector of mankind and the gods",
    "stories": ["story_utgard", "story_thrym", "story_jormungandr"],
    "symbols": ["hammer", "lightning", "oak_tree"]
  }
}
```

### GET /mythology/creatures

Retrieve information about mythological creatures.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by type (giant, dwarf, elf, beast, monster) |
| `realm` | string | No | Filter by realm (midgard, asgard, jotunheim, etc.) |
| `search` | string | No | Search by name or description |
| `limit` | integer | No | Number of results (default: 20) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "creatures": [
      {
        "id": "creature_fenrir",
        "name": "Fenrir",
        "type": "wolf",
        "classification": "monster",
        "description": "Monstrous wolf, son of Loki",
        "significance": "Destined to kill Odin during Ragnarok",
        "related_deities": ["deity_loki", "deity_odin"]
      }
    ]
  }
}
```

### GET /mythology/stories

Retrieve mythological stories and tales.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `characters` | string | No | Filter by character IDs (comma-separated) |
| `theme` | string | No | Filter by theme (creation, ragnarok, adventure, etc.) |
| `limit` | integer | No | Number of results (default: 20) |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "stories": [
      {
        "id": "story_creation",
        "title": "The Creation of the World",
        "summary": "How Odin and his brothers created the world from Ymir's body",
        "characters": ["deity_odin", "deity_vili", "deity_ve", "creature_ymir"],
        "theme": "creation",
        "source": "Prose Edda",
        "content_url": "/mythology/stories/story_creation/full"
      }
    ]
  }
}
```

### GET /mythology/realms

Retrieve information about the Nine Realms.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "realms": [
      {
        "id": "realm_asgard",
        "name": "Asgard",
        "description": "Home of the Aesir gods",
        "inhabitants": "Aesir gods",
        "notable_locations": ["Valhalla", "Bifrost", "Idavoll"],
        "connected_realms": ["realm_midgard", "realm_vanaheim"]
      }
    ]
  }
}
```
