// ===== API HANDLER =====
class APIHandler {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Fetch data dari Yahoo Finance (gratis, no API key)
     */
    async fetchYahooFinance(symbol, timeframe, period) {
        const cacheKey = `${symbol}_${timeframe}_${period}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
                return cached.data;
            }
        }

        try {
            // Convert timeframe dan period ke format Yahoo Finance
            const interval = this.convertTimeframe(timeframe);
            const range = this.convertPeriod(period);
            
            const url = `${CONFIG.YAHOO_FINANCE_BASE}${symbol}?interval=${interval}&range=${range}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');
            
            const json = await response.json();
            const result = json.chart.result[0];
            
            // Parse data
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            
            const data = timestamps.map((timestamp, i) => ({
                date: new Date(timestamp * 1000),
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i]
            })).filter(d => d.open !== null);
            
            // Cache data
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('Error fetching from Yahoo Finance:', error);
            return this.fetchAlphaVantage(symbol, timeframe);
        }
    }

    /**
     * Backup: Alpha Vantage API
     */
    async fetchAlphaVantage(symbol, timeframe) {
        try {
            const fn = timeframe.includes('d') || timeframe.includes('wk') ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
            const url = `https://www.alphavantage.co/query?function=${fn}&symbol=${symbol}&interval=${timeframe}&apikey=${CONFIG.ALPHA_VANTAGE_API_KEY}&outputsize=full`;
            
            const response = await fetch(url);
            const json = await response.json();
            
            // Parse Alpha Vantage response
            const timeSeriesKey = Object.keys(json).find(k => k.includes('Time Series'));
            if (!timeSeriesKey) throw new Error('No data');
            
            const timeSeries = json[timeSeriesKey];
            const data = Object.entries(timeSeries).map(([date, values]) => ({
                date: new Date(date),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseFloat(values['5. volume'])
            })).reverse();
            
            return data;
            
        } catch (error) {
            console.error('Error fetching from Alpha Vantage:', error);
            // Gunakan data dummy sebagai fallback
            return this.generateDummyData();
        }
    }

    /**
     * Generate dummy data untuk testing
     */
    generateDummyData() {
        const data = [];
        let price = 150 + Math.random() * 50;
        const now = new Date();
        
        for (let i = 200; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const change = (Math.random() - 0.5) * 5;
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            const volume = Math.random() * 10000000 + 5000000;
            
            data.push({
                date: date,
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume: Math.floor(volume)
            });
            
            price = close;
        }
        
        return data;
    }

    /**
     * Convert timeframe ke Yahoo Finance format
     */
    convertTimeframe(timeframe) {
        const map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '1h': '60m',
            '4h': '1h', // Yahoo doesn't support 4h
            '1d': '1d',
            '1wk': '1wk'
        };
        return map[timeframe] || '1d';
    }

    /**
     * Convert period ke Yahoo Finance format
     */
    convertPeriod(period) {
        const map = {
            '1d': '1d',
            '5d': '5d',
            '1mo': '1mo',
            '3mo': '3mo',
            '6mo': '6mo',
            '1y': '1y',
            '2y': '2y',
            '5y': '5y'
        };
        return map[period] || '6mo';
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Global API instance
const api = new APIHandler();