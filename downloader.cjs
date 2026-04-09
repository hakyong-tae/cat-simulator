const puppeteer = require('/Users/hytae/Downloads/cryzen-downloader/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_URL = 'https://poki.com/kr/g/cat-simulator';
const WAIT_FOR_GAME_MS = 60000;

async function downloadGameSources() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(__dirname, 'output', `cat-simulator_${timestamp}`);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('브라우저 시작...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send('Network.enable');
  await client.send('Debugger.enable');

  const savedUrls = new Set();
  const scriptMap = new Map();
  let gameUUID = null;

  client.on('Network.responseReceived', async ({ requestId, response }) => {
    const url = response.url;
    if (!url || savedUrls.has(url)) return;

    // game-cdn.poki.com 에서 UUID 추출
    const uuidMatch = url.match(/game-cdn\.poki\.com\/([a-f0-9\-]{36})\//);
    if (uuidMatch && !gameUUID) {
      gameUUID = uuidMatch[1];
      console.log(`  [UUID 발견] ${gameUUID}`);
    }

    const urlPath = url.split('?')[0];
    const ext = path.extname(urlPath).toLowerCase();
    const captureExts = [
      '.js', '.mjs', '.wasm', '.json', '.css', '.html', '.htm',
      '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif',
      '.mp3', '.ogg', '.wav', '.aac',
      '.ttf', '.woff', '.woff2',
      '.archive', '.arcd', '.arci', '.arcm',
      '.arcd0', '.arci0', '.dmanifest0', '.projectc0', '.der0',
      '.bin', '.dat', '.pak',
    ];

    const isGameCDN = url.includes('game-cdn.poki.com') || url.includes('.gdn.poki.com');
    const hasValidExt = captureExts.includes(ext);

    if (!hasValidExt && !isGameCDN) return;

    try {
      const { body, base64Encoded } = await client.send('Network.getResponseBody', { requestId });
      const urlObj = new URL(url);
      const relPath = urlObj.pathname.replace(/^\//, '');
      const filePath = path.join(outputDir, 'network', relPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      if (base64Encoded) {
        fs.writeFileSync(filePath, Buffer.from(body, 'base64'));
      } else {
        fs.writeFileSync(filePath, body, 'utf8');
      }
      savedUrls.add(url);
      console.log(`  [저장] ${relPath}`);
    } catch (e) {
      if (e.message && e.message.includes('No resource with given identifier')) return;
      console.log(`  [실패] ${url.slice(0, 80)} - ${e.message}`);
    }
  });

  client.on('Debugger.scriptParsed', ({ scriptId, url }) => {
    if (url && !url.startsWith('debugger://')) scriptMap.set(scriptId, url);
  });

  console.log('페이지 로딩:', TARGET_URL);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log(`게임 로딩 대기 중... (${WAIT_FOR_GAME_MS/1000}초) - 게임이 완전히 로딩될 때까지 기다리세요!`);

  for (let i = 0; i < WAIT_FOR_GAME_MS / 5000; i++) {
    await new Promise(r => setTimeout(r, 5000));
    console.log(`  ... ${(i+1)*5}초 경과 (저장된 파일: ${savedUrls.size}개)`);
  }

  // Debugger로 누락된 JS 보완
  const debuggerDir = path.join(outputDir, 'debugger');
  fs.mkdirSync(debuggerDir, { recursive: true });
  for (const [scriptId, url] of scriptMap) {
    if (savedUrls.has(url)) continue;
    try {
      const { scriptSource } = await client.send('Debugger.getScriptSource', { scriptId });
      let fileName;
      try { fileName = path.basename(new URL(url).pathname) || `script_${scriptId}.js`; }
      catch { fileName = `inline_${scriptId}.js`; }
      fs.writeFileSync(path.join(debuggerDir, fileName), scriptSource, 'utf8');
      savedUrls.add(url);
      console.log(`  [Debugger] ${fileName}`);
    } catch {}
  }

  if (gameUUID) {
    fs.writeFileSync(path.join(outputDir, 'game_uuid.txt'), gameUUID);
    console.log(`\n게임 UUID: ${gameUUID}`);
  }

  console.log(`\n완료! 총 ${savedUrls.size}개 파일 → ${outputDir}`);
  await browser.close();
  return { outputDir, gameUUID };
}

downloadGameSources().catch(console.error);
