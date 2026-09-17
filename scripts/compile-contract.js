import fs from 'fs';
import path from 'path';
import solc from 'solc';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contractsDir = path.resolve(__dirname, '../contracts');
const outputDir = path.resolve(__dirname, '../src/config/contracts');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔨 Compiling smart contracts...');

const contractFiles = ['ArtisanEscrow.sol', 'MockUSDC.sol'];
const sources = {};

for (const file of contractFiles) {
  const filePath = path.join(contractsDir, file);
  if (fs.existsSync(filePath)) {
    sources[file] = { content: fs.readFileSync(filePath, 'utf8') };
  }
}

const input = {
  language: 'Solidity',
  sources,
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

// Save ArtisanEscrow
const escrowContract = output.contracts['ArtisanEscrow.sol']['ArtisanEscrow'];
const escrowArtifact = {
  contractName: 'ArtisanEscrow',
  abi: escrowContract.abi,
  bytecode: escrowContract.evm.bytecode.object,
  compiledAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(outputDir, 'ArtisanEscrow.json'), JSON.stringify(escrowArtifact, null, 2));

// Save MockUSDC
if (output.contracts['MockUSDC.sol'] && output.contracts['MockUSDC.sol']['MockUSDC']) {
  const usdcContract = output.contracts['MockUSDC.sol']['MockUSDC'];
  const usdcArtifact = {
    contractName: 'MockUSDC',
    abi: usdcContract.abi,
    bytecode: usdcContract.evm.bytecode.object,
    compiledAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outputDir, 'MockUSDC.json'), JSON.stringify(usdcArtifact, null, 2));
  console.log(`✅ Successfully compiled MockUSDC.sol!`);
}

console.log(`✅ Successfully compiled ArtisanEscrow.sol!`);
console.log(`📦 Artifacts saved to: ${outputDir}`);
