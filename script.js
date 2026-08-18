/**
 * Gerador de Memorial Descritivo - Modelo UniFECAF (Landscape Slides Clean)
 */

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

const state = { spaces: {} };

// Logo Oficial (Centralizada)
const UNIFECAF_LOGO_WHITE = `
<div style="display: flex; align-items: center; justify-content: center; width: 100%;">
    <img src="logo-unifecaf.webp" alt="Logo UniFECAF" style="max-width: 320px; height: auto; display: block; margin: 0 auto;" />
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split('T')[0];
    const emissionInput = document.getElementById('emissionDate');
    if (emissionInput) emissionInput.value = today;

    spacesMasterList.forEach(space => {
        state.spaces[space.id] = { description: "", images: [] };
    });

    renderFormSpaces();
    document.getElementById('btnGeneratePDF').addEventListener('click', generatePDF);
});

function renderFormSpaces() {
    const container = document.getElementById('spacesContainer');
    container.innerHTML = spacesMasterList.map(space => `
        <div class="p-6 border border-slate-200/90 rounded-xl bg-slate-50/40 hover:bg-slate-50/90 transition-all shadow-xs" id="card-${space.id}">
            <h3 class="font-bold text-brand-navy text-base mb-4 flex items-center justify-between">
                <span class="text-brand-navy font-bold flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-brand-blue"></span>
                    ${space.title}
                </span>
                <span id="badge-${space.id}" class="text-xs bg-amber-50 text-amber-800 border border-amber-300/80 px-3 py-1 rounded-full font-bold hidden">
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
                        placeholder="Ex: - 20 computadores Dell Core i5&#10;- Ar condicionado 24.000 BTUs&#10;- Botoeira de emergência e PWD"
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

function handleFileUpload(spaceId, input) {
    const files = Array.from(input.files);
    const currentImages = state.spaces[spaceId].images;

    if (currentImages.length + files.length > 4) {
        Swal.fire({
            icon: 'warning',
            title: 'Limite Excedido',
            text: 'Você só pode anexar até 4 fotos por ambiente.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        });
        input.value = "";
        return;
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.spaces[spaceId].images.push(e.target.result);
            renderPreviews(spaceId);
            applyConditionalValidation(spaceId);
        };
        reader.readAsDataURL(file);
    });

    input.value = "";
}

function removeImage(spaceId, index) {
    state.spaces[spaceId].images.splice(index, 1);
    renderPreviews(spaceId);
    applyConditionalValidation(spaceId);
}

function renderPreviews(spaceId) {
    const previewContainer = document.getElementById(`preview-${spaceId}`);
    const images = state.spaces[spaceId].images;

    previewContainer.innerHTML = images.map((imgSrc, index) => `
        <div class="relative group aspect-square border border-slate-200 rounded-lg bg-slate-100 overflow-hidden shadow-xs">
            <img src="${imgSrc}" class="w-full h-full object-cover">
            <button type="button" onclick="removeImage('${spaceId}', ${index})" 
                class="absolute top-1 right-1 bg-rose-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold hover:bg-rose-700 transition shadow-sm">
                &times;
            </button>
        </div>
    `).join('');
}

function updateDescription(spaceId, value) {
    state.spaces[spaceId].description = value;
}

