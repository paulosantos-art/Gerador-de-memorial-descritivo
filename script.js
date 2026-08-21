/**
 * Gerador de Memorial Descritivo - Modelo UniFECAF (Landscape Slides Clean)
 */

// =========================================================================
// CONFIGURAÇÃO DOS AMBIENTES
// =========================================================================

const spacesMasterList = [
    { id: "fachada", title: "Fachada e Acesso" },
    { id: "recepcao", title: "Recepção e Atendimento" },
    { id: "area_adm", title: "Área Administrativa" },
    { id: "lab_info", title: "Laboratórios de Informática" },
    { id: "lab_saude", title: "Laboratórios da Área da Saúde" },
    { id: "lab_eng_arq", title: "Laboratórios de Engenharias / Arquitetura" },
    { id: "espaco_estudos", title: "Espaço de Estudos e Biblioteca" },
    { id: "sala_aula", title: "Salas de Aula Multifuncionais" },
    { id: "sanitarios", title: "Sanitários e Acessibilidade" },
    { id: "espaco_convivencia", title: "Área de Convivência" }
];

// =========================================================================
// ESTADO GLOBAL
// =========================================================================

const state = { spaces: {} };
let allPoloNames = [];
let isPoloSelected = false;

// Evitar rolagem automática ao recarregar
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// =========================================================================
// DADOS DA CAPA
// =========================================================================

// Helper universal para pegar Endereço e CEP independente do ID utilizado no HTML
function getDadosCapa() {
    const poloInput =
        document.getElementById('poloName') ||
        document.getElementById('nomePolo') ||
        document.getElementById('polo');

    const enderecoInput =
        document.getElementById('poloAddress') ||
        document.getElementById('endereco') ||
        document.getElementById('poloEndereco');

    const cepInput =
        document.getElementById('poloCep') ||
        document.getElementById('cep') ||
        document.getElementById('poloCEP');

    return {
        poloInput,
        enderecoInput,
        cepInput,
        polo: poloInput ? poloInput.value.trim() : '',
        endereco: enderecoInput ? enderecoInput.value.trim() : '',
        cep: cepInput ? cepInput.value.trim() : ''
    };
}

// =========================================================================
// LOGO
// =========================================================================

const UNIFECAF_LOGO_WHITE = `
<div style="display: flex; align-items: center; justify-content: center; width: 100%;">
    <img 
        src="channels4_profile-removebg-preview.png" 
        alt="Logo UniFECAF" 
        style="max-width: 320px; height: auto; display: block; margin: 0 auto;" 
    />
</div>
`;

// =========================================================================
// INICIALIZAÇÃO
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);

    // Inicializa o objeto de estado limpando qualquer lixo de memória
    spacesMasterList.forEach(space => {
        state.spaces[space.id] = {
            description: "",
            images: []
        };
    });

    loadPolosFromGoogleSheets();
    renderFormSpaces();

    const btnPDF = document.getElementById('btnGeneratePDF');

    if (btnPDF) {
        btnPDF.addEventListener('click', generatePDF);
    }
});

// =========================================================================
// RENDERIZAÇÃO DOS AMBIENTES
// =========================================================================

function renderFormSpaces() {
    const container = document.getElementById('spacesContainer');

    if (!container) return;

    container.innerHTML = spacesMasterList.map(space => `
        <div 
            class="p-6 border border-slate-200/90 rounded-xl bg-slate-50/40 hover:bg-slate-50/90 transition-all shadow-xs" 
            id="card-${space.id}"
        >
            <h3 class="font-bold text-brand-navy text-base mb-4 flex items-center justify-between">
                <span class="text-brand-navy font-bold flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-brand-blue"></span>
                    ${space.title}
                </span>

                <span 
                    id="badge-${space.id}" 
                    class="text-xs bg-amber-50 text-amber-800 border border-amber-300/80 px-3 py-1 rounded-full font-bold hidden"
                >
                    Descrição Obrigatória
                </span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        Descrição / Inventário de Itens (Tópicos)
                    </label>

                    <textarea 
                        id="desc-${space.id}"
                        rows="5" 
                        placeholder="Ex: - 20 computadores Dell Core i5&#10;- Ar condicionado 24.000 BTUs"
                        oninput="updateDescription('${space.id}', this.value)"
                        class="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-brand-dark focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 focus:outline-none transition-all font-mono leading-relaxed"
                    ></textarea>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                        Fotos do Espaço (Até 4 imagens)
                    </label>

                    <input 
                        type="file" 
                        id="file-${space.id}"
                        accept="image/jpeg, image/png" 
                        multiple 
                        onchange="handleFileUpload('${space.id}', this)"
                        class="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100 transition-all mb-3 cursor-pointer"
                    />

                    <div id="preview-${space.id}" class="grid grid-cols-4 gap-2.5"></div>
                </div>

            </div>
        </div>
    `).join('');
}

