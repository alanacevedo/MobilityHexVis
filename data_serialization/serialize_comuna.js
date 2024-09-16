import fs from 'fs';

const filterComunas = () => {
    // Define boundaries
    const LAT_LOWER = -33.96;
    const LAT_UPPER = -33.2;
    const LON_LOWER = -71;
    const LON_UPPER = -70.3;

    // Read the comunas.json file
    const rawData = fs.readFileSync('./data_serialization/comunas.json', 'utf-8');
    const comunas = JSON.parse(rawData);

    // Get all unique regions
    const allRegions = [...new Set(comunas.features.map(feature => feature.properties.REGION))];
    console.log('All regions present:');
    allRegions.forEach(region => console.log(`- ${region}`));

    // Filter features
    const filteredComunas = comunas.features.filter(feature => {
        // Check if the feature is in Región Metropolitana
        if (feature.properties.REGION !== "Región Metropolitana de Santiago") return false;

        // Check if the feature's coordinates are within the specified boundaries
        const coordinates = feature.geometry.coordinates[0];
        return coordinates.some(coord => {
            const [lon, lat] = coord;
            return lat >= LAT_LOWER && lat <= LAT_UPPER && lon >= LON_LOWER && lon <= LON_UPPER;
        });
    });

    // Create a new GeoJSON object with filtered features
    const filteredGeoJSON = {
        type: "FeatureCollection",
        features: filteredComunas
    };

    // Write the filtered data to a new file
    fs.writeFileSync('./data_serialization/comunas_metropolitana.json', JSON.stringify(filteredGeoJSON, null));

    console.log(`\nFiltered ${filteredComunas.length} comunas in Región Metropolitana.`);
}

filterComunas();