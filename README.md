# 🔮 CROEBET - Salão dos Arcanos

<div align="center">

![Status](https://img.shields.io/badge/status-paródia-red)
![Dinheiro Real](https://img.shields.io/badge/dinheiro%20real-NÃO-green)
![Diversão](https://img.shields.io/badge/diversão-SIM-yellow)

**⚠️ ESTA É UMA APLICAÇÃO DE PARÓDIA/SÁTIRA ⚠️**

Um cassino místico de mentirinha: roleta, caça-níqueis e bola de cristal, todos com saldo fictício.

</div>

---

## 💜 Inspiração

Este projeto nasceu do querido **[CROEBET original](https://github.com/bruno-fs/croebet)**, criado pelo **Bruno** ([bruno-fs](https://github.com/bruno-fs)) a partir das piadas do chat da **Croezinha**: o "cassino bem lofi" com o **Jogo do Krepinho**, em que o trabalhista Frederico Krepe vira oráculo esotérico, e uma lista de jogos místicos que "ainda estavam na fumaça".

Daqui pra frente, o Salão dos Arcanos pega essa ideia e tira alguns desses jogos do papel. Ficam do original:

- 🎨 O visual roxo e rosa, as fontes, os cards e as animações (`styles.css`)
- 💬 O humor: indústria do Loss™, Getúlio em espírito, SuperChats, Coldplay e o Krepinho triste
- 🃏 A lista de jogos místicos, agora com alguns jogáveis
- ⚖️ A crítica às bets e o aviso de que a casa sempre ganha

Obrigado, Bruno e chat da Croezinha (e Franceline), por alimentarem o meme. 💜

---

## 🎰 Jogos

| Jogo | Página | Como funciona |
|---|---|---|
| 🔮 **Jogo do Krepinho** (original) | `krepinho.html` | O caça-níquel do Croebet original, mantido como era: 3 símbolos místicos iguais pagam até 10x. Atalhos: `Espaço`/`Enter` gira, `+`/`-` muda a aposta, `R` reseta o saldo. |
| 🌙 **Roleta da Lua Cheia Trabalhista** | `roleta.html` | Roleta europeia (0 a 36). Clique na mesa para colocar fichas (botão direito tira). Número exato paga 36x, dúzia/coluna 3x, cor/par/metade 2x. Cada derrota leva um direito trabalhista. |
| 🃏 **Caça-Níqueis de Tarô** | `caca-niqueis.html` | Grade 3x3 com 5 linhas (3 horizontais + 2 diagonais). Arcanos de A Roda da Fortuna (25x) até A Morte (1x). |
| 🔮 **Bola de Cristal dos Direitos** | `bola-de-cristal.html` | 12 direitos escondidos na fumaça, com 1, 3, 5 ou 8 reformas no meio. Cada direito mantido aumenta o multiplicador; ache uma reforma e perde tudo. Saque quando quiser. |

Os outros cards (Baralho Cigano, Runas do Endividamento, Astrologia do CLT etc.) continuam desativados na página inicial, esperando a fumaça baixar.

O **saldo fictício** começa em R$ 1.000 e é compartilhado entre a Roleta, o Caça-Níqueis e a Bola de Cristal. Ele fica salvo no navegador (`localStorage`). Quando zera, clique na mensagem para resetar. O Jogo do Krepinho mantém o saldo próprio do original, que recomeça a cada visita.

---

## 🚀 Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # gera o site em dist/
```

### GitHub Pages

O workflow em `.github/workflows/deploy.yml` faz o build com Vite e publica `dist/` no GitHub Pages a cada push na `main`. No repositório, vá em **Settings > Pages** e escolha **GitHub Actions** como fonte. O `base: './'` no `vite.config.js` deixa o site funcionar tanto em `usuario.github.io/repo` quanto em domínio próprio.

---

## 🗂️ Estrutura

```
index.html              # Salão dos Arcanos: cards de todos os jogos
krepinho.html           # Jogo do Krepinho (página original do Croebet)
script.js               # Lógica original do Jogo do Krepinho
roleta.html / .js       # Roleta da Lua Cheia Trabalhista
caca-niqueis.html / .js # Caça-Níqueis de Tarô
bola-de-cristal.html / .js # Bola de Cristal dos Direitos
jogos.js                # Código comum: saldo, mensagens, controle de aposta
jogos.css               # Estilos específicos dos jogos
styles.css              # Visual base herdado do Croebet original
```

---

## ⚠️ Avisos Importantes

- ❌ **NÃO** é um site de apostas real e **NÃO** envolve dinheiro real
- ❌ **NÃO** deve ser usado como modelo para sites de apostas reais
- ✅ É uma crítica satírica à indústria de apostas: roleta e caça-níquel de verdade são desenhados para você perder

**Consciência de classe > Apostas esportivas**

### Se você precisa de ajuda

- 🆘 **Jogadores Anônimos**: [www.jogadoresanonimos.com.br](https://www.jogadoresanonimos.com.br/)
- 📞 **CVV** (Centro de Valorização da Vida): 188

---

## 📝 Licença

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Assim como o [original](https://github.com/bruno-fs/croebet), este projeto está sob a **Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional**, como exige a licença de obras derivadas.

- ✅ Pode compartilhar, adaptar e remixar
- 📝 Dando crédito (ao original e a este projeto)
- 🚫 **Sem fins comerciais**
- 🔄 Distribuindo sob a mesma licença

**Alterações em relação ao original:** o Jogo do Krepinho saiu de `index.html` para `krepinho.html` (com um link de volta ao hub); criação da Roleta, do Caça-Níqueis e da Bola de Cristal; página inicial transformada em hub de jogos; saldo compartilhado entre os jogos novos.

Veja o arquivo [LICENSE](LICENSE).

---

<div align="center">

**Lembre-se: Esta é uma PARÓDIA! Divirta-se com responsabilidade! 🎭**

</div>
