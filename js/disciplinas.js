(() => {
    const lista = document.querySelector('.disciplinas-grid');
    const modal = document.querySelector('#formulario-disciplina');
    const formulario = document.querySelector('#dados-disciplina');
    const exclusao = document.querySelector('#confirmar-exclusao');
    const adicionar = document.querySelector('#adicionar-disciplina');
    const feedback = document.querySelector('#feedback-disciplinas');
    const campos = ['nome', 'professor', 'horario', 'sala', 'semestre', 'anotacoes'];
    const modelo = lista.querySelector('.card-disciplina').cloneNode(true);
    let cardEditado = null;
    let cardExcluido = null;
    let proximoId = 5;
    let temporizador;

    // O estado vive somente no DOM desta página. Não há persistência nem requisições.
    function avisar(mensagem) {
        clearTimeout(temporizador);
        feedback.textContent = mensagem;
        temporizador = setTimeout(() => { feedback.textContent = ''; }, 4000);
        document.querySelector('#disciplinas-vazias').hidden = lista.children.length > 0;
    }

    function abrirFormulario(card = null) {
        cardEditado = card;
        formulario.reset();
        campos.forEach((campo) => {
            formulario.elements[campo].value = card?.dataset[campo] || '';
        });
        if (card) formulario.elements.nome.value = card.querySelector('h3').textContent;
        formulario.elements.nome.setCustomValidity('');
        modal.querySelector('h2').textContent = card ? 'Editar disciplina' : 'Adicionar disciplina';
        formulario.querySelector('[type="submit"]').textContent = card ? 'Salvar alterações' : 'Salvar disciplina';
        modal.showModal();
    }

    function criarCard() {
        const card = modelo.cloneNode(true);
        const id = proximoId++;
        card.querySelector('h3').id = `disciplina-${id}`;
        card.setAttribute('aria-labelledby', `disciplina-${id}`);
        card.querySelector('.acoes-disciplina').id = `acoes-${id}`;
        card.querySelector('.abrir-acoes').setAttribute('aria-controls', `acoes-${id}`);
        card.querySelector('.resumo-disciplina').textContent = '0 atividades';
        const progresso = card.querySelector('progress');
        progresso.id = `progresso-${id}`;
        progresso.value = 0;
        progresso.textContent = '0%';
        const rotulo = card.querySelector('.progresso-disciplina label');
        rotulo.htmlFor = progresso.id;
        rotulo.textContent = 'Nenhuma atividade cadastrada';
        const item = document.createElement('li');
        item.textContent = 'Nenhuma atividade nesta disciplina.';
        card.querySelector('.atividades-disciplina ul').replaceChildren(item);
        return card;
    }

    function atualizarCard(card, dados) {
        campos.forEach((campo) => { card.dataset[campo] = dados[campo]; });
        card.querySelector('h3').textContent = dados.nome;
        const valores = [dados.professor || 'Não informado', dados.horario || 'A definir',
            dados.sala || 'A definir', dados.semestre || 'Não informado'];
        card.querySelectorAll('dd').forEach((elemento, indice) => { elemento.textContent = valores[indice]; });
        card.querySelector('.anotacoes-disciplina p').textContent = dados.anotacoes || 'Sem anotações.';
        card.querySelector('summary .sr-only').textContent = `de ${dados.nome}`;
        card.querySelector('.abrir-acoes').setAttribute('aria-label', `Opções de ${dados.nome}`);
        card.querySelector('.acoes-disciplina').setAttribute('aria-label', `Ações de ${dados.nome}`);
        card.querySelector('[data-acao="editar"]').setAttribute('aria-label', `Editar ${dados.nome}`);
        card.querySelector('[data-acao="excluir"]').setAttribute('aria-label', `Excluir ${dados.nome}`);
    }

    function fecharMenus() {
        lista.querySelectorAll('.abrir-acoes').forEach((botao) => {
            botao.setAttribute('aria-expanded', 'false');
            botao.nextElementSibling.hidden = true;
        });
    }
    document.addEventListener('click', (evento) => {
        if (!evento.target.closest('.menu-disciplina')) fecharMenus();
    });
    document.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') return;
        const aberto = lista.querySelector('.abrir-acoes[aria-expanded="true"]');
        if (aberto) {
            fecharMenus();
            aberto.focus();
        }
    });
    lista.addEventListener('focusout', (evento) => {
        const menu = evento.target.closest('.menu-disciplina');
        if (menu && !menu.contains(evento.relatedTarget)) fecharMenus();
    });

    adicionar.addEventListener('click', () => abrirFormulario());
    lista.addEventListener('click', (evento) => {
        const abrir = evento.target.closest('.abrir-acoes');
        if (abrir) {
            const estavaAberto = abrir.getAttribute('aria-expanded') === 'true';
            fecharMenus();
            if (!estavaAberto) {
                abrir.setAttribute('aria-expanded', 'true');
                abrir.nextElementSibling.hidden = false;
            }
            return;
        }
        const botao = evento.target.closest('[data-acao]');
        if (!botao) return;
        const card = botao.closest('.card-disciplina');
        fecharMenus();
        card.querySelector('.abrir-acoes').focus();
        if (botao.dataset.acao === 'editar') abrirFormulario(card);
        else {
            cardExcluido = card;
            exclusao.querySelector('.nome-exclusao').textContent = card.querySelector('h3').textContent;
            exclusao.showModal();
        }
    });

    formulario.elements.nome.addEventListener('input', () => formulario.elements.nome.setCustomValidity(''));
    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const dados = Object.fromEntries(campos.map((campo) => [campo, formulario.elements[campo].value.trim()]));
        if (!dados.nome) {
            formulario.elements.nome.setCustomValidity('Informe o nome da disciplina.');
            formulario.elements.nome.reportValidity();
            return;
        }
        const editando = Boolean(cardEditado);
        const card = cardEditado || criarCard();
        atualizarCard(card, dados);
        if (!editando) lista.append(card);
        modal.close();
        card.querySelector('.abrir-acoes').focus();
        avisar(editando ? 'Alterações aplicadas na tela.' : 'Disciplina adicionada à tela.');
    });

    document.querySelector('#remover-disciplina').addEventListener('click', () => {
        if (!cardExcluido) return;
        cardExcluido.remove();
        cardExcluido = null;
        exclusao.close();
        adicionar.focus();
        avisar('Disciplina removida da tela.');
    });
    document.querySelectorAll('[data-fechar]').forEach((botao) => {
        botao.addEventListener('click', () => botao.closest('dialog').close());
    });
})();
