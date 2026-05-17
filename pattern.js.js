// ===== PATTERN DETECTION =====
class PatternDetector {
    /**
     * Detect semua pola candlestick
     */
    static detectAll(data, indicators) {
        const patterns = [];
        
        patterns.push(...this.detectDoji(data, indicators));
        patterns.push(...this.detectHammerShootingStar(data, indicators));
        patterns.push(...this.detectEngulfing(data, indicators));
        patterns.push(...this.detectPinBar(data, indicators));
        patterns.push(...this.detectMorningEveningStar(data, indicators));
        patterns.push(...this.detectThreeWhiteSoldiers(data));
        patterns.push(...this.detectThreeBlackCrows(data));
        
        // Sort by date
        patterns.sort((a, b) => b.date - a.date);
        
        return patterns;
    }

    /**
     * Detect Doji patterns
     */
    static detectDoji(data, indicators) {
        const patterns = [];
        
        for (let i = 1; i < data.length; i++) {
            const body = indicators.bodies[i];
            const bodyAvg = indicators.bodyAvg[i];
            const upperShadow = indicators.upperShadows[i];
            const lowerShadow = indicators.lowerShadows[i];
            
            if (body <= bodyAvg * CONFIG.DOJI_THRESHOLD) {
                // Long-legged Doji
                if (upperShadow > body * 2 && lowerShadow > body * 2) {
                    patterns.push({
                        date: data[i].date,
                        type: 'Long-legged Doji',
                        price: data[i].close,
                        signal: 'Reversal',
                        strength: data[i].volume > indicators.volumeMA[i] * 1.5 ? 'Strong' : 'Normal',
                        category: 'neutral'
                    });
                }
                // Dragonfly Doji
                else if (lowerShadow > body * 3 && upperShadow < body) {
                    patterns.push({
                        date: data[i].date,
                        type: 'Dragonfly Doji',
                        price: data[i].close,
                        signal: 'Bullish Reversal',
                        strength: 'Strong',
                        category: 'bullish'
                    });
                }
                // Gravestone Doji
                else if (upperShadow > body * 3 && lowerShadow < body) {
                    patterns.push({
                        date: data[i].date,
                        type: 'Gravestone Doji',
                        price: data[i].close,
                        signal: 'Bearish Reversal',
                        strength: 'Strong',
                        category: 'bearish'
                    });
                }
            }
        }
        
        return patterns;
    }

    /**
     * Detect Hammer & Shooting Star
     */
    static detectHammerShootingStar(data, indicators) {
        const patterns = [];
        
        for (let i = 1; i < data.length; i++) {
            const body = indicators.bodies[i];
            const upperShadow = indicators.upperShadows[i];
            const lowerShadow = indicators.lowerShadows[i];
            
            // Hammer (Bullish)
            if (lowerShadow > body * 2 && upperShadow < body * 0.5 && body > 0) {
                if (i >= 3) {
                    const prevClose = data.slice(i - 3, i).reduce((sum, d) => sum + d.close, 0) / 3;
                    if (data[i].close < prevClose) {
                        patterns.push({
                            date: data[i].date,
                            type: 'Hammer',
                            price: data[i].close,
                            signal: 'Bullish Reversal',
                            strength: data[i].volume > indicators.volumeMA[i] * 1.5 ? 'Strong' : 'Normal',
                            category: 'bullish'
                        });
                    }
                }
            }
            
            // Shooting Star (Bearish)
            if (upperShadow > body * 2 && lowerShadow < body * 0.5 && body > 0) {
                if (i >= 3) {
                    const prevClose = data.slice(i - 3, i).reduce((sum, d) => sum + d.close, 0) / 3;
                    if (data[i].close > prevClose) {
                        patterns.push({
                            date: data[i].date,
                            type: 'Shooting Star',
                            price: data[i].close,
                            signal: 'Bearish Reversal',
                            strength: 'Strong',
                            category: 'bearish'
                        });
                    }
                }
            }
        }
        
        return patterns;
    }

