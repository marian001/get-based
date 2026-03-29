<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getStatus } from './utils';
  import type { ActiveMarker } from './types';

  export let marker: ActiveMarker;
  export let dates: string[];
  export let dateLabels: string[];

  let canvas: HTMLCanvasElement;
  let chart: any = null;

  // @ts-ignore — Chart.js loaded from vendor
  let Chart: any;

  onMount(async () => {
    // Dynamic import of Chart.js from vendor
    const mod = await import('../../vendor/chart.min.js');
    Chart = (window as any).Chart || mod.default;
    createChart();
  });

  onDestroy(() => {
    if (chart) { chart.destroy(); chart = null; }
  });

  function createChart() {
    if (!Chart || !canvas || !marker) return;
    if (chart) { chart.destroy(); chart = null; }

    const values = marker.values || [];
    const nonNull = values.map((v, i) => v !== null ? i : -1).filter(i => i >= 0);
    if (nonNull.length === 0) return;

    // Point colors based on status
    const pointColors = values.map(v => {
      if (v === null) return 'transparent';
      const s = getStatus(v, marker.refMin, marker.refMax);
      if (s === 'high') return getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
      if (s === 'low') return getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim();
      return getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
    });

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text2').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dateLabels,
        datasets: [{
          data: values,
          borderColor: accentColor,
          backgroundColor: 'transparent',
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2,
          tension: 0.3,
          spanGaps: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `${ctx.parsed.y} ${marker.unit}`,
            }
          }
        },
        scales: {
          x: {
            ticks: { color: textColor, font: { size: 11 } },
            grid: { color: borderColor },
          },
          y: {
            ticks: { color: textColor, font: { size: 11 } },
            grid: { color: borderColor },
          }
        }
      },
      plugins: [{
        // Reference range band
        id: 'refBand',
        beforeDraw(chart: any) {
          if (marker.refMin == null || marker.refMax == null) return;
          const { ctx, chartArea, scales: { y } } = chart;
          if (!chartArea || !y) return;
          const yMin = y.getPixelForValue(marker.refMin);
          const yMax = y.getPixelForValue(marker.refMax);
          ctx.save();
          ctx.fillStyle = 'rgba(79, 140, 255, 0.06)';
          ctx.fillRect(chartArea.left, Math.min(yMin, yMax), chartArea.right - chartArea.left, Math.abs(yMax - yMin));
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(79, 140, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(chartArea.left, yMin); ctx.lineTo(chartArea.right, yMin); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(chartArea.left, yMax); ctx.lineTo(chartArea.right, yMax); ctx.stroke();
          ctx.restore();
        }
      }, {
        // Optimal range band
        id: 'optBand',
        beforeDraw(chart: any) {
          if (marker.optimalMin == null || marker.optimalMax == null) return;
          const { ctx, chartArea, scales: { y } } = chart;
          if (!chartArea || !y) return;
          const yMin = y.getPixelForValue(marker.optimalMin);
          const yMax = y.getPixelForValue(marker.optimalMax);
          ctx.save();
          ctx.fillStyle = 'rgba(52, 211, 153, 0.06)';
          ctx.fillRect(chartArea.left, Math.min(yMin, yMax), chartArea.right - chartArea.left, Math.abs(yMax - yMin));
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(chartArea.left, yMin); ctx.lineTo(chartArea.right, yMin); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(chartArea.left, yMax); ctx.lineTo(chartArea.right, yMax); ctx.stroke();
          ctx.restore();
        }
      }]
    });
  }

  // Recreate chart when data changes
  $: if (Chart && canvas && marker) createChart();
</script>

<div class="chart-container">
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .chart-container { height: 220px; position: relative; }
</style>
