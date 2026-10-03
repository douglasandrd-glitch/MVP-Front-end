(() => {
    const chave = 'studyplanner-atividades';
    const dialogo = document.querySelector('#dialogo-atividade');
    const formulario = document.querySelector('#formulario-atividade');
    const lista = document.querySelector('#lista-atividades');
    const mensagem = document.querySelector('#mensagem-atividades');
    const erro = document.querySelector('#erro-formulario');
    const busca = document.querySelector('.pesquisa');
    const filtros = document.querySelectorAll('[data-filtro]');
    const coresTipo = { Tarefa: 'verde', Trabalho: 'amarela', Prova: 'vermelha' };
    const coresSituacao = { Pendente: 'cor2', 'Em andamento': 'cor3', 'Concluído': 'cor4' };
    const desfazer = document.querySelector('#desfazer-exclusao');
    const exemplos = Array.from(lista.querySelectorAll('.atividade'), (item, indice) => ({
        id: `exemplo-${indice + 1}`,
        titulo: item.querySelector('h4').textContent.trim(),
        disciplina: item.querySelector('h5').textContent.trim(),
        descricao: '',
        prazo: item.querySelector('.data').textContent.trim().split('/').reverse().join('-'),
        tipo: item.querySelector('.vermelha') ? 'Prova' : item.querySelector('.amarela') ? 'Trabalho' : 'Tarefa',
        situacao: item.querySelector('.situacao').textContent.trim()
    }));
    let filtroAtual = 'todos';
    let ultimaExclusao = null;
    let idEmEdicao = null;

    function prepararFormulario(atividade = null) {
        formulario.reset();
        formulario.querySelectorAll('input').forEach((input) => input.setCustomValidity(''));
        erro.textContent = '';
        idEmEdicao = atividade?.id || null;
        document.querySelector('#titulo-formulario').textContent = atividade ? 'Editar atividade' : 'Nova atividade';
        formulario.querySelector('[type="submit"]').textContent = atividade ? 'Salvar alterações' : 'Salvar atividade';
        if (atividade) {
            for (const nome of ['titulo', 'disciplina', 'tipo', 'prazo', 'situacao', 'descricao']) {
                formulario.elements.namedItem(nome).value = atividade[nome];
            }
        }
        dialogo.showModal();
    }

    function editarAtividade(id) {
        try {
            const atividades = lerAtividades();
            const atividade = atividades.find((item) => item.id === id);
            if (!atividade) {
                mostrarAtividades(atividades);
                mensagem.textContent = 'Esta atividade já foi excluída.';
                return;
            }
            prepararFormulario(atividade);
        } catch {
            mensagem.textContent = 'Não foi possível abrir a atividade para edição. Tente novamente.';
        }
    }

    function concluirAtividade(id) {
        try {
            const atividades = lerAtividades();
            const atividade = atividades.find((item) => item.id === id);
            if (!atividade) {
                mostrarAtividades(atividades);
                mensagem.textContent = 'Esta atividade já foi excluída.';
                return;
            }
            atividade.situacao = atividade.situacao === 'Concluído' ? 'Pendente' : 'Concluído';
            salvarAtividades(atividades);
            mostrarAtividades(atividades);
            mensagem.textContent = `Atividade “${atividade.titulo}” ${atividade.situacao === 'Concluído' ? 'concluída' : 'marcada como pendente'}.`;
            const item = Array.from(lista.children).find((item) => item.dataset.atividadeId === id && !item.hidden);
            (item?.querySelector('.concluir-atividade') || document.querySelector('[data-filtro][aria-pressed="true"]')).focus();
        } catch {
            mensagem.textContent = 'Não foi possível atualizar a situação da atividade. Tente novamente.';
        }
    }

    function salvarAtividades(atividades) {
        localStorage.setItem(chave, JSON.stringify({ versao: 2, atividades }));
    }

    function lerAtividades() {
        const dados = JSON.parse(localStorage.getItem(chave) || '[]');
        const formatoAntigo = Array.isArray(dados);
        if (!formatoAntigo && dados?.versao !== 2) throw new Error('Formato de atividades inválido');
        const atividades = formatoAntigo ? dados : dados.atividades;
        if (!Array.isArray(atividades) || !atividades.every((atividade) =>
            atividade && typeof atividade.titulo === 'string' &&
            typeof atividade.disciplina === 'string' &&
            typeof atividade.descricao === 'string' &&
            typeof atividade.prazo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(atividade.prazo) &&
            Object.hasOwn(coresTipo, atividade.tipo) && Object.hasOwn(coresSituacao, atividade.situacao)
        )) throw new Error('Dados de atividades inválidos');
        if (formatoAntigo) {
            const migradas = [...atividades.map((atividade) => ({ ...atividade, id: crypto.randomUUID() })), ...exemplos];
            salvarAtividades(migradas);
            return migradas;
        }
        if (atividades.some((atividade) => typeof atividade.id !== 'string' || !atividade.id) ||
            new Set(atividades.map((atividade) => atividade.id)).size !== atividades.length) {
            throw new Error('Identificadores de atividades inválidos');
        }
        return atividades;
    }

    function elemento(tag, classe, texto) {
        const novo = document.createElement(tag);
        novo.className = classe;
        if (texto !== undefined) novo.textContent = texto;
        return novo;
    }

    function mostrarAtividades(atividades) {
        const fragmento = document.createDocumentFragment();
        atividades.forEach((atividade) => {
            const item = elemento('article', 'atividade');
            item.dataset.cadastrada = '';
            item.dataset.atividadeId = atividade.id;
            const bolinha = elemento('div', `bolinha ${coresTipo[atividade.tipo]}`);
            bolinha.setAttribute('aria-hidden', 'true');
            const conteudo = elemento('div', 'conteudo-atividade');
            conteudo.append(elemento('h4', '', atividade.titulo));
            conteudo.append(elemento('h5', '', `${atividade.disciplina} · ${atividade.tipo}`));
            const data = elemento('time', 'data', atividade.prazo.split('-').reverse().join('/'));
            data.dateTime = atividade.prazo;
            item.append(bolinha, conteudo, data, elemento('div', `situacao ${coresSituacao[atividade.situacao]}`, atividade.situacao));
            const acoes = elemento('div', 'acoes-atividade');
            acoes.setAttribute('role', 'group');
            acoes.setAttribute('aria-label', `Ações da atividade: ${atividade.titulo}`);
            const editar = elemento('button', 'editar-atividade', 'Editar');
            editar.type = 'button';
            editar.setAttribute('aria-label', `Editar atividade: ${atividade.titulo} (${atividade.disciplina})`);
            editar.addEventListener('click', () => editarAtividade(atividade.id));
            const concluida = atividade.situacao === 'Concluído';
            const concluir = elemento('button', 'concluir-atividade', concluida ? 'pedente' : 'Concluída');
            concluir.type = 'button';
            concluir.setAttribute('aria-label', `${concluida ? 'Marcar como pendente' : 'Concluir atividade'}: ${atividade.titulo} (${atividade.disciplina})`);
            concluir.title = concluida ? 'Clique para voltar a pendente' : 'Clique para concluir';
            concluir.addEventListener('click', () => concluirAtividade(atividade.id));
            const excluir = elemento('button', 'excluir-atividade', 'Excluir');
            excluir.type = 'button';
            excluir.setAttribute('aria-label', `Excluir atividade: ${atividade.titulo} (${atividade.disciplina})`);
            excluir.addEventListener('click', () => excluirAtividade(atividade.id));
            acoes.append(editar, concluir, excluir);
            const rodape = elemento('div', 'rodape-atividade');
            if (atividade.descricao) {
                const anotacoes = elemento('div', 'anotacoes-atividade');
                anotacoes.append(elemento('strong', '', 'Anotações:'));
                anotacoes.append(elemento('p', 'descricao-atividade', atividade.descricao));
                rodape.append(anotacoes);
            }
            rodape.append(acoes);
            item.append(rodape);
            fragmento.append(item);
        });
        lista.replaceChildren(fragmento);
        filtrarAtividades();
    }

    function excluirAtividade(id) {
        try {
            const atividades = lerAtividades();
            const indice = atividades.findIndex((atividade) => atividade.id === id);
            if (indice === -1) {
                mostrarAtividades(atividades);
                mensagem.textContent = 'Esta atividade já foi excluída.';
                return;
            }
            const [atividade] = atividades.splice(indice, 1);
            salvarAtividades(atividades);
            ultimaExclusao = { atividade, indice };
            mostrarAtividades(atividades);
            mensagem.textContent = `Atividade “${atividade.titulo}” excluída.`;
            desfazer.hidden = false;
            desfazer.focus();
        } catch {
            mensagem.textContent = 'Não foi possível excluir a atividade. Verifique o armazenamento do navegador e tente novamente.';
        }
    }

    desfazer.addEventListener('click', () => {
        if (!ultimaExclusao) return;
        try {
            const atividades = lerAtividades();
            const { atividade, indice } = ultimaExclusao;
            if (!atividades.some((item) => item.id === atividade.id)) atividades.splice(indice, 0, atividade);
            salvarAtividades(atividades);
            mostrarAtividades(atividades);
            mensagem.textContent = `Atividade “${atividade.titulo}” restaurada.`;
            ultimaExclusao = null;
            desfazer.hidden = true;
            document.querySelector('#nova-atividade').focus();
        } catch {
            mensagem.textContent = 'Não foi possível restaurar a atividade. Tente novamente.';
        }
    });

    function normalizar(texto) {
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function filtrarAtividades() {
        const termo = normalizar(busca.value.trim());
        let visiveis = 0;
        lista.querySelectorAll('.atividade').forEach((item) => {
            const situacao = item.querySelector('.situacao').textContent.trim();
            const texto = `${item.querySelector('.conteudo-atividade').textContent} ${item.querySelector('.descricao-atividade')?.textContent || ''} ${item.querySelector('.data').textContent} ${situacao}`;
            item.hidden = !(normalizar(texto).includes(termo) &&
                (filtroAtual === 'todos' || situacao === filtroAtual));
            if (!item.hidden) visiveis++;
        });
        const vazio = document.querySelector('#lista-vazia');
        vazio.hidden = visiveis !== 0;
        vazio.textContent = lista.children.length ? 'Nenhuma atividade encontrada para esta busca.' : 'Nenhuma atividade cadastrada. Clique em + Nova atividade para começar.';
        filtros.forEach((botao) => botao.setAttribute('aria-pressed', String(botao.dataset.filtro === filtroAtual)));
    }

    document.querySelector('#nova-atividade').addEventListener('click', () => {
        prepararFormulario();
    });
    document.querySelectorAll('[data-fechar-formulario]').forEach((botao) => {
        botao.addEventListener('click', () => dialogo.close());
    });
    dialogo.addEventListener('close', () => {
        idEmEdicao = null;
        formulario.reset();
        formulario.querySelectorAll('input').forEach((input) => input.setCustomValidity(''));
        erro.textContent = '';
    });
    formulario.addEventListener('input', (evento) => {
        if (evento.target instanceof HTMLInputElement) evento.target.setCustomValidity('');
    });
    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        for (const nome of ['titulo', 'disciplina']) {
            const input = formulario.elements.namedItem(nome);
            input.value = input.value.trim();
            input.setCustomValidity(input.value ? '' : 'Preencha este campo.');
        }
        if (!formulario.reportValidity()) return;
        const atividade = Object.fromEntries(new FormData(formulario));
        const editando = idEmEdicao !== null;
        atividade.id = idEmEdicao || crypto.randomUUID();
        atividade.descricao = atividade.descricao.trim();
        let atividades;
        try {
            atividades = lerAtividades();
            if (editando) {
                const indice = atividades.findIndex((item) => item.id === idEmEdicao);
                if (indice === -1) {
                    erro.textContent = 'Esta atividade foi excluída em outra aba. Feche o formulário para continuar.';
                    return;
                }
                atividades[indice] = atividade;
            } else {
                atividades.unshift(atividade);
            }
            salvarAtividades(atividades);
        } catch {
            erro.textContent = 'Não foi possível salvar neste navegador. Seus campos foram mantidos. Verifique o armazenamento disponível e tente novamente.';
            return;
        }
        busca.value = '';
        filtroAtual = 'todos';
        mostrarAtividades(atividades);
        dialogo.close();
        mensagem.textContent = `Atividade “${atividade.titulo}” ${editando ? 'atualizada' : 'adicionada'}. Salva neste navegador.`;
        if (editando) {
            Array.from(lista.children).find((item) => item.dataset.atividadeId === atividade.id)?.querySelector('.editar-atividade').focus();
        }
    });
    busca.addEventListener('input', filtrarAtividades);
    filtros.forEach((botao) => botao.addEventListener('click', () => {
        filtroAtual = botao.dataset.filtro;
        filtrarAtividades();
    }));
    try {
        mostrarAtividades(lerAtividades());
    } catch {
        mensagem.textContent = 'Não foi possível carregar as atividades salvas neste navegador.';
    }
})();
