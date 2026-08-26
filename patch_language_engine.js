const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

const oldInstruct = `aiPrompt += "\\n\\nIMPORTANT INSTRUCTIONS:\\nIf the user is asking about bulk/wholesale purchasing, append [SEGMENT: WHOLESALE]. If they purchase high value items consistently, append [SEGMENT: VIP]. If they only ask questions and don't buy, append [SEGMENT: WINDOW_SHOPPER].";`;

const newInstruct = `aiPrompt += "\\n\\nIMPORTANT INSTRUCTIONS:\\nIf the user is asking about bulk/wholesale purchasing, append [SEGMENT: WHOLESALE]. If they purchase high value items consistently, append [SEGMENT: VIP]. If they only ask questions and don't buy, append [SEGMENT: WINDOW_SHOPPER].\\n\\n[MULTI-LANGUAGE ENGINE ACTIVE]:\\n1. You must auto-detect the user's language (Sinhala, Singlish, Tamil, or English).\\n2. You MUST reply in the EXACT SAME LANGUAGE and dialect they used.\\n3. If they type in Singlish (Sinhala words in English alphabet), you MUST reply in natural Singlish.\\n4. If they type in Sinhala Unicode or Tamil, reply in the exact same script.\\n5. Always mirror their linguistic style naturally.";`;

if (code.includes(oldInstruct)) {
    code = code.replace(oldInstruct, newInstruct);
    fs.writeFileSync('index.js', code);
    console.log("Language engine patched in index.js");
} else {
    console.log("Could not find old instruction in index.js");
}

let uiCode = fs.readFileSync('src/App.tsx', 'utf8');
const oldUi = `<h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup</h3>`;
const newUi = `<h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles size={20} className="text-indigo-500" /> DeepSeek Engine Setup <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200">🌍 MULTI-LANGUAGE AUTO-DETECT ACTIVE</span></h3>`;

if (uiCode.includes(oldUi)) {
    uiCode = uiCode.replace(oldUi, newUi);
    fs.writeFileSync('src/App.tsx', uiCode);
    console.log("Language badge added to App.tsx");
} else {
    console.log("Could not find UI snippet");
}
