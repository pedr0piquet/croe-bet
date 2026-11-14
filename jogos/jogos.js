// ======================================================
// CROEBET - Salão dos Arcanos: código comum aos jogos
// Mesma lógica do script.js da raiz: saldo fictício, nada real.
// O saldo fica salvo no navegador para ser o mesmo em todas as páginas.
// ======================================================

export const SALDO_INICIAL = 1000;

// Modo streamer: as páginas em /streamer/ têm <html data-modo="streamer">.
// Igual às "contas demo" de influenciador de bet: o jogo é o mesmo, mas a casa deixa ganhar.
export const MODO_STREAMER = document.documentElement.dataset.modo === 'streamer';

// Saldo separado para o streamer não inflar o saldo das páginas normais
const CHAVE_SALDO = MODO_STREAMER ? 'croebet-saldo-streamer' : 'croebet-saldo';

function lerSaldo() {
    try {
        const v = parseFloat(localStorage.getItem(CHAVE_SALDO));
        return Number.isFinite(v) && v >= 0 ? v : SALDO_INICIAL;
    } catch {
        return SALDO_INICIAL;
    }
}

// Objeto (e não variável solta) para os jogos poderem alterar o valor
export const saldo = { valor: lerSaldo() };

const balanceElement = document.getElementById('balance');
const balanceListeners = [];

export const formatBRL = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function onBalanceChange(fn) {
    balanceListeners.push(fn);
}

export function updateBalance() {
    saldo.valor = Math.round(saldo.valor * 100) / 100;
    if (balanceElement) balanceElement.textContent = `R$ ${formatBRL(saldo.valor)}`;
    try {
        localStorage.setItem(CHAVE_SALDO, String(saldo.valor));
    } catch {
        // navegação privada / armazenamento bloqueado: segue só em memória
    }
    balanceListeners.forEach((fn) => fn());
}

export function showMessage(el, text, type = '') {
    el.textContent = text;
    el.className = `result-message ${type}`.trim();
    el.style.cursor = 'default';
    el.onclick = null;
}

// Se o saldo acabou, a mensagem vira um botão de reset (igual ao jogo do Krepinho)
export function checkBroke(el) {
    if (saldo.valor >= 1) return;
    showMessage(el, '💸 Sem saldo! Mas relaxa, clique aqui para resetar! 💸', 'lose');
    el.style.cursor = 'pointer';
    el.onclick = () => {
        resetarSaldo();
        showMessage(el, '💰 Saldo resetado! Os astros te dão mais uma chance 💰');
    };
}

// Controle de aposta reaproveitado em todos os jogos (botões - / + e input)
export function createBetControl({ input, decrease, increase, onChange }) {
    const state = { value: parseInt(input.value, 10) || 10 };
    const set = (v) => {
        state.value = Math.max(1, Math.min(1000, Math.round(v) || 1));
        input.value = state.value;
        onChange?.(state.value);
    };
    decrease.addEventListener('click', () => set(state.value - 10));
    increase.addEventListener('click', () => set(state.value + 10));
    input.addEventListener('change', (e) => set(parseInt(e.target.value, 10)));
    set(state.value);
    return state;
}

// Volta o saldo para o inicial e avisa os jogos (a roleta, por exemplo, limpa as fichas da mesa)
export function resetarSaldo() {
    saldo.valor = SALDO_INICIAL;
    window.dispatchEvent(new CustomEvent('croebet:saldo-resetado'));
    updateBalance();
}

// Botão "↺ resetar" do topo, presente em todas as páginas
document.getElementById('resetSaldo')?.addEventListener('click', resetarSaldo);

// Mostra o saldo salvo assim que a página abre (também no hub, que não tem jogo)
updateBalance();

console.log('%c🌙 CROEBET - Salão dos Arcanos 🃏', 'font-size: 20px; color: #FF69B4; font-weight: bold;');
console.log('%c⚠️ ESTA É UMA PARÓDIA! Nenhum dinheiro real está envolvido.', 'font-size: 14px; color: #ff0000; font-weight: bold;');