// =========================================================================
// UPLOAD DE IMAGENS
// =========================================================================

function handleFileUpload(spaceId, input) {
    const files = Array.from(input.files);

    if (!state.spaces[spaceId]) {
        state.spaces[spaceId] = {
            description: "",
            images: []
        };
    }

    const currentImages = state.spaces[spaceId].images;

    if (currentImages.length + files.length > 4) {
        Swal.fire({
            icon: 'warning',
            title: 'Limite Excedido',
            text: 'Você só pode anexar até 4 fotos por ambiente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC'
        });

        input.value = "";
        return;
    }

    let loadedCount = 0;

    files.forEach(file => {
        const reader = new FileReader();

        reader.onload = (e) => {
            state.spaces[spaceId].images.push(e.target.result);

            loadedCount++;

            if (loadedCount === files.length) {
                renderPreviews(spaceId);
                applyConditionalValidation(spaceId);
            }
        };

        reader.readAsDataURL(file);
    });

    input.value = "";
}

function removeImage(spaceId, index) {
    if (state.spaces[spaceId] && state.spaces[spaceId].images) {
        state.spaces[spaceId].images.splice(index, 1);

        renderPreviews(spaceId);
        applyConditionalValidation(spaceId);
    }
}

function renderPreviews(spaceId) {
    const previewContainer = document.getElementById(`preview-${spaceId}`);

    if (!previewContainer) return;

    const images = state.spaces[spaceId]
        ? state.spaces[spaceId].images
        : [];

    previewContainer.innerHTML = images.map((imgSrc, index) => `
        <div 
            class="relative group aspect-square border border-slate-200 rounded-lg bg-slate-100 overflow-hidden shadow-xs"
        >
            <img 
                src="${imgSrc}" 
                class="w-full h-full object-cover"
            >

            <button 
                type="button" 
                onclick="removeImage('${spaceId}', ${index})" 
                class="absolute top-1 right-1 bg-rose-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold hover:bg-rose-700 transition shadow-sm"
            >
                &times;
            </button>
        </div>
    `).join('');
}

// =========================================================================
// DESCRIÇÃO
// =========================================================================

function updateDescription(spaceId, value) {
    if (!state.spaces[spaceId]) {
        state.spaces[spaceId] = {
            description: "",
            images: []
        };
    }

    state.spaces[spaceId].description = value;
}

