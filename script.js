/**
 * Gerador de Memorial Descritivo - Modelo UniFECAF (Landscape Slides)
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

const UNIFECAF_LOGO_WHITE = `
<div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" rx="15" stroke="white" stroke-width="12" fill="none"/>
        <rect x="35" y="35" width="30" height="30" fill="white"/>
    </svg>
    <span style="font-family: Arial, sans-serif; font-weight: 900; font-size: 42pt; color: white; letter-spacing: -1px;">UniFECAF</span>
</div>
`;

const UNIFECAF_ICON_TEAL = `
<svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="80" height="80" rx="12" stroke="#00d285" stroke-width="12" fill="none"/>
    <rect x="35" y="35" width="30" height="30" fill="#00d285"/>
</svg>
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
        <div class="p-5 border border-slate-700 rounded-xl bg-slate-900/60 shadow-md" id="card-${space.id}">
            <h3 class="font-bold text-white text-base mb-4 flex items-center justify-between">
                <span class="text-emerald-400 font-semibold">${space.title}</span>
                <span id="badge-${space.id}" class="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full hidden">Descrição Obrigatória</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Descrição / Inventário de Itens (Tópicos)
                    </label>
                    <textarea 
                        id="desc-${space.id}"
                        rows="5" 
                        placeholder="Ex: - 20 computadores Dell Core i5&#10;- Ar condicionado 24.000 BTUs&#10;- Botoeira de emergência e PWD"
                        oninput="updateDescription('${space.id}', this.value)"
                        class="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    ></textarea>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Fotos do Espaço (Até 4 imagens)
                    </label>
                    <input 
                        type="file" 
                        id="file-${space.id}"
                        accept="image/jpeg, image/png" 
                        multiple 
                        onchange="handleFileUpload('${space.id}', this)"
                        class="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 mb-3 cursor-pointer"
                    />
                    <div id="preview-${space.id}" class="grid grid-cols-4 gap-2"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function handleFileUpload(spaceId, input) {
    const files = Array.from(input.files);
    const currentImages = state.spaces[spaceId].images;

    if (currentImages.length + files.length > 4) {
        alert("Você só pode anexar até 4 fotos por ambiente.");
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
        <div class="relative group aspect-square border border-slate-700 rounded-lg bg-slate-950 overflow-hidden">
            <img src="${imgSrc}" class="w-full h-full object-cover">
            <button type="button" onclick="removeImage('${spaceId}', ${index})" 
                class="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center font-bold hover:bg-red-700 transition">
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

function generatePDF() {
    const poloNameInput = document.getElementById('poloName');
    const poloAddressInput = document.getElementById('poloAddress');
    const poloCepInput = document.getElementById('poloCep');
    const emissionDateInput = document.getElementById('emissionDate');

   if (!poloNameInput.value.trim()) {
    alert("Por favor, preencha o Nome do Polo.");
    poloNameInput.focus();
    return;
}

if (!poloAddressInput.value.trim()) {
    alert("Por favor, preencha o Endereço / Bairro.");
    poloAddressInput.focus();
    return;
}

if (!poloCepInput.value.trim()) {
    alert("Por favor, preencha o CEP.");
    poloCepInput.focus();
    return;
}
// TRAVA: Impede gerar o PDF caso haja foto sem descrição OU descrição sem foto
for (const spaceMeta of spacesMasterList) {
    const spaceData = state.spaces[spaceMeta.id];
    const hasImages = spaceData.images.length > 0;
    const hasDesc = spaceData.description.trim().length > 0;

    // Foto anexada sem texto
    if (hasImages && !hasDesc) {
        alert(`O ambiente "${spaceMeta.title}" possui foto(s) anexada(s), mas a descrição está em branco. Preencha a descrição para continuar.`);
        const textarea = document.getElementById(`desc-${spaceMeta.id}`);
        if (textarea) textarea.focus();
        return; // BARRA A GERAÇÃO
    }

    // Texto preenchido sem foto
    if (hasDesc && !hasImages) {
        alert(`O ambiente "${spaceMeta.title}" possui descrição, mas nenhuma foto foi anexada. Insira ao menos uma imagem para continuar.`);
        const fileInput = document.getElementById(`file-${spaceMeta.id}`);
        if (fileInput) fileInput.focus();
        return; // BARRA A GERAÇÃO
    }
}

    const templateContainer = document.getElementById('pdfTemplate');
    templateContainer.innerHTML = "";

    let activeSpacesCount = 0;

    // --- CAPA IGUAL AO SLIDE 1 ---
    const coverSlide = document.createElement('div');
    coverSlide.className = 'slide-page cover-slide';
    
    const address = poloAddressInput.value.trim();
    const cep = poloCepInput.value.trim();

    coverSlide.innerHTML = `
        <div class="top-right-logo-icon">
            ${UNIFECAF_ICON_TEAL}
        </div>

        <div class="cover-logo-container">
            ${UNIFECAF_LOGO_WHITE}
            <div class="cover-subtitle">Memorial descritivo</div>
        </div>

        <div class="cover-polo-info">
            <div>${poloNameInput.value.toUpperCase()}</div>
            ${address ? `<div>${address.toUpperCase()}</div>` : ''}
            ${cep ? `<div>${cep.toUpperCase()}</div>` : ''}
        </div>

        <div class="slide-footer" style="position: absolute; bottom: 15mm; left: 20mm; right: 20mm;">
            <span>UniFECAF - Centro Universitário</span>
            <span>Emissão: ${emissionDateInput.value || 'Data não informada'}</span>
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
                    return cleanLine ? `<li style="margin-bottom:6px;"><span style="color:#ffffff;">${cleanLine}</span></li>` : '';
                }).join('');
                formattedText = `<ul style="padding-left: 18px; list-style-type: square; color:#00d285;">${formattedText}</ul>`;
            } else {
                formattedText = `<p style="color:#e2e8f0; font-size:13pt; line-height:1.6; white-space:pre-line;">${spaceData.description}</p>`;
            }

            let gridClass = "images-grid";
            if (spaceData.images.length === 1) gridClass += " single-img";
            else if (spaceData.images.length === 2) gridClass += " two-imgs";

            const imagesHTML = hasImages ? `
                <div class="${gridClass}">
                    ${spaceData.images.map(img => `<img src="${img}" class="img-card" />`).join('')}
                </div>
            ` : `<div class="images-grid"><div style="height:135mm; background:rgba(255,255,255,0.02); border-radius:8px; border:1px dashed rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.4);">Sem fotos anexadas</div></div>`;

            slide.innerHTML = `
                <div class="slide-header">
                    <div class="slide-title-pill">${spaceMeta.title}</div>
                    <div class="slide-brand-small">
                        ${UNIFECAF_ICON_TEAL}
                        <span>UniFECAF</span>
                    </div>
                </div>

                <div class="slide-body">
                    ${imagesHTML}
                    <div class="description-box">
                        <div style="font-size: 11pt; text-transform: uppercase; color: #00d285; font-weight: 800; margin-bottom: 12px; letter-spacing: 1px;">
                            Especificações & Equipamentos
                        </div>
                        <div class="description-text">
                            ${formattedText}
                        </div>
                    </div>
                </div>

                <div class="slide-footer">
                    <span>Memorial Descritivo de Infraestrutura</span>
                    <span>${poloNameInput.value.toUpperCase()}</span>
                </div>
            `;

            templateContainer.appendChild(slide);
        }
    });

    if (activeSpacesCount === 0) {
        alert("Preencha a descrição ou insira imagens em ao menos um ambiente para gerar o PDF.");
        return;
    }

    // Configuração do PDF para Orientação Paisagem (Landscape / Slides)
    const element = document.getElementById('pdfTemplate');

    const opt = {
        margin:       0,
        filename:     `Memorial_Descritivo_UniFECAF_${poloNameInput.value.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };

 html2pdf().set(opt).from(element).save().then(() => {
        // Recarrega a página automaticamente após gerar o PDF
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o arquivo PDF.");
    });
}
