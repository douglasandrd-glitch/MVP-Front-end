(() => {
    const chave = 'studyplanner-tema';
    const raiz = document.documentElement;
    const preferenciaSistema = window.matchMedia('(prefers-color-scheme: dark)');
    let temaSalvo;

    try {
        temaSalvo = localStorage.getItem(chave);
    } catch {
        // O tema continua funcionando quando o navegador bloqueia o armazenamento.
    }

    if (temaSalvo !== 'claro' && temaSalvo !== 'escuro') temaSalvo = null;

    function aplicarTema(tema) {
        raiz.dataset.tema = tema;
        document.querySelectorAll('[data-alternar-tema]').forEach((botao) => {
            const descricao = tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo noturno';
            botao.setAttribute('aria-label', descricao);
            botao.setAttribute('title', descricao);
        });
    }

    aplicarTema(temaSalvo || (preferenciaSistema.matches ? 'escuro' : 'claro'));

    document.addEventListener('DOMContentLoaded', () => {
        aplicarTema(raiz.dataset.tema);
        document.querySelectorAll('[data-alternar-tema]').forEach((botao) => {
            botao.addEventListener('click', () => {
                temaSalvo = raiz.dataset.tema === 'escuro' ? 'claro' : 'escuro';
                aplicarTema(temaSalvo);
                try {
                    localStorage.setItem(chave, temaSalvo);
                } catch {
                    // Mantém a escolha nesta página mesmo sem armazenamento.
                }
            });
        });
    });

    preferenciaSistema.addEventListener('change', (evento) => {
        if (!temaSalvo) aplicarTema(evento.matches ? 'escuro' : 'claro');
    });
})();