    /**
     * Detect Engulfing patterns
     */
    static detectEngulfing(data, indicators) {
        const patterns = [];
        
        for (let i = 1; i < data.length; i++) {
            // Bullish Engulfing
            if (data[i].close > data[i].open && // Green candle
                data[i - 1].close < data[i - 1].open && // Previous red candle
                data[i].open < data[i - 1].close &&
                data[i].close > data[i - 1].open) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Bullish Engulfing',
                    price: data[i].close,
                    signal: 'Strong Bullish',
                    strength: data[i].volume > indicators.volumeMA[i] * 1.5 ? 'Strong' : 'Normal',
                    category: 'bullish'
                });
            }
            
            // Bearish Engulfing
            if (data[i].close < data[i].open && // Red candle
                data[i - 1].close > data[i - 1].open && // Previous green candle
                data[i].open > data[i - 1].close &&
                data[i].close < data[i - 1].open) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Bearish Engulfing',
                    price: data[i].close,
                    signal: 'Strong Bearish',
                    strength: data[i].volume > indicators.volumeMA[i] * 1.5 ? 'Strong' : 'Normal',
                    category: 'bearish'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect Pin Bars
     */
    static detectPinBar(data, indicators) {
        const patterns = [];
        
        for (let i = 1; i < data.length; i++) {
            const body = indicators.bodies[i];
            const upperShadow = indicators.upperShadows[i];
            const lowerShadow = indicators.lowerShadows[i];
            
            // Bullish Pin Bar
            if (lowerShadow > body * 3 && upperShadow < body * 0.5 && body > indicators.bodyAvg[i] * 0.3) {
                patterns.push({
                    date: data[i].date,
                    type: 'Bullish Pin Bar',
                    price: data[i].low,
                    signal: 'Strong Bullish Reversal',
                    strength: data[i].volume > indicators.volumeMA[i] * 2 ? 'Very Strong' : 'Strong',
                    category: 'bullish'
                });
            }
            
            // Bearish Pin Bar
            if (upperShadow > body * 3 && lowerShadow < body * 0.5 && body > indicators.bodyAvg[i] * 0.3) {
                patterns.push({
                    date: data[i].date,
                    type: 'Bearish Pin Bar',
                    price: data[i].high,
                    signal: 'Strong Bearish Reversal',
                    strength: data[i].volume > indicators.volumeMA[i] * 2 ? 'Very Strong' : 'Strong',
                    category: 'bearish'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect Morning/Evening Star (3-candle pattern)
     */
    static detectMorningEveningStar(data) {
        const patterns = [];
        
        for (let i = 2; i < data.length; i++) {
            // Morning Star (Bullish)
            if (data[i - 2].close < data[i - 2].open && // First candle red
                Math.abs(data[i - 1].close - data[i - 1].open) < Math.abs(data[i - 2].close - data[i - 2].open) * 0.3 && // Small body
                data[i].close > data[i].open && // Third candle green
                data[i].close > (data[i - 2].open + data[i - 2].close) / 2) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Morning Star',
                    price: data[i].close,
                    signal: 'Bullish Reversal',
                    strength: 'Strong',
                    category: 'bullish'
                });
            }
            
            // Evening Star (Bearish)
            if (data[i - 2].close > data[i - 2].open && // First candle green
                Math.abs(data[i - 1].close - data[i - 1].open) < Math.abs(data[i - 2].close - data[i - 2].open) * 0.3 && // Small body
                data[i].close < data[i].open && // Third candle red
                data[i].close < (data[i - 2].open + data[i - 2].close) / 2) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Evening Star',
                    price: data[i].close,
                    signal: 'Bearish Reversal',
                    strength: 'Strong',
                    category: 'bearish'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect Three White Soldiers
     */
    static detectThreeWhiteSoldiers(data) {
        const patterns = [];
        
        for (let i = 2; i < data.length; i++) {
            if (data[i - 2].close > data[i - 2].open &&
                data[i - 1].close > data[i - 1].open &&
                data[i].close > data[i].open &&
                data[i - 1].close > data[i - 2].close &&
                data[i].close > data[i - 1].close) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Three White Soldiers',
                    price: data[i].close,
                    signal: 'Strong Bullish Continuation',
                    strength: 'Very Strong',
                    category: 'bullish'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Detect Three Black Crows
     */
    static detectThreeBlackCrows(data) {
        const patterns = [];
        
        for (let i = 2; i < data.length; i++) {
            if (data[i - 2].close < data[i - 2].open &&
                data[i - 1].close < data[i - 1].open &&
                data[i].close < data[i].open &&
                data[i - 1].close < data[i - 2].close &&
                data[i].close < data[i - 1].close) {
                
                patterns.push({
                    date: data[i].date,
                    type: 'Three Black Crows',
                    price: data[i].close,
                    signal: 'Strong Bearish Continuation',
                    strength: 'Very Strong',
                    category: 'bearish'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Find Support & Resistance levels
     */
    static findSupportResistance(data, window = 20, minTouches = 2) {
        const supports = [];
        const resistances = [];
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        const closes = data.map(d => d.close);
        
        for (let i = window; i < data.length - window; i++) {
            // Swing High (Resistance)
            if (highs[i] === Math.max(...highs.slice(i - window, i + window + 1))) {
                const level = highs[i];
                let touches = 0;
                
                for (let j = Math.max(0, i - 50); j < Math.min(data.length, i + 50); j++) {
                    if (Math.abs(highs[j] - level) / level < 0.01 || 
                        Math.abs(closes[j] - level) / level < 0.01) {
                        touches++;
                    }
                }
                
                if (touches >= minTouches) {
                    resistances.push({
                        price: parseFloat(level.toFixed(2)),
                        strength: touches >= 3 ? 'Strong' : 'Normal',
                        touches: touches
                    });
                }
            }
            
            // Swing Low (Support)
            if (lows[i] === Math.min(...lows.slice(i - window, i + window + 1))) {
                const level = lows[i];
                let touches = 0;
                
                for (let j = Math.max(0, i - 50); j < Math.min(data.length, i + 50); j++) {
                    if (Math.abs(lows[j] - level) / level < 0.01 || 
                        Math.abs(closes[j] - level) / level < 0.01) {
                        touches++;
                    }
                }
                
                if (touches >= minTouches) {
                    supports.push({
                        price: parseFloat(level.toFixed(2)),
                        strength: touches >= 3 ? 'Strong' : 'Normal',
                        touches: touches
                    });
                }
            }
        }
        
        // Remove duplicates and sort
        const uniqueSupports = [...new Map(supports.map(s => [s.price, s])).values()]
            .sort((a, b) => b.price - a.price)
            .slice(0, 5);
            
        const uniqueResistances = [...new Map(resistances.map(r => [r.price, r])).values()]
            .sort((a, b) => a.price - b.price)
            .slice(0, 5);
        
        return {
            support: uniqueSupports,
            resistance: uniqueResistances
        };
    }
}