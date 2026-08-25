// =========================================================================
// SCRIPT ADMINISTRATIVO - MEMORIAL DESCRITIVO
// VERSÃO COM SINCRONIZAÇÃO FIREBASE
// =========================================================================

let currentPage = 1;
const itemsPerPage = 10;
let listaMemoriaisGlobal = [];

// E-mail padrão caso ainda não exista configuração no Firebase
const EMAILS_PADRAO = ['admin@unifecaf.com.br'];


// =========================================================================
// INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // Escuta memoriais em tempo real
    escutarMemoriaisEmTempoReal();

    // Escuta e-mails ADM em tempo real
    escutarEmailsAdmEmTempoReal();

});


// =========================================================================
// PROTEÇÃO CONTRA HTML / XSS
// =========================================================================

function escaparHTML(str) {

    if (!str) return '';

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// =========================================================================
// MEMORIAIS - SINCRONIZAÇÃO EM TEMPO REAL
// =========================================================================

function escutarMemoriaisEmTempoReal() {

    if (typeof db === 'undefined') {

        console.error(
            'Erro: O Firestore não foi inicializado.'
        );

        return;
    }

    db.collection('memoriais')
        .orderBy('criadoEm', 'desc')
        .onSnapshot(

            (snapshot) => {

                listaMemoriaisGlobal = [];

                snapshot.forEach((doc) => {

                    listaMemoriaisGlobal.push({

                        // ID REAL DO DOCUMENTO FIRESTORE
                        firestoreId: doc.id,

                        // Dados salvos no documento
                        ...doc.data()

                    });

                });

                carregarMemoriais();

            },

            (error) => {

                console.error(
                    'Erro ao sincronizar memoriais:',
                    error
                );

            }

        );

}


// =========================================================================
// CARREGAMENTO DA TABELA
// =========================================================================

function carregarMemoriais() {

    const tbody = document.getElementById(
        'memorialsTableBody'
    );

    if (!tbody) return;


    // ---------------------------------------------------------
    // IMPORTANTE:
    // O PAINEL PRINCIPAL MOSTRA SOMENTE PENDENTES
    // ---------------------------------------------------------

    const listaPendentes = listaMemoriaisGlobal.filter(item => {

        const status = String(
            item.status || 'PENDENTE'
        ).toUpperCase();

        return status === 'PENDENTE';

    });


    // ---------------------------------------------------------
    // CONTADORES
    // ---------------------------------------------------------

    const countPendente = listaMemoriaisGlobal.filter(item => {

        const status = String(
            item.status || 'PENDENTE'
        ).toUpperCase();

        return status === 'PENDENTE';

    }).length;


    const countAprovado = listaMemoriaisGlobal.filter(item => {

        const status = String(
            item.status || ''
        ).toUpperCase();

        return status === 'APROVADO';

    }).length;


    const elementoPendente =
        document.getElementById('countPendente');

    const elementoAprovado =
        document.getElementById('countAprovado');


    if (elementoPendente) {

        elementoPendente.innerText =
            countPendente;

    }


    if (elementoAprovado) {

        elementoAprovado.innerText =
            countAprovado;

    }


    // ---------------------------------------------------------
    // NENHUM MEMORIAL PENDENTE
    // ---------------------------------------------------------

    if (listaPendentes.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    class="py-12 px-4 text-center text-slate-400 font-medium">

                    Nenhum memorial pendente no momento.

                </td>
            </tr>
        `;

        updatePaginationControls(
            0,
            0,
            0,
            1
        );

        return;

    }


    // ---------------------------------------------------------
    // PAGINAÇÃO
    // ---------------------------------------------------------

    const totalItems =
        listaPendentes.length;

    const totalPages =
        Math.ceil(totalItems / itemsPerPage);


    if (currentPage > totalPages) {

        currentPage = totalPages;

    }


    if (currentPage < 1) {

        currentPage = 1;

    }


    const startIndex =
        (currentPage - 1) * itemsPerPage;


    const endIndex =
        Math.min(
            startIndex + itemsPerPage,
            totalItems
        );


    const paginatedItems =
        listaPendentes.slice(
            startIndex,
            endIndex
        );


    tbody.innerHTML = '';


    // ---------------------------------------------------------
    // RENDERIZA OS MEMORIAIS
    // ---------------------------------------------------------

    paginatedItems.forEach(item => {

        const poloNome =
            item.polo
                ? escaparHTML(item.polo)
                : 'Sem Nome';


        const emailContato =
            item.email || item.emailContato
                ? escaparHTML(
                    item.email ||
                    item.emailContato
                )
                : 'Não informado';


        const dataEnvio =
            item.dataEnvio
                ? escaparHTML(item.dataEnvio)
                : 'N/A';


        const tr =
            document.createElement('tr');


        tr.className =
            'hover:bg-slate-50 border-b border-slate-100 transition-colors';


        tr.innerHTML = `

            <td class="p-4 font-semibold text-slate-700">
                ${poloNome}
            </td>

            <td class="p-4 text-slate-500">
                ${emailContato}
            </td>

            <td class="p-4 text-slate-500">
                ${dataEnvio}
            </td>

            <td class="p-4">

                <span class="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full">

                    PENDENTE

                </span>

            </td>

            <td class="p-4 text-center">

                <button

                    onclick="analisarMemorial('${item.firestoreId}')"

                    class="bg-[#1A3666]
                    hover:bg-slate-800
                    text-white
                    px-4
                    py-2
                    rounded-xl
                    text-xs
                    font-bold
                    transition-all
                    shadow-sm
                    cursor-pointer">

                    Analisar / Validar

                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });


    updatePaginationControls(

        startIndex + 1,

        endIndex,

        totalItems,

        totalPages

    );

}


