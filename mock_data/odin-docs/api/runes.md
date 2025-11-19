# Runes API

Work with the runic alphabets, including Elder Futhark, Younger Futhark, and Anglo-Saxon runes.

## Endpoints

### GET /runes/alphabets

Get information about runic alphabets.

**Query Parameters:**

| Parameter  | Type   | Required | Description                                                 |
| ---------- | ------ | -------- | ----------------------------------------------------------- |
| `alphabet` | string | No       | Alphabet type (elder_futhark, younger_futhark, anglo_saxon) |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/runes/alphabets?alphabet=elder_futhark" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "alphabet": {
            "id": "elder_futhark",
            "name": "Elder Futhark",
            "period": "2nd to 8th century CE",
            "region": "Scandinavia and Germanic regions",
            "total_runes": 24,
            "description": "The oldest form of the runic alphabets",
            "runes": [
                {
                    "id": "rune_fehu",
                    "character": "ᚠ",
                    "name": "Fehu",
                    "transliteration": "f",
                    "meaning": "Cattle, wealth, prosperity",
                    "divination_meaning": "Wealth, abundance, financial success",
                    "reversed_meaning": "Loss, financial difficulty",
                    "aett": "Freyr's Aett",
                    "position": 1,
                    "poem_verse": "Wealth is a comfort to all men;\nyet must every man bestow it freely,\nif he wish to gain honour in the sight of the Lord."
                }
            ]
        }
    }
}
```

### GET /runes/{rune_id}

Get detailed information about a specific rune.

**Path Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `rune_id` | string | Yes      | Rune identifier |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "rune": {
            "id": "rune_ansuz",
            "character": "ᚨ",
            "name": "Ansuz",
            "transliteration": "a",
            "alphabet": "elder_futhark",
            "meaning": "God, divinity, Odin",
            "divination": {
                "upright": "Communication, wisdom, divine inspiration, signals",
                "reversed": "Miscommunication, manipulation, delusion"
            },
            "associated_deity": "Odin",
            "element": "Air",
            "keywords": ["communication", "wisdom", "divine", "revelation"],
            "magical_uses": ["Enhancing communication", "Seeking wisdom", "Invoking divine guidance"],
            "historical_inscriptions": [
                {
                    "artifact": "Kylver Stone",
                    "location": "Gotland, Sweden",
                    "date": "~400 CE"
                }
            ]
        }
    }
}
```

### POST /runes/translate

Translate text to and from runes.

**Request Body:**

```json
{
    "text": "Hello",
    "direction": "to_runes",
    "alphabet": "elder_futhark",
    "transliteration_style": "standard"
}
```

**Parameters:**

| Parameter               | Type   | Required | Description            |
| ----------------------- | ------ | -------- | ---------------------- |
| `text`                  | string | Yes      | Text to translate      |
| `direction`             | string | Yes      | to_runes or from_runes |
| `alphabet`              | string | Yes      | Runic alphabet to use  |
| `transliteration_style` | string | No       | standard or scholarly  |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "original_text": "Hello",
        "transliterated": "halu",
        "runic_text": "ᚺᚨᛚᚢ",
        "alphabet": "elder_futhark",
        "runes_used": [
            {
                "character": "ᚺ",
                "name": "Hagalaz",
                "transliteration": "h"
            },
            {
                "character": "ᚨ",
                "name": "Ansuz",
                "transliteration": "a"
            },
            {
                "character": "ᛚ",
                "name": "Laguz",
                "transliteration": "l"
            },
            {
                "character": "ᚢ",
                "name": "Uruz",
                "transliteration": "u"
            }
        ],
        "notes": "Modern English phonetics adapted to runic alphabet"
    }
}
```

### POST /runes/divination

Get a runic divination reading.

**Request Body:**

```json
{
    "spread_type": "three_rune",
    "question": "What should I focus on?",
    "alphabet": "elder_futhark"
}
```

**Spread Types:**

- `single_rune` - Single rune draw
- `three_rune` - Past, Present, Future
- `runic_cross` - Six rune spread
- `nine_worlds` - Nine rune spread

**Example Response:**

```json
{
    "success": true,
    "data": {
        "spread_type": "three_rune",
        "reading_id": "reading_12345",
        "timestamp": "2025-10-10T12:00:00Z",
        "runes": [
            {
                "position": "past",
                "rune": {
                    "character": "ᚱ",
                    "name": "Raidho",
                    "orientation": "upright"
                },
                "interpretation": "Journey and progress have brought you to this point"
            },
            {
                "position": "present",
                "rune": {
                    "character": "ᛈ",
                    "name": "Perthro",
                    "orientation": "upright"
                },
                "interpretation": "Mystery and hidden potential surround your current situation"
            },
            {
                "position": "future",
                "rune": {
                    "character": "ᛏ",
                    "name": "Tiwaz",
                    "orientation": "upright"
                },
                "interpretation": "Victory and justice await if you maintain your honor"
            }
        ],
        "overall_guidance": "Your journey has prepared you for the mysteries ahead. Maintain your integrity and victory will follow."
    }
}
```

### GET /runes/inscriptions

Get historical runic inscriptions.

**Query Parameters:**

| Parameter       | Type   | Required | Description                             |
| --------------- | ------ | -------- | --------------------------------------- |
| `location`      | string | No       | Geographic region                       |
| `period`        | string | No       | Time period                             |
| `artifact_type` | string | No       | Type (runestone, weapon, jewelry, etc.) |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "inscriptions": [
            {
                "id": "inscription_jellinge",
                "name": "Jelling Stones",
                "location": "Jelling, Denmark",
                "date": "~965 CE",
                "alphabet": "younger_futhark",
                "runic_text": "ᚼᛅᚱᛅᛚᛏᚱ᛬ᚴᚢᚾᚢᚴᛦ",
                "transliteration": "haraltr kunukR",
                "translation": "Harald, King",
                "full_inscription": "King Harald ordered these memorials made...",
                "significance": "Marks the Christianization of Denmark",
                "artifact_type": "runestone",
                "images": ["https://cdn.odin.io/inscriptions/jellinge_01.jpg"]
            }
        ]
    }
}
```

### GET /runes/bind-runes

Get information about bind runes (combined runes).

**Example Response:**

```json
{
    "success": true,
    "data": {
        "bind_runes": [
            {
                "id": "bind_protection",
                "name": "Protection Bind Rune",
                "component_runes": ["Algiz", "Eihwaz", "Tiwaz"],
                "combined_character": "ᛉᛇᛏ",
                "purpose": "Protection and divine strength",
                "usage": "Carved on weapons and armor",
                "historical_examples": ["Lindholm amulet", "Various spearheads"]
            }
        ]
    }
}
```
