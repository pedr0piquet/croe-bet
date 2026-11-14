import { saldo, updateBalance, onBalanceChange, formatBRL, pick, sleep, showMessage, checkBroke, createBetControl } from './jogos.js';

// ======================================================
// 🃏 CAÇA-NÍQUEIS DE TARÔ (3x3, 5 linhas)
// ======================================================
const slot = (() => {
    // peso = frequência no rolo; mult = quanto paga sobre a aposta por linha com 3 iguais
    const ARCANOS = [
        { s: '🎡', nome: 'A Roda da Fortuna', peso: 2, mult: 25 },
        { s: '🌞', nome: 'O Sol', peso: 3, mult: 10 },
        { s: '⭐', nome: 'A Estrela', peso: 4, mult: 5 },
        { s: '🌙', nome: 'A Lua', peso: 5, mult: 3 },
        { s: '🃏', nome: 'O Louco', peso: 6, mult: 2 },
        { s: '🗼', nome: 'A Torre', peso: 6, mult: 1.5 },
        { s: '💀', nome: 'A Morte', peso: 4, mult: 1 },
    ];
    const PESO_TOTAL = ARCANOS.reduce((s, a) => s + a.peso, 0);

    // Linhas: [coluna, linha] de cada posição
    const LINHAS = [
        { nome: 'linha de cima', pos: [[0, 0], [1, 0], [2, 0]] },
        { nome: 'linha do meio', pos: [[0, 1], [1, 1], [2, 1]] },
        { nome: 'linha de baixo', pos: [[0, 2], [1, 2], [2, 2]] },
        { nome: 'diagonal ↘', pos: [[0, 0], [1, 1], [2, 2]] },
        { nome: 'diagonal ↗', pos: [[0, 2], [1, 1], [2, 0]] },
    ];

    const gridEl = document.getElementById('slotGrid');
    const spinBtn = document.getElementById('slotSpin');
    const priceEl = document.getElementById('slotPrice');
    const message = document.getElementById('slotMessage');
    let isSpinning = false;
    let bet = null;

    bet = createBetControl({
        input: document.getElementById('slotBet'),
        decrease: document.getElementById('slotDecrease'),
        increase: document.getElementById('slotIncrease'),
        onChange: (v) => { priceEl.textContent = formatBRL(v); refresh(); },
    });

    // Monta a grade 3x3
    const cols = [];
    const cellEls = []; // cellEls[col][row]
    for (let c = 0; c < 3; c++) {
        const col = document.createElement('div');
        col.className = 'reel-col';
        cellEls[c] = [];
        for (let r = 0; r < 3; r++) {
            const cell = document.createElement('div');
            cell.className = 'slot-cell';
            cell.innerHTML = `<span class="symbol">${ARCANOS[(c + r) % ARCANOS.length].s}</span>`;
            col.appendChild(cell);
            cellEls[c][r] = cell;
        }
        gridEl.appendChild(col);
        cols.push(col);
    }

    // Tabela de prêmios
    document.getElementById('slotPaytable').innerHTML = ARCANOS.map((a) =>
        `<div class="paytable-row"><span>${a.s}${a.s}${a.s} <span class="arcano-nome">(${a.nome})</span></span><span class="prize">${String(a.mult).replace('.', ',')}x</span></div>`
    ).join('');

    function sorteiaArcano() {
        let x = Math.random() * PESO_TOTAL;
        for (const a of ARCANOS) {
            x -= a.peso;
            if (x < 0) return a;
        }
        return ARCANOS[ARCANOS.length - 1];
    }

    function sorteiaGrade() {
        const grade = [0, 1, 2].map(() => [0, 1, 2].map(() => sorteiaArcano()));
        // Igual ao Krepinho: um empurrãozinho "generoso" (é paródia, afinal)
        if (Math.random() < 0.12) {
            const linha = pick(LINHAS);
            const arcano = sorteiaArcano();
            linha.pos.forEach(([c, r]) => { grade[c][r] = arcano; });
        }
        return grade;
    }

    function linhasVencedoras(grade) {
        return LINHAS.filter((l) => {
            const [a, b, c] = l.pos.map(([col, row]) => grade[col][row]);
            return a === b && b === c;
        }).map((l) => ({ ...l, arcano: grade[l.pos[0][0]][l.pos[0][1]] }));
    }

    async function spin() {
        const valor = bet.value;
        if (isSpinning || saldo.valor < valor) return;
        isSpinning = true;
        saldo.valor -= valor;
        updateBalance();
        showMessage(message, '🃏 Embaralhando os arcanos... 💨');
        cellEls.flat().forEach((c) => c.classList.remove('win'));

        cols.forEach((col) => col.classList.add('spinning'));
        const shuffle = setInterval(() => {
            cellEls.forEach((col, c) => {
                if (!cols[c].classList.contains('spinning')) return;
                col.forEach((cell) => { cell.querySelector('.symbol').textContent = pick(ARCANOS).s; });
            });
        }, 90);

        await sleep(1000 + Math.random() * 1500);
        const grade = sorteiaGrade();

        // Para as colunas uma por uma (efeito dramático)
        for (let c = 0; c < 3; c++) {
            await sleep(350);
            cols[c].classList.remove('spinning');
            for (let r = 0; r < 3; r++) cellEls[c][r].querySelector('.symbol').textContent = grade[c][r].s;
        }
        clearInterval(shuffle);
        await sleep(400);

        const vencedoras = linhasVencedoras(grade);
        const premio = vencedoras.reduce((s, l) => s + valor * l.arcano.mult, 0);

        if (premio > 0) {
            saldo.valor += premio;
            updateBalance();
            vencedoras.forEach((l) => l.pos.forEach(([c, r]) => cellEls[c][r].classList.add('win')));
            const top = vencedoras.reduce((m, l) => (l.arcano.mult > m.arcano.mult ? l : m));
            const qtd = vencedoras.length > 1 ? ` em ${vencedoras.length} linhas` : ` na ${top.nome}`;
            const msgs = top.arcano.s === '💀'
                ? [`💀 Três Mortes${qtd}... a cartomante diz que é "transformação". Volta R$ ${formatBRL(premio)}`]
                : [
                    `🎉 ${top.arcano.nome}${qtd}! +R$ ${formatBRL(premio)} 🎉`,
                    `🔮 A cartomante acertou: ${top.arcano.nome}! +R$ ${formatBRL(premio)} (fictícios)`,
                    `✨ "Crobet tá pagando forte" (só que não) +R$ ${formatBRL(premio)}`,
                    `🎶 Krepe tira ${top.arcano.nome} ao som de "Yellow"! +R$ ${formatBRL(premio)}`,
                ];
            showMessage(message, pick(msgs), 'win');
            setTimeout(() => cellEls.flat().forEach((c) => c.classList.remove('win')), 1500);
        } else {
            showMessage(message, pick([
                '🗼 A Torre caiu... em cima da sua conta bancária',
                '💀 Saiu A Morte. Do seu salário, no caso',
                '🃏 O Louco é você por continuar girando (ainda bem que é de mentira)',
                '😢 O Krepinho tirou as cartas e ficou triste por você',
                '📉 Os arcanos dizem: indústria do Loss™',
                '🔮 "Vejo... sua carteira vazia" - Cartomante do Slot',
                '😅 "Perdi o salário no tigre" - mas aqui é de mentira!',
            ]), 'lose');
        }

        isSpinning = false;
        refresh();
        checkBroke(message);
    }

    function refresh() {
        if (!bet) return;
        spinBtn.disabled = isSpinning || saldo.valor < bet.value;
    }

    spinBtn.addEventListener('click', spin);
    return { refresh };
})();

onBalanceChange(slot.refresh);
updateBalance();
