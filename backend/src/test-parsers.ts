/**
 * Test script to verify parsers work in isolation
 * Run with: npx ts-node src/test-parsers.ts
 */

import { PDFParser } from './services/parsers/pdfParser';
import { ExcelParser } from './services/parsers/excelParser';

async function testParsers() {
  console.log('=== PARSER TEST START ===\n');

  // Test 1: Check imports
  console.log('1. Checking imports...');
  console.log('   PDFParser type:', typeof PDFParser);
  console.log('   ExcelParser type:', typeof ExcelParser);
  console.log('   PDFParser:', PDFParser);
  console.log('   ExcelParser:', ExcelParser);
  console.log('   ✅ Imports OK\n');

  // Test 2: Create instances
  console.log('2. Creating parser instances...');
  try {
    const pdfParser = new PDFParser();
    const excelParser = new ExcelParser();
    console.log('   pdfParser:', pdfParser);
    console.log('   excelParser:', excelParser);
    console.log('   pdfParser.parse type:', typeof pdfParser.parse);
    console.log('   excelParser.parse type:', typeof excelParser.parse);
    console.log('   ✅ Instances created OK\n');
  } catch (error: any) {
    console.error('   ❌ Error creating instances:', error.message);
    console.error('   Stack:', error.stack);
    return;
  }

  // Test 3: Test PDF parser with empty buffer
  console.log('3. Testing PDFParser with empty buffer...');
  try {
    const pdfParser = new PDFParser();
    const emptyBuffer = Buffer.from('');
    const result = await pdfParser.parse(emptyBuffer);
    console.log('   Result:', result);
    console.log('   ✅ PDFParser callable (error expected for empty buffer)\n');
  } catch (error: any) {
    console.log('   ⚠️  Expected error:', error.message);
    console.log('');
  }

  // Test 4: Test Excel parser with empty buffer
  console.log('4. Testing ExcelParser with empty buffer...');
  try {
    const excelParser = new ExcelParser();
    const emptyBuffer = Buffer.from('');
    const result = await excelParser.parse(emptyBuffer);
    console.log('   Result:', result);
    console.log('   ✅ ExcelParser callable (error expected for empty buffer)\n');
  } catch (error: any) {
    console.log('   ⚠️  Expected error:', error.message);
    console.log('');
  }

  // Test 5: Test PDF parser with sample text
  console.log('5. Testing PDFParser with sample text (will fail gracefully)...');
  try {
    const pdfParser = new PDFParser();
    const sampleBuffer = Buffer.from('Sample PDF text that is not a real PDF');
    const result = await pdfParser.parse(sampleBuffer);
    console.log('   Result:', JSON.stringify(result, null, 2));
    console.log('   ✅ PDFParser executed\n');
  } catch (error: any) {
    console.log('   ⚠️  Error (expected):', error.message);
    console.log('');
  }

  console.log('=== PARSER TEST END ===');
  console.log('\n✅ All tests completed. Parsers are properly exported and callable.');
}

testParsers().catch(error => {
  console.error('Fatal error in test:', error);
  process.exit(1);
});
