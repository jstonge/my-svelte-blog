import geopandas as gpd
import json
from topojson import Topology
from pathlib import Path
from pyprojroot.here import here

OUTPUT_DIR = here()

# MONTREAL DISTRICTS
districts = gpd.read_file(here("raw/mtl_topo.json"))

# MONTREAL HYDRO
hydro = gpd.read_file(here("raw/hydrographie-2020.zip"), layer='CARTO_DRA_EAU_JOUR')
# Convert to WGS84 (lat/lon) for web mapping
hydro_wgs84 = hydro.to_crs(epsg=4326)
# Simplify geometry and keep as GeoDataFrame with proper CRS
hydro_simplified = gpd.GeoDataFrame(
    geometry=hydro_wgs84.geometry.simplify(tolerance=0.0001),
    crs=hydro_wgs84.crs
)

# MTL city boundaries
city = gpd.read_file(here("raw/mtl.json"))
city = city.iloc[1:, :]

# Convert all non-geometry columns to strings to avoid JSON serialization issues
for col in city.columns:
    if col != 'geometry':
        city[col] = city[col].astype(str)

# Output as GeoJSON (simpler, works directly with d3 without topojson-client)
# Districts GeoJSON - simplify to reduce file size
districts_simplified = districts.copy()
districts_simplified['geometry'] = districts.geometry.simplify(tolerance=0.0001)
output_districts = OUTPUT_DIR / "districts.json"
with open(output_districts, 'w') as f:
    f.write(districts_simplified.to_json())
print(f"Wrote districts GeoJSON to {output_districts}")

# Hydro GeoJSON
output_hydro = OUTPUT_DIR / "hydro.json"
with open(output_hydro, 'w') as f:
    f.write(hydro_simplified.to_json())
print(f"Wrote hydro GeoJSON to {output_hydro}")

# City GeoJSON
city_simplified = city.copy()
city_simplified['geometry'] = city.geometry.simplify(tolerance=0.0001)
output_city = OUTPUT_DIR / "city.json"
with open(output_city, 'w') as f:
    f.write(city_simplified.to_json())
print(f"Wrote city GeoJSON to {output_city}")