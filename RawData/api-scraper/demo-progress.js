const NSEAPIClient = require('./api-scraper.js');

async function demoProgress() {
    const client = new NSEAPIClient();
    
    // Override config for demo
    const originalConfig = require('./config.json');
    const demoConfig = {
        stocks: ['RELIANCE', 'TCS'],
        years: { start: 2023, end: 2024 }
    };
    
    // Temporarily replace config
    const config = require('./config.json');
    config.stocks = demoConfig.stocks;
    config.years = demoConfig.years;
    
    console.log('🎯 Demo: Progress Counter (2 stocks × 2 years = 4 downloads)');
    console.log('=========================================================');
    
    await client.downloadAllStocks();
    
    console.log('\n✅ Demo completed! You can see the progress counter in action above.');
}

demoProgress().catch(console.error);
