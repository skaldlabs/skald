# Geography API

Explore the geography, regions, and places of the Nordic countries.

## Endpoints

### GET /geography/regions

Get information about Nordic regions and landscapes.

**Query Parameters:**

| Parameter     | Type    | Required | Description                                              |
| ------------- | ------- | -------- | -------------------------------------------------------- |
| `country`     | string  | No       | Filter by country code (NO, SE, DK, IS, FI)              |
| `type`        | string  | No       | Region type (fjord, mountain, forest, archipelago, etc.) |
| `unesco_site` | boolean | No       | Filter UNESCO World Heritage sites                       |

**Example Request:**

```bash
curl -X GET "https://api.odin.io/v1/geography/regions?country=NO&type=fjord" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Example Response:**

```json
{
    "success": true,
    "data": {
        "regions": [
            {
                "id": "region_geiranger",
                "name": "Geirangerfjord",
                "country": "NO",
                "type": "fjord",
                "coordinates": {
                    "latitude": 62.1009,
                    "longitude": 7.094
                },
                "description": "Deep blue fjord surrounded by majestic mountains and spectacular waterfalls",
                "unesco_site": true,
                "area_km2": 15,
                "max_depth_m": 260,
                "notable_features": ["Seven Sisters Waterfall", "Suitor Waterfall", "Bridal Veil Waterfall"],
                "activities": ["Kayaking", "Hiking", "Scenic cruises"],
                "best_season": "May to September",
                "accessibility": "Ferry and road access",
                "historical_significance": "Ancient Viking settlement area"
            }
        ]
    }
}
```

### GET /geography/cities

Get information about Nordic cities and towns.

**Query Parameters:**

| Parameter        | Type    | Required | Description            |
| ---------------- | ------- | -------- | ---------------------- |
| `country`        | string  | No       | Filter by country code |
| `population_min` | integer | No       | Minimum population     |
| `coastal`        | boolean | No       | Filter coastal cities  |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "cities": [
            {
                "id": "city_reykjavik",
                "name": "Reykjavík",
                "country": "IS",
                "country_name": "Iceland",
                "population": 131136,
                "founded": "874 CE",
                "coordinates": {
                    "latitude": 64.1466,
                    "longitude": -21.9426
                },
                "is_capital": true,
                "elevation_m": 0,
                "description": "World's northernmost capital city, known for colorful houses and vibrant culture",
                "highlights": [
                    "Hallgrímskirkja church",
                    "Harpa Concert Hall",
                    "Blue Lagoon (nearby)",
                    "Northern Lights viewing",
                    "Midnight sun in summer"
                ],
                "climate": {
                    "type": "Subpolar oceanic",
                    "avg_temp_winter_c": 0,
                    "avg_temp_summer_c": 11
                },
                "economy": ["Tourism", "Fishing", "Technology", "Green energy"],
                "languages": ["Icelandic"],
                "etymology": "Smoky Bay (from geothermal steam)"
            }
        ]
    }
}
```

### GET /geography/landmarks

Get information about notable landmarks and natural features.

**Query Parameters:**

