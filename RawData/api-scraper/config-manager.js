const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, 'config.json');
    }

    async loadConfig() {
        try {
            const config = await fs.readJson(this.configPath);
            return config;
        } catch (error) {
            console.error('Error loading config:', error.message);
            return null;
        }
    }

    async saveConfig(config) {
        try {
            await fs.writeJson(this.configPath, config, { spaces: 2 });
            console.log('✓ Configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving config:', error.message);
            return false;
        }
    }

    async addStock(symbol) {
        const config = await this.loadConfig();
        if (config && !config.stocks.includes(symbol.toUpperCase())) {
            config.stocks.push(symbol.toUpperCase());
            await this.saveConfig(config);
            console.log(`✓ Added stock: ${symbol.toUpperCase()}`);
        } else {
            console.log(`Stock ${symbol.toUpperCase()} already exists or config error`);
        }
    }

    async removeStock(symbol) {
        const config = await this.loadConfig();
        if (config) {
            const index = config.stocks.indexOf(symbol.toUpperCase());
            if (index > -1) {
                config.stocks.splice(index, 1);
                await this.saveConfig(config);
                console.log(`✓ Removed stock: ${symbol.toUpperCase()}`);
            } else {
                console.log(`Stock ${symbol.toUpperCase()} not found`);
            }
        }
    }

    async setYearRange(startYear, endYear) {
        const config = await this.loadConfig();
        if (config) {
            config.years.start = parseInt(startYear);
            config.years.end = parseInt(endYear);
            await this.saveConfig(config);
            console.log(`✓ Year range set to: ${startYear} - ${endYear}`);
        }
    }

    async listStocks() {
        const config = await this.loadConfig();
        if (config) {
            console.log('\nCurrent stock list:');
            config.stocks.forEach((stock, index) => {
                console.log(`${index + 1}. ${stock}`);
            });
            console.log(`\nYear range: ${config.years.start} - ${config.years.end}`);
            console.log(`Total stocks: ${config.stocks.length}`);
            console.log(`Total years: ${config.years.end - config.years.start + 1}`);
            console.log(`Total files to download: ${config.stocks.length * (config.years.end - config.years.start + 1)}`);
        }
    }

    async resetToDefaults() {
        const defaultConfig = {
            "stocks": [
                "RELIANCE",
                "TCS",
                "HDFCBANK",
                "ICICIBANK",
                "HINDUNILVR",
                "INFY",
                "ITC",
                "SBIN",
                "BHARTIARTL",
                "KOTAKBANK"
            ],
            "years": {
                "start": 2014,
                "end": 2024
            },
            "settings": {
                "headless": false,
                "downloadTimeout": 5000,
                "pageTimeout": 10000,
                "waitBetweenStocks": 2000,
                "waitBetweenYears": 1000
            }
        };
        
        await this.saveConfig(defaultConfig);
        console.log('✓ Configuration reset to defaults');
    }
}

// Command line interface
async function main() {
    const configManager = new ConfigManager();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
NSE Scraper Configuration Manager

Usage:
  node config-manager.js list                    - List current stocks and settings
  node config-manager.js add <SYMBOL>            - Add a stock symbol
  node config-manager.js remove <SYMBOL>         - Remove a stock symbol  
  node config-manager.js years <START> <END>     - Set year range
  node config-manager.js reset                   - Reset to default configuration

Examples:
  node config-manager.js add WIPRO
  node config-manager.js remove ITC
  node config-manager.js years 2020 2024
        `);
        return;
    }

    const command = args[0].toLowerCase();

    switch (command) {
        case 'list':
            await configManager.listStocks();
            break;
        
        case 'add':
            if (args[1]) {
                await configManager.addStock(args[1]);
            } else {
                console.log('Error: Please provide a stock symbol to add');
            }
            break;
        
        case 'remove':
            if (args[1]) {
                await configManager.removeStock(args[1]);
            } else {
                console.log('Error: Please provide a stock symbol to remove');
            }
            break;
        
        case 'years':
            if (args[1] && args[2]) {
                await configManager.setYearRange(args[1], args[2]);
            } else {
                console.log('Error: Please provide start and end years');
            }
            break;
        
        case 'reset':
            await configManager.resetToDefaults();
            break;
        
        default:
            console.log('Error: Unknown command. Use without arguments to see usage.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ConfigManager;