// =========================================================================
// PAGINAÇÃO
// =========================================================================

function updatePaginationControls(
    start,
    end,
    total,
    totalPages
) {

    const info =
        document.getElementById(
            'paginationInfo'
        );


    const indicator =
        document.getElementById(
            'pageIndicator'
        );


    const btnPrev =
        document.getElementById(
            'btnPrevPage'
        );


    const btnNext =
        document.getElementById(
            'btnNextPage'
        );


    if (info) {

        info.textContent =
            total > 0
                ? `Mostrando ${start}–${end} de ${total}`
                : 'Mostrando 0 de 0';

    }


    if (indicator) {

        indicator.textContent =
            `Página ${currentPage} de ${totalPages || 1}`;

    }


    if (btnPrev) {

        btnPrev.disabled =
            currentPage <= 1;

    }


    if (btnNext) {

        btnNext.disabled =
            currentPage >= totalPages ||
            totalPages === 0;

    }

}


function changePage(direction) {

    currentPage += direction;

    carregarMemoriais();

}


// =========================================================================
// E-MAILS DOS ADMINISTRADORES
// =========================================================================

// IMPORTANTE:
// Agora os e-mails ficam no FIRESTORE.
//
// Coleção:
// configuracoes
//
// Documento:
// administradores
//
// Campo:
// emails
//
// Exemplo:
//
// configuracoes
//    └── administradores
//          └── emails:
//               - admin@unifecaf.com.br
//               - outro@unifecaf.com.br


let emailsAdmGlobal = [...EMAILS_PADRAO];


// =========================================================================
// ESCUTA OS E-MAILS EM TEMPO REAL
// =========================================================================

function escutarEmailsAdmEmTempoReal() {

    if (typeof db === 'undefined') {

        console.error(
            'Firestore não inicializado.'
        );

        return;

    }


    db.collection('configuracoes')
        .doc('administradores')
        .onSnapshot(

            async (doc) => {

                // ---------------------------------------------------------
                // SE O DOCUMENTO NÃO EXISTIR
                // ---------------------------------------------------------

                if (!doc.exists) {

                    try {

                        await db
                            .collection('configuracoes')
                            .doc('administradores')
                            .set({

                                emails:
                                    EMAILS_PADRAO

                            });

                        emailsAdmGlobal =
                            [...EMAILS_PADRAO];

                        renderizarListaEmailsAdm();

                    } catch (error) {

                        console.error(
                            'Erro ao criar configuração de administradores:',
                            error
                        );

                    }

                    return;

                }


                // ---------------------------------------------------------
                // DOCUMENTO EXISTE
                // ---------------------------------------------------------

                const dados =
                    doc.data() || {};


                const emails =
                    Array.isArray(dados.emails)
                        ? dados.emails
                        : EMAILS_PADRAO;


                emailsAdmGlobal =
                    [...emails];


                // Mantém também uma cópia local
                // apenas como cache.

                localStorage.setItem(
                    'listaEmailsAdm',
                    JSON.stringify(
                        emailsAdmGlobal
                    )
                );


                renderizarListaEmailsAdm();

            },

            (error) => {

                console.error(
                    'Erro ao sincronizar e-mails ADM:',
                    error
                );

                // Tenta usar cache local
                // caso exista.

                const salvos =
                    localStorage.getItem(
                        'listaEmailsAdm'
                    );


                if (salvos) {

                    try {

                        emailsAdmGlobal =
                            JSON.parse(salvos);

                    } catch (e) {

                        emailsAdmGlobal =
                            [...EMAILS_PADRAO];

                    }

                }


                renderizarListaEmailsAdm();

            }

        );

}


// =========================================================================
// OBTER E-MAILS ADM
// =========================================================================

function obterEmailsAdm() {

    return [
        ...emailsAdmGlobal
    ];

}


// =========================================================================
// SALVAR E-MAILS NO FIRESTORE
// =========================================================================