function applyConditionalValidation(spaceId) {
    const hasImages =
        state.spaces[spaceId] &&
        state.spaces[spaceId].images.length > 0;

    const badge = document.getElementById(`badge-${spaceId}`);

    if (badge) {
        if (hasImages) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// =========================================================================
// AUXILIAR DE FOCO
// =========================================================================

function focusElement(element) {
    if (!element) return;

    setTimeout(() => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        if (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA'
        ) {
            element.focus();
        }
    }, 200);
}

// =========================================================================
// GERAÇÃO DO PDF
// =========================================================================

function generatePDF() {
    const dados = getDadosCapa();

    if (!dados.polo) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o Nome do Polo.',
            confirmButtonColor: '#0E77CC'
        }).then(() => focusElement(dados.poloInput));

        return;
    }

    if (!dados.endereco) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o Endereço / Bairro.',
            confirmButtonColor: '#0E77CC'
        }).then(() => focusElement(dados.enderecoInput));

        return;
    }

    if (!dados.cep) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o CEP.',
            confirmButtonColor: '#0E77CC'
        }).then(() => focusElement(dados.cepInput));

        return;
    }

    for (const spaceMeta of spacesMasterList) {
        const spaceData =
            state.spaces[spaceMeta.id] || {
                description: "",
                images: []
            };

        const hasImages = spaceData.images.length > 0;
        const hasDesc = spaceData.description.trim().length > 0;

        if (hasImages && !hasDesc) {
            Swal.fire({
                icon: 'warning',
                title: 'Descrição Ausente',
                text: `O ambiente "${spaceMeta.title}" possui foto(s), mas a descrição está em branco.`,
                confirmButtonColor: '#0E77CC'
            }).then(() =>
                focusElement(
                    document.getElementById(`desc-${spaceMeta.id}`)
                )
            );

            return;
        }

        if (hasDesc && !hasImages) {
            Swal.fire({
                icon: 'warning',
                title: 'Foto Ausente',
                text: `O ambiente "${spaceMeta.title}" possui descrição, mas nenhuma foto foi anexada.`,
                confirmButtonColor: '#0E77CC'
            }).then(() =>
                focusElement(
                    document.getElementById(`file-${spaceMeta.id}`)
                )
            );

            return;
        }
    }

    const templateContainer =
        document.getElementById('pdfTemplate');

    if (!templateContainer) return;

    templateContainer.innerHTML = "";

    let activeSpacesCount = 0;

    // =========================================================================
    // CAPA
    // =========================================================================

    const coverSlide = document.createElement('div');

    coverSlide.className = 'slide-page cover-slide';

    coverSlide.innerHTML = `
        <div 
            style="
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 190mm; 
                text-align: center; 
                padding: 0 20mm;
            "
        >

            <div style="margin-bottom: 12px; width: 100%;">
                ${UNIFECAF_LOGO_WHITE}
            </div>

            <div 
                style="
                    font-size: 18pt; 
                    font-weight: 700; 
                    color: #ffffff; 
                    margin-bottom: 50px;
                "
            >
                Memorial Descritivo de Infraestrutura
            </div>

            <div 
                style="
                    display: flex; 
                    flex-direction: column; 
                    gap: 6px; 
                    color: #ffffff; 
                    text-align: center;
                "
            >

                <div 
                    style="
                        font-size: 16pt; 
                        font-weight: 800; 
                        text-transform: uppercase;
                    "
                >
                    ${dados.polo}
                </div>

                <div 
                    style="
                        font-size: 12pt; 
                        font-weight: 600; 
                        text-transform: uppercase; 
                        opacity: 0.95;
                    "
                >
                    ${dados.endereco}
                </div>

                <div 
                    style="
                        font-size: 11pt; 
                        font-weight: 600; 
                        text-transform: uppercase; 
                        opacity: 0.85;
                    "
                >
                    CEP: ${dados.cep}
                </div>

            </div>
        </div>
    `;

    templateContainer.appendChild(coverSlide);

    // =========================================================================
    // SLIDES INTERNOS
    // =========================================================================

    spacesMasterList.forEach(spaceMeta => {
        const spaceData = state.spaces[spaceMeta.id];

        if (!spaceData) return;

        const hasDesc =
            spaceData.description.trim().length > 0;

        const hasImages =
            spaceData.images.length > 0;

        if (hasDesc && hasImages) {

            activeSpacesCount++;

            const slide = document.createElement('div');

            slide.className = 'slide-page';

            let formattedText = spaceData.description;

            if (
                formattedText.includes('-') ||
                formattedText.includes('•')
            ) {

                const lines = formattedText.split('\n');

                formattedText = lines.map(line => {

                    const cleanLine = line
                        .replace(/^[-•]\s*/, '')
                        .trim();

                    return cleanLine
                        ? `<li style="margin-bottom:8px;">
                            <span style="color:#191919;">
                                ${cleanLine}
                            </span>
                           </li>`
                        : '';

                }).join('');

                formattedText = `
                    <ul 
                        style="
                            padding-left: 18px; 
                            list-style-type: square; 
                            color:#17A460;
                        "
                    >
                        ${formattedText}
                    </ul>
                `;

            } else {

                formattedText = `
                    <p 
                        style="
                            color:#191919; 
                            font-size:11pt; 
                            line-height:1.6; 
                            white-space:pre-line;
                        "
                    >
                        ${spaceData.description}
                    </p>
                `;
            }

            let gridClass = "images-grid";

            if (spaceData.images.length === 1) {
                gridClass += " single-img";
            } else if (spaceData.images.length === 2) {
                gridClass += " two-imgs";
            }

            const imagesHTML = `
                <div class="${gridClass}">
                    ${
                        spaceData.images
                            .map(img =>
                                `<img src="${img}" class="img-card" />`
                            )
                            .join('')
                    }
                </div>
            `;

            slide.innerHTML = `
                <div class="slide-header">

                    <div class="slide-header-left">
                        <span class="header-dot"></span>
                        <div class="slide-title-pill">
                            ${spaceMeta.title}
                        </div>
                    </div>

                    <span class="slide-brand-tag">
                        UniFECAF
                    </span>

                </div>

                <div class="slide-body">

                    ${imagesHTML}

                    <div class="description-box">

                        <div class="description-box-title">
                            Especificações & Equipamentos
                        </div>

                        <div class="description-text">
                            ${formattedText}
                        </div>

                    </div>

                </div>

                <div class="slide-footer">
                    <span>
                        Memorial Descritivo de Infraestrutura
                    </span>

                    <span class="logo-text">
                        ${dados.polo.toUpperCase()}
                    </span>
                </div>
            `;

            templateContainer.appendChild(slide);
        }
    });

    if (activeSpacesCount === 0) {

        Swal.fire({
            icon: 'info',
            title: 'Formulário Vazio',
            text: 'Preencha ao menos um ambiente para gerar o PDF.',
            confirmButtonColor: '#0E77CC'
        });

        return;
    }

    const opt = {
        margin: 0,

        filename:
            `Memorial_Descritivo_UniFECAF_${dados.polo.replace(/\s+/g, '_')}.pdf`,

        image: {
            type: 'jpeg',
            quality: 0.98
        },

        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            scrollX: 0,
            scrollY: 0
        },

        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'landscape'
        },

        pagebreak: {
            mode: ['css', 'legacy']
        }
    };

    html2pdf()
        .set(opt)
        .from(templateContainer)
        .save()
        .then(() => {

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'O Memorial foi baixado com sucesso.',
                confirmButtonColor: '#17A460'
            }).then(() => {

                window.scrollTo(0, 0);
                window.location.reload();

            });
        });
}

