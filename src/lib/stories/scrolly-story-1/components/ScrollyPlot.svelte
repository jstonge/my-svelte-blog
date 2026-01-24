<script>
    import { scaleLinear, scaleBand, max } from 'd3';
    
    import boys1980 from '../data/boys-1980.json';
    
    let { scrollyIndex } = $props();

    // Chart dimensions - bind to container width for responsiveness
    let width = $state(800);
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 80, left: 60 };

    let innerWidth = $derived(width - margin.left - margin.right);
    let innerHeight = $derived(height - margin.top - margin.bottom);

    // Seeded random number generator for consistent shuffle
    function seededRandom(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Deterministic shuffle function using seeded random
    function shuffle(array, seed = 42) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Get top 50 sorted, then shuffle/sort based on step
    const top50Sorted = boys1980
        .sort((a, b) => b.counts - a.counts)
        .slice(0, 50);

    // Select and prepare data based on scroll step
    let currentData = $derived.by(() => {
        if (scrollyIndex !== undefined && scrollyIndex >= 1) {
            // Sort by counts descending (steps 1+)
            return top50Sorted;
        }
        // Shuffle at step 0 or undefined (deterministic)
        return shuffle(top50Sorted);
    });

    // Determine chart type based on step
    let chartType = $derived(scrollyIndex >= 2 ? 'lollipop' : 'bar');

    // Scales
    let xScale = $derived(scaleBand()
        .domain(currentData.map(d => d.types))
        .range([0, innerWidth])
        .padding(0.1));

    let yScale = $derived(scaleLinear()
        .domain([0, max(currentData, d => d.counts)])
        .range([innerHeight, 0])
        .nice());

    // Y-axis ticks
    let yTicks = $derived(yScale.ticks(5));
</script>

<div class="chart-container" bind:clientWidth={width}>
    <svg viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${margin.left},${margin.top})`}>
            <!-- Y-axis grid lines -->
            {#each yTicks as tick}
                <line
                    x1={0}
                    x2={innerWidth}
                    y1={yScale(tick)}
                    y2={yScale(tick)}
                    stroke="#e0e0e0"
                    stroke-width="1"
                />
            {/each}

            <!-- Render both bars and lollipops, fade between them -->
            {#each currentData as d (d.types)}
                <!-- Bars -->
                <rect
                    x={xScale(d.types)}
                    y={yScale(d.counts)}
                    width={xScale.bandwidth()}
                    height={innerHeight - yScale(d.counts)}
                    fill="#a6a6a6"
                    opacity={chartType === 'bar' ? 1 : 0}
                    style="transition: x 0.8s ease-in-out, y 0.8s ease-in-out, height 0.8s ease-in-out, opacity 0.8s ease-in-out;"
                />

                <!-- Lollipop stem (line) -->
                <line
                    x1={xScale(d.types) + xScale.bandwidth() / 2}
                    x2={xScale(d.types) + xScale.bandwidth() / 2}
                    y1={innerHeight}
                    y2={yScale(d.counts)}
                    stroke="#a6a6a6"
                    stroke-width="2"
                    opacity={chartType === 'lollipop' ? 1 : 0}
                    style="transition: x1 0.8s ease-in-out, x2 0.8s ease-in-out, y2 0.8s ease-in-out, opacity 0.8s ease-in-out;"
                />

                <!-- Lollipop head (circle) -->
                <circle
                    cx={xScale(d.types) + xScale.bandwidth() / 2}
                    cy={yScale(d.counts)}
                    r=5
                    fill="#a6a6a6"
                    opacity={chartType === 'lollipop' ? 1 : 0}
                    style="transition: cx 0.8s ease-in-out, cy 0.8s ease-in-out, opacity 0.8s ease-in-out;"
                />
            {/each}

            <!-- X-axis labels (show every other label) -->
            {#each currentData as d, i (d.types)}
                {#if i % 3 === 0}
                    <text
                        x={xScale(d.types) + xScale.bandwidth() / 2}
                        y={innerHeight + 10}
                        text-anchor="end"
                        font-size="10"
                        transform={`rotate(-25, ${xScale(d.types) + xScale.bandwidth() / 2}, ${innerHeight + 10})`}
                        style="transition: x 0.8s ease-in-out;"
                    >
                        {d.types}
                    </text>
                {/if}
            {/each}

            <!-- Y-axis labels -->
            {#each yTicks as tick}
                <text
                    x={-10}
                    y={yScale(tick)}
                    text-anchor="end"
                    alignment-baseline="middle"
                    font-size="10"
                >
                    {tick}
                </text>
            {/each}

            <!-- Axes lines -->
            <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} stroke="black" stroke-width="1" />
            <line x1={0} x2={0} y1={0} y2={innerHeight} stroke="black" stroke-width="1" />
        </g>
    </svg>
</div>

<style>
    .chart-container {
        width: 100%;
        height: auto;
    }

    svg {
        width: 100%;
        height: auto;
    }

    text {
        fill: #333;
    }
</style>
