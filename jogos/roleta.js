import { MODO_STREAMER, saldo, updateBalance, onBalanceChange, formatBRL, pick, sleep, showMessage, checkBroke, createBetControl } from './jogos.js';

// ======================================================
// 🌙 ROLETA DA LUA CHEIA TRABALHISTA
// ======================================================
const roleta = (() => {
    const ORDEM = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const VERMELHOS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const CORES = { vermelho: '#c2185b', preto: '#1a0520', verde: '#2e7d32' };
    const STEP = 360 / ORDEM.length;

    const DIREITOS = [
        '13º salário', 'férias remuneradas', 'FGTS', 'hora extra', 'vale-refeição',
        'aposentadoria', 'adicional noturno', 'licença-maternidade', 'descanso semanal',
        'seguro-desemprego', 'carteira assinada', 'insalubridade', 'PLR', 'aviso prévio',
    ];

    const corDe = (n) => (n === 0 ? 'verde' : VERMELHOS.has(n) ? 'vermelho' : 'preto');

    const wheel = document.getElementById('wheel');
    const table = document.getElementById('rouletteTable');
    const spinBtn = document.getElementById('rouletteSpin');
    const totalEl = document.getElementById('rouletteTotal');
    const message = document.getElementById('rouletteMessage');
    const lastNumberEl = document.getElementById('lastNumber');
    const historyEl = document.getElementById('history');
    const clearBtn = document.getElementById('clearBets');
    const repeatBtn = document.getElementById('repeatBets');

    let bets = {};       // { chave: valor }
    let lastBets = {};
    let rotation = 0;
    let isSpinning = false;
    const cells = {};    // chave -> elemento da mesa

    const chip = createBetControl({
        input: document.getElementById('chipAmount'),
        decrease: document.getElementById('chipDecrease'),
        increase: document.getElementById('chipIncrease'),
    });

    // ---------- Desenho da roda (SVG) ----------
    function polar(r, deg) {
        const rad = (deg * Math.PI) / 180;
        return `${(r * Math.sin(rad)).toFixed(3)} ${(-r * Math.cos(rad)).toFixed(3)}`;
    }

    function drawWheel() {
        const R = 98, r = 62;
        let svg = '';
        ORDEM.forEach((n, i) => {
            const a0 = i * STEP - STEP / 2;
            const a1 = a0 + STEP;
            svg += `<path d="M ${polar(R, a0)} A ${R} ${R} 0 0 1 ${polar(R, a1)} L ${polar(r, a1)} A ${r} ${r} 0 0 0 ${polar(r, a0)} Z"
                fill="${CORES[corDe(n)]}" stroke="#FF69B4" stroke-width="0.6"/>`;
            svg += `<text transform="rotate(${i * STEP}) translate(0 -84)" font-size="9" text-anchor="middle" dominant-baseline="middle">${n}</text>`;
        });
        svg += `<circle r="${r}" fill="#2a0a2a" stroke="#FF69B4" stroke-width="1.5"/>`;
        svg += `<circle r="40" fill="#3d0f4a" stroke="#dda0dd" stroke-width="1" stroke-dasharray="3 3"/>`;
        svg += `<text font-size="40" text-anchor="middle" dominant-baseline="central">🌙</text>`;
        wheel.innerHTML = svg;
    }

    // ---------- Mesa de apostas ----------
    function addCell(key, label, cls, gridArea) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = `bet-cell ${cls}`;
        el.textContent = label;
        el.style.gridArea = gridArea;
        el.addEventListener('click', () => placeBet(key));
        el.addEventListener('contextmenu', (e) => { e.preventDefault(); removeBet(key); });
        table.appendChild(el);
        cells[key] = el;
    }

    function buildTable() {
        // 0 ocupa as 3 linhas da esquerda
        addCell('n:0', '0', 'cor-verde', '1 / 1 / 4 / 2');
        // Números: linha de cima 3,6,9..., meio 2,5,8..., baixo 1,4,7...
        for (let n = 1; n <= 36; n++) {
            const col = Math.ceil(n / 3) + 1;
            const row = 3 - ((n - 1) % 3);
            addCell(`n:${n}`, String(n), `cor-${corDe(n)}`, `${row} / ${col} / ${row + 1} / ${col + 1}`);
        }
        // Colunas (2:1)
        addCell('c3', '2:1', '', '1 / 14 / 2 / 15');
        addCell('c2', '2:1', '', '2 / 14 / 3 / 15');
        addCell('c1', '2:1', '', '3 / 14 / 4 / 15');
        // Dúzias
        addCell('d1', '1ª dúzia', '', '4 / 2 / 5 / 6');
        addCell('d2', '2ª dúzia', '', '4 / 6 / 5 / 10');
        addCell('d3', '3ª dúzia', '', '4 / 10 / 5 / 14');
        // Apostas externas
        addCell('baixo', '1-18', '', '5 / 2 / 6 / 4');
        addCell('par', 'Par', '', '5 / 4 / 6 / 6');
        addCell('vermelho', '♦ Vermelho', 'cor-vermelho', '5 / 6 / 6 / 8');
        addCell('preto', '♠ Preto', 'cor-preto', '5 / 8 / 6 / 10');
        addCell('impar', 'Ímpar', '', '5 / 10 / 6 / 12');
        addCell('alto', '19-36', '', '5 / 12 / 6 / 14');
    }

    // ---------- Fichas ----------
    const totalBet = () => Object.values(bets).reduce((s, v) => s + v, 0);

    function renderChips() {
        Object.entries(cells).forEach(([key, el]) => {
            el.querySelector('.chip')?.remove();
            if (bets[key]) {
                const c = document.createElement('span');
                c.className = 'chip';
                c.textContent = bets[key] >= 1000 ? `${Math.round(bets[key] / 1000)}k` : bets[key];
                el.appendChild(c);
            }
        });
        totalEl.textContent = formatBRL(totalBet());
        refresh();
    }

    function placeBet(key) {
        if (isSpinning) return;
        const value = chip.value;
        if (saldo.valor < value) {
            showMessage(message, '❌ Saldo insuficiente pra essa ficha! (Mas é tudo de mentirinha mesmo 😄)', 'lose');
            return;
        }
        saldo.valor -= value;
        bets[key] = (bets[key] || 0) + value;
        updateBalance();
        renderChips();
    }

    function removeBet(key) {
        if (isSpinning || !bets[key]) return;
        saldo.valor += bets[key];
        delete bets[key];
        updateBalance();
        renderChips();
    }

    function clearBets() {
        if (isSpinning) return;
        saldo.valor += totalBet();
        bets = {};
        updateBalance();
        renderChips();
    }

    function repeatBets() {
        if (isSpinning) return;
        clearBets();
        const needed = Object.values(lastBets).reduce((s, v) => s + v, 0);
        if (needed > saldo.valor) {
            showMessage(message, '❌ Saldo insuficiente pra repetir a aposta!', 'lose');
            return;
        }
        saldo.valor -= needed;
        bets = { ...lastBets };
        updateBalance();
        renderChips();
    }

    // ---------- Regras ----------
    function ganha(key, n) {
        if (key.startsWith('n:')) return Number(key.slice(2)) === n;
        if (n === 0) return false;
        switch (key) {
            case 'vermelho': return VERMELHOS.has(n);
            case 'preto': return !VERMELHOS.has(n);
            case 'par': return n % 2 === 0;
            case 'impar': return n % 2 === 1;
            case 'baixo': return n <= 18;
            case 'alto': return n >= 19;
            case 'd1': return n <= 12;
            case 'd2': return n >= 13 && n <= 24;
            case 'd3': return n >= 25;
            case 'c1': return n % 3 === 1;
            case 'c2': return n % 3 === 2;
            case 'c3': return n % 3 === 0;
        }
        return false;
    }

    // Retorno total (aposta + lucro)
    const multiplicador = (key) => (key.startsWith('n:') ? 36 : /^[dc]\d$/.test(key) ? 3 : 2);

    // Modo streamer: a "sorte" escolhe o número que mais paga para as fichas da mesa
    function indiceMaisLucrativo() {
        const premios = ORDEM.map((n) => Object.entries(bets)
            .reduce((s, [key, value]) => s + (ganha(key, n) ? value * multiplicador(key) : 0), 0));
        const melhor = Math.max(...premios);
        const candidatos = premios.map((p, i) => (p === melhor ? i : -1)).filter((i) => i >= 0);
        return pick(candidatos);
    }

    // ---------- Giro ----------
    async function spin() {
        if (isSpinning || totalBet() === 0) return;
        isSpinning = true;
        refresh();
        showMessage(message, '🌙 A lua está girando... acenda um cigarro e aguarde 💨');
        Object.values(cells).forEach((el) => el.classList.remove('hit'));

        const index = MODO_STREAMER ? indiceMaisLucrativo() : Math.floor(Math.random() * ORDEM.length);
        const numero = ORDEM[index];

        // Leva o setor sorteado até o ponteiro (topo), com várias voltas
        const jitter = (Math.random() - 0.5) * STEP * 0.6;
        const base = Math.ceil(rotation / 360) * 360 + 360 * 6;
        rotation = base + ((360 - index * STEP) % 360) + jitter;
        const duration = 5000;
        wheel.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
        wheel.style.transform = `rotate(${rotation}deg)`;
        await sleep(duration + 200);

        // Resultado
        const cor = corDe(numero);
        lastNumberEl.textContent = numero;
        lastNumberEl.className = `roulette-last-number cor-${cor}`;
        const ball = document.createElement('span');
        ball.className = `hist-ball cor-${cor}`;
        ball.textContent = numero;
        historyEl.prepend(ball);
        while (historyEl.children.length > 12) historyEl.lastChild.remove();
        cells[`n:${numero}`].classList.add('hit');

        let premio = 0;
        Object.entries(bets).forEach(([key, value]) => {
            if (ganha(key, numero)) premio += value * multiplicador(key);
        });
        const apostado = totalBet();
        lastBets = { ...bets };
        bets = {};
        saldo.valor += premio;
        updateBalance();
        renderChips();

        const direito = pick(DIREITOS);
        if (numero === 0) {
            showMessage(message, pick([
                `🟢 ZERO! A reforma trabalhista levou tudo, inclusive seu ${direito}`,
                `🟢 Deu 0... igual ao seu aumento salarial este ano`,
                `🟢 Zero! Getúlio chora em espírito 😢`,
            ]) + (premio > 0 ? ` (mas você apostou no zero: +R$ ${formatBRL(premio)}!)` : ''), premio > 0 ? 'win' : 'lose');
        } else if (premio > apostado) {
            showMessage(message, pick([
                `🌕 Deu ${numero}! Getúlio aparece em espírito e devolve seu ${direito}: +R$ ${formatBRL(premio)}`,
                `🎉 ${numero} ${cor}! A lua cheia pagou R$ ${formatBRL(premio)} (fictícios)`,
                `💰 "Acabei de ganhar R$ ${formatBRL(premio)} na roleta da Croebet!" - SuperChat`,
                `🏆 Deu ${numero}! Nas bets reais isso NÃO acontece com essa frequência`,
                `🎶 Krepe celebra ao som de "Viva la Vida"! +R$ ${formatBRL(premio)} 🌙`,
            ]), 'win');
        } else if (premio > 0) {
            showMessage(message, `😐 Deu ${numero} ${cor}. Voltou R$ ${formatBRL(premio)} de R$ ${formatBRL(apostado)}... igual reajuste abaixo da inflação`, 'lose');
        } else {
            showMessage(message, pick([
                `🌑 Deu ${numero} ${cor}. O cosmos levou seu ${direito}`,
                `📉 Deu ${numero}. Bem-vindo à indústria do Loss™`,
                `💸 "Meu salário é da Croebet, nunca ganho" - Vibes (deu ${numero})`,
                `😔 Deu ${numero}. A lua minguou junto com sua carteira`,
                `🎵 Deu ${numero}. Krepe ouve "Fix You" e reflete sobre a derrota lunar...`,
            ]), 'lose');
        }

        isSpinning = false;
        refresh();
        checkBroke(message);
    }

    function refresh() {
        spinBtn.disabled = isSpinning || totalBet() === 0;
        clearBtn.disabled = isSpinning || totalBet() === 0;
        repeatBtn.disabled = isSpinning || Object.keys(lastBets).length === 0;
    }

    drawWheel();
    buildTable();
    renderChips();
    spinBtn.addEventListener('click', spin);
    clearBtn.addEventListener('click', clearBets);
    repeatBtn.addEventListener('click', repeatBets);
    // Saiu da página com fichas na mesa (sem girar)? Devolve pro saldo
    window.addEventListener('pagehide', () => { if (!isSpinning) clearBets(); });
    showMessage(message, '🪙 Clique na mesa pra colocar fichas (botão direito tira a ficha)');

    return { refresh };
})();

onBalanceChange(roleta.refresh);
updateBalance();