// =========================================================================
// CARREGAR POLOS DO GOOGLE SHEETS
// =========================================================================

async function loadPolosFromGoogleSheets() {

    const SHEET_ID =
        '1fVH0Yc4Zo6PKcwEpWSgSbAPnSVLXqgaahj9i3HdK92c';

    const GID = '1722842106';

    const csvUrl =
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

    const poloInput =
        document.getElementById('poloName') ||
        document.getElementById('nomePolo');

    const dropdown =
        document.getElementById('poloDropdown');

    if (!poloInput || !dropdown) return;

    try {

        const response = await fetch(csvUrl);

        const data = await response.text();

        const rows =
            data
                .split('\n')
                .map(row => row.split(','));

        const headers =
            rows[0]
                .map(h =>
                    h.replace(/"/g, '')
                        .trim()
                        .toLowerCase()
                );

        let nameIndex =
            headers.indexOf('nome');

        if (nameIndex === -1) {
            nameIndex = 0;
        }

        allPoloNames =
            rows
                .slice(1)
                .map(row =>
                    row[nameIndex]
                        ? row[nameIndex]
                            .replace(/"/g, '')
                            .trim()
                        : ''
                )
                .filter(name => name.length > 0);

        poloInput.addEventListener('input', (e) => {

            isPoloSelected = false;

            renderCustomDropdown(e.target.value);

        });

        document.addEventListener('click', (e) => {

            if (
                !poloInput.contains(e.target) &&
                !dropdown.contains(e.target)
            ) {

                dropdown.classList.add('hidden');

            }
        });

    } catch (error) {

        console.error(
            "Erro ao carregar polos:",
            error
        );

    }
}

// =========================================================================
// DROPDOWN DE POLOS
// =========================================================================

function renderCustomDropdown(searchTerm) {

    const dropdown =
        document.getElementById('poloDropdown');

    const poloInput =
        document.getElementById('poloName') ||
        document.getElementById('nomePolo');

    if (!dropdown || !poloInput) return;

    const cleanSearch =
        searchTerm.toLowerCase().trim();

    if (cleanSearch.length === 0) {

        dropdown.classList.add('hidden');

        return;
    }

    const filtered =
        allPoloNames
            .filter(name =>
                name.toLowerCase()
                    .includes(cleanSearch)
            )
            .slice(0, 5);

    if (filtered.length === 0) {

        dropdown.innerHTML = `
            <div 
                class="px-4 py-3 text-sm text-slate-400 italic text-center"
            >
                Nenhum polo encontrado
            </div>
        `;

        dropdown.classList.remove('hidden');

        return;
    }

    dropdown.innerHTML =
        filtered.map(name => `
            <div 
                class="polo-item px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue cursor-pointer font-medium"
                data-value="${name}"
            >
                ${name}
            </div>
        `).join('');

    dropdown.classList.remove('hidden');

    dropdown
        .querySelectorAll('.polo-item')
        .forEach(item => {

            item.addEventListener('click', () => {

                poloInput.value =
                    item.getAttribute('data-value');

                isPoloSelected = true;

                dropdown.classList.add('hidden');

            });

        });
}

// =========================================================================
// ENVIO DO MEMORIAL PARA VALIDAÇÃO
// =========================================================================

async function enviarParaValidacao(event) {

    if (event) {
        event.preventDefault();
    }

    const dados = getDadosCapa();

    // ---------------------------------------------------------------------
    // NOVO: RECUPERA O E-MAIL SALVO NO LOGIN
    // ---------------------------------------------------------------------

    const emailUsuarioPolo =
        localStorage.getItem('emailUsuarioPolo') || '';

    // ---------------------------------------------------------------------
    // VALIDAÇÃO DO POLO
    // ---------------------------------------------------------------------

    if (!dados.polo) {

        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Informe o Nome do Polo.',
            confirmButtonColor: '#0E77CC'
        });

        return;
    }

    // ---------------------------------------------------------------------
    // NOVO: VALIDAÇÃO DO E-MAIL DO LOGIN
    // ---------------------------------------------------------------------

    if (!emailUsuarioPolo) {

        Swal.fire({
            icon: 'warning',
            title: 'E-mail não identificado',
            text: 'Não foi possível identificar o e-mail utilizado no acesso. Faça o login novamente para continuar.',
            confirmButtonColor: '#0066FF'
        });

        return;
    }

    // Validação adicional do formato do e-mail
    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailUsuarioPolo)) {

        Swal.fire({
            icon: 'warning',
            title: 'E-mail inválido',
            text: 'O e-mail utilizado no acesso não é válido. Faça o login novamente.',
            confirmButtonColor: '#0066FF'
        });

        return;
    }

    // ---------------------------------------------------------------------
    // COLETA DOS AMBIENTES
    // ---------------------------------------------------------------------

    const ambientesValidos = [];

    spacesMasterList.forEach(spaceMeta => {

        const spaceData =
            state.spaces[spaceMeta.id];

        if (spaceData) {

            const desc =
                spaceData.description.trim();

            const fotos =
                spaceData.images;

            if (
                desc !== '' &&
                fotos.length > 0
            ) {

                ambientesValidos.push({

                    titulo:
                        spaceMeta.title,

                    descricao:
                        desc,

                    fotos:
                        [...fotos]

                });
            }
        }
    });

    // ---------------------------------------------------------------------
    // VALIDAÇÃO DO FORMULÁRIO
    // ---------------------------------------------------------------------

    if (ambientesValidos.length === 0) {

        Swal.fire({
            icon: 'info',
            title: 'Formulário Vazio',
            text: 'Preencha ao menos um ambiente completo.',
            confirmButtonColor: '#0E77CC'
        });

        return;
    }

    // ---------------------------------------------------------------------
    // LOADING
    // ---------------------------------------------------------------------

    Swal.fire({

        title: 'Enviando Memorial...',

        text: 'Aguarde enquanto registramos seus dados.',

        allowOutsideClick: false,

        didOpen: () => {
            Swal.showLoading();
        }

    });

    // =========================================================================
    // NOVO MEMORIAL
    // =========================================================================
    //
    // AQUI FOI ADICIONADO:
    //
    // email: emailUsuarioPolo
    //
    // Esse é o principal ajuste para permitir que o ADM encontre o
    // endereço de e-mail posteriormente.
    // =========================================================================

    const novoMemorial = {

        id: Date.now(),

        polo:
            dados.polo,

        endereco:
            dados.endereco,

        cep:
            dados.cep,

        // -------------------------------------------------------------
        // E-MAIL DO USUÁRIO QUE FEZ LOGIN
        // -------------------------------------------------------------
        email:
            emailUsuarioPolo,

        dataEnvio:
            new Date().toLocaleDateString('pt-BR'),

        status:
            'PENDENTE',

        ambientes:
            ambientesValidos

    };

    // =========================================================================
    // 1. SALVA LOCALMENTE (CACHE)
    // =========================================================================

    const memoriaisExistentes =
        JSON.parse(
            localStorage.getItem('memoriaisEnviados')
        ) || [];

    memoriaisExistentes.push(
        novoMemorial
    );

    localStorage.setItem(
        'memoriaisEnviados',
        JSON.stringify(memoriaisExistentes)
    );

    // =========================================================================
    // 2. NOTIFICA OS ADMS
    // =========================================================================

    await notificarAdmsNovoMemorial(
        dados.polo,
        emailUsuarioPolo
    );

    // =========================================================================
    // 3. ALERTA DE SUCESSO
    // =========================================================================

    Swal.fire({

        icon: 'success',

        title: 'Enviado com Sucesso!',

        text:
            `O Memorial do polo "${dados.polo}" foi registrado e a equipe administrativa foi notificada. A resposta será enviada para ${emailUsuarioPolo}.`,

        confirmButtonColor: '#17A460'

    }).then(() => {

        window.scrollTo(0, 0);

        window.location.reload();

    });
}