| Parameter | Type    | Required | Description                                        |
| --------- | ------- | -------- | -------------------------------------------------- |
| `country` | string  | No       | Filter by country                                  |
| `type`    | string  | No       | Landmark type (natural, historical, architectural) |
| `unesco`  | boolean | No       | Filter UNESCO sites only                           |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "landmarks": [
            {
                "id": "landmark_northcape",
                "name": "North Cape",
                "local_name": "Nordkapp",
                "country": "NO",
                "type": "natural",
                "coordinates": {
                    "latitude": 71.1725,
                    "longitude": 25.7844
                },
                "description": "Steep cliff at the northern edge of Europe",
                "elevation_m": 307,
                "significance": "One of the northernmost points of Europe accessible by car",
                "features": [
                    "Midnight Sun (May-July)",
                    "Northern Lights (September-March)",
                    "Global monument",
                    "Visitor center"
                ],
                "visiting_info": {
                    "best_time": "May to August",
                    "accessibility": "Road access, seasonal ferry",
                    "facilities": "Restaurant, museum, gift shop"
                },
                "historical_notes": "Named by English explorer Richard Chancellor in 1553"
            }
        ]
    }
}
```

### GET /geography/islands

Get information about Nordic islands and archipelagos.

**Example Response:**

```json
{
    "success": true,
    "data": {
        "islands": [
            {
                "id": "island_svalbard",
                "name": "Svalbard",
                "country": "NO",
                "type": "archipelago",
                "total_islands": 400,
                "total_area_km2": 61022,
                "population": 2939,
                "main_settlement": "Longyearbyen",
                "coordinates": {
                    "latitude": 78.2232,
                    "longitude": 15.6267
                },
                "description": "Arctic archipelago between mainland Norway and the North Pole",
                "climate": "Arctic",
                "wildlife": ["Polar bears", "Arctic foxes", "Reindeer", "Walrus", "Various seabirds"],
                "features": [
                    "Global Seed Vault",
                    "Abandoned mining towns",
                    "Glaciers covering 60% of land",
                    "No sunset from April to August"
                ],
                "activities": ["Polar bear safaris", "Dog sledding", "Snowmobile tours", "Glacier hiking"],
                "unique_laws": "One of the few visa-free zones in the world"
            }
        ]
    }
}
```

### GET /geography/trails

Get information about hiking trails and outdoor routes.

**Query Parameters:**

| Parameter       | Type   | Required | Description                                     |
| --------------- | ------ | -------- | ----------------------------------------------- |
| `country`       | string | No       | Filter by country                               |
| `difficulty`    | string | No       | Difficulty level (easy, moderate, hard, expert) |
| `length_km_min` | number | No       | Minimum trail length                            |
| `length_km_max` | number | No       | Maximum trail length                            |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "trails": [
            {
                "id": "trail_kungsleden",
                "name": "Kungsleden",
                "english_name": "The King's Trail",
                "country": "SE",
                "region": "Lapland",
                "length_km": 440,
                "difficulty": "moderate",
                "duration_days": "25-30",
                "type": "Long-distance hiking trail",
                "start_point": "Abisko",
                "end_point": "Hemavan",
                "elevation_gain_m": 12000,
                "highest_point_m": 1140,
                "season": "June to September",
                "description": "Sweden's most famous hiking trail through spectacular arctic landscapes",
                "highlights": [
                    "Abisko National Park",
                    "Kebnekaise (Sweden's highest mountain nearby)",
                    "Mountain huts along the route",
                    "Sami culture",
                    "Arctic wilderness"
                ],
                "accommodations": {
                    "mountain_huts": true,
                    "camping_allowed": true,
                    "hut_spacing_km": "15-20"
                },
                "permits_required": false,
                "accessibility": "Well-marked trail, some sections challenging"
            }
        ]
    }
}
```

### GET /geography/climate

Get climate information for Nordic regions.

**Query Parameters:**

| Parameter  | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| `location` | string | Yes      | City or region name |
| `country`  | string | No       | Country code        |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "climate": {
            "location": "Tromsø",
            "country": "NO",
            "coordinates": {
                "latitude": 69.6492,
                "longitude": 18.9553
            },
            "climate_zone": "Subarctic",
            "characteristics": ["Mild winters for latitude due to Gulf Stream", "Cool summers", "High precipitation"],
            "temperatures": {
                "january_avg_c": -4,
                "july_avg_c": 12,
                "annual_avg_c": 2.5,
                "record_high_c": 30.2,
                "record_low_c": -20.1
            },
            "precipitation": {
                "annual_mm": 1031,
                "wettest_month": "October",
                "driest_month": "May"
            },
            "daylight": {
                "polar_night": {
                    "start": "November 27",
                    "end": "January 15",
                    "description": "Sun does not rise above horizon"
                },
                "midnight_sun": {
                    "start": "May 20",
                    "end": "July 22",
                    "description": "Sun visible 24 hours"
                }
            },
            "northern_lights": {
                "season": "September to March",
                "visibility": "Excellent - located in auroral oval"
            }
        }
    }
}
```

### GET /geography/wildlife

Get information about Nordic wildlife and nature.

**Query Parameters:**

| Parameter      | Type   | Required | Description                                 |
| -------------- | ------ | -------- | ------------------------------------------- |
| `country`      | string | No       | Filter by country                           |
| `habitat`      | string | No       | Habitat type (arctic, forest, marine, etc.) |
| `species_type` | string | No       | Type (mammal, bird, fish, etc.)             |

**Example Response:**

```json
{
    "success": true,
    "data": {
        "species": [
            {
                "id": "species_moose",
                "common_name": "Moose",
                "scientific_name": "Alces alces",
                "local_names": {
                    "norwegian": "Elg",
                    "swedish": "Älg",
                    "finnish": "Hirvi"
                },
                "countries": ["NO", "SE", "FI"],
                "habitat": "Forests, wetlands",
                "population_estimate": {
                    "norway": 30000,
                    "sweden": 350000,
                    "finland": 100000
                },
                "characteristics": {
                    "height_m": "1.8-2.1",
                    "weight_kg": "300-700",
                    "diet": "Herbivore"
                },
                "conservation_status": "Least Concern",
                "cultural_significance": "Important game animal, traffic hazard, national symbol",
                "best_viewing": "Early morning and evening in forested areas"
            }
        ]
    }
}
```
