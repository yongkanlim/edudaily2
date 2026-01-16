import fs from 'fs';
import csvParser from 'csv-parser';

// Step 1: Read items.csv
const items = {};
fs.createReadStream('../data/lookup_item.csv')   // ../ moves up from scripts to edudaily
  .pipe(csvParser())
  .on('data', (row) => {
    items[row.item_code] = {
      name: row.item,
      unit: row.unit,
      group: row.item_group,
      category: row.item_category,
    };
  })
  .on('end', () => {
    console.log('Items loaded');
  });

// Step 2: Read prices.csv
const prices = {};
fs.createReadStream('../data/pricecatcher_2026-01.csv')
  .pipe(csvParser())
  .on('data', (row) => {
    const code = row.item_code;
    if (!prices[code]) prices[code] = [];
    prices[code].push(parseFloat(row.price));
  })
  .on('end', () => {
    // Step 3: Calculate average price per item_code
    const avgPrices = {};
    for (const code in prices) {
      const sum = prices[code].reduce((a,b)=>a+b,0);
      avgPrices[code] = sum / prices[code].length;
    }
    // Step 4: Combine with items metadata
    const lookup = {};
    for (const code in items) {
      lookup[items[code].name] = {
        unit: items[code].unit,
        avgPrice: avgPrices[code] || 0
      };
    }

    // Save to JSON for frontend
    fs.writeFileSync('../src/data/ingredient_prices.json', JSON.stringify(lookup, null, 2));
    console.log('Ingredient price lookup saved!');
  });
