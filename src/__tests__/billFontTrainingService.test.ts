import { BillFontTrainingService } from '../services/billFontTrainingService';

describe('BillFontTrainingService', () => {
  let service: BillFontTrainingService;

  beforeEach(() => {
    service = BillFontTrainingService.getInstance();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('Character Mappings', () => {
    test('should have correct character mappings for numbers', () => {
      const trainingData = service.getBillFontTrainingData();
      const mappings = trainingData.characterMappings;

      // Test number mappings
      expect(mappings.get('0')).toContain('O');
      expect(mappings.get('0')).toContain('o');
      expect(mappings.get('1')).toContain('l');
      expect(mappings.get('1')).toContain('I');
      expect(mappings.get('5')).toContain('S');
      expect(mappings.get('8')).toContain('B');
    });

    test('should have correct character mappings for letters', () => {
      const trainingData = service.getBillFontTrainingData();
      const mappings = trainingData.characterMappings;

      // Test letter mappings
      expect(mappings.get('A')).toContain('4');
      expect(mappings.get('A')).toContain('@');
      expect(mappings.get('B')).toContain('8');
      expect(mappings.get('O')).toContain('0');
    });
  });

  describe('Bill Patterns', () => {
    test('should have Indonesian product patterns', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.productPatterns;

      // Test Indonesian food patterns
      const esTehPattern = patterns.find(p => p.source.includes('ES\\s+[A-Z\\s]+'));
      expect(esTehPattern).toBeDefined();

      const mieAyamPattern = patterns.find(p => p.source.includes('MIE\\s+[A-Z\\s]+'));
      expect(mieAyamPattern).toBeDefined();
    });

    test('should have price patterns for Indonesian currency', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.pricePatterns;

      // Test Rupiah patterns
      const rpPattern = patterns.find(p => p.source.includes('Rp'));
      expect(rpPattern).toBeDefined();

      // Test quantity patterns
      const qtyPattern = patterns.find(p => p.source.includes('\\d+\\s*x\\s*@'));
      expect(qtyPattern).toBeDefined();
    });
  });

  describe('Context Corrections', () => {
    test('should have common bill context corrections', () => {
      const trainingData = service.getBillFontTrainingData();
      const corrections = trainingData.contextCorrections;

      // Test common corrections
      expect(corrections.get('T0TAL')).toBe('TOTAL');
      expect(corrections.get('SUBT0TAL')).toBe('SUBTOTAL');
      expect(corrections.get('PAJAK:')).toBe('PAJAK:');
      expect(corrections.get('CASH:')).toBe('CASH:');
    });

    test('should have product name corrections', () => {
      const trainingData = service.getBillFontTrainingData();
      const corrections = trainingData.contextCorrections;

      // Test product corrections
      expect(corrections.get('ES T3H')).toBe('ES TEH');
      expect(corrections.get('K0PI HITAM')).toBe('KOPI HITAM');
      expect(corrections.get('N4SI GORENG')).toBe('NASI GORENG');
    });
  });

  describe('Pattern Matching', () => {
    test('should match Indonesian product patterns', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.productPatterns;

      // Test standard product pattern
      const standardPattern = patterns[0];
      const testLine = 'ES TEH: 2 x @ 5000 = 10000';
      expect(standardPattern.test(testLine)).toBe(true);

      // Test Indonesian food pattern
      const foodPattern = patterns[4]; // ES pattern
      const testFood = 'ES TEH MANIS';
      expect(foodPattern.test(testFood)).toBe(true);
    });

    test('should match price patterns', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.pricePatterns;

      // Test Rupiah pattern
      const rpPattern = patterns[0];
      const testPrice = 'Rp 15000';
      expect(rpPattern.test(testPrice)).toBe(true);

      // Test quantity pattern
      const qtyPattern = patterns[4];
      const testQty = '2 x @ 5000';
      expect(qtyPattern.test(testQty)).toBe(true);
    });
  });

  describe('Text Processing', () => {
    test('should process bill text correctly', () => {
      const testText = 'T0TAL: Rp 25.000\nES T3H: 2 x @ 5.000 = 10.000\nK0PI: 1 x @ 8.000 = 8.000';
      
      // This would be tested in the actual service method
      // For now, we test the pattern matching
      const trainingData = service.getBillFontTrainingData();
      const corrections = trainingData.contextCorrections;
      
      // Test that corrections exist for the test text
      expect(corrections.has('T0TAL')).toBe(true);
      expect(corrections.has('ES T3H')).toBe(true);
      expect(corrections.has('K0PI')).toBe(true);
    });

    test('should handle special regex characters correctly', () => {
      const trainingData = service.getBillFontTrainingData();
      const mappings = trainingData.characterMappings;
      
      // Test that special characters are properly handled
      expect(mappings.get('x')).toContain('*'); // This should not cause regex error
      expect(mappings.get('x')).toContain('×');
      
      // Test that the service can be initialized without regex errors
      expect(() => service.getBillFontTrainingData()).not.toThrow();
    });

    test('should recognize Indonesian food items from real bills', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.productPatterns;

      // Test specific items from the provided bill
      const testItems = [
        'ES TEKLEK: 1 x @ 6,364 = 6,364',
        'MIE GACOAN: 1 x @ 10,000 = 10,000',
        'SIOMAY AYAM: 1 x @ 9,091 = 9,091',
        'TEA: 2 x @ 4,546 = 9,092',
        'UDANG KEJU: 1 x @ 9,091 = 9,091',
        'UDANG RAMBUTAN: 1 x @ 9,091 = 9,091'
      ];

      testItems.forEach(item => {
        const matched = patterns.some(pattern => pattern.test(item));
        expect(matched).toBe(true);
      });
    });

    test('should recognize Indonesian tax patterns', () => {
      const trainingData = service.getBillFontTrainingData();
      const patterns = trainingData.commonBillPatterns;

      // Test tax patterns
      const taxPatterns = [
        'Pajak 10%: 5,273',
        'Sub Total: 52,729'
      ];

      taxPatterns.forEach(pattern => {
        const matched = patterns.some(p => p.test(pattern));
        expect(matched).toBe(true);
      });
    });

    test('should handle multiline bill format', () => {
      const testBillText = `
ES TEKLEK
1 x @ 6,364    6,364

MIE GACOAN
1 x @ 10,000   10,000

SIOMAY AYAM
1 x @ 9,091    9,091

TEA
2 x @ 4,546    9,092

UDANG KEJU
1 x @ 9,091    9,091

UDANG RAMBUTAN
1 x @ 9,091    9,091

Sub Total: 52,729
Pajak 10%: 5,273
`;

      // Test that the service can extract products from multiline format
      const lines = testBillText.split('\n');
      
      // Test product name detection
      expect(service['isProductNameLine']('ES TEKLEK')).toBe(true);
      expect(service['isProductNameLine']('MIE GACOAN')).toBe(true);
      expect(service['isProductNameLine']('SIOMAY AYAM')).toBe(true);
      
      // Test price line detection
      expect(service['isPriceLine']('1 x @ 6,364    6,364')).toBe(true);
      expect(service['isPriceLine']('2 x @ 4,546    9,092')).toBe(true);
      
      // Test multiline product parsing
      const product = service['parseMultilineProduct']('ES TEKLEK', '1 x @ 6,364    6,364');
      expect(product).toBeDefined();
      expect(product?.name).toBe('ES TEKLEK');
      expect(product?.quantity).toBe(1);
      expect(product?.price).toBe(6364);
    });

    test('should handle complete bill format with header and footer', () => {
      const testBillText = `
Tanggal: 09-09-24
Jam: 17:46:49
Nama Tamu: 71k 48
Kasir: kasir aljufri

ES TEKLEK: 1 x @ 6,364 = 6,364
MIE GACOAN: 1 x @ 10,000 = 10,000
SIOMAY AYAM: 1 x @ 9,091 = 9,091
TEA: 2 x @ 4,546 = 9,092
UDANG KEJU: 1 x @ 9,091 = 9,091
UDANG RAMBUTAN: 1 x @ 9,091 = 9,091

Sub Total: 52,729
Pajak 10%: 5,273
Total Bill: 58,002
Pembulatan: -2
Grand Total: 58,000

Cash: 60,000
Kembali: 2,000

Terima Kasih Atas Kunjungan Anda. Silahkan Datang Kembali.
Kritik dan Keluhan, Hubungi :
WA: 0896-3934-5020.
Survey Kepuasan Pelanggan, Scan QR-Code di bawah:
`;

      // Test header/footer filtering
      expect(service['isHeaderOrFooterLine']('Tanggal: 09-09-24')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Jam: 17:46:49')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Nama Tamu: 71k 48')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Kasir: kasir aljufri')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Sub Total: 52,729')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Pajak 10%: 5,273')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Total Bill: 58,002')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Pembulatan: -2')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Grand Total: 58,000')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Cash: 60,000')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Kembali: 2,000')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Terima Kasih Atas Kunjungan Anda. Silahkan Datang Kembali.')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Kritik dan Keluhan, Hubungi :')).toBe(true);
      expect(service['isHeaderOrFooterLine']('WA: 0896-3934-5020.')).toBe(true);
      expect(service['isHeaderOrFooterLine']('Survey Kepuasan Pelanggan, Scan QR-Code di bawah:')).toBe(true);
      
      // Test that product lines are not filtered
      expect(service['isHeaderOrFooterLine']('ES TEKLEK: 1 x @ 6,364 = 6,364')).toBe(false);
      expect(service['isHeaderOrFooterLine']('MIE GACOAN: 1 x @ 10,000 = 10,000')).toBe(false);
      expect(service['isHeaderOrFooterLine']('SIOMAY AYAM: 1 x @ 9,091 = 9,091')).toBe(false);
    });

    test('should handle severely corrupted OCR text', () => {
      const corruptedText = `
R ES TENLEK .- T x @ R,364 R,364 @ MIE GACOAN T x @ 10,000 10,000 SEN STOMAY AYAM or R 1x @ 9,001 9,091 mn TEA = T = cel 2 x @ @,546 9,092 si cowl DANG KEJU da ETS @ 1x @ 9,09 9,091 Fe @ ANG RAMBUTAN ar Ts 1x @9,091 9,091 = _ Sub Total : Ex 729 = di Pajak 10 : 2,273 eV ho secomara=e aba Se Total Bill : 58,002 9= . Pembulatan : -2 = Grand Total : 58,000 2 =
`;

      // Test specific OCR error corrections
      const correctedText = service['applySpecificOCRErrorCorrections'](corruptedText);
      
      // Test product name corrections
      expect(correctedText).toContain('ES TEKLEK');
      expect(correctedText).toContain('MIE GACOAN');
      expect(correctedText).toContain('SIOMAY AYAM');
      expect(correctedText).toContain('UDANG KEJU');
      expect(correctedText).toContain('UDANG RAMBUTAN');
      
      // Test quantity and price corrections
      expect(correctedText).toContain('1 x @');
      expect(correctedText).toContain('6,364');
      expect(correctedText).toContain('9,091');
      expect(correctedText).toContain('4,546');
    });

    test('should use fuzzy matching for corrupted product names', () => {
      // Test fuzzy matching for corrupted product names
      expect(service['isFuzzyMatch']('R ES TENLEK', 'ES TEKLEK')).toBe(true);
      expect(service['isFuzzyMatch']('SEN STOMAY AYAM', 'SIOMAY AYAM')).toBe(true);
      expect(service['isFuzzyMatch']('DANG KEJU', 'UDANG KEJU')).toBe(true);
      expect(service['isFuzzyMatch']('ANG RAMBUTAN', 'UDANG RAMBUTAN')).toBe(true);
      
      // Test string similarity calculation
      expect(service['calculateStringSimilarity']('tenlek', 'teklek')).toBeGreaterThan(0.6);
      expect(service['calculateStringSimilarity']('stomay', 'siomay')).toBeGreaterThan(0.6);
      expect(service['calculateStringSimilarity']('dang', 'udang')).toBeGreaterThan(0.6);
    });

    test('should extract quantity and price from corrupted lines', () => {
      // Test quantity and price extraction from corrupted lines
      const qtyPrice1 = service['extractQuantityAndPriceFromCorruptedLine']('T x @ R,364 R,364');
      expect(qtyPrice1).toBeDefined();
      expect(qtyPrice1?.quantity).toBe(1);
      expect(qtyPrice1?.price).toBe(6364);
      
      const qtyPrice2 = service['extractQuantityAndPriceFromCorruptedLine']('1x @ 9,091 9,091');
      expect(qtyPrice2).toBeDefined();
      expect(qtyPrice2?.quantity).toBe(1);
      expect(qtyPrice2?.price).toBe(9091);
      
      const qtyPrice3 = service['extractQuantityAndPriceFromCorruptedLine']('2 x @ @,546 9,092');
      expect(qtyPrice3).toBeDefined();
      expect(qtyPrice3?.quantity).toBe(2);
      expect(qtyPrice3?.price).toBe(9092);
    });

    test('should handle Alfamart OCR output', () => {
      const alfamartText = `
ALFAMART CILANDAK KKU Q SX PT:SUNBER ALFARIA TRIJAYA, BK 2 ALFA TOWER LT:12, ALAM SUTERA, TANGERANG NPWP + 01..336..238.,9=054:000 Bon 1H1G111=1B097K5 Ka r + SADI RI SNGHN 755 T B00 220 Total Item Fw ui Kerbal ian 24,800 PN (2,29) Tol. 18=00=02 G84 Y:2021g tidy T SHS hh: 081110640868
`;

      // Test specific Alfamart corrections
      const correctedText = service['applySpecificOCRErrorCorrections'](alfamartText);
      
      // Test character corrections
      expect(correctedText).toContain('KKO 5');
      expect(correctedText).toContain('TBK');
      expect(correctedText).toContain('SUMBER');
      expect(correctedText).toContain('LT.12');
      expect(correctedText).toContain('01.336.238.9-054.000');
      expect(correctedText).toContain('1M1G-111-18037X5X');
      expect(correctedText).toContain('Kasir : SANDI RI');
      expect(correctedText).toContain('SUNLG MINT 755');
      expect(correctedText).toContain('25,200');
      expect(correctedText).toContain('Tunai');
      expect(correctedText).toContain('Kembalian');
      expect(correctedText).toContain('PPN ( 2,291)');
      expect(correctedText).toContain('Tgl. 18-03-2022');
      expect(correctedText).toContain('06:28:44');
      expect(correctedText).toContain('V.2022.1.0');
    });

    test('should extract Alfamart products', () => {
      // Test Alfamart product extraction
      const alfamartProduct = service['extractAlfamartProduct']('SUNLG MINT 755 1 25,200 25,200');
      expect(alfamartProduct).toBeDefined();
      expect(alfamartProduct?.name).toBe('SUNLG MINT 755');
      expect(alfamartProduct?.quantity).toBe(1);
      expect(alfamartProduct?.price).toBe(25200);
      expect(alfamartProduct?.confidence).toBeGreaterThan(0.8);
    });

    test('should clean Alfamart product names', () => {
      // Test product name cleaning
      expect(service['cleanAlfamartProductName']('SNGHN 755')).toBe('SUNLG 755');
      expect(service['cleanAlfamartProductName']('ALFAMART SNGHN 755')).toBe('SUNLG 755');
      expect(service['cleanAlfamartProductName']('CILANDAK SNGHN 755')).toBe('SUNLG 755');
    });

    test('should validate Alfamart product names', () => {
      // Test product name validation
      expect(service['isValidAlfamartProductName']('SUNLG MINT 755')).toBe(true);
      expect(service['isValidAlfamartProductName']('COCA COLA')).toBe(true);
      expect(service['isValidAlfamartProductName']('AQUA VIT')).toBe(true);
      expect(service['isValidAlfamartProductName']('ALFAMART')).toBe(false);
      expect(service['isValidAlfamartProductName']('CILANDAK')).toBe(false);
    });

    test('should calculate Alfamart confidence', () => {
      // Test confidence calculation
      const confidence = service['calculateAlfamartConfidence']('SUNLG MINT 755 1 25,200', 'SUNLG MINT 755', 1, 25200);
      expect(confidence).toBeGreaterThan(0.8);
      expect(confidence).toBeLessThanOrEqual(1.0);
    });

    test('should validate Alfamart structure', () => {
      // Test structure validation
      expect(service['hasValidAlfamartStructure']('SUNLG MINT 755 1 25,200 25,200')).toBe(true);
      expect(service['hasValidAlfamartStructure']('SUNLG MINT 755 1 25,200')).toBe(true);
      expect(service['hasValidAlfamartStructure']('SUNLG MINT 755 25,200')).toBe(true);
      expect(service['hasValidAlfamartStructure']('ALFAMART CILANDAK')).toBe(false);
    });

    test('should validate Alfamart context', () => {
      // Test context validation
      expect(service['hasValidAlfamartContext']('ALFAMART CILANDAK KKO 5')).toBe(true);
      expect(service['hasValidAlfamartContext']('PT.SUMBER ALFARIA TRIJAYA, TBK')).toBe(true);
      expect(service['hasValidAlfamartContext']('Kasir : SANDI RI')).toBe(true);
      expect(service['hasValidAlfamartContext']('Total Item 1')).toBe(true);
      expect(service['hasValidAlfamartContext']('SUNLG MINT 755')).toBe(false);
    });

    test('should handle specific Alfamart format with T character', () => {
      // Test the specific format: SUNLG 755 T 25,200 25,200
      const alfamartProduct = service['extractAlfamartProduct']('SUNLG 755 T 25,200 25,200');
      expect(alfamartProduct).toBeDefined();
      expect(alfamartProduct?.name).toBe('SUNLG 755');
      expect(alfamartProduct?.quantity).toBe(1);
      expect(alfamartProduct?.price).toBe(25200);
      expect(alfamartProduct?.confidence).toBeGreaterThan(0.8);
    });

    test('should apply Alfamart character corrections', () => {
      // Test character corrections
      const corrected = service['applyAlfamartCharacterCorrections']('SUNLG 755 T 25,200 25,200');
      expect(corrected).toBe('SUNLG 755 1 25,200 25,200');
    });

    test('should extract product from full Alfamart text', () => {
      const fullText = `
ALFAMART CILANDAK KKU Q SX PT:SUNBER ALFARIA TRIJAYA, BK 2 ALFA TOWER LT:12, ALAM SUTERA, TANGERANG NPWP + 01..336..238.,9=054:000 Bon 1H1G111=1B097K5 Ka r + SADI RI SUNLG 755 T 25,200 25,200 Total Item Fw ui Kerbal ian 24,800 PPN (2,291) Tol. 18=00=02 G84 Y:2021g tidy T SHS hh: 081110640868
`;

      // Split into lines and test product extraction
      const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
      const products = service['extractSingleLineProducts'](lines);
      
      expect(products.length).toBeGreaterThan(0);
      const product = products[0];
      expect(product.name).toBe('SUNLG 755');
      expect(product.quantity).toBe(1);
      expect(product.price).toBe(25200);
    });

    test('should handle complex OCR format with multiple products', () => {
      const complexLine = 'ES TEKLEK T x46, 364 R,364 MIE GACOAN T x @ 10,000 10,000 SIOMAY AYAM 1x @ 9,000 9,09111 TEA - 2 x @ @,546 9,09112 = UUUUUDANG KEJU 2 1x @ 9,09111 9,09111 e UDUDUDUDUDANG RAMBUTAN : T xe 9,09111';
      
      const products = service['extractComplexOCRProducts'](complexLine);
      
      expect(products.length).toBeGreaterThan(0);
      
      // Check first product
      const firstProduct = products[0];
      expect(firstProduct.name).toBe('ES TEKLEK');
      expect(firstProduct.quantity).toBe(1);
      expect(firstProduct.price).toBeGreaterThan(0);
    });

    test('should split complex OCR line into segments', () => {
      const complexLine = 'ES TEKLEK T x46, 364 R,364 MIE GACOAN T x @ 10,000 10,000';
      
      const segments = service['splitComplexOCRLine'](complexLine);
      
      expect(segments.length).toBeGreaterThan(0);
      expect(segments.some(s => s.includes('ES TEKLEK'))).toBe(true);
      expect(segments.some(s => s.includes('MIE GACOAN'))).toBe(true);
    });

    test('should check product indicators in segments', () => {
      expect(service['containsProductIndicators']('ES TEKLEK')).toBe(true);
      expect(service['containsProductIndicators']('MIE GACOAN')).toBe(true);
      expect(service['containsProductIndicators']('SIOMAY AYAM')).toBe(true);
      expect(service['containsProductIndicators']('TEA')).toBe(true);
      expect(service['containsProductIndicators']('UDANG KEJU')).toBe(true);
      expect(service['containsProductIndicators']('UDANG RAMBUTAN')).toBe(true);
      expect(service['containsProductIndicators']('ALFAMART CILANDAK')).toBe(false);
    });

    test('should extract product from segment', () => {
      const segment = 'ES TEKLEK T x 6,364 6,364';
      
      const product = service['extractProductFromSegment'](segment);
      
      expect(product).toBeDefined();
      expect(product?.name).toBe('ES TEKLEK');
      expect(product?.quantity).toBe(1);
      expect(product?.price).toBe(6364);
    });

    test('should extract enhanced price from line', () => {
      const line = 'ES TEKLEK T x 6,364 6,364 MIE GACOAN T x @ 10,000 10,000';
      
      const price = service['extractPriceFromOriginalLine'](line, 'ES TEKLEK');
      
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThanOrEqual(100000);
    });

    test('should extract enhanced quantity from line', () => {
      const line = 'ES TEKLEK T x @ 6,364 6,364';
      
      const quantity = service['extractQuantityFromOriginalLine'](line, 'ES TEKLEK');
      
      expect(quantity).toBe(1);
    });
  });

  describe('Service Initialization', () => {
    test('should be singleton', () => {
      const service1 = BillFontTrainingService.getInstance();
      const service2 = BillFontTrainingService.getInstance();
      expect(service1).toBe(service2);
    });

    test('should initialize training data', () => {
      const trainingData = service.getBillFontTrainingData();
      expect(trainingData).toBeDefined();
      expect(trainingData.characterMappings.size).toBeGreaterThan(0);
      expect(trainingData.productPatterns.length).toBeGreaterThan(0);
      expect(trainingData.pricePatterns.length).toBeGreaterThan(0);
      expect(trainingData.contextCorrections.size).toBeGreaterThan(0);
    });
  });
});
