const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSaveConfig = `  const saveConfig = async () => {
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
    alert('All configurations saved successfully!');
  };`;

const newSaveConfig = `  const saveConfig = async () => {
    let finalConfig = { ...config };
    const baseInstruction = "\\n\\nIMPORTANT: To show interactive WhatsApp Buttons to the user, you MUST append a list at the very end of your message in this exact format: [OPTIONS: Button 1, Button 2, Button 3]\\nTo create an order, output EXACTLY: [CREATE_ORDER: ProductName || CustomerName || CustomerAddress]\\nTo check an order status, output EXACTLY: [CHECK_ORDER: OrderID]";
    
    if (finalConfig.settings && finalConfig.settings.systemPrompt && !finalConfig.settings.systemPrompt.includes('CREATE_ORDER')) {
        finalConfig.settings.systemPrompt += baseInstruction;
    }

    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalConfig) });
    setConfig(finalConfig);
    alert('All configurations saved successfully! AI Instructions were updated.');
  };`;

if (code.includes('const saveConfig = async () => {')) {
    code = code.replace(/const saveConfig = async \(\) => {[\s\S]*?alert\('All configurations saved successfully!'\);\s*};/, newSaveConfig);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched saveConfig successfully.");
} else {
    console.log("Could not find saveConfig");
}
