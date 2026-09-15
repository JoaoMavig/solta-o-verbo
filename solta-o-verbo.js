const puppeteer = require('puppeteer');

// ======================================================
// CONFIGURAÇÕES
// ======================================================

// Modo "Exercitando o Cérebro"
const MODE_URL = 'https://soltaoverbo.com.br/cerebro';

// Seu tópico do ntfy
const NTFY_TOPIC = 'soltaoverbomavig';

// Categorias existentes no modo "Exercitando o Cérebro"
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
        // ENCONTRA O LOCAL ONDE O TEMA APARECE
        // --------------------------------------------------

        const placeholderSelector =
            "xpath/.//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'seu tema aparece aqui')]";

        await page.waitForSelector(
            placeholderSelector,
            {
                timeout: 10000
            }
        );

        const placeholder =
            await page.$(placeholderSelector);

        if (!placeholder) {
            throw new Error(
                'Não encontrei o local onde o tema aparece.'
            );
        }


        // --------------------------------------------------
        // ENCONTRA O BOTÃO "SORTEAR"
        // --------------------------------------------------

        const buttonSelector =
            "xpath/.//button[contains(., 'Sortear')]";

        await page.waitForSelector(
            buttonSelector,
            {
                timeout: 10000
            }
        );

        const button =
            await page.$(buttonSelector);

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
        // ESPERA O TEMA SER ALTERADO
        // --------------------------------------------------

        await page.waitForFunction(

            (el) => {

                return (
                    el &&
                    el.innerText &&
                    !el.innerText
                        .toLowerCase()
                        .includes(
                            'seu tema aparece aqui'
                        )
                );

            },

            {
                timeout: 10000
            },

            placeholder
        );


        // --------------------------------------------------
        // PEGA O TEMA
        // --------------------------------------------------

        const tema =
            await page.evaluate(
                (el) => el.innerText.trim(),
                placeholder
            );


        // --------------------------------------------------
        // PROCURA A CATEGORIA DO TEMA
        // --------------------------------------------------

        const categoria =
            await page.evaluate(

                (temaEl, categorias) => {

                    /*
                    Começa no elemento do tema
                    e vai subindo pela estrutura da página.

                    Em cada nível, procura algum elemento
                    cujo texto seja exatamente igual
                    a uma das categorias conhecidas.
                    */

                    let elemento =
                        temaEl.parentElement;

                    for (
                        let nivel = 0;
                        nivel < 6 && elemento;
                        nivel++
                    ) {

                        const elementos =
                            elemento.querySelectorAll('*');

                        for (const el of elementos) {

                            const texto =
                                el.innerText?.trim();

                            if (!texto) {
                                continue;
                            }

                            const encontrada =
                                categorias.find(
                                    (cat) =>
                                        cat.toLowerCase() ===
                                        texto.toLowerCase()
                                );

                            if (encontrada) {
                                return encontrada;
                            }
                        }

                        elemento =
                            elemento.parentElement;
                    }

                    return 'Categoria não encontrada';

                },

                placeholder,
                CATEGORIAS
            );


        // --------------------------------------------------
        // MOSTRA O RESULTADO NO GITHUB ACTIONS
        // --------------------------------------------------

        console.log('');
        console.log('==============================');
        console.log('SOLTA O VERBO');
        console.log('==============================');
        console.log('');
        console.log(
            'Categoria:',
            categoria
        );

        console.log(
            'Tema:',
            tema
        );

        console.log('');


        // --------------------------------------------------
        // ENVIA NOTIFICAÇÃO PARA O CELULAR
        // --------------------------------------------------

        console.log(
            'Enviando notificação...'
        );

        const resposta =
            await fetch(
                `https://ntfy.sh/${NTFY_TOPIC}`,
                {
                    method: 'POST',

                    headers: {
                        Title: 'Solta o Verbo',
                        Tags: 'brain'
                    },

                    body:
`🧠 Categoria: ${categoria}

🎲 Tema: ${tema}`
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

        // --------------------------------------------------
        // MOSTRA ERROS NO GITHUB ACTIONS
        // --------------------------------------------------

        console.error('');
        console.error(
            'ERRO:',
            erro.message
        );

        process.exitCode = 1;


    } finally {

        // --------------------------------------------------
        // FECHA O NAVEGADOR
        // --------------------------------------------------

        if (browser) {
            await browser.close();
        }

    }

})();