async function salvarEmailsAdm(emails) {

    if (typeof db === 'undefined') {

        throw new Error(
            'Firestore não inicializado.'
        );

    }

    const emailsNormalizados = emails
        .map(email =>
            String(email)
                .trim()
                .toLowerCase()
        )
        .filter(Boolean);

    await db
        .collection('configuracoes')
        .doc('administradores')
        .set({
            emails: emailsNormalizados,

            atualizadoEm:
                firebase.firestore.FieldValue.serverTimestamp()
        });

    // Atualiza cache local
    emailsAdmGlobal = [
        ...emailsNormalizados
    ];

    localStorage.setItem(
        'listaEmailsAdm',
        JSON.stringify(
            emailsNormalizados
        )
    );
}

// =========================================================================
// ABRIR / FECHAR CONFIGURAÇÃO DE E-MAILS
// =========================================================================

function toggleConfigEmails() {

    const box =
        document.getElementById(
            'boxConfigEmails'
        );


    const icon =
        document.getElementById(
            'iconChevron'
        );


    if (box && icon) {

        box.classList.toggle(
            'hidden'
        );

        icon.classList.toggle(
            'rotate-180'
        );

    }

}


// =========================================================================
// RENDERIZAR E-MAILS
// =========================================================================

function renderizarListaEmailsAdm() {

    const container =
        document.getElementById(
            'listaEmailsAdm'
        );


    const badge =
        document.getElementById(
            'badgeQtdEmails'
        );


    if (!container) return;


    const emails =
        obterEmailsAdm();


    if (badge) {

        badge.innerText =
            `${emails.length} e-mail${emails.length !== 1 ? 's' : ''}`;

    }


    if (emails.length === 0) {

        container.innerHTML = `
            <span class="text-xs text-slate-400 italic">
                Nenhum e-mail de administrador cadastrado.
            </span>
        `;

        return;

    }


    container.innerHTML =
        emails
            .map((email, index) => `

                <span
                    class="inline-flex
                    items-center
                    gap-2
                    px-3
                    py-1.5
                    bg-white
                    border
                    border-slate-200
                    rounded-xl
                    text-xs
                    font-semibold
                    text-slate-700
                    shadow-xs">

                    ${escaparHTML(email)}

                    <button

                        onclick="removerEmailAdm(${index})"

                        class="text-slate-400
                        hover:text-red-500
                        font-bold
                        ml-1
                        cursor-pointer">

                        ✕

                    </button>

                </span>

            `)
            .join('');

}


// =========================================================================
// ADICIONAR E-MAIL ADM
// =========================================================================

async function adicionarEmailAdm() {

    const input =
        document.getElementById(
            'novoEmailAdmInput'
        );


    if (!input) return;


    const novoEmail =
        input.value
            .trim()
            .toLowerCase();


    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(novoEmail)) {

        Swal.fire(
            'E-mail Inválido',
            'Por favor, informe um endereço de e-mail válido.',
            'warning'
        );

        return;

    }


    const emails =
        obterEmailsAdm();


    if (emails.includes(novoEmail)) {

        Swal.fire(
            'Atenção',
            'Este e-mail já está cadastrado na lista.',
            'info'
        );

        return;

    }


    emails.push(novoEmail);


    try {

        // SALVA NO FIREBASE
        await salvarEmailsAdm(emails);


        input.value = '';


        renderizarListaEmailsAdm();


        Swal.fire({

            icon: 'success',

            title: 'E-mail Adicionado!',

            text:
                'O e-mail foi salvo no Firebase e será sincronizado com os outros computadores.',

            toast: true,

            position: 'top-end',

            showConfirmButton: false,

            timer: 2500

        });

    } catch (error) {

        console.error(
            'Erro ao adicionar e-mail ADM:',
            error
        );


        Swal.fire(
            'Erro',
            'Não foi possível salvar o e-mail no Firebase.',
            'error'
        );

    }

}


// =========================================================================
// REMOVER E-MAIL ADM
// =========================================================================

function removerEmailAdm(index) {

    const emails =
        obterEmailsAdm();


    if (emails.length <= 1) {

        Swal.fire(
            'Atenção',
            'É necessário manter ao menos um e-mail cadastrado.',
            'info'
        );

        return;

    }


    Swal.fire({

        title: 'Remover e-mail?',

        text:
            `Deseja remover "${emails[index]}" da lista?`,

        icon: 'warning',

        showCancelButton: true,

        confirmButtonText:
            'Sim, remover',

        cancelButtonText:
            'Cancelar',

        confirmButtonColor:
            '#F43F5E',

        cancelButtonColor:
            '#64748B'

    }).then(async (result) => {

        if (!result.isConfirmed) {
            return;
        }


        emails.splice(index, 1);


        try {

            // REMOVE DO FIREBASE
            await salvarEmailsAdm(emails);


            renderizarListaEmailsAdm();


            Swal.fire({

                icon: 'success',

                title: 'E-mail removido!',

                toast: true,

                position: 'top-end',

                showConfirmButton: false,

                timer: 2000

            });

        } catch (error) {

            console.error(
                'Erro ao remover e-mail ADM:',
                error
            );


            Swal.fire(
                'Erro',
                'Não foi possível remover o e-mail do Firebase.',
                'error'
            );

        }

    });

}


