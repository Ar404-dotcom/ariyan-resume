// Huffman Encoding Service
const HuffmanService = (function() {
    'use strict';

    // Node class for Huffman tree
    class HuffmanNode {
        constructor(char, freq) {
            this.char = char;
            this.freq = freq;
            this.left = null;
            this.right = null;
        }
    }

    // Build frequency map
    function buildFrequencyMap(text) {
        const freqMap = new Map();
        for (let char of text) {
            freqMap.set(char, (freqMap.get(char) || 0) + 1);
        }
        return freqMap;
    }

    // Build Huffman tree
    function buildHuffmanTree(freqMap) {
        // Create priority queue (min heap) of nodes
        const nodes = Array.from(freqMap.entries()).map(([char, freq]) => new HuffmanNode(char, freq));
        
        // Sort by frequency (ascending)
        nodes.sort((a, b) => a.freq - b.freq);
        
        while (nodes.length > 1) {
            // Take two nodes with lowest frequency
            const left = nodes.shift();
            const right = nodes.shift();
            
            // Create parent node
            const parent = new HuffmanNode(null, left.freq + right.freq);
            parent.left = left;
            parent.right = right;
            
            // Insert parent back into sorted position
            let inserted = false;
            for (let i = 0; i < nodes.length; i++) {
                if (parent.freq <= nodes[i].freq) {
                    nodes.splice(i, 0, parent);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                nodes.push(parent);
            }
        }
        
        return nodes[0]; // Root of tree
    }

    // Generate Huffman codes
    function generateCodes(root, code = '', codeMap = new Map()) {
        if (!root) return codeMap;
        
        // Leaf node
        if (root.char !== null) {
            codeMap.set(root.char, code || '0'); // Handle single character case
            return codeMap;
        }
        
        // Traverse left and right
        generateCodes(root.left, code + '0', codeMap);
        generateCodes(root.right, code + '1', codeMap);
        
        return codeMap;
    }

    // Encode text to Huffman code
    function encode(text) {
        if (!text || text.length === 0) {
            return { encoded: '', codeMap: {}, tree: null, error: 'Empty text' };
        }
        
        if (text.length === 1) {
            // Special case: single character
            const codeMap = new Map([[text[0], '0']]);
            return {
                encoded: '0',
                codeMap: Object.fromEntries(codeMap),
                originalLength: text.length
            };
        }
        
        try {
            // Build frequency map
            const freqMap = buildFrequencyMap(text);
            
            // Build Huffman tree
            const tree = buildHuffmanTree(freqMap);
            
            // Generate codes
            const codeMap = generateCodes(tree);
            
            // Encode the text
            let encoded = '';
            for (let char of text) {
                encoded += codeMap.get(char);
            }
            
            return {
                encoded: encoded,
                codeMap: Object.fromEntries(codeMap),
                originalLength: text.length,
                encodedLength: encoded.length,
                compressionRatio: ((1 - encoded.length / (text.length * 8)) * 100).toFixed(2) + '%'
            };
        } catch (error) {
            return { encoded: '', codeMap: {}, error: error.message };
        }
    }

    // Decode Huffman code back to text
    function decode(encodedText, codeMap) {
        if (!encodedText || !codeMap) {
            return { decoded: '', error: 'Invalid input' };
        }
        
        try {
            // Create reverse map (code -> char)
            const reverseMap = new Map();
            for (let [char, code] of Object.entries(codeMap)) {
                reverseMap.set(code, char);
            }
            
            let decoded = '';
            let currentCode = '';
            
            for (let bit of encodedText) {
                currentCode += bit;
                if (reverseMap.has(currentCode)) {
                    decoded += reverseMap.get(currentCode);
                    currentCode = '';
                }
            }
            
            if (currentCode !== '') {
                return { decoded: '', error: 'Invalid encoded text or code map mismatch' };
            }
            
            return {
                decoded: decoded,
                decodedLength: decoded.length
            };
        } catch (error) {
            return { decoded: '', error: error.message };
        }
    }

    // Format encoded data for display/storage
    function formatEncodedData(result) {
        if (result.error) {
            return `Error: ${result.error}`;
        }
        
        let output = '=== HUFFMAN ENCODED DATA ===\n\n';
        output += `Original Length: ${result.originalLength} characters\n`;
        output += `Encoded Length: ${result.encodedLength} bits\n`;
        output += `Compression Ratio: ${result.compressionRatio}\n\n`;
        output += '--- Code Map ---\n';
        
        const sortedEntries = Object.entries(result.codeMap).sort((a, b) => a[1].length - b[1].length);
        for (let [char, code] of sortedEntries) {
            const displayChar = char === '\n' ? '\\n' : char === '\t' ? '\\t' : char === ' ' ? 'SPACE' : char;
            output += `'${displayChar}' : ${code}\n`;
        }
        
        output += '\n--- Encoded Binary ---\n';
        output += result.encoded;
        output += '\n\n--- Code Map (JSON) ---\n';
        output += JSON.stringify(result.codeMap, null, 2);
        
        return output;
    }

    // Parse encoded data from formatted text
    function parseEncodedData(text) {
        try {
            // Extract code map JSON
            const jsonMatch = text.match(/--- Code Map \(JSON\) ---\s*\n([\s\S]+?)(?:\n\n|$)/);
            if (!jsonMatch) {
                return { codeMap: null, encoded: null, error: 'Code map not found' };
            }
            
            const codeMap = JSON.parse(jsonMatch[1].trim());
            
            // Extract encoded binary
            const binaryMatch = text.match(/--- Encoded Binary ---\s*\n([01]+)/);
            if (!binaryMatch) {
                return { codeMap: null, encoded: null, error: 'Encoded binary not found' };
            }
            
            const encoded = binaryMatch[1].trim();
            
            return { codeMap, encoded };
        } catch (error) {
            return { codeMap: null, encoded: null, error: error.message };
        }
    }

    // Public API
    return {
        encode: encode,
        decode: decode,
        formatEncodedData: formatEncodedData,
        parseEncodedData: parseEncodedData
    };
})();

// Make it available globally
if (typeof window !== 'undefined') {
    window.HuffmanService = HuffmanService;
}
