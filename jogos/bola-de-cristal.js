import { MODO_STREAMER, saldo, updateBalance, onBalanceChange, formatBRL, pick, sleep, showMessage, checkBroke, createBetControl } from './jogos.js';

// ======================================================
// 🔮 BOLA DE CRISTAL DOS DIREITOS
// Revele direitos na fumaça: cada direito mantido aumenta o prêmio,
// achar uma reforma perde tudo. Dá pra sacar a qualquer momento.
// ======================================================
const bola = (() => {
    const DIREITOS = [
        { icon: '🎄', nome: '13º salário' },
        { icon: '🏖️', nome: 'Férias' },
        { icon: '🏦', nome: 'FGTS' },
        { icon: '⏰', nome: 'Hora extra' },
        { icon: '🍽️', nome: 'Vale-refeição' },
        { icon: '👴', nome: 'Aposentadoria' },
        { icon: '🌃', nome: 'Adicional noturno' },
        { icon: '🍼', nome: 'Licença-maternidade' },
        { icon: '🛌', nome: 'Descanso semanal' },
        { icon: '🪪', nome: 'Carteira assinada' },
        { icon: '☣️', nome: 'Insalubridade' },
        { icon: '📜', nome: 'Aviso prévio' },
    ];
    const REFORMAS = [
        'Reforma Trabalhista', 'Pejotização', 'Terceirização', 'Uberização',
        'Trabalho intermitente', 'Banco de horas', 'Negociado sobre o legislado', 'Reforma da Previdência',
    ];
    const OPCOES_REFORMAS = [1, 3, 5, 8];
    const TOTAL = DIREITOS.length;
    const MARGEM_DA_CASA = 0.97;

    const gridEl = document.getElementById('crystalGrid');
    const ballEl = document.getElementById('crystalBall');
    const labelEl = document.getElementById('crystalLabel');
    const multEl = document.getElementById('crystalMult');
    const nextEl = document.getElementById('crystalNext');
    const optionsEl = document.getElementById('reformaOptions');
    const btn = document.getElementById('bolaBtn');
    const btnText = document.getElementById('bolaBtnText');
    const priceEl = document.getElementById('bolaPrice');
    const message = document.getElementById('bolaMessage');
    const betInput = document.getElementById('bolaBet');
    const betButtons = [document.getElementById('bolaDecrease'), document.getElementById('bolaIncrease')];

    let reformas = 3;
    let emJogo = false;
    let apostaAtual = 0;
    let acertos = 0;
    let mapa = [];      // true = reforma escondida
    let tiles = [];
    let bet = null;

    // Multiplicador justo após k direitos mantidos, com uma margem pequena pra casa
    function multiplicador(k) {
        let chance = 1;
        for (let i = 0; i < k; i++) chance *= (TOTAL - reformas - i) / (TOTAL - i);
        return k === 0 ? 1 : Math.floor((MARGEM_DA_CASA / chance) * 100) / 100;
    }

    const fmtMult = (m) => `${formatBRL(m)}x`;

    // Seletor de quantidade de reformas
    const optionButtons = OPCOES_REFORMAS.map((n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn-small';
        b.textContent = `💨 ${n}`;
        b.title = `${n} reforma${n > 1 ? 's' : ''} escondida${n > 1 ? 's' : ''}`;
        b.addEventListener('click', () => {
            if (emJogo) return;
            reformas = n;
            render();
        });
        optionsEl.appendChild(b);
        return { n, el: b };
    });

    // Monta os 12 cartões enevoados
    function montarGrade() {
        gridEl.innerHTML = '';
        tiles = DIREITOS.map((_, i) => {
            const t = document.createElement('button');
            t.type = 'button';
            t.className = 'crystal-tile oculto';
            t.innerHTML = '<span class="tile-icon">🌫️</span><span class="tile-name">???</span>';
            t.addEventListener('click', () => revelar(i));
            gridEl.appendChild(t);
            return t;
        });
    }

    function mostrarTile(i, { fatal = false, depois = false } = {}) {
        const t = tiles[i];
        t.classList.remove('oculto', 'jogavel');
        if (mapa[i]) {
            t.classList.add('reforma');
            if (fatal) t.classList.add('fatal');
            t.innerHTML = `<span class="tile-icon">💨</span><span class="tile-name">${pick(REFORMAS)}</span>`;
        } else {
            t.classList.add('mantido');
            t.innerHTML = `<span class="tile-icon">${DIREITOS[i].icon}</span><span class="tile-name">${DIREITOS[i].nome}</span>`;
        }
        if (depois) t.classList.add('revelado-depois');
        t.dataset.revelado = '1';
    }

    function iniciar() {
        const valor = bet.value;
        if (saldo.valor < valor) return;
        saldo.valor -= valor;
        apostaAtual = valor;
        acertos = 0;
        emJogo = true;
        updateBalance();

        // Sorteia onde estão as reformas
        mapa = Array(TOTAL).fill(false);
        let colocadas = 0;
        while (colocadas < reformas) {
            const i = Math.floor(Math.random() * TOTAL);
            if (!mapa[i]) { mapa[i] = true; colocadas++; }
        }

        montarGrade();
        tiles.forEach((t) => t.classList.add('jogavel'));
        ballEl.classList.remove('perdeu', 'ganhou');
        ballEl.classList.add('ativa');
        showMessage(message, pick([
            '🔮 A fumaça se espalha... escolha um direito para consultar',
            '💨 Acenda um cigarro e toque na névoa. A bola vai responder',
            '🕯️ Os espíritos da CLT estão ouvindo. Escolha com sabedoria',
        ]));
        render();
    }

    function revelar(i) {
        if (!emJogo || tiles[i].dataset.revelado) return;

        // Modo streamer: se clicou numa reforma, ela "foge" para outro cartão ainda escondido
        if (MODO_STREAMER && mapa[i]) {
            const destino = tiles.findIndex((t, j) => !t.dataset.revelado && !mapa[j]);
            if (destino >= 0) {
                mapa[destino] = true;
                mapa[i] = false;
            }
        }

        if (mapa[i]) {
            // Achou a reforma: perdeu tudo
            mostrarTile(i, { fatal: true });
            emJogo = false;
            tiles.forEach((_, j) => { if (!tiles[j].dataset.revelado) mostrarTile(j, { depois: true }); });
            ballEl.classList.remove('ativa');
            ballEl.classList.add('perdeu');
            showMessage(message, pick([
                `💨 A fumaça revelou: reforma! Lá se vão R$ ${formatBRL(apostaAtual)} e o seu ${DIREITOS[i].nome.toLowerCase()}`,
                '🔮 A bola de cristal avisou: a reforma sempre vem',
                '⚖️ Getúlio aparece em espírito para lamentar sua perda',
                '😔 O Krepinho olhou na bola e ficou triste... você também perdeu',
                '📉 Direitos flexibilizados com sucesso. Bem-vindo à indústria do Loss™',
            ]), 'lose');
            render();
            checkBroke(message);
            return;
        }

        acertos++;
        mostrarTile(i);
        if (acertos === TOTAL - reformas) {
            sacar(true);
            return;
        }
        showMessage(message, `✅ ${DIREITOS[i].nome} mantido! A bola brilha... ${fmtMult(multiplicador(acertos))}. Arriscar mais um?`);
        render();
    }

    function sacar(todos = false) {
        if (!emJogo || acertos === 0) return;
        const premio = Math.floor(apostaAtual * multiplicador(acertos) * 100) / 100;
        saldo.valor += premio;
        emJogo = false;
        tiles.forEach((_, j) => { if (!tiles[j].dataset.revelado) mostrarTile(j, { depois: true }); });
        ballEl.classList.remove('ativa');
        ballEl.classList.add('ganhou');
        updateBalance();
        showMessage(message, todos
            ? `🌟 Todos os direitos mantidos! Um milagre que nem a CLT previa: +R$ ${formatBRL(premio)}`
            : pick([
                `🔮 Você saiu antes da reforma chegar! +R$ ${formatBRL(premio)} (fictícios)`,
                `💰 "Acabei de ganhar R$ ${formatBRL(premio)} na bola de cristal!" - SuperChat`,
                `✨ A fumaça foi generosa: +R$ ${formatBRL(premio)}. Nas bets reais ela não é`,
                `🎶 Krepe celebra ao som de "Clocks"! +R$ ${formatBRL(premio)}`,
            ]), 'win');
        render();
    }

    function onButton() {
        if (emJogo) sacar();
        else iniciar();
    }

    function render() {
        optionButtons.forEach(({ n, el }) => {
            el.classList.toggle('ativo', n === reformas);
            el.disabled = emJogo;
        });
        betInput.disabled = emJogo;
        betButtons.forEach((b) => { b.disabled = emJogo; });

        if (emJogo) {
            const atual = multiplicador(acertos);
            const proximo = multiplicador(acertos + 1);
            labelEl.textContent = acertos === 0 ? 'Escolha um direito' : `${acertos} direito${acertos > 1 ? 's' : ''} mantido${acertos > 1 ? 's' : ''}`;
            multEl.textContent = fmtMult(atual);
            nextEl.textContent = `próximo: ${fmtMult(proximo)}`;
            btnText.textContent = 'SACAR';
            priceEl.textContent = formatBRL(Math.floor(apostaAtual * atual * 100) / 100);
            btn.disabled = acertos === 0;
        } else {
            labelEl.textContent = ballEl.classList.contains('perdeu') ? 'A reforma venceu' : 'A bola aguarda';
            multEl.textContent = ballEl.classList.contains('perdeu') ? '💨' : fmtMult(multiplicador(1));
            nextEl.innerHTML = ballEl.classList.contains('perdeu') ? '&nbsp;' : '1º direito paga';
            btnText.textContent = 'CONSULTAR A BOLA';
            priceEl.textContent = formatBRL(bet ? bet.value : 0);
            btn.disabled = !bet || saldo.valor < bet.value;
        }
    }

    bet = createBetControl({
        input: betInput,
        decrease: betButtons[0],
        increase: betButtons[1],
        onChange: () => render(),
    });

    montarGrade();
    btn.addEventListener('click', onButton);
    render();
    showMessage(message, '🔮 Escolha quantas reformas se escondem na fumaça e consulte a bola');

    return { refresh: render };
})();

onBalanceChange(bola.refresh);
updateBalance();