// =========================================================================
// GOOGLE APPS SCRIPT
// =========================================================================

const URL_GOOGLE_SCRIPT =
    'https://script.google.com/macros/s/AKfycbwmDh2tDlscfVGP7WnyS-piEKWqvNfJ9sgH0x5nLVBQYOTvBH7TrGtWxJPCcjGL2Vsi9w/exec';


// =========================================================================
// NOTIFICAR POLO
// =========================================================================

async function notificarPoloPorEmail(
    emailPolo,
    status,
    poloNome,
    motivo = ''
) {

    if (
        !emailPolo ||
        !emailPolo.includes('@')
    ) {

        console.warn(
            'E-mail do polo ausente ou inválido:',
            emailPolo
        );

        return;

    }


    const payload = {

        tipo:
            'STATUS_MEMORIAL',

        emailPolo:
            emailPolo,

        poloNome:
            poloNome || 'Polo',

        status:
            status,

        motivo:
            motivo

    };


    try {

        await fetch(
            URL_GOOGLE_SCRIPT,
            {

                method:
                    'POST',

                mode:
                    'no-cors',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify(payload)

            }
        );


        console.log(
            `Notificação de ${status} enviada para o Polo: ${emailPolo}`
        );

    } catch (error) {

        console.error(
            'Erro ao enviar notificação ao polo:',
            error
        );

    }

}


// =========================================================================
// NOTIFICAR ADMINISTRADORES
// =========================================================================

async function notificarAdmsNovoMemorial(
    poloNome,
    emailPolo
) {

    // AGORA PEGA DO FIREBASE / CACHE SINCRONIZADO
    const emailsDestinatarios =
        obterEmailsAdm();


    if (
        !emailsDestinatarios ||
        emailsDestinatarios.length === 0
    ) {

        console.warn(
            'Nenhum administrador cadastrado.'
        );

        return;

    }


    const payload = {

        tipo:
            'NOVO_MEMORIAL',

        emailsAdm:
            emailsDestinatarios,

        poloNome:
            poloNome,

        emailPolo:
            emailPolo

    };


    try {

        await fetch(
            URL_GOOGLE_SCRIPT,
            {

                method:
                    'POST',

                mode:
                    'no-cors',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify(payload)

            }
        );


        console.log(
            'Notificação enviada para:',
            emailsDestinatarios
        );

    } catch (error) {

        console.error(
            'Erro ao notificar administradores:',
            error
        );

    }

}


// =========================================================================
// MODAL DE ANÁLISE
// =========================================================================

function analisarMemorial(id) {

    const item =
        listaMemoriaisGlobal.find(
            memorial =>
                String(memorial.firestoreId) ===
                String(id)
        );


    if (!item) {

        Swal.fire({

            icon: 'error',

            title: 'Erro',

            text:
                'Memorial não encontrado no sistema.'

        });

        return;

    }


    const htmlCompleto =
        montarEstruturaHTML(item);


    const totalPaginas =
        (item.ambientes
            ? item.ambientes.length
            : 0) + 1;


    Swal.fire({

        title:
            `<span style="font-size:14px; font-weight:bold; color:#334155;">
                Prévia do Memorial:
                ${escaparHTML(item.polo)}
                (${totalPaginas} página${totalPaginas > 1 ? 's' : ''})
            </span>`,

        html: `

            <div
                style="
                    max-height:68vh;
                    overflow-y:auto;
                    background-color:#1e293b;
                    padding:20px;
                    border-radius:10px;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    gap:20px;
                ">

                <div
                    id="pdfTemplate"
                    style="
                        box-shadow:0 10px 25px rgba(0,0,0,0.3);
                        background-color:#ffffff;
                    ">

                    ${htmlCompleto}

                </div>

            </div>

        `,

        width:
            '1100px',

        showCancelButton:
            true,

        showDenyButton:
            true,

        confirmButtonText:
            'Aprovar e Gerar PDF',

        denyButtonText:
            'Rejeitar Memorial',

        cancelButtonText:
            'Fechar',

        confirmButtonColor:
            '#10B981',

        denyButtonColor:
            '#F43F5E',

        cancelButtonColor:
            '#64748B',

        allowOutsideClick:
            false

    }).then(async (result) => {


        // =====================================================
        // APROVAR
        // =====================================================

        if (result.isConfirmed) {

            try {

                await alterarStatus(
                    id,
                    'APROVADO'
                );


                await notificarPoloPorEmail(

                    item.email ||
                    item.emailContato,

                    'Aprovado',

                    item.polo

                );


                gerarPDFSemFalhas(item);


            } catch (error) {

                console.error(
                    'Erro ao aprovar memorial:',
                    error
                );

            }


            return;

        }


        // =====================================================
        // REJEITAR
        // =====================================================

        if (result.isDenied) {

            const resultadoMotivo =
                await Swal.fire({

                    title:
                        'Motivo da Reprovação',

                    input:
                        'textarea',

                    inputLabel:
                        'Descreva detalhadamente o motivo da rejeição do memorial:',

                    inputPlaceholder:
                        'Escreva aqui o motivo para o polo ajustar...',

                    inputAttributes: {

                        'aria-label':
                            'Escreva aqui o motivo'

                    },

                    showCancelButton:
                        true,

                    confirmButtonText:
                        'Confirmar e Enviar E-mail',

                    cancelButtonText:
                        'Cancelar',

                    confirmButtonColor:
                        '#F43F5E',

                    cancelButtonColor:
                        '#64748B',

                    inputValidator:
                        (value) => {

                            if (
                                !value ||
                                !value.trim()
                            ) {

                                return 'É obrigatório informar o motivo da reprovação!';

                            }

                        }

                });


            const motivo =
                resultadoMotivo.value;


            if (!motivo) {
                return;
            }


            try {

                // ------------------------------------------------
                // PRIMEIRO ATUALIZA O FIREBASE
                // ------------------------------------------------

                await alterarStatusComMotivo(

                    id,

                    'REJEITADO',

                    motivo

                );


                // ------------------------------------------------
                // DEPOIS ENVIA E-MAIL
                // ------------------------------------------------

                await notificarPoloPorEmail(

                    item.email ||
                    item.emailContato,

                    'Rejeitado',

                    item.polo,

                    motivo

                );


                Swal.fire({

                    icon:
                        'success',

                    title:
                        'Memorial Rejeitado!',

                    text:
                        'O status foi atualizado no Firebase e todos os computadores receberão a alteração automaticamente.',

                    confirmButtonColor:
                        '#10B981'

                });


            } catch (error) {

                console.error(
                    'Erro ao rejeitar memorial:',
                    error
                );


                Swal.fire({

                    icon:
                        'error',

                    title:
                        'Erro ao rejeitar',

                    text:
                        'Não foi possível atualizar o memorial no Firebase.'

                });

            }

        }

    });

}


