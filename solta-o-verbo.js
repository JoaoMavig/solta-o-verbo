const puppeteer = require('puppeteer');

// ======================================================
// CONFIGURAÇÕES
// ======================================================

const MODE_URL = 'https://soltaoverbo.com.br/cerebro';
const NTFY_TOPIC = 'soltaoverbomavig';

const CATEGORIAS = [
    'Ciência',
    'Comportamento social',
    'Cultura pop',
    'Filosofia',
    'Literatura',
    'Mitos e lendas',
    'Neurociência & cognição',
    'Psicologia',
    'Redes sociais e saúde mental'
];


// ======================================================
// INÍCIO
// ======================================================

(async () => {

    let browser;

    try {

        // --------------------------------------------------
        // ABRE O NAVEGADOR
        // --------------------------------------------------

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();

        console.log('Abrindo Solta o Verbo...');

        await page.goto(MODE_URL, {
            waitUntil: 'networkidle0'
        });


        // --------------------------------------------------
        // ENCONTRA O TEXTO GRANDE DO TEMA
        // --------------------------------------------------

        const temaSelector = 'p.font-display.font-bold';

        await page.waitForSelector(temaSelector, {
            timeout: 10000
        });

        const temaAntes = await page.$eval(
            temaSelector,
            el => el.innerText.trim()
        );

        console.log('Texto antes do sorteio:', temaAntes);


        // --------------------------------------------------
        // ENCONTRA O BOTÃO "SORTEAR"
        // --------------------------------------------------

        const buttonSelector =
            "xpath/.//button[contains(., 'Sortear')]";

        await page.waitForSelector(buttonSelector, {
            timeout: 10000
        });

        const button = await page.$(buttonSelector);

        if (!button) {
            throw new Error(
                'Não encontrei o botão Sortear.'
            );
        }


        // --------------------------------------------------
        // CLICA EM "SORTEAR"
        // --------------------------------------------------

        console.log('Sorteando tema...');

        await button.click();


        // --------------------------------------------------
        // ESPERA O TEMA MUDAR
        // --------------------------------------------------

        await page.waitForFunction(
            (selector, textoAnterior) => {

                const el =
                    document.querySelector(selector);

                if (!el) {
                    return false;
                }

                const texto =
                    el.innerText.trim();

                return (
                    texto.length > 0 &&
                    texto !== textoAnterior
                );

            },
            {
                timeout: 10000
            },
            temaSelector,
            temaAntes
        );


        // --------------------------------------------------
        // CAPTURA O TEMA
        // --------------------------------------------------

        const tema = await page.$eval(
            temaSelector,
            el => el.innerText.trim()
        );


        // --------------------------------------------------
        // CAPTURA A CATEGORIA
        // --------------------------------------------------

        const categoria = await page.evaluate(
            (categorias, temaSelector) => {

                const temaEl =
                    document.querySelector(temaSelector);

                if (!temaEl) {
                    return 'Categoria não encontrada';
                }

                const elementos =
                    Array.from(
                        document.querySelectorAll(
                            'p, span, div'
                        )
                    );

                const indiceTema =
                    elementos.indexOf(temaEl);

                // Procura a categoria nos elementos
                // anteriores ao tema.
                for (
                    let i = indiceTema - 1;
                    i >= 0;
                    i--
                ) {

                    const el = elementos[i];

                    // Ignora containers grandes
                    if (el.children.length > 0) {
                        continue;
                    }

                    const texto =
                        el.innerText
                            ?.replace(/\s+/g, ' ')
                            .trim();

                    if (!texto) {
                        continue;
                    }

                    const encontrada =
                        categorias.find(
                            cat =>
                                cat.toLowerCase() ===
                                texto.toLowerCase()
                        );

                    if (encontrada) {
                        return encontrada;
                    }
                }

                return 'Categoria não encontrada';

            },
            CATEGORIAS,
            temaSelector
        );


        // --------------------------------------------------
        // MOSTRA O RESULTADO NO GITHUB ACTIONS
        // --------------------------------------------------

        console.log('');
        console.log('================================');
        console.log('       SOLTA O VERBO');
        console.log('================================');
        console.log('');

        console.log(
            `Categoria: ${categoria}`
        );

        console.log(
            `Tema: ${tema}`
        );

        console.log('');
        console.log('================================');


        // ==================================================
        // CRIA LINK PARA PESQUISAR O TEMA
        // ==================================================

        const linkPesquisa =
            `https://www.google.com/search?q=${encodeURIComponent(tema)}`;

        console.log('');
        console.log(
            `Link de pesquisa: ${linkPesquisa}`
        );


        // ==================================================
        // MONTA A MENSAGEM
        // ==================================================

        const mensagem =
`📚 Categoria: ${categoria}

🎲 Tema: ${tema}`;


        // ==================================================
        // ENVIA PARA O NTFY
        // ==================================================

        console.log('');
        console.log('Enviando notificação...');

        const resposta = await fetch(
            `https://ntfy.sh/${NTFY_TOPIC}`,
            {
                method: 'POST',

                headers: {

                    // Nome da notificação
                    Title: 'Solta o Verbo',

                    // 🧠 no título
                    Tags: 'brain',

                    // Prioridade normal
                    Priority: '3',

                    // Botão para pesquisar o tema
                    Actions:
                        `view, 🔎 Pesquisar tema, ${linkPesquisa}`
                },

                body: mensagem
            }
        );


        // --------------------------------------------------
        // VERIFICA SE O NTFY ACEITOU
        // --------------------------------------------------

        if (!resposta.ok) {

            throw new Error(
                `Erro ao enviar notificação: ${resposta.status}`
            );

        }


        console.log(
            'Notificação enviada com sucesso!'
        );


    } catch (erro) {

        // ==================================================
        // TRATAMENTO DE ERROS
        // ==================================================

        console.error('');
        console.error(
            'ERRO:',
            erro.message
        );

        process.exitCode = 1;


    } finally {

        // ==================================================
        // FECHA O NAVEGADOR
        // ==================================================

        if (browser) {
            await browser.close();
        }

    }

})();
