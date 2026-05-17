// ===== CHART RENDERING =====
class ChartRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.ema20Series = null;
        this.ema50Series = null;
        this.supportLines = [];
        this.resistanceLines = [];
        this.markers = [];
        
        this.initChart();
    }

    initChart() {
        // Buat chart dengan Lightweight Charts
        this.chart = LightweightCharts.createChart(this.container, {
            layout: {
                background: { color: '#0a0e27' },
                textColor: '#8b8fa3',
            },
            grid: {
                vertLines: { color: '#1a1f4e' },
                horzLines: { color: '#1a1f4e' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#2a2f5e',
            },
            timeScale: {
                borderColor: '#2a2f5e',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        // Candlestick series
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderDownColor: '#ef5350',
            borderUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            wickUpColor: '#26a69a',
        });

        // Volume series
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        // EMA 20
        this.ema20Series = this.chart.addLineSeries({
            color: '#ffd700',
            lineWidth: 1,
            priceLineVisible: false,
        });

        // EMA 50
        this.ema50Series = this.chart.addLineSeries({
            color: '#ff6b6b',
            lineWidth: 1,
            priceLineVisible: false,
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.resize(
                this.container.clientWidth,
                this.container.clientHeight
            );
        });
    }

    updateChart(data, indicators, patterns, srLevels) {
        if (!data || data.length === 0) return;

        // Clear existing data
        this.clearChart();

        // Format data untuk candlestick
        const candleData = data.map(d => ({
            time: this.formatDate(d.date),
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        // Format data untuk volume
        const volumeData = data.map((d, i) => ({
            time: this.formatDate(d.date),
            value: d.volume,
            color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }));

        // Format EMA data
        const ema20Data = data.map((d, i) => ({
            time: this.formatDate(d.date),
            value: indicators.ema20[i],
        })).filter(d => d.value !== null);

        const ema50Data = data.map((d, i) => ({
            time: this.formatDate(d.date),
            value: indicators.ema50[i],
        })).filter(d => d.value !== null);

        // Set data
        this.candleSeries.setData(candleData);
        this.volumeSeries.setData(volumeData);
        this.ema20Series.setData(ema20Data);
        this.ema50Series.setData(ema50Data);

        // Add support/resistance lines
        this.addSupportResistanceLines(srLevels, data);

        // Add pattern markers
        this.addPatternMarkers(patterns, data);

        // Fit content
        this.chart.timeScale().fitContent();
    }

    addSupportResistanceLines(srLevels, data) {
        // Remove existing lines
        this.supportLines.forEach(line => this.candleSeries.removePriceLine(line));
        this.resistanceLines.forEach(line => this.candleSeries.removePriceLine(line));
        this.supportLines = [];
        this.resistanceLines = [];

        // Add support lines
        srLevels.support.forEach(level => {
            const line = this.candleSeries.createPriceLine({
                price: level.price,
                color: '#4caf50',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: `S: ${level.price}`,
            });
            this.supportLines.push(line);
        });

        // Add resistance lines
        srLevels.resistance.forEach(level => {
            const line = this.candleSeries.createPriceLine({
                price: level.price,
                color: '#f44336',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: `R: ${level.price}`,
            });
            this.resistanceLines.push(line);
        });
    }

    addPatternMarkers(patterns, data) {
        // Remove existing markers
        this.markers.forEach(marker => this.candleSeries.removeMarker(marker));
        this.markers = [];

        // Add markers for recent patterns
        patterns.slice(0, 10).forEach(pattern => {
            const marker = this.candleSeries.setMarkers([{
                time: this.formatDate(pattern.date),
                position: pattern.category === 'bullish' ? 'belowBar' : 'aboveBar',
                color: pattern.category === 'bullish' ? '#26a69a' : '#ef5350',
                shape: pattern.category === 'bullish' ? 'arrowUp' : 'arrowDown',
                text: pattern.type,
                size: 2,
            }]);
            this.markers.push(marker);
        });
    }

    clearChart() {
        // Clear existing markers
        this.markers.forEach(marker => {
            try {
                this.candleSeries.removeMarker(marker);
            } catch (e) {}
        });
        this.markers = [];

        // Clear support/resistance lines
        this.supportLines.forEach(line => {
            try {
                this.candleSeries.removePriceLine(line);
            } catch (e) {}
        });
        this.resistanceLines.forEach(line => {
            try {
                this.candleSeries.removePriceLine(line);
            } catch (e) {}
        });
    }

    formatDate(date) {
        // Format date ke YYYY-MM-DD
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    destroy() {
        this.chart.remove();
    }
}