// =========================================================================
// ALTERAR STATUS
// =========================================================================

async function alterarStatus(
    id,
    novoStatus
) {

    try {

        await db
            .collection('memoriais')
            .doc(id)
            .update({

                status:
                    novoStatus,

                atualizadoEm:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


        console.log(
            `Memorial ${id} atualizado para ${novoStatus}`
        );


    } catch (error) {

        console.error(
            'Erro ao atualizar status:',
            error
        );


        throw error;

    }

}


// =========================================================================
// ALTERAR STATUS + MOTIVO
// =========================================================================

async function alterarStatusComMotivo(
    id,
    novoStatus,
    motivo
) {

    try {

        await db
            .collection('memoriais')
            .doc(id)
            .update({

                status:
                    novoStatus,

                motivo:
                    motivo,

                atualizadoEm:
                    firebase.firestore.FieldValue.serverTimestamp()

            });


        console.log(
            `Memorial ${id} rejeitado.`
        );


    } catch (error) {

        console.error(
            'Erro ao rejeitar memorial:',
            error
        );


        throw error;

    }

}


// =========================================================================
// FUNÇÃO ANTIGA - NÃO DELETAR MAIS DO FIREBASE
// =========================================================================
//
// Mantida apenas para evitar problemas caso outro ponto do sistema
// ainda chame essa função.
// =========================================================================

async function excluirMemorial(id) {

    console.warn(
        'A função excluirMemorial foi desativada. Os memoriais não serão apagados do Firebase.'
    );


    try {

        await alterarStatusComMotivo(

            id,

            'REJEITADO',

            'Memorial rejeitado.'

        );


    } catch (error) {

        console.error(
            'Erro ao marcar memorial como rejeitado:',
            error
        );

    }

}


// =========================================================================
// MONTAGEM DO HTML DO MEMORIAL
// =========================================================================

function obterTextoEnderecoECEP(item) {

    if (!item) return '';


    const endereco = (

        item.enderecoBairro ||
        item.endereco_bairro ||
        item.endereco ||
        item.bairro ||
        item.logradouro ||
        item.rua ||
        ''

    )
        .toString()
        .trim();


    const cep = (

        item.cep ||
        item.CEP ||
        item.codigoPostal ||
        ''

    )
        .toString()
        .trim();


    if (endereco && cep) {

        return `${endereco} - CEP: ${cep}`;

    }


    if (endereco) {

        return endereco;

    }


    if (cep) {

        return `CEP: ${cep}`;

    }


    return '';

}


function montarEstruturaHTML(item) {

    const linhaEnderecoECEP =
        obterTextoEnderecoECEP(item);


    let html = `

        <div
            class="pdf-page"
            style="
                width:297mm;
                height:210mm;
                background-color:#0055d4;
                color:#ffffff;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                text-align:center;
                font-family:'Arial',sans-serif;
                box-sizing:border-box;
                padding:40px;
                page-break-after:always;
                position:relative;
                overflow:hidden;
            ">

            <div
                style="
                    margin-bottom:30px;
                    display:flex;
                    justify-content:center;
                    align-items:center;
                ">

                <img
                    src="channels4_profile-removebg-preview.png"
                    style="
                        width:85px;
                        height:85px;
                        object-fit:contain;
                        filter:brightness(0) invert(1);
                    "
                    alt="Logo">

            </div>


            <h2
                style="
                    font-size:20pt;
                    font-weight:700;
                    margin:0 0 20px 0;
                    color:#ffffff;
                ">

                Memorial Descritivo de Infraestrutura

            </h2>


            <h1
                style="
                    font-size:26pt;
                    font-weight:900;
                    text-transform:uppercase;
                    margin:0 0 20px 0;
                    color:#ffffff;
                    padding:0 30px;
                    line-height:1.25;
                    max-width:90%;
                ">

                ${escaparHTML(item.polo || '')}

            </h1>


            ${
                linhaEnderecoECEP
                    ? `

                        <p
                            style="
                                font-size:13pt;
                                margin:0;
                                color:#ffffff;
                                font-weight:400;
                                opacity:0.95;
                            ">

                            ${escaparHTML(
                                linhaEnderecoECEP
                            )}

                        </p>

                    `
                    : ''
            }

        </div>

    `;


    if (
        item.ambientes &&
        item.ambientes.length > 0
    ) {

        item.ambientes.forEach(amb => {

            const fotos =
                amb.fotos || [];


            let gridColumns =
                '1fr';


            let gridRows =
                '1fr';


            if (fotos.length === 2) {

                gridColumns =
                    '1fr';

                gridRows =
                    '1fr 1fr';

            } else if (fotos.length >= 3) {

                gridColumns =
                    '1fr 1fr';

                gridRows =
                    '1fr 1fr';

            }


            html += `

                <div
                    class="pdf-page"
                    style="
                        width:297mm;
                        height:210mm;
                        background-color:#ffffff;
                        font-family:Arial,sans-serif;
                        box-sizing:border-box;
                        padding:15mm;
                        display:flex;
                        flex-direction:column;
                        justify-content:space-between;
                        page-break-after:always;
                        position:relative;
                        overflow:hidden;
                    ">


                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            height:12mm;
                            margin-bottom:5mm;
                        ">

                        <div
                            style="
                                background-color:#1A3666;
                                color:#ffffff;
                                padding:6px 18px;
                                border-radius:8px;
                                font-size:14pt;
                                font-weight:bold;
                                display:flex;
                                align-items:center;
                                gap:10px;
                            ">

                            <span
                                style="
                                    width:8px;
                                    height:8px;
                                    background-color:#10B981;
                                    border-radius:50%;
                                    display:inline-block;
                                ">
                            </span>

                            ${escaparHTML(
                                amb.titulo
                            )}

                        </div>


                        <span
                            style="
                                color:#1A3666;
                                font-size:14pt;
                                font-weight:900;
                                letter-spacing:1px;
                            ">

                            UNIFECAF

                        </span>

                    </div>


                    <div
                        style="
                            display:flex;
                            gap:15px;
                            height:150mm;
                            align-items:stretch;
                            overflow:hidden;
                        ">


                        <div
                            style="
                                flex:1.3;
                                display:grid;
                                grid-template-columns:${gridColumns};
                                grid-template-rows:${gridRows};
                                gap:10px;
                                height:100%;
                                width:100%;
                            ">

                            ${
                                fotos.length > 0

                                    ? fotos.map(f => `

                                        <div
                                            style="
                                                width:100%;
                                                height:100%;
                                                background-color:#f8fafc;
                                                border:1px solid #e2e8f0;
                                                border-radius:8px;
                                                display:flex;
                                                align-items:center;
                                                justify-content:center;
                                                padding:5px;
                                                box-sizing:border-box;
                                                overflow:hidden;
                                            ">

                                            <img
                                                src="${f}"
                                                style="
                                                    max-width:100%;
                                                    max-height:100%;
                                                    object-fit:contain;
                                                    border-radius:4px;
                                                ">

                                        </div>

                                    `).join('')

                                    : `

                                        <div
                                            style="
                                                width:100%;
                                                height:100%;
                                                background-color:#f8fafc;
                                                border:1px dashed #cbd5e1;
                                                border-radius:8px;
                                                display:flex;
                                                align-items:center;
                                                justify-content:center;
                                                color:#94a3b8;
                                                font-size:11pt;
                                            ">

                                            Nenhuma foto enviada

                                        </div>

                                    `
                            }

                        </div>


                        <div
                            style="
                                flex:0.9;
                                border-left:4px solid #10B981;
                                background-color:#ffffff;
                                padding:15px;
                                border-radius:0 8px 8px 0;
                                border-top:1px solid #f1f5f9;
                                border-right:1px solid #f1f5f9;
                                border-bottom:1px solid #f1f5f9;
                                height:100%;
                                box-sizing:border-box;
                                overflow:hidden;
                            ">

                            <div
                                style="
                                    color:#0066FF;
                                    font-size:10pt;
                                    font-weight:800;
                                    margin-bottom:10px;
                                    letter-spacing:0.5px;
                                    text-transform:uppercase;
                                ">

                                ESPECIFICAÇÕES & EQUIPAMENTOS

                            </div>


                            <div
                                style="
                                    font-size:10pt;
                                    color:#334155;
                                    line-height:1.5;
                                    white-space:pre-line;
                                    max-height:135mm;
                                    overflow-y:auto;
                                ">

                                ${
                                    escaparHTML(
                                        amb.descricao
                                    ) ||
                                    'Sem especificações informadas.'
                                }

                            </div>

                        </div>

                    </div>


                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            height:8mm;
                            font-size:8pt;
                            color:#94a3b8;
                            border-top:1px solid #e2e8f0;
                            margin-top:3mm;
                        ">

                        <span>
                            ${escaparHTML(
                                item.polo
                            )}
                        </span>

                        <span
                            style="
                                font-weight:bold;
                                color:#1A3666;
                            ">

                            UniFECAF

                        </span>

                    </div>

                </div>

            `;

        });

    }


    return html;

}


// =========================================================================
// PDF
// =========================================================================

function adicionarImagemPDF(
    doc,
    imgData,
    x,
    y,
    w,
    h
) {

    if (!imgData) return;


    try {

        const format =
            imgData.startsWith('data:image/png')
                ? 'PNG'
                : 'JPEG';


        doc.addImage(
            imgData,
            format,
            x,
            y,
            w,
            h
        );


    } catch (e) {

        try {

            doc.addImage(
                imgData,
                'JPEG',
                x,
                y,
                w,
                h
            );

        } catch (err) {

            console.warn(
                'Erro ao inserir imagem no PDF:',
                err
            );

        }

    }

}


// =========================================================================
// GERAR PDF
// =========================================================================

async function gerarPDFSemFalhas(item) {

    const { jsPDF } =
        window.jspdf;


    Swal.fire({

        title:
            'Gerando PDF...',

        text:
            'Desenhando capa e páginas...',

        allowOutsideClick:
            false,

        didOpen: () => {

            Swal.showLoading();

        }

    });


    const doc =
        new jsPDF({

            orientation:
                'landscape',

            unit:
                'mm',

            format:
                'a4'

        });


    const carregarImagemLogo =
        (src) => {

            return new Promise(
                (resolve) => {

                    const img =
                        new Image();


                    img.crossOrigin =
                        'Anonymous';


                    img.onload =
                        () => {

                            const canvas =
                                document.createElement(
                                    'canvas'
                                );


                            canvas.width =
                                img.width;


                            canvas.height =
                                img.height;


                            const ctx =
                                canvas.getContext(
                                    '2d'
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0
                            );


                            const imgData =
                                ctx.getImageData(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );


                            for (
                                let i = 0;
                                i < imgData.data.length;
                                i += 4
                            ) {

                                if (
                                    imgData.data[i + 3] >
                                    0
                                ) {

                                    imgData.data[i] =
                                        255;

                                    imgData.data[i + 1] =
                                        255;

                                    imgData.data[i + 2] =
                                        255;

                                }

                            }


                            ctx.putImageData(
                                imgData,
                                0,
                                0
                            );


                            resolve(
                                canvas.toDataURL(
                                    'image/png'
                                )
                            );

                        };


                    img.onerror =
                        () => resolve(null);


                    img.src =
                        src;

                }
            );

        };


    const logoBase64 =
        await carregarImagemLogo(
            'channels4_profile-removebg-preview.png'
        );


    // ---------------------------------------------------------
    // CAPA
    // ---------------------------------------------------------

    doc.setFillColor(
        0,
        85,
        212
    );


    doc.rect(
        0,
        0,
        297,
        210,
        'F'
    );


    if (logoBase64) {

        adicionarImagemPDF(
            doc,
            logoBase64,
            136,
            35,
            25,
            25
        );

    }


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.setFont(
        'helvetica',
        'bold'
    );


    doc.setFontSize(
        18
    );


    doc.text(
        'Memorial Descritivo de Infraestrutura',
        148.5,
        82,
        {
            align:
                'center'
        }
    );


    doc.setFontSize(
        24
    );


    const textoPolo =
        String(
            item.polo || ''
        ).toUpperCase();


    const linhasPolo =
        doc.splitTextToSize(
            textoPolo,
            240
        );


    doc.text(
        linhasPolo,
        148.5,
        104,
        {
            align:
                'center'
        }
    );


    const linhaEnderecoECEP =
        obterTextoEnderecoECEP(item);


    if (linhaEnderecoECEP) {

        doc.setFont(
            'helvetica',
            'normal'
        );


        doc.setFontSize(
            12
        );


        const offsetAltura =
            (linhasPolo.length - 1) *
            10;


        const linhasEndereco =
            doc.splitTextToSize(
                linhaEnderecoECEP,
                220
            );


        doc.text(
            linhasEndereco,
            148.5,
            122 + offsetAltura,
            {
                align:
                    'center'
            }
        );

    }


    // ---------------------------------------------------------
    // PÁGINAS DOS AMBIENTES
    // ---------------------------------------------------------

    if (
        item.ambientes &&
        item.ambientes.length > 0
    ) {

        for (
            let i = 0;
            i < item.ambientes.length;
            i++
        ) {

            const amb =
                item.ambientes[i];


            doc.addPage(
                'a4',
                'landscape'
            );


            doc.setFillColor(
                26,
                54,
                102
            );


            doc.roundedRect(
                15,
                10,
                120,
                12,
                2,
                2,
                'F'
            );


            doc.setTextColor(
                255,
                255,
                255
            );


            doc.setFont(
                'helvetica',
                'bold'
            );


            doc.setFontSize(
                12
            );


            doc.text(
                String(
                    amb.titulo ||
                    'Ambiente'
                ),
                20,
                18
            );


            doc.setTextColor(
                26,
                54,
                102
            );


            doc.setFontSize(
                14
            );


            doc.text(
                'UNIFECAF',
                280,
                18,
                {
                    align:
                        'right'
                }
            );


            doc.setDrawColor(
                226,
                232,
                240
            );


            doc.line(
                15,
                25,
                280,
                25
            );


            const fotos =
                amb.fotos || [];


            if (fotos.length === 1) {

                adicionarImagemPDF(
                    doc,
                    fotos[0],
                    15,
                    30,
                    140,
                    150
                );

            } else if (
                fotos.length === 2
            ) {

                adicionarImagemPDF(
                    doc,
                    fotos[0],
                    15,
                    30,
                    140,
                    72
                );


                adicionarImagemPDF(
                    doc,
                    fotos[1],
                    15,
                    105,
                    140,
                    75
                );

            } else if (
                fotos.length >= 3
            ) {

                adicionarImagemPDF(
                    doc,
                    fotos[0],
                    15,
                    30,
                    68,
                    72
                );


                adicionarImagemPDF(
                    doc,
                    fotos[1],
                    87,
                    30,
                    68,
                    72
                );


                if (fotos[2]) {

                    adicionarImagemPDF(
                        doc,
                        fotos[2],
                        15,
                        105,
                        68,
                        75
                    );

                }


                if (fotos[3]) {

                    adicionarImagemPDF(
                        doc,
                        fotos[3],
                        87,
                        105,
                        68,
                        75
                    );

                }

            } else {

                doc.setDrawColor(
                    203,
                    213,
                    225
                );


                doc.rect(
                    15,
                    30,
                    140,
                    150,
                    'D'
                );


                doc.setTextColor(
                    148,
                    163,
                    184
                );


                doc.setFontSize(
                    11
                );


                doc.text(
                    'Nenhuma foto enviada',
                    85,
                    105,
                    {
                        align:
                            'center'
                    }
                );

            }


            doc.setFillColor(
                255,
                255,
                255
            );


            doc.setDrawColor(
                241,
                245,
                249
            );


            doc.rect(
                160,
                30,
                120,
                150,
                'FD'
            );


            doc.setFillColor(
                16,
                185,
                129
            );


            doc.rect(
                160,
                30,
                3,
                150,
                'F'
            );


            doc.setTextColor(
                0,
                102,
                255
            );


            doc.setFont(
                'helvetica',
                'bold'
            );


            doc.setFontSize(
                10
            );


            doc.text(
                'ESPECIFICAÇÕES & EQUIPAMENTOS',
                168,
                40
            );


            doc.setTextColor(
                51,
                65,
                85
            );


            doc.setFont(
                'helvetica',
                'normal'
            );


            doc.setFontSize(
                10
            );


            const textoDescricao =
                amb.descricao ||
                'Sem especificações informadas.';


            const linhasTexto =
                doc.splitTextToSize(
                    textoDescricao,
                    105
                );


            doc.text(
                linhasTexto,
                168,
                50
            );


            doc.setDrawColor(
                226,
                232,
                240
            );


            doc.line(
                15,
                190,
                280,
                190
            );


            doc.setTextColor(
                148,
                163,
                184
            );


            doc.setFontSize(
                8
            );


            doc.text(
                String(
                    item.polo || ''
                ),
                15,
                196
            );


            doc.text(
                'UniFECAF',
                280,
                196,
                {
                    align:
                        'right'
                }
            );

        }

    }


    doc.save(

        `Memorial_${String(
            item.polo || 'Polo'
        ).replace(
            /[^a-z0-9]/gi,
            '_'
        )}.pdf`

    );


    Swal.fire({

        icon:
            'success',

        title:
            'PDF Gerado!',

        text:
            'Arquivo baixado e notificação enviada ao polo com sucesso!',

        confirmButtonColor:
            '#10B981'

    });

}


// =========================================================================
// LOGOUT
// =========================================================================

function logout() {

    localStorage.removeItem(
        'userProfile'
    );

    sessionStorage.clear();

    window.location.href =
        'login.html';

}
