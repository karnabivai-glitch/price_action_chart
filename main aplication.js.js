// ===== MAIN APPLICATION =====
class PriceActionApp {
    constructor() {
        this.chart = null;
        this.currentData = null;
        this.currentIndicators = null;
        this.currentPatterns = null;
        this.currentSRLevels = null;
        
        this.init();
    }

    init() {
        // Initialize chart
        this.chart = new ChartRenderer('chartContainer');
        
        // Add event listeners
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
        document.getElementById('autoRefreshBtn').addEventListener('click', () => this.toggleAutoRefresh());
        
        // Input change handlers
        document.getElementById('symbol').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.analyze();
        });
        
        // Load default analysis
        this.analyze();
    }

    async analyze() {
        const symbol = document.getElementById('symbol').value.toUpperCase();
        const timeframe = document.getElementById('timeframe').value;
        const period = document.getElementById('period').value;
        
        // Update state
        STATE.currentSymbol = symbol;
        STATE.currentTimeframe = timeframe;
        STATE.currentPeriod = period;
        
        // Show loading
        this.showLoading(true);
        
        try {
            // Fetch data
            const data = await api.fetchYahooFinance(symbol, timeframe, period);
            
            if (!data || data.length < 50) {
                this.showError('Insufficient data. Try different symbol or period.');
                return;
            }
            
            // Calculate indicators
            const indicators = TechnicalIndicators.calculateAll(data);
            
            // Detect patterns
            const patterns = PatternDetector.detectAll(data, indicators);
            
            // Find support/resistance
            const srLevels = PatternDetector.findSupportResistance(data);
            
            // Store current state
            this.currentData = data;
            this.currentIndicators = indicators;
            this.currentPatterns = patterns;
            this.currentSRLevels = srLevels;
            
            // Update UI
            this.updateUI(data, indicators, patterns, srLevels);
            
            // Update chart
            this.chart.updateChart(data, indicators, patterns, srLevels);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Failed to analyze. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    updateUI(data, indicators, patterns, srLevels) {
        this.updateMarketInfo(data);
        this.updateTrendInfo(indicators.trend);
        this.updateSRLevels(srLevels);
        this.updatePatterns(patterns);
        this.updateSignal(patterns, indicators.trend);
    }

    updateMarketInfo(data) {
        const lastData = data[data.length - 1];
        const prevData = data[data.length - 2];
        
        const price = lastData.close;
        const change = ((price - prevData.close) / prevData.close) * 100;
        
        document.getElementById('currentPrice').textContent = `$${price.toFixed(2)}`;
        
        const changeEl = document.getElementById('priceChange');
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = change >= 0 ? 'bullish' : 'bearish';
        
        document.getElementById('volume').textContent = this.formatVolume(lastData.volume);
    }

    updateTrendInfo(trend) {
        const trendBadge = document.getElementById('trendBadge');
        trendBadge.textContent = trend.trend.toUpperCase();
        trendBadge.className = `trend-badge ${trend.trend}`;
        
        document.getElementById('trendStrength').textContent = trend.strength;
        document.getElementById('ema20').textContent = `$${trend.ema20.toFixed(2)}`;
        document.getElementById('ema50').textContent = `$${trend.ema50.toFixed(2)}`;
    }

    updateSRLevels(srLevels) {
        // Resistance
        const resistanceDiv = document.getElementById('resistanceLevels');
        if (srLevels.resistance.length > 0) {
            resistanceDiv.innerHTML = srLevels.resistance.map(r => `
                <div class="level-item">
                    <span>$${r.price}</span>
                    <span class="touches">${r.strength} | ${r.touches} touches</span>
                </div>
            `).join('');
        } else {
            resistanceDiv.innerHTML = '<p class="no-data">No resistance levels found</p>';
        }
        
        // Support
        const supportDiv = document.getElementById('supportLevels');
        if (srLevels.support.length > 0) {
            supportDiv.innerHTML = srLevels.support.map(s => `
                <div class="level-item">
                    <span>$${s.price}</span>
                    <span class="touches">${s.strength} | ${s.touches} touches</span>
                </div>
            `).join('');
        } else {
            supportDiv.innerHTML = '<p class="no-data">No support levels found</p>';
        }
    }

    updatePatterns(patterns) {
        const patternsDiv = document.getElementById('patternsList');
        
        if (patterns.length === 0) {
            patternsDiv.innerHTML = '<p class="no-data">No patterns detected</p>';
            return;
        }
        
        // Show recent 10 patterns
        patternsDiv.innerHTML = patterns.slice(0, 10).map(p => `
            <div class="pattern-item ${p.category}">
                <div class="pattern-header">
                    <span class="pattern-type">${p.type}</span>
                    <span class="pattern-date">${new Date(p.date).toLocaleDateString()}</span>
                </div>
                <div>
                    <span class="pattern-signal ${p.category}">${p.signal}</span>
                    <span style="margin-left: 10px; color: #8b8fa3; font-size: 0.9rem;">
                        Strength: ${p.strength}
                    </span>
                </div>
                <div style="margin-top: 5px; color: #8b8fa3;">
                    Price: $${p.price.toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    updateSignal(patterns, trend) {
        const signalCard = document.getElementById('signalCard');
        const signalContent = document.getElementById('signalContent');
        
        // Count signals
        const recentPatterns = patterns.slice(0, 20);
        const bullishCount = recentPatterns.filter(p => p.category === 'bullish').length;
        const bearishCount = recentPatterns.filter(p => p.category === 'bearish').length;
        const neutralCount = recentPatterns.filter(p => p.category === 'neutral').length;
        
        let recommendation, recommendationClass;
        
        if (bullishCount > bearishCount && trend.trend === 'uptrend') {
            recommendation = '🟢 STRONG BUY - Bullish patterns with uptrend confirmation';
            recommendationClass = 'buy';
            signalCard.className = 'card signal-card strong-buy';
        } else if (bearishCount > bullishCount && trend.trend === 'downtrend') {
            recommendation = '🔴 STRONG SELL - Bearish patterns with downtrend confirmation';
            recommendationClass = 'sell';
            signalCard.className = 'card signal-card strong-sell';
        } else if (bullishCount > bearishCount) {
            recommendation = '🟡 WATCH - Bullish signals, wait for trend confirmation';
            recommendationClass = 'neutral';
            signalCard.className = 'card signal-card';
        } else if (bearishCount > bullishCount) {
            recommendation = '🟠 CAUTION - Bearish signals, consider taking profits';
            recommendationClass = 'neutral';
            signalCard.className = 'card signal-card';
        } else {
            recommendation = '⚪ NEUTRAL - Mixed signals, wait for clearer direction';
            recommendationClass = 'neutral';
            signalCard.className = 'card signal-card';
        }
        
        signalContent.innerHTML = `
            <div class="signal-summary">
                <div class="signal-stat">
                    <div class="number bullish">${bullishCount}</div>
                    <div class="label">Bullish Signals</div>
                </div>
                <div class="signal-stat">
                    <div class="number bearish">${bearishCount}</div>
                    <div class="label">Bearish Signals</div>
                </div>
                <div class="signal-stat">
                    <div class="number" style="color: #ffd700;">${neutralCount}</div>
                    <div class="label">Neutral Signals</div>
                </div>
            </div>
            <div class="recommendation ${recommendationClass}">
                ${recommendation}
            </div>
        `;
    }

    toggleAutoRefresh() {
        STATE.autoRefresh = !STATE.autoRefresh;
        const btn = document.getElementById('autoRefreshBtn');
        
        if (STATE.autoRefresh) {
            btn.textContent = '⏱️ Auto Refresh: ON';
            btn.classList.add('active');
            STATE.refreshInterval = setInterval(() => this.analyze(), CONFIG.AUTO_REFRESH_INTERVAL);
        } else {
            btn.textContent = '⏱️ Auto Refresh: OFF';
            btn.classList.remove('active');
            clearInterval(STATE.refreshInterval);
        }
    }

    showLoading(show) {
        const btn = document.getElementById('analyzeBtn');
        if (show) {
            btn.innerHTML = '<span class="loading"></span> Analyzing...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '🔍 Analyze';
            btn.disabled = false;
        }
    }

    showError(message) {
        alert(message);
    }

    formatVolume(volume) {
        if (volume >= 1000000000) {
            return `${(volume / 1000000000).toFixed(2)}B`;
        } else if (volume >= 1000000) {
            return `${(volume / 1000000).toFixed(2)}M`;
        } else if (volume >= 1000) {
            return `${(volume / 1000).toFixed(2)}K`;
        }
        return volume.toString();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PriceActionApp();
});