const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const config = require('./config.json');

class NSEAPIClient {
    constructor() {
        this.baseUrl = 'https://www.nseindia.com';
        this.cookies = '';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Referer': 'https://www.nseindia.com/report-detail/eq_security',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        };
    }

    async initializeSession() {
        console.log('🔑 Initializing session with NSE...');
        
        return new Promise((resolve, reject) => {
            const request = https.get(`${this.baseUrl}/report-detail/eq_security`, { 
                headers: {
                    'User-Agent': this.headers['User-Agent'],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            }, (response) => {
                // Extract cookies from response
                const setCookies = response.headers['set-cookie'];
                if (setCookies) {
                    this.cookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
                    console.log('✅ Session cookies obtained');
                } else {
                    console.log('⚠️  No cookies received');
                }
                
                let data = '';
                let stream = response;
                const encoding = response.headers['content-encoding'];
                
                if (encoding === 'gzip') {
                    stream = response.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = response.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = response.pipe(zlib.createBrotliDecompress());
                }
                
                stream.on('data', (chunk) => {
                    data += chunk;
                });
                
                stream.on('end', () => {
                    resolve();
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(30000, () => {
                request.abort();
                reject(new Error('Session initialization timeout'));
            });
        });
    }

    async fetchData(symbol, year) {
        const fromDate = `01-01-${year}`;
        const toDate = `31-12-${year}`;
        
        const url = `${this.baseUrl}/api/historicalOR/generateSecurityWiseHistoricalData?from=${fromDate}&to=${toDate}&symbol=${symbol}&type=priceVolumeDeliverable&series=EQ&csv=true`;
        
        console.log(`📡 Fetching CSV data for ${symbol} - ${year}`);
        
        // Add cookies to headers
        const requestHeaders = { ...this.headers };
        if (this.cookies) {
            requestHeaders['Cookie'] = this.cookies;
        }
        
        return new Promise((resolve, reject) => {
            const request = https.get(url, { headers: requestHeaders }, (response) => {
                let data = '';
                
                // Handle gzip compression
                let stream = response;
                const encoding = response.headers['content-encoding'];
                
                if (encoding === 'gzip') {
                    stream = response.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = response.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = response.pipe(zlib.createBrotliDecompress());
                }
                
                stream.on('data', (chunk) => {
                    data += chunk;
                });
                
                stream.on('end', () => {
                    try {
                        if (response.statusCode === 200) {
                            // Clean BOM character if present
                            const cleanData = data.replace(/^\uFEFF/, '');
                            resolve(cleanData);
                        } else {
                            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                        }
                    } catch (error) {
                        console.log(`Response preview: ${data.substring(0, 200)}...`);
                        reject(new Error(`Failed to process CSV: ${error.message}`));
                    }
                });
                
                stream.on('error', (error) => {
                    reject(error);
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(30000, () => {
                request.abort();
                reject(new Error('Request timeout'));
            });
        });
    }

    convertToCSV(csvData, symbol, year) {
        if (!csvData || typeof csvData !== 'string') {
            throw new Error('Invalid CSV data received from API');
        }

        // Split CSV into lines and remove empty lines
        const lines = csvData.split('\n').filter(line => line.trim());
        
        if (lines.length <= 1) {
            throw new Error('No data available for the specified period');
        }

        // The data is already in CSV format, but we need to ensure it matches NSE format
        // The API already returns properly formatted CSV with correct headers
        return csvData;
    }

    async saveCSV(csvContent, symbol, year) {
        const stockDir = path.join(__dirname, 'data', symbol);
        await fs.ensureDir(stockDir);
        
        // NSE filename format: 01-01-YYYY-TO-31-12-YYYY-SYMBOL-ALL-N.csv
        const filename = `01-01-${year}-TO-31-12-${year}-${symbol}-ALL-N.csv`;
        const filepath = path.join(stockDir, filename);
        
        await fs.writeFile(filepath, csvContent, 'utf8');
        
        return filepath;
    }

    async downloadStockData(symbol, year, retryCount = 0) {
        const maxRetries = config.settings?.maxRetries || 1; // Allow configurable retries
        const retryDelay = config.settings?.retryDelay || 3000; // Configurable retry delay
        const retryText = retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : '';
        
        try {
            console.log(`\n🔄 Processing ${symbol} - ${year}${retryText}`);
            
            // Fetch CSV data from API
            const csvData = await this.fetchData(symbol, year);
            
            // Validate and save CSV
            const csvContent = this.convertToCSV(csvData, symbol, year);
            
            // Save CSV file
            const filepath = await this.saveCSV(csvContent, symbol, year);
            
            // Get record count (subtract 1 for header)
            const recordCount = csvContent.split('\n').filter(line => line.trim()).length - 1;
            
            console.log(`✅ Success: ${symbol} - ${year}${retryText}`);
            console.log(`📊 Records: ${recordCount}`);
            console.log(`📁 Saved: ${filepath}`);
            
            return {
                success: true,
                symbol,
                year,
                records: recordCount,
                filepath,
                retryCount
            };
            
        } catch (error) {
            if (retryCount < maxRetries) {
                console.error(`⚠️  Failed: ${symbol} - ${year} - ${error.message}`);
                console.log(`🔄 Retrying in ${retryDelay/1000} seconds... (${retryCount + 1}/${maxRetries})`);
                
                // Wait before retry
                await this.wait(retryDelay);
                
                // Retry the download
                return await this.downloadStockData(symbol, year, retryCount + 1);
            } else {
                console.error(`❌ Failed: ${symbol} - ${year} - ${error.message} (Max retries exceeded)`);
                return {
                    success: false,
                    symbol,
                    year,
                    error: error.message,
                    retryCount
                };
            }
        }
    }    async downloadAllStocks() {
        const stocks = config.stocks;
        const startYear = config.years.start;
        const endYear = config.years.end;
        const years = Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);
        const totalDownloads = stocks.length * years.length;
        
        console.log('🚀 Starting NSE Data Download via CSV API');
        console.log('=========================================');
        console.log(`📈 Stocks: ${stocks.join(', ')}`);
        console.log(`📅 Years: ${startYear} - ${endYear}`);
        console.log(`📊 Total downloads: ${totalDownloads}`);
        console.log('');
        
        // Initialize session first
        await this.initializeSession();
        
        const results = [];
        let completed = 0;
        let failed = 0;
        let currentDownload = 0;
        
        for (let stockIndex = 0; stockIndex < stocks.length; stockIndex++) {
            const stock = stocks[stockIndex];
            console.log(`\n📈 Processing stock: ${stock} (${stockIndex + 1}/${stocks.length})`);
            console.log('─'.repeat(50));
            
            for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
                const year = years[yearIndex];
                currentDownload++;
                
                // Update the processing message to include progress
                console.log(`\n🔄 Processing ${stock} - ${year} (${currentDownload}/${totalDownloads})`);
                
                const result = await this.downloadStockDataWithProgress(stock, year, currentDownload, totalDownloads);
                results.push(result);
                
                if (result.success) {
                    completed++;
                } else {
                    failed++;
                }
                
                // Add delay between requests to be respectful to the server
                await this.wait(1000);
            }
            
            // Longer delay between stocks
            if (stockIndex < stocks.length - 1) {
                console.log('⏳ Waiting before next stock...');
                await this.wait(2000);
            }
        }
        
        // Summary
        console.log('\n🎉 Download Summary');
        console.log('==================');
        console.log(`✅ Successful: ${completed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Total: ${completed + failed}`);
        
        // Show retry statistics
        const retriedItems = results.filter(r => r.retryCount > 0);
        if (retriedItems.length > 0) {
            console.log(`🔄 Items that needed retry: ${retriedItems.length}`);
        }
        
        if (failed > 0) {
            console.log('\n❌ Failed Downloads (after retries):');
            results.filter(r => !r.success).forEach(r => {
                const retryInfo = r.retryCount > 0 ? ` (tried ${r.retryCount + 1} times)` : '';
                console.log(`   ${r.symbol} - ${r.year}: ${r.error}${retryInfo}`);
            });
        }
        
        console.log(`\n📁 Data saved in: ${path.join(__dirname, 'data')}`);
        
        return results;
    }

    async downloadStockDataWithProgress(symbol, year, current, total, retryCount = 0) {
        const maxRetries = config.settings?.maxRetries || 1; // Allow configurable retries
        const retryDelay = config.settings?.retryDelay || 3000; // Configurable retry delay
        const retryText = retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : '';
        
        try {
            // Fetch CSV data from API
            const csvData = await this.fetchData(symbol, year);
            
            // Validate and save CSV
            const csvContent = this.convertToCSV(csvData, symbol, year);
            
            // Save CSV file
            const filepath = await this.saveCSV(csvContent, symbol, year);
            
            // Get record count (subtract 1 for header)
            const recordCount = csvContent.split('\n').filter(line => line.trim()).length - 1;
            
            console.log(`✅ Success: ${symbol} - ${year} (${current}/${total})${retryText}`);
            console.log(`📊 Records: ${recordCount}`);
            console.log(`📁 Saved: ${filepath}`);
            
            return {
                success: true,
                symbol,
                year,
                records: recordCount,
                filepath,
                retryCount
            };
            
        } catch (error) {
            if (retryCount < maxRetries) {
                console.error(`⚠️  Failed: ${symbol} - ${year} (${current}/${total}) - ${error.message}`);
                console.log(`🔄 Retrying in ${retryDelay/1000} seconds... (${retryCount + 1}/${maxRetries})`);
                
                // Wait before retry
                await this.wait(retryDelay);
                
                // Retry the download
                return await this.downloadStockDataWithProgress(symbol, year, current, total, retryCount + 1);
            } else {
                console.error(`❌ Failed: ${symbol} - ${year} (${current}/${total}) - ${error.message} (Max retries exceeded)`);
                return {
                    success: false,
                    symbol,
                    year,
                    error: error.message,
                    retryCount
                };
            }
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testSingleDownload(symbol = 'HDFCBANK', year = 2024) {
        console.log('🧪 Testing Single Download');
        console.log('=========================');
        
        // Initialize session first
        await this.initializeSession();
        
        const result = await this.downloadStockData(symbol, year);
        
        if (result.success) {
            console.log('\n✅ Test successful! The CSV API scraper is working.');
            console.log(`📁 Check the file: ${result.filepath}`);
            console.log('\nTo download all stocks, run: npm run api:all');
        } else {
            console.log('\n❌ Test failed. Please check the error above.');
        }
        
        return result;
    }
}

async function main() {
    const client = new NSEAPIClient();
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'test') {
        // Test mode - download one stock/year
        await client.testSingleDownload();
    } else if (args[0] === 'all') {
        // Download all configured stocks and years
        await client.downloadAllStocks();
    } else if (args[0] === 'single' && args.length >= 3) {
        // Download specific stock and year
        const symbol = args[1].toUpperCase();
        const year = parseInt(args[2]);
        await client.downloadStockData(symbol, year);
    } else {
        console.log(`
NSE API Data Downloader

Usage:
  node api-scraper.js                    # Test with HDFCBANK 2024
  node api-scraper.js test               # Same as above
  node api-scraper.js all                # Download all configured stocks/years
  node api-scraper.js single SYMBOL YEAR # Download specific stock/year

Examples:
  node api-scraper.js single RELIANCE 2023
  node api-scraper.js all
        `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NSEAPIClient;
