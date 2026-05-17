// ===== TECHNICAL INDICATORS =====
class TechnicalIndicators {
    /**
     * Calculate EMA
     */
    static calculateEMA(data, period) {
        const closes = data.map(d => d.close);
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // SMA untuk nilai awal
        let sma = closes.slice(0, period).reduce((a, b) => a + b) / period;
        ema.push(sma);
        
        // EMA
        for (let i = period; i < closes.length; i++) {
            const value = (closes[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
            ema.push(value);
        }
        
        // Pad dengan null untuk index awal
        const padding = new Array(period - 1).fill(null);
        return [...padding, ...ema];
    }

    /**
     * Calculate ATR (Average True Range)
     */
    static calculateATR(data, period = 14) {
        const trueRanges = [];
        
        for (let i = 1; i < data.length; i++) {
            const high = data[i].high;
            const low = data[i].low;
            const prevClose = data[i - 1].close;
            
            const tr1 = high - low;
            const tr2 = Math.abs(high - prevClose);
            const tr3 = Math.abs(low - prevClose);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        const atr = [];
        let sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
        atr.push(sum / period);
        
        for (let i = period; i < trueRanges.length; i++) {
            const value = (atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period;
            atr.push(value);
        }
        
        const padding = new Array(period).fill(null);
        return [...padding, ...atr];
    }

    /**
     * Calculate RSI
     */
    static calculateRSI(data, period = 14) {
        const closes = data.map(d => d.close);
        const gains = [];
        const losses = [];
        
        for (let i = 1; i < closes.length; i++) {
            const diff = closes[i] - closes[i - 1];
            gains.push(diff > 0 ? diff : 0);
            losses.push(diff < 0 ? Math.abs(diff) : 0);
        }
        
        const rsi = [];
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
        
        for (let i = period; i < gains.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            
            const rs = avgGain / (avgLoss || 1);
            rsi.push(100 - (100 / (1 + rs)));
        }
        
        const padding = new Array(period + 1).fill(null);
        return [...padding, ...rsi];
    }

    /**
     * Calculate Volume Moving Average
     */
    static calculateVolumeMA(data, period = 20) {
        const volumes = data.map(d => d.volume);
        const ma = [];
        
        for (let i = 0; i < volumes.length; i++) {
            if (i < period - 1) {
                ma.push(null);
                continue;
            }
            const sum = volumes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            ma.push(sum / period);
        }
        
        return ma;
    }

    /**
     * Detect Trend
     */
    static detectTrend(data, ema20, ema50) {
        if (data.length < 50) return { trend: 'Insufficient Data', strength: 'N/A' };
        
        const lastEMA20 = ema20[ema20.length - 1];
        const lastEMA50 = ema50[ema50.length - 1];
        const currentPrice = data[data.length - 1].close;
        
        let trend;
        if (lastEMA20 > lastEMA50 * 1.02) {
            trend = 'uptrend';
        } else if (lastEMA20 < lastEMA50 * 0.98) {
            trend = 'downtrend';
        } else {
            trend = 'sideways';
        }
        
        // Calculate strength
        const price20DaysAgo = data[Math.max(0, data.length - 20)].close;
        const priceChange = ((currentPrice - price20DaysAgo) / price20DaysAgo) * 100;
        
        let strength;
        if (Math.abs(priceChange) > 10) strength = 'Strong';
        else if (Math.abs(priceChange) > 5) strength = 'Moderate';
        else strength = 'Weak';
        
        return {
            trend,
            strength,
            priceChange: priceChange.toFixed(2),
            ema20: lastEMA20,
            ema50: lastEMA50
        };
    }

    /**
     * Calculate all indicators
     */
    static calculateAll(data) {
        const ema20 = this.calculateEMA(data, 20);
        const ema50 = this.calculateEMA(data, 50);
        const atr = this.calculateATR(data);
        const rsi = this.calculateRSI(data);
        const volumeMA = this.calculateVolumeMA(data);
        const trend = this.detectTrend(data, ema20, ema50);
        
        // Calculate candle properties
        const bodies = data.map(d => Math.abs(d.close - d.open));
        const bodyAvg = this.calculateEMA(data.map((d, i) => ({ close: bodies[i] })), 20);
        const upperShadows = data.map(d => d.high - Math.max(d.close, d.open));
        const lowerShadows = data.map(d => Math.min(d.close, d.open) - d.low);
        const ranges = data.map(d => d.high - d.low);
        
        return {
            ema20,
            ema50,
            atr,
            rsi,
            volumeMA,
            trend,
            bodies,
            bodyAvg,
            upperShadows,
            lowerShadows,
            ranges
        };
    }
}