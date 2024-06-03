import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# print(gpd.io.file)
# gpd.io.file.shp_utils.SHAPES_RESTORE_SHX = "YES"


# Read the CSV file
df = pd.read_csv('bfro-report-locations.csv')

# Load the US states shapefile
us_states = gpd.read_file('./cb_2018_us_state_500k/cb_2018_us_state_500k.shp')

# Convert latitude and longitude to Point objects
geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]

# Create a GeoDataFrame from the DataFrame
gdf = gpd.GeoDataFrame(df, geometry=geometry, crs=us_states.crs)

# Perform spatial join to get the state information
result = gpd.sjoin(gdf, us_states, op='within')
# print(result)

# # Print the DataFrame with state information
# print(result[['latitude', 'longitude', 'NAME']])

result.to_csv('data-with-states.csv', index=False)
