const puppeteer = require('puppeteer');

// --- CONFIGURAÇÕES ---
// Troque a URL pelo modo que você quer:
// https://soltaoverbo.com.br/oratoria  -> Praticar oratória
// https://soltaoverbo.com.br/jogar     -> Jogar (puxar assunto)
// https://soltaoverbo.com.br/cerebro   -> Exercitando o Cérebro
const MODE_URL = 'https://soltaoverbo.com.br/cerebro';

// Crie um "tópico" único e secreto em https://ntfy.sh (não precisa cadastro).
// Depois instale o app ntfy no celular e "inscreva-se" no mesmo nome de tópico.
const NTFY_TOPIC = 'soltaoverbomavig';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(MODE_URL, { waitUntil: 'networkidle0' });

  // Acha o elemento que mostra "seu tema aparece aqui" antes do sorteio
  const placeholderSelector = "xpath/.//*[contains(text(), 'seu tema aparece aqui')]";
  await page.waitForSelector(placeholderSelector, { timeout: 10000 });
  const placeholder = await page.$(placeholderSelector);
  if (!placeholder) {
    throw new Error('Não encontrei o elemento do tema. O site pode ter mudado — ajuste o seletor.');
  }

  // Acha e clica no botão "Sortear"
  const buttonSelector = "xpath/.//button[contains(., 'Sortear')]";
  await page.waitForSelector(buttonSelector, { timeout: 10000 });
  const button = await page.$(buttonSelector);
  if (!button) {
    throw new Error('Não encontrei o botão Sortear. O site pode ter mudado.');
  }
  await button.click();

  // Espera o texto do tema mudar
  await page.waitForFunction(
    (el) => el && el.innerText && !el.innerText.includes('seu tema aparece aqui'),
    { timeout: 8000 },
    placeholder
  );

  const tema = await page.evaluate((el) => el.innerText.trim(), placeholder);
  console.log('Tema sorteado:', tema);

  // Envia notificação para o celular via ntfy.sh
  await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    body: `🎲 Tema do dia: ${tema}`,
    headers: { Title: 'Solta o Verbo' },
  });

  await browser.close();
})();
