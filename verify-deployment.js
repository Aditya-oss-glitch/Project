#!/usr/bin/env node

// Road Rescue 360 - Deployment Verification Script
console.log('🔍 Verifying Road Rescue 360 Deployment...\n');

// Check if backend package.json exists
const fs = require('fs');
const path = require('path');

const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
const backendServerPath = path.join(__dirname, 'backend', 'server.js');

console.log('📁 Checking file structure...');

if (fs.existsSync(backendPackagePath)) {
    console.log('✅ backend/package.json found');
    
    // Read and check package.json
    const packageJson = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    
    if (packageJson.dependencies && packageJson.dependencies.express) {
        console.log('✅ Express dependency found in package.json');
    } else {
        console.log('❌ Express dependency missing from package.json');
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log('✅ Start script found in package.json');
    } else {
        console.log('❌ Start script missing from package.json');
    }
} else {
    console.log('❌ backend/package.json not found');
}

if (fs.existsSync(backendServerPath)) {
    console.log('✅ backend/server.js found');
} else {
    console.log('❌ backend/server.js not found');
}

// Check render.yaml
const renderYamlPath = path.join(__dirname, 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
    console.log('✅ render.yaml found');
    
    const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
    if (renderYaml.includes('buildCommand: npm run build')) {
        console.log('✅ Build command configured correctly');
    } else {
        console.log('❌ Build command not configured correctly');
    }
    
    if (renderYaml.includes('startCommand: npm start')) {
        console.log('✅ Start command configured correctly');
    } else {
        console.log('❌ Start command not configured correctly');
    }
} else {
    console.log('❌ render.yaml not found');
}

// Check root package.json
const rootPackagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(rootPackagePath)) {
    console.log('✅ Root package.json found');
    
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    if (rootPackage.scripts && rootPackage.scripts.build) {
        console.log('✅ Build script found in root package.json');
    } else {
        console.log('❌ Build script missing from root package.json');
    }
} else {
    console.log('❌ Root package.json not found');
}

console.log('\n🎯 Deployment Summary:');
console.log('1. Backend dependencies should be installed with: npm run build');
console.log('2. Backend should start with: npm start');
console.log('3. Render will use the render.yaml configuration');
console.log('4. Make sure to set up MongoDB database in Render');
console.log('5. Environment variables will be auto-configured');

console.log('\n📝 Next Steps:');
console.log('1. Commit all changes: git add . && git commit -m "Fix deployment"');
console.log('2. Push to GitHub: git push origin main');
console.log('3. Deploy on Render using the updated configuration');
console.log('4. Check Render logs for any remaining issues');

console.log('\n✨ Deployment verification complete!');