// =========================================================================
// INTEGRAÇÃO COM GOOGLE APPS SCRIPT
// =========================================================================

const URL_GOOGLE_SCRIPT_POLO =
    'https://script.google.com/macros/s/AKfycbwmDh2tDlscfVGP7WnyS-piEKWqvNfJ9sgH0x5nLVBQYOTvBH7TrGtWxJPCcjGL2Vsi9w/exec';

// =========================================================================
// NOTIFICAÇÃO PARA OS ADMS
// =========================================================================

async function notificarAdmsNovoMemorial(
    poloNome,
    emailPolo = ''
) {

    const admsSalvos =
        JSON.parse(
            localStorage.getItem('listaEmailsAdm')
        ) || [
            'admin@unifecaf.com.br'
        ];

    if (admsSalvos.length === 0) {
        return;
    }

    // =========================================================================
    // PAYLOAD ENVIADO AO GOOGLE APPS SCRIPT
    // =========================================================================

    const payload = {

        tipo:
            'NOVO_MEMORIAL',

        poloNome:
            poloNome,

        // E-mail do polo também é enviado
        // para que o Apps Script possa utilizá-lo,
        // caso necessário.
        emailPolo:
            emailPolo,

        emailsAdm:
            admsSalvos

    };

    try {

        await fetch(
            URL_GOOGLE_SCRIPT_POLO,
            {
                method: 'POST',

                mode: 'no-cors',

                headers: {
                    'Content-Type':
                        'text/plain;charset=utf-8'
                },

                body:
                    JSON.stringify(payload)
            }
        );

        console.log(
            "Notificação enviada ao Google Apps Script com sucesso."
        );

        console.log(
            "E-mail do polo registrado:",
            emailPolo
        );

    } catch (err) {

        console.error(
            'Erro ao notificar os administradores:',
            err
        );

    }
}
