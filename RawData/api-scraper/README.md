# NSE Stock Data Downloader (API-Based)

Fast and reliable downloader for NSE India stock data using direct API calls. No browser automation required!

## 🚀 Features

- ⚡ **Lightning Fast** - Direct API calls to NSE (10x faster than browser scraping)
- � **Complete Data** - Historical price, volume, and delivery data
- �️ **Auto Organization** - Files saved as `STOCK_YEAR.csv` in organized folders
- ⚙️ **Easy Configuration** - JSON-based settings for stocks and date ranges
- �️ **Reliable** - No browser dependencies or UI changes to break
- 📈 **Scalable** - Download hundreds of stocks effortlessly

## � Data Fields

Each CSV file contains comprehensive trading data:
- **Price Data**: Open, High, Low, Close, Previous Close, Last Traded Price, VWAP
- **Volume Data**: Total Traded Quantity, Total Traded Value, Number of Trades  
- **Delivery Data**: Delivery Quantity, Delivery Percentage
- **Metadata**: Symbol, Series, Timestamps

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test with one stock:**
   ```bash
   npm test
   ```

3. **Download all configured stocks:**
   ```bash
   npm start
   ```

## ⚙️ Configuration

### View Current Settings
```bash
npm run config:list
```

### Manage Stock List
```bash
# Add a stock
node config-manager.js add WIPRO

# Remove a stock  
node config-manager.js remove ITC

# Set year range
node config-manager.js years 2020 2024
```

### Configuration File
Edit `config.json` directly:

```json
{
  "stocks": [
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", 
    "HINDUNILVR", "INFY", "ITC", "SBIN"
  ],
  "years": {
    "start": 2014,
    "end": 2024
  },
  "settings": {
    "maxRetries": 1,
    "retryDelay": 3000,
    "waitBetweenStocks": 2000,
    "waitBetweenYears": 1000
  }
}
```

### Retry Configuration
- **maxRetries**: Number of retry attempts for failed downloads (default: 1)
- **retryDelay**: Wait time in milliseconds before retrying (default: 3000ms)
- **waitBetweenStocks**: Delay between processing different stocks (default: 2000ms)
- **waitBetweenYears**: Delay between years for same stock (default: 1000ms)

## 🎮 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Download all configured stocks/years |
| `npm test` | Test with single stock (HDFCBANK 2024) |
| `npm run config:list` | Show current configuration |
| `node api-scraper.js single RELIANCE 2023` | Download specific stock/year |

## 📁 Output Structure

```
data/
├── RELIANCE/
│   ├── RELIANCE_2014.csv
│   ├── RELIANCE_2015.csv
│   └── ... (through 2024)
├── TCS/
│   ├── TCS_2014.csv
│   └── ...
└── ...
```

## 🔧 Advanced Usage

### Download Specific Stock/Year
```bash
node api-scraper.js single RELIANCE 2023
node api-scraper.js single TCS 2022
```

### Download All Configured Data
```bash
node api-scraper.js all
# or simply
npm start
```

### Configuration Management
```bash
# View help
node config-manager.js

# Examples
node config-manager.js add WIPRO
node config-manager.js remove ITC  
node config-manager.js years 2020 2024
node config-manager.js reset
```

## 📊 Example Output

Sample data from HDFCBANK_2024.csv:
```csv
CH_SYMBOL,CH_SERIES,mTIMESTAMP,CH_PREVIOUS_CLS_PRICE,CH_OPENING_PRICE,CH_TRADE_HIGH_PRICE,CH_TRADE_LOW_PRICE,CH_LAST_TRADED_PRICE,CH_CLOSING_PRICE,VWAP,CH_TOT_TRADED_QTY,CH_TOT_TRADED_VAL,CH_TOTAL_TRADES,CH_TIMESTAMP,COP_DELIV_QTY,COP_DELIV_PERC
HDFCBANK,EQ,01-Jan-2024,1709.25,1706,1709.15,1692,1692.9,1698.1,1701.52,7119843,12114568489.3,258349,2023-12-31T18:30:00.000+00:00,4416670,62.03
```

## 🚀 Performance

- **Speed**: Downloads complete year data in ~2 seconds per stock
- **Reliability**: Direct API access, no browser dependencies
- **Data Quality**: Raw NSE data with all original fields
- **Scalability**: Handle 100+ stocks easily

## 🛠️ Technical Details

### API Endpoint
Uses NSE's official API:
```
https://www.nseindia.com/api/historicalOR/generateSecurityWiseHistoricalData
```

### Session Management
- Automatically handles NSE session cookies
- Proper request headers and compression
- Rate limiting to respect server resources

### Error Handling
- **Automatic Retries**: Failed downloads are automatically retried (default: 1 retry)
- **Configurable Retry Settings**: Customize retry count and delay in config.json
- **Progress Tracking**: Retry attempts are clearly shown in progress counters
- **Detailed Error Reporting**: See exactly what failed and after how many attempts
- **Graceful Handling**: Continues processing other stocks if some fail
- **Retry Statistics**: Summary shows which items needed retries

## ❓ Troubleshooting

### Common Issues

1. **Network Errors**: Check internet connection
2. **No Data**: Verify stock symbol is correct and listed on NSE
3. **Empty Response**: Stock may not have traded during specified period

### Success Indicators
```
✅ Session cookies obtained
🔄 Processing HDFCBANK - 2024 (1/33)
✅ Success: HDFCBANK - 2024 (1/33)
📊 Records: 70
📁 Saved: ./data/HDFCBANK/01-01-2024-TO-31-12-2024-HDFCBANK-ALL-N.csv
```

### Retry Process
```
⚠️  Failed: SOMESTOCK - 2024 (5/33) - Network timeout
🔄 Retrying in 3 seconds... (1/1)
🔄 Processing SOMESTOCK - 2024 (5/33) (Retry 1/1)
✅ Success: SOMESTOCK - 2024 (5/33) (Retry 1/1)
```

### Download Summary
```
🎉 Download Summary
==================
✅ Successful: 32
❌ Failed: 1
📊 Total: 33
🔄 Items that needed retry: 3
```

## 📄 File Naming Convention

Files are automatically named as: `{SYMBOL}_{YEAR}.csv`

Examples:
- `RELIANCE_2024.csv`
- `TCS_2023.csv`  
- `HDFCBANK_2022.csv`

## 🎯 Use Cases

Perfect for:
- 📈 **Financial Analysis** - Historical price and volume analysis
- 🤖 **Algorithmic Trading** - Backtesting strategies
- 📊 **Research** - Academic and professional research
- 💼 **Portfolio Management** - Performance analysis
- 📉 **Technical Analysis** - Chart pattern analysis

## 🔒 Legal & Ethical

- Uses publicly available NSE data
- Respects rate limits and server resources
- No unauthorized access or data modification
- Intended for legitimate research and analysis

## 🆚 Why API over Web Scraping?

| Aspect | API Approach | Web Scraping |
|--------|-------------|--------------|
| **Speed** | ⚡ ~2 sec/stock | 🐌 ~30 sec/stock |
| **Reliability** | ✅ Stable | ❌ Breaks with UI changes |
| **Data Quality** | ✅ Raw JSON data | ⚠️ Parsed HTML |
| **Maintenance** | ✅ Minimal | ❌ High |
| **Resources** | ✅ Light | ❌ Heavy (browser) |

## 📜 License

MIT License - Free for personal and commercial use.

---

**⭐ Star this repo if it helped you download NSE data efficiently!**
