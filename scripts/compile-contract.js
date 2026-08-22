import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractPath = path.resolve(__dirname, '../contracts/ArtisanEscrow.sol');
const outputDir = path.resolve(__dirname, '../src/config/contracts');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🔨 Compiling contract from: ${contractPath}...`);
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ArtisanEscrow.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasFatalError = false;
  output.errors.forEach((err) => {
    if (err.severity === 'error') {
      console.error('❌ Compilation Error:', err.formattedMessage);
      hasFatalError = true;
    } else {
      console.warn('⚠️ Warning:', err.formattedMessage);
    }
  });

  if (hasFatalError) {
    process.exit(1);
  }
}

const contract = output.contracts['ArtisanEscrow.sol']['ArtisanEscrow'];
const artifact = {
  contractName: 'ArtisanEscrow',
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
  compiledAt: new Date().toISOString(),
};

const outputPath = path.join(outputDir, 'ArtisanEscrow.json');
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));

console.log(`✅ Successfully compiled ArtisanEscrow.sol!`);
console.log(`📦 Artifact saved to: ${outputPath}`);