function applyConditionalValidation(spaceId) {
    const hasImages = state.spaces[spaceId].images.length > 0;
    const badge = document.getElementById(`badge-${spaceId}`);
    if (badge) {
        if (hasImages) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

// Função utilitária para focar e rolar até o elemento com erro
function focusElement(element) {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.focus();
}

function generatePDF() {
    const poloNameInput = document.getElementById('poloName');
    const poloAddressInput = document.getElementById('poloAddress');
    const poloCepInput = document.getElementById('poloCep');

    // 1. VALIDAÇÃO DOS CAMPOS DA CAPA (SWEETALERT2)
    if (!poloNameInput.value.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o Nome do Polo.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        }).then(() => focusElement(poloNameInput));
        return;
    }

    if (!poloAddressInput.value.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o Endereço / Bairro.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        }).then(() => focusElement(poloAddressInput));
        return;
    }

    if (!poloCepInput.value.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo Obrigatório',
            text: 'Por favor, preencha o CEP.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        }).then(() => focusElement(poloCepInput));
        return;
    }

    // 2. TRAVAS DE VALIDAÇÃO DOS ESPAÇOS (SWEETALERT2)
    for (const spaceMeta of spacesMasterList) {
        const spaceData = state.spaces[spaceMeta.id];
        const hasImages = spaceData.images.length > 0;
        const hasDesc = spaceData.description.trim().length > 0;

        if (hasImages && !hasDesc) {
            Swal.fire({
                icon: 'warning',
                title: 'Descrição Ausente',
                text: `O ambiente "${spaceMeta.title}" possui foto(s) anexada(s), mas a descrição está em branco. Preencha a descrição para continuar.`,
                confirmButtonText: 'Corrigir Agora',
                confirmButtonColor: '#0E77CC',
                customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
            }).then(() => {
                const textarea = document.getElementById(`desc-${spaceMeta.id}`);
                focusElement(textarea);
            });
            return;
        }

        if (hasDesc && !hasImages) {
            Swal.fire({
                icon: 'warning',
                title: 'Foto Ausente',
                text: `O ambiente "${spaceMeta.title}" possui descrição, mas nenhuma foto foi anexada. Insira ao menos uma imagem para continuar.`,
                confirmButtonText: 'Corrigir Agora',
                confirmButtonColor: '#0E77CC',
                customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
            }).then(() => {
                const fileInput = document.getElementById(`file-${spaceMeta.id}`);
                focusElement(fileInput);
            });
            return;
        }
    }

    const templateContainer = document.getElementById('pdfTemplate');
    templateContainer.innerHTML = "";

    let activeSpacesCount = 0;

    // --- CAPA SEGUINDO O DESIGN CLEAN UNIFECAF ---
    const coverSlide = document.createElement('div');
    coverSlide.className = 'slide-page cover-slide';
    
    const address = poloAddressInput.value.trim();
    const cep = poloCepInput.value.trim();

    coverSlide.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 0 20mm;">
            <div style="margin-bottom: 12px; width: 100%;">
                ${UNIFECAF_LOGO_WHITE}
            </div>

            <div style="font-size: 18pt; font-weight: 700; color: #ffffff; margin-bottom: 50px; letter-spacing: -0.2px;">
                Memorial Descritivo de Infraestrutura
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px; color: #ffffff; text-align: center;">
                <div style="font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${poloNameInput.value.trim()}
                </div>
                ${address ? `
                    <div style="font-size: 12pt; font-weight: 600; text-transform: uppercase; opacity: 0.95;">
                        ${address}
                    </div>
                ` : ''}
                ${cep ? `
                    <div style="font-size: 11pt; font-weight: 600; text-transform: uppercase; opacity: 0.85; margin-top: 2px;">
                        CEP: ${cep}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    templateContainer.appendChild(coverSlide);

    // --- SLIDES INTERNOS DOS ESPAÇOS ---
    spacesMasterList.forEach(spaceMeta => {
        const spaceData = state.spaces[spaceMeta.id];
        const hasDesc = spaceData.description.trim().length > 0;
        const hasImages = spaceData.images.length > 0;

        if (hasDesc || hasImages) {
            activeSpacesCount++;

            const slide = document.createElement('div');
            slide.className = 'slide-page';

            let formattedText = spaceData.description;
            if (formattedText.includes('-') || formattedText.includes('•')) {
                const lines = formattedText.split('\n');
                formattedText = lines.map(line => {
                    const cleanLine = line.replace(/^[-•]\s*/, '').trim();
                    return cleanLine ? `<li style="margin-bottom:8px;"><span style="color:#191919;">${cleanLine}</span></li>` : '';
                }).join('');
                formattedText = `<ul style="padding-left: 18px; list-style-type: square; color:#17A460;">${formattedText}</ul>`;
            } else {
                formattedText = `<p style="color:#191919; font-size:11pt; line-height:1.6; white-space:pre-line;">${spaceData.description}</p>`;
            }

            let gridClass = "images-grid";
            if (spaceData.images.length === 1) gridClass += " single-img";
            else if (spaceData.images.length === 2) gridClass += " two-imgs";

            const imagesHTML = hasImages ? `
                <div class="${gridClass}">
                    ${spaceData.images.map(img => `<img src="${img}" class="img-card" />`).join('')}
                </div>
            ` : `<div class="images-grid"><div style="height:138mm; background:#ffffff; border-radius:10px; border:2px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; color:#64748b; font-weight:600; font-size:10pt;">Sem fotos anexadas</div></div>`;

            slide.innerHTML = `
                <div class="slide-header">
                    <div class="slide-header-left">
                        <span class="header-dot"></span>
                        <div class="slide-title-pill">${spaceMeta.title}</div>
                    </div>
                    <span class="slide-brand-tag">UniFECAF</span>
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
                    <span>Memorial Descritivo de Infraestrutura</span>
                    <span class="logo-text">${poloNameInput.value.toUpperCase()}</span>
                </div>
            `;

            templateContainer.appendChild(slide);
        }
    });

    if (activeSpacesCount === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Formulário Vazio',
            text: 'Preencha a descrição ou insira imagens em ao menos um ambiente para gerar o PDF.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0E77CC',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        });
        return;
    }

    // Configuração e Geração do PDF com Limpeza Automática
    const element = document.getElementById('pdfTemplate');

    const opt = {
        margin:         0,
        filename:       `Memorial_Descritivo_UniFECAF_${poloNameInput.value.replace(/\s+/g, '_')}.pdf`,
        image:          { type: 'jpeg', quality: 0.98 },
        html2canvas:    { 
            scale: 2, 
            useCORS: true, 
            allowTaint: true,
            logging: false, 
            scrollX: 0, 
            scrollY: 0 
        },
        jsPDF:          { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:      { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        Swal.fire({
            icon: 'error',
            title: 'Erro na Geração',
            text: 'Ocorreu um erro ao gerar o arquivo PDF.',
            confirmButtonText: 'Fechar',
            confirmButtonColor: '#e11d48',
            customClass: { popup: 'rounded-2xl', confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm' }
        });
    });
}
