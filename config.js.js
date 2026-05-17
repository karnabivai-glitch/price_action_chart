// ===== CONFIGURATION =====
const CONFIG = {
    // API Configuration
    // Anda bisa daftar gratis di https://www.alphavantage.co/support/#api-key
    ALPHA_VANTAGE_API_KEY: 'demo', // Ganti dengan API key Anda
    
    // Yahoo Finance (no API key needed)
    YAHOO_FINANCE_BASE: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    
    // Default settings
    DEFAULT_SYMBOL: 'AAPL',
    DEFAULT_TIMEFRAME: '1d',
    DEFAULT_PERIOD: '6mo',
    
    // Auto refresh interval (ms) - 5 menit
    AUTO_REFRESH_INTERVAL: 300000,
    
    // Pattern detection settings
    DOJI_THRESHOLD: 0.1,
    MIN_PATTERN_STRENGTH: 'Normal',
    
    // Support/Resistance
    SR_WINDOW: 20,
    MIN_TOUCHES: 2,
    
    // Cache duration (ms) - 1 menit
    CACHE_DURATION: 60000
};

// ===== GLOBAL STATE =====
const STATE = {
    currentSymbol: CONFIG.DEFAULT_SYMBOL,
    currentTimeframe: CONFIG.DEFAULT_TIMEFRAME,
    currentPeriod: CONFIG.DEFAULT_PERIOD,
    priceData: [],
    volumeData: [],
    patterns: [],
    supportResistance: { support: [], resistance: [] },
    autoRefresh: false,
    refreshInterval: null,
    cache: new Map()
};