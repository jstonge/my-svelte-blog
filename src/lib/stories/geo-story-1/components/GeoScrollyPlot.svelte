<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    import * as topojson from 'topojson-client';

    let { scrollyIndex } = $props();

    // Remote data URLs
    const TOPOJSON_URL = 'https://raw.githubusercontent.com/jstonge/dag-montreal/refs/heads/main/src/dag_montreal/defs/transform/input/montreal.topojson';
    const METADATA_URL = 'https://raw.githubusercontent.com/jstonge/dag-montreal/refs/heads/main/src/dag_montreal/defs/transform/input/metadata.csv';

    // Fetched data
    let districts = $state([]);
    let metadataRaw = $state([]);

    // Fetch data on mount
    onMount(async () => {
        const [topo, csvText] = await Promise.all([
            fetch(TOPOJSON_URL).then(r => r.json()),
            fetch(METADATA_URL).then(r => r.text())
        ]);
        districts = topojson.feature(topo, topo.objects.data).features;
        metadataRaw = d3.csvParse(csvText);
    });

    // Chart dimensions
    let width = $state(800);
    let height = $state(600);
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };

    let innerWidth = $derived(width - margin.left - margin.right);
    let innerHeight = $derived(height - margin.top - margin.bottom);

    // Determine display mode from scrollyIndex
    // Step 0: Show 2011 population
    // Step 1: Show % change between 2011 and 2016
    let showChange = $derived(scrollyIndex !== undefined && scrollyIndex >= 1);

    // Parse CSV data (year and population are strings from CSV, need to convert)
    let metadata = $derived(
        metadataRaw.map(d => ({
            arrondissement: d.arrondissement,
            year: parseInt(d.year),
            population: parseFloat(d.population)
        }))
    );

    // Create lookup maps for both years
    let pop2011 = $derived(
        new Map(metadata.filter(d => d.year === 2011).map(d => [d.arrondissement, d.population]))
    );
    let pop2016 = $derived(
        new Map(metadata.filter(d => d.year === 2016).map(d => [d.arrondissement, d.population]))
    );

    // Calculate percentage change for each arrondissement
    let changeMap = $derived.by(() => {
        const map = new Map();
        for (const [arr, pop11] of pop2011) {
            const pop16 = pop2016.get(arr);
            if (pop11 && pop16) {
                const change = ((pop16 - pop11) / pop11) * 100;
                map.set(arr, change);
            }
        }
        return map;
    });

    // Max population for color scale domain (2011)
    let maxPopulation = $derived(
        metadata.length > 0 ? d3.max(metadata.filter(d => d.year === 2011), d => d.population) : 100000
    );

    // Max absolute change for diverging scale
    let maxChange = $derived.by(() => {
        const values = [...changeMap.values()];
        return values.length > 0 ? Math.max(Math.abs(d3.min(values)), Math.abs(d3.max(values))) : 10;
    });

    // Color scale for population (spectral)
    let populationColorScale = $derived(
        d3.scaleSequential(d3.interpolateSpectral)
            .domain([maxPopulation, 0])
    );

    // Color scale for change (diverging: red = decline, white = no change, blue = growth)
    let changeColorScale = $derived(
        d3.scaleDiverging(d3.interpolateRdBu)
            .domain([-maxChange, 0, maxChange])
    );

    // Get fill color based on mode
    function getFillColor(arrondissement) {
        if (showChange) {
            const change = changeMap.get(arrondissement);
            return change !== undefined ? changeColorScale(change) : '#ccc';
        } else {
            const pop = pop2011.get(arrondissement);
            return pop !== undefined ? populationColorScale(pop) : '#ccc';
        }
    }

    // Get tooltip text based on mode
    function getTooltip(arrondissement, nom) {
        if (showChange) {
            const change = changeMap.get(arrondissement);
            const sign = change >= 0 ? '+' : '';
            return `${nom}: ${sign}${change?.toFixed(1)}%`;
        } else {
            const pop = pop2011.get(arrondissement);
            return `${nom}: ${pop?.toLocaleString() || 'N/A'}`;
        }
    }

    // Projection that fits the districts to the container
    let projection = $derived.by(() => {
        if (districts.length === 0) return d3.geoMercator();

        return d3.geoMercator()
            .fitSize([innerWidth, innerHeight], {
                type: "FeatureCollection",
                features: districts
            });
    });

    // Path generator
    let pathGenerator = $derived(d3.geoPath().projection(projection));

    // Get centroid for labels
    function getCentroid(feature) {
        return pathGenerator.centroid(feature);
    }

</script>

<div class="chart-container" bind:clientWidth={width} bind:clientHeight={height}>
    <div class="year-indicator">
        {#if showChange}
            Population Change 2011→2016
        {:else}
            Population 2011
        {/if}
    </div>

    <svg viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left},${margin.top})`}>
            <!-- Districts -->
            {#each districts as feature (feature.properties.id || feature.properties.nom)}
                <path
                    d={pathGenerator(feature)}
                    fill={getFillColor(feature.properties.arrondissement)}
                    stroke="#333"
                    stroke-width="0.5"
                    style="transition: fill 0.5s ease;"
                >
                    <title>{getTooltip(feature.properties.arrondissement, feature.properties.nom)}</title>
                </path>
            {/each}

            <!-- District labels -->
            {#each districts as feature (feature.properties.id || feature.properties.nom)}
                {@const centroid = getCentroid(feature)}
                {#if centroid && !isNaN(centroid[0])}
                    <text
                        x={centroid[0]}
                        y={centroid[1]}
                        text-anchor="middle"
                        font-size="8"
                        fill="#333"
                        stroke="white"
                        stroke-width="2"
                        paint-order="stroke"
                    >
                        {feature.properties.nom}
                    </text>
                {/if}
            {/each}
        </g>
    </svg>

    <!-- Color legend -->
    <div class="legend">
        {#if showChange}
            <span class="legend-label">-{maxChange?.toFixed(0)}%</span>
            <div class="legend-gradient-diverging"></div>
            <span class="legend-label">+{maxChange?.toFixed(0)}%</span>
        {:else}
            <span class="legend-label">0</span>
            <div class="legend-gradient"></div>
            <span class="legend-label">{maxPopulation?.toLocaleString()}</span>
        {/if}
    </div>
</div>

<style>
    .chart-container {
        width: 100%;
        height: 100%;
        min-height: 500px;
        position: relative;
    }

    svg {
        width: 100%;
        height: 100%;
    }

    .year-indicator {
        position: absolute;
        top: 10px;
        left: 10px;
        font-size: 1.2rem;
        font-weight: bold;
        color: #333;
        background: rgba(255, 255, 255, 0.8);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .legend {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.9);
        padding: 0.5rem;
        border-radius: 4px;
    }

    .legend-gradient {
        width: 200px;
        height: 12px;
        background: linear-gradient(to right,
            #5e4fa2, #3288bd, #66c2a5, #abdda4,
            #e6f598, #fee08b, #fdae61, #f46d43, #d53e4f, #9e0142
        );
        border-radius: 2px;
    }

    .legend-gradient-diverging {
        width: 200px;
        height: 12px;
        background: linear-gradient(to right, #b2182b, #f7f7f7, #2166ac);
        border-radius: 2px;
    }

    .legend-label {
        font-size: 0.75rem;
        color: #333;
    }

    path {
        cursor: pointer;
    }

    path:hover {
        stroke-width: 2;
        stroke: #000;
    }
</style>
