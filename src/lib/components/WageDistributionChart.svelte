<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';

  /** 
   * wageData: array of { AREA_TITLE: string; A_MEDIAN: string }
   */
  export let wageData: { AREA_TITLE: string; A_MEDIAN: string }[] = [];

  let container: HTMLDivElement;
  let width = 0;
  const height = 200;
  let resizeObserver: ResizeObserver;

  // watch for container mount & data changes
  $: if (container && wageData.length && width) {
    drawChart();
  }

  onMount(() => {
    // observe container size
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        width = entry.contentRect.width;
      }
    });
    resizeObserver.observe(container);
  });

  onDestroy(() => {
    resizeObserver.disconnect();
  });

  function drawChart() {
    container.innerHTML = ''; // clear old

    // parse wages, remove commas
    const parsed = wageData
      .map(d => ({
        state: d.AREA_TITLE,
        wage: +d.A_MEDIAN.replace(/,/g, '')
      }))
      .filter(d => !isNaN(d.wage));

    if (!parsed.length) return;

    const values = parsed.map(d => d.wage).sort(d3.ascending);
    const ilDatum = parsed.find(d => d.state === 'Illinois');

    const min = d3.min(values)!;
    const max = d3.max(values)!;

    // dimensions & margins
    const margin = { top: 10, right: 20, bottom: 30, left: 20 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    const centerY = h / 2;

    // x scale
    const x = d3.scaleLinear()
      .domain([min - (max-min)*0.05, max + (max-min)*0.05])
      .range([0, w]);

    // density
    const kde = kernelDensityEstimator(
      kernelEpanechnikov((max-min)/20),
      x.ticks(50)
    );
    const density = kde(values);
    const maxDensity = d3.max(density, d => d[1])!;
    const yScale = d3.scaleLinear()
      .domain([0, maxDensity])
      .range([0, centerY - 10]);

    // create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // violin
    const area = d3.area<[number, number]>()
      .curve(d3.curveCatmullRom)
      .x(d => x(d[0]))
      .y0(d => centerY - yScale(d[1]))
      .y1(d => centerY + yScale(d[1]));

    svg.append('path')
      .datum(density)
      .attr('d', area)
      .attr('fill', '#e5182d')
      .attr('opacity', 0.4);

    // state dots + tooltips
    svg.selectAll('circle.state')
      .data(parsed)
      .enter()
      .append('circle')
      .attr('class', 'state')
      .attr('cx', d => x(d.wage))
      .attr('cy', centerY)
      .attr('r', 3)
      .attr('fill', d => d.state === 'Illinois' ? 'black' : 'gray')
      .append('title')
      .text(d => `${d.state}: $${d3.format(',')(d.wage)}`);

    // annotate Illinois
    if (ilDatum) {
      const ix = x(ilDatum.wage);
      const label = `Illinois ($${d3.format(',')(ilDatum.wage)})`;

      svg.append('text')
        .attr('x', ix)
        .attr('y', centerY - yScale(maxDensity) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'black')
        .text(label);

      svg.append('line')
        .attr('x1', ix)
        .attr('y1', centerY - yScale(maxDensity) - 3)
        .attr('x2', ix)
        .attr('y2', centerY - 1)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
    }

    // x-axis
    svg.append('g')
      .attr('transform', `translate(0,${h - 10})`)
      .call(
        d3.axisBottom(x)
          .ticks(6)
          .tickFormat(d => `$${d3.format(',')(d as number)}`)
      );
  }

  // density helpers
  function kernelDensityEstimator(kernel: any, X: number[]) {
    return (V: number[]) => X.map(x => [x, d3.mean(V, v => kernel(x - v))!]);
  }
  function kernelEpanechnikov(k: number) {
    return (v: number) => {
      v = v / k;
      return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  }
</script>

<div class="chart-container" bind:this={container}></div>

<style>
  .chart-container {
    width: 100%;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    font-family: sans-serif;
  }
  div {
    margin-top: 1rem;
  }
</style>