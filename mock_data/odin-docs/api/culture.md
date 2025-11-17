# Culture API

Explore Nordic culture, history, traditions, and modern Nordic countries.

## Endpoints

### GET /culture/countries

Get information about Nordic countries.

**Query Parameters:**

| Parameter      | Type   | Required | Description                                      |
| -------------- | ------ | -------- | ------------------------------------------------ |
| `country_code` | string | No       | ISO country code (NO, SE, DK, IS, FI)            |
| `include`      | string | No       | Additional data (demographics, economy, tourism) |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/culture/countries?country_code=NO" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "country": {
            "code": "NO",
            "name": "Norway",
            "native_name": "Norge",
            "capital": "Oslo",
            "population": 5488984,
            "area_km2": 385207,
            "languages": ["Norwegian (Bokmål)", "Norwegian (Nynorsk)", "Sami"],
            "currency": "NOK",
            "government": "Constitutional monarchy",
            "independence_date": "1905-06-07",
            "national_day": "1814-05-17",
            "regions": [
                {
                    "name": "Østlandet",
                    "description": "Eastern Norway",
                    "major_cities": ["Oslo", "Drammen", "Fredrikstad"]
                }
            ],
            "cultural_highlights": ["Viking heritage", "Fjords", "Northern Lights", "Sami culture"]
        }
    }
}
```

### GET /culture/traditions

Get information about Nordic traditions and celebrations.

**Query Parameters:**

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `country` | string | No       | Filter by country code                            |
| `season`  | string | No       | Filter by season (winter, spring, summer, autumn) |
| `type`    | string | No       | Type (holiday, festival, ritual, custom)          |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "traditions": [
            {
                "id": "tradition_midsummer",
                "name": "Midsummer",
                "native_names": {
                    "swedish": "Midsommar",
                    "norwegian": "Sankthans",
                    "danish": "Sankt Hans",
                    "finnish": "Juhannus"
                },
                "date": "Around June 21",
                "countries": ["SE", "NO", "DK", "FI"],
                "description": "Celebration of the summer solstice",
                "traditions": [
                    "Raising and dancing around the maypole",
                    "Bonfires",
                    "Flower crowns",
                    "Traditional foods"
                ],
                "historical_origin": "Pre-Christian solstice celebration",
                "modern_practices": "Public holiday in Sweden and Finland"
            }
        ]
    }
}
```

### GET /culture/history

Get historical events and periods.

**Query Parameters:**

| Parameter   | Type    | Required | Description                                      |
| ----------- | ------- | -------- | ------------------------------------------------ |
| `period`    | string  | No       | Historical period (viking_age, medieval, modern) |
| `country`   | string  | No       | Filter by country                                |
| `year_from` | integer | No       | Start year                                       |
| `year_to`   | integer | No       | End year                                         |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "events": [
            {
                "id": "event_viking_age",
                "name": "Viking Age",
                "period": "793-1066 CE",
                "description": "Period of Scandinavian expansion through trade and conquest",
                "key_events": [
                    {
                        "year": 793,
                        "event": "Lindisfarne raid",
                        "description": "Traditional start of Viking Age"
                    },
                    {
                        "year": 1066,
                        "event": "Battle of Stamford Bridge",
                        "description": "Traditional end of Viking Age"
                    }
                ],
                "significance": "Major cultural and historical period that shaped Northern Europe",
                "related_topics": ["mythology", "exploration", "trade"]
            }
        ]
    }
}
```

### GET /culture/cuisine

Get information about Nordic cuisine and traditional dishes.

**Query Parameters:**

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| `country` | string | No       | Filter by country                                |
| `course`  | string | No       | Filter by course (appetizer, main, dessert)      |
| `dietary` | string | No       | Dietary restrictions (vegetarian, seafood, meat) |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "dishes": [
            {
                "id": "dish_rakfisk",
                "name": "Rakfisk",
                "country": "NO",
                "description": "Fermented trout, a traditional Norwegian delicacy",
                "ingredients": ["Trout", "Salt", "Sugar"],
                "preparation": "Fish is salted and fermented for 2-3 months",
                "serving_suggestion": "Served with flatbread, sour cream, and onions",
                "season": "Autumn/Winter",
                "cultural_significance": "Traditional preservation method dating back centuries",
                "similar_dishes": ["Surströmming (Swedish)", "Hákarl (Icelandic)"]
            }
        ]
    }
}
```

### GET /culture/folklore

Get Nordic folklore, legends, and folk tales.

**Query Parameters:**

| Parameter       | Type   | Required | Description                                          |
| --------------- | ------ | -------- | ---------------------------------------------------- |
| `country`       | string | No       | Filter by country                                    |
| `creature_type` | string | No       | Filter by creature type (troll, huldra, nisse, etc.) |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "folklore": [
            {
                "id": "folk_nisse",
                "name": "Nisse",
                "type": "creature",
                "countries": ["NO", "DK", "SE"],
                "description": "Small household spirit that protects the farm",
                "appearance": "Small, elderly man with a long beard and red cap",
                "behavior": "Helpful if treated well, mischievous if disrespected",
                "traditions": "Leave out porridge on Christmas Eve",
                "modern_influence": "Basis for Christmas gnome decorations",
                "similar_creatures": {
                    "finnish": "Tonttu",
                    "icelandic": "Álfar"
                }
            }
        ]
    }
}
```

### GET /culture/symbols

Get information about Nordic cultural symbols.

**Example Response:**

```json
{
    "success": true,
    "data": {
        "symbols": [
            {
                "id": "symbol_valknut",
                "name": "Valknut",
                "description": "Three interlocked triangles",
                "meaning": "Associated with Odin and the slain warriors",
                "historical_usage": "Found on Viking Age artifacts and runestones",
                "modern_usage": "Popular symbol in Nordic culture",
                "controversies": "Sometimes misappropriated by extremist groups"
            }
        ]
    }
}
```
