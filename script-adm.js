// =========================================================================
// INICIALIZAÇÃO & EVENTOS
// =========================================================================

let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    carregarMemoriais();
    renderizarListaEmailsAdm();
});

// Helper para proteção contra injeção de scripts (XSS)
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
// GERENCIAMENTO DA TABELA DE MEMORIAIS (COM PAGINAÇÃO)
// =========================================================================

function carregarMemoriais() {
    const lista = JSON.parse(localStorage.getItem('memoriaisEnviados')) || [];
    const tbody = document.getElementById('memorialsTableBody');

    let countPendente = 0, countAprovado = 0;

    // Calcula os contadores globais independentemente da página atual
    lista.forEach(item => {
        if (item.status === 'PENDENTE' || !item.status) countPendente++;
        if (item.status === 'Aprovado' || item.status === 'APROVADO') countAprovado++;
    });

    if (document.getElementById('countPendente')) document.getElementById('countPendente').innerText = countPendente;
    if (document.getElementById('countAprovado')) document.getElementById('countAprovado').innerText = countAprovado;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-12 px-4 text-center text-slate-400 font-medium">
                    Nenhum memorial enviado até o momento.
                </td>
            </tr>
        `;
        updatePaginationControls(0, 0, 0, 1);
        return;
    }

    // Lógica de Paginação
    const totalItems = lista.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = lista.slice(startIndex, endIndex);

    // Renderiza apenas os itens fatiados para a página atual
    paginatedItems.forEach(item => {
        let statusBadge = `<span class="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-xs rounded-full">PENDENTE</span>`;
        if (item.status === 'Aprovado' || item.status === 'APROVADO') statusBadge = `<span class="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">APROVADO</span>`;
        if (item.status === 'Rejeitado' || item.status === 'REJEITADO') statusBadge = `<span class="px-3 py-1 bg-rose-100 text-rose-700 font-bold text-xs rounded-full">REJEITADO</span>`;

        const poloNome = item.polo ? escaparHTML(item.polo) : 'Sem Nome';
        const emailContato = item.email || item.emailContato ? escaparHTML(item.email || item.emailContato) : 'Não informado';
        const dataEnvio = item.dataEnvio ? escaparHTML(item.dataEnvio) : 'N/A';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 border-b border-slate-100 transition-colors';
        tr.innerHTML = `
            <td class="p-4 font-semibold text-slate-700">${poloNome}</td>
            <td class="p-4 text-slate-500">${emailContato}</td>
            <td class="p-4 text-slate-500">${dataEnvio}</td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-center">
                <button onclick="analisarMemorial('${item.id}')" class="bg-[#1A3666] hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                    Analisar / Validar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePaginationControls(startIndex + 1, endIndex, totalItems, totalPages);
}

// Atualiza os textos e botões no rodapé da tabela
function updatePaginationControls(start, end, total, totalPages) {
    const info = document.getElementById('paginationInfo');
    const indicator = document.getElementById('pageIndicator');
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (info) info.textContent = total > 0 ? `Mostrando ${start}–${end} de ${total}` : 'Mostrando 0 de 0';
    if (indicator) indicator.textContent = `Página ${currentPage} de ${totalPages || 1}`;

    if (btnPrev) btnPrev.disabled = currentPage <= 1;
    if (btnNext) btnNext.disabled = currentPage >= totalPages || totalPages === 0;
}

// Disparado ao clicar nos botões "Anterior" ou "Próxima"
function changePage(direction) {
    currentPage += direction;
    carregarMemoriais();
}

// =========================================================================
// GERENCIAMENTO DE E-MAILS DE NOTIFICAÇÃO (ADM)
// =========================================================================

const EMAILS_PADRAO = ['admin@unifecaf.com.br'];

function obterEmailsAdm() {
    const salvos = localStorage.getItem('listaEmailsAdm');
    return salvos ? JSON.parse(salvos) : EMAILS_PADRAO;
}

function toggleConfigEmails() {
    const box = document.getElementById('boxConfigEmails');
    const icon = document.getElementById('iconChevron');
    if (box && icon) {
        box.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }
}

function renderizarListaEmailsAdm() {
    const container = document.getElementById('listaEmailsAdm');
    const badge = document.getElementById('badgeQtdEmails');
    if (!container) return;

    const emails = obterEmailsAdm();

    if (badge) {
        badge.innerText = `${emails.length} e-mail${emails.length !== 1 ? 's' : ''}`;
    }

    if (emails.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-400 italic">Nenhum e-mail de administrador cadastrado.</span>`;
        return;
    }

    container.innerHTML = emails.map((email, index) => `
        <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
            ${escaparHTML(email)}
            <button onclick="removerEmailAdm(${index})" class="text-slate-400 hover:text-red-500 font-bold ml-1 cursor-pointer">✕</button>
        </span>
    `).join('');
}

function adicionarEmailAdm() {
    const input = document.getElementById('novoEmailAdmInput');
    if (!input) return;

    const novoEmail = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(novoEmail)) {
        Swal.fire('E-mail Inválido', 'Por favor, informe um endereço de e-mail válido.', 'warning');
        return;
    }

    const emails = obterEmailsAdm();
    if (emails.includes(novoEmail)) {
        Swal.fire('Atenção', 'Este e-mail já está cadastrado na lista.', 'info');
        return;
    }

    emails.push(novoEmail);
    localStorage.setItem('listaEmailsAdm', JSON.stringify(emails));
    input.value = '';
    renderizarListaEmailsAdm();

    Swal.fire({
        icon: 'success',
        title: 'E-mail Adicionado!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
    });
}

function removerEmailAdm(index) {
    const emails = obterEmailsAdm();
    
    if (emails.length <= 1) {
        Swal.fire('Atenção', 'É necessário manter ao menos um e-mail cadastrado.', 'info');
        return;
    }

    Swal.fire({
        title: 'Remover e-mail?',
        text: `Deseja remover "${emails[index]}" da lista?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#F43F5E',
        cancelButtonColor: '#64748B'
    }).then((result) => {
        if (result.isConfirmed) {
            emails.splice(index, 1);
            localStorage.setItem('listaEmailsAdm', JSON.stringify(emails));
            renderizarListaEmailsAdm();
        }
    });
}

// =========================================================================
// INTEGRAÇÃO COM GOOGLE APPS SCRIPT
// =========================================================================

const URL_GOOGLE_SCRIPT = 'https://script.google.com/macros/s/AKfycbwmDh2tDlscfVGP7WnyS-piEKWqvNfJ9sgH0x5nLVBQYOTvBH7TrGtWxJPCcjGL2Vsi9w/exec';

async function notificarPoloPorEmail(emailPolo, status, poloNome, motivo = '') {
    if (!emailPolo || !emailPolo.includes('@')) {
        console.warn('E-mail do polo ausente ou inválido:', emailPolo);
        return;
    }

    const payload = {
        tipo: 'STATUS_MEMORIAL',
        emailPolo: emailPolo,
        poloNome: poloNome || 'Polo',
        status: status,
        motivo: motivo
    };

    try {
        await fetch(URL_GOOGLE_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        console.log(`Notificação de ${status} enviada para o Polo: ${emailPolo}`);
    } catch (error) {
        console.error('Erro ao enviar notificação ao Polo por e-mail:', error);
    }
}

async function notificarAdmsNovoMemorial(poloNome, emailPolo) {
    const emailsDestinatarios = obterEmailsAdm();

    const payload = {
        tipo: 'NOVO_MEMORIAL',
        emailsAdm: emailsDestinatarios, 
        poloNome: poloNome,
        emailPolo: emailPolo
    };

    try {
        await fetch(URL_GOOGLE_SCRIPT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        console.log(`Notificação de novo memorial enviada para os administradores:`, emailsDestinatarios);
    } catch (error) {
        console.error('Erro ao notificar administradores:', error);
    }
}

// =========================================================================
// MODAL DE ANÁLISE / VALIDAÇÃO
// =========================================================================

function analisarMemorial(id) {
    const lista = JSON.parse(localStorage.getItem('memoriaisEnviados')) || [];
    const item = lista.find(m => String(m.id) === String(id));

    if (!item) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Memorial não encontrado no sistema.'
        });
        return;
    }

    const htmlCompleto = montarEstruturaHTML(item);
    const totalPaginas = (item.ambientes ? item.ambientes.length : 0) + 1;

    Swal.fire({
        title: `<span style="font-size:14px; font-weight:bold; color: #334155;">Prévia do Memorial: ${escaparHTML(item.polo)} (${totalPaginas} página${totalPaginas > 1 ? 's' : ''})</span>`,
        html: `
            <div style="max-height: 68vh; overflow-y: auto; background-color: #1e293b; padding: 20px; border-radius: 10px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                <div id="pdfTemplate" style="box-shadow: 0 10px 25px rgba(0,0,0,0.3); background-color: #ffffff;">
                    ${htmlCompleto}
                </div>
            </div>
        `,
        width: '1100px',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Aprovar e Gerar PDF',
        denyButtonText: 'Rejeitar Memorial',
        cancelButtonText: 'Fechar',
        confirmButtonColor: '#10B981',
        denyButtonColor: '#F43F5E',
        cancelButtonColor: '#64748B',
        allowOutsideClick: false
    }).then(async (result) => {
        if (result.isConfirmed) {
            alterarStatus(id, 'Aprovado');
            await notificarPoloPorEmail(item.email || item.emailContato, 'Aprovado', item.polo);
            gerarPDFSemFalhas(item);
        } else if (result.isDenied) {
            const { value: motivo } = await Swal.fire({
                title: 'Motivo da Reprovação',
                input: 'textarea',
                inputLabel: 'Descreva detalhadamente o motivo da rejeição do memorial:',
                inputPlaceholder: 'Escreva aqui o motivo para o polo ajustar...',
                inputAttributes: {
                    'aria-label': 'Escreva aqui o motivo'
                },
                showCancelButton: true,
                confirmButtonText: 'Confirmar e Enviar E-mail',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#F43F5E',
                cancelButtonColor: '#64748B',
                inputValidator: (value) => {
                    if (!value || !value.trim()) {
                        return 'É obrigatório informar o motivo da reprovação!';
                    }
                }
            });

            if (motivo) {
                await notificarPoloPorEmail(item.email || item.emailContato, 'Rejeitado', item.polo, motivo);
                excluirMemorial(id);
            }
        }
    });
}

// =========================================================================
// MONTAGEM DO HTML E PDF
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
    ).toString().trim();

    const cep = (
        item.cep || 
        item.CEP || 
        item.codigoPostal || 
        ''
    ).toString().trim();

    if (endereco && cep) {
        return `${endereco} - CEP: ${cep}`;
    } else if (endereco) {
        return endereco;
    } else if (cep) {
        return `CEP: ${cep}`;
    }

    return '';
}

function montarEstruturaHTML(item) {
    const linhaEnderecoECEP = obterTextoEnderecoECEP(item);

    let html = `
        <div class="pdf-page" style="width: 297mm; height: 210mm; background-color: #0055d4; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-family: 'Arial', sans-serif; box-sizing: border-box; padding: 40px; page-break-after: always; position: relative; overflow: hidden;">
            <div style="margin-bottom: 30px; display: flex; justify-content: center; align-items: center;">
                <img src="channels4_profile-removebg-preview.png" style="width: 85px; height: 85px; object-fit: contain; filter: brightness(0) invert(1);" alt="Logo">
            </div>
            <h2 style="font-size: 20pt; font-weight: 700; margin: 0 0 20px 0; color: #ffffff;">
                Memorial Descritivo de Infraestrutura
            </h2>
            <h1 style="font-size: 26pt; font-weight: 900; text-transform: uppercase; margin: 0 0 20px 0; color: #ffffff; padding: 0 30px; line-height: 1.25; max-width: 90%;">
                ${escaparHTML(item.polo || '')}
            </h1>
            ${linhaEnderecoECEP ? `
                <p style="font-size: 13pt; margin: 0; color: #ffffff; font-weight: 400; opacity: 0.95;">
                    ${escaparHTML(linhaEnderecoECEP)}
                </p>
            ` : ''}
        </div>
    `;

    if (item.ambientes && item.ambientes.length > 0) {
        item.ambientes.forEach(amb => {
            const fotos = amb.fotos || [];
            
            let gridColumns = '1fr';
            let gridRows = '1fr';
            
            if (fotos.length === 2) {
                gridColumns = '1fr';
                gridRows = '1fr 1fr';
            } else if (fotos.length >= 3) {
                gridColumns = '1fr 1fr';
                gridRows = fotos.length > 2 ? '1fr 1fr' : '1fr';
            }

            html += `
                <div class="pdf-page" style="width: 297mm; height: 210mm; background-color: #ffffff; font-family: Arial, sans-serif; box-sizing: border-box; padding: 15mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; position: relative; overflow: hidden;">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; height: 12mm; margin-bottom: 5mm;">
                        <div style="background-color: #1A3666; color: #ffffff; padding: 6px 18px; border-radius: 8px; font-size: 14pt; font-weight: bold; display: flex; align-items: center; gap: 10px;">
                            <span style="width: 8px; height: 8px; background-color: #10B981; border-radius: 50%; display: inline-block;"></span>
                            ${escaparHTML(amb.titulo)}
                        </div>
                        <span style="color: #1A3666; font-size: 14pt; font-weight: 900; letter-spacing: 1px;">UNIFECAF</span>
                    </div>

                    <div style="display: flex; gap: 15px; height: 150mm; align-items: stretch; overflow: hidden;">
                        
                        <div style="flex: 1.3; display: grid; grid-template-columns: ${gridColumns}; grid-template-rows: ${gridRows}; gap: 10px; height: 100%; width: 100%;">
                            ${fotos.length > 0 
                                ? fotos.map(f => `
                                    <div style="width: 100%; height: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 5px; box-sizing: border-box; overflow: hidden;">
                                        <img src="${f}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;">
                                    </div>
                                `).join('')
                                : `<div style="width: 100%; height: 100%; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 11pt;">Nenhuma foto enviada</div>`
                            }
                        </div>

                        <div style="flex: 0.9; border-left: 4px solid #10B981; background-color: #ffffff; padding: 15px; border-radius: 0 8px 8px 0; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; height: 100%; box-sizing: border-box; overflow: hidden;">
                            <div style="color: #0066FF; font-size: 10pt; font-weight: 800; margin-bottom: 10px; letter-spacing: 0.5px; text-transform: uppercase;">ESPECIFICAÇÕES & EQUIPAMENTOS</div>
                            <div style="font-size: 10pt; color: #334155; line-height: 1.5; white-space: pre-line; max-height: 135mm; overflow-y: auto;">${escaparHTML(amb.descricao) || 'Sem especificações informadas.'}</div>
                        </div>

                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; height: 8mm; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; margin-top: 3mm;">
                        <span>${escaparHTML(item.polo)}</span>
                        <span style="font-weight: bold; color: #1A3666;">UniFECAF</span>
                    </div>

                </div>
            `;
        });
    }

    return html;
}

async function gerarPDFSemFalhas(item) {
    const { jsPDF } = window.jspdf;

    Swal.fire({
        title: 'Gerando PDF...',
        text: 'Desenhando capa e páginas...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const carregarImagemLogo = (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < imgData.data.length; i += 4) {
                    if (imgData.data[i + 3] > 0) {
                        imgData.data[i] = 255;
                        imgData.data[i + 1] = 255;
                        imgData.data[i + 2] = 255;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    };

    const logoBase64 = await carregarImagemLogo('channels4_profile-removebg-preview.png');

    doc.setFillColor(0, 85, 212);
    doc.rect(0, 0, 297, 210, 'F');

    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', 136, 35, 25, 25);
        } catch (e) {
            console.warn(e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Memorial Descritivo de Infraestrutura', 148.5, 82, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    const textoPolo = String(item.polo || '').toUpperCase();
    const linhasPolo = doc.splitTextToSize(textoPolo, 240);
    doc.text(linhasPolo, 148.5, 104, { align: 'center' });

    const linhaEnderecoECEP = obterTextoEnderecoECEP(item);

    if (linhaEnderecoECEP) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const offsetAltura = (linhasPolo.length - 1) * 10;
        const linhasEndereco = doc.splitTextToSize(linhaEnderecoECEP, 220);
        doc.text(linhasEndereco, 148.5, 122 + offsetAltura, { align: 'center' });
    }

    if (item.ambientes && item.ambientes.length > 0) {
        for (let i = 0; i < item.ambientes.length; i++) {
            const amb = item.ambientes[i];
            doc.addPage('a4', 'landscape');

            doc.setFillColor(26, 54, 102);
            doc.roundedRect(15, 10, 120, 12, 2, 2, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(String(amb.titulo || 'Ambiente'), 20, 18);

            doc.setTextColor(26, 54, 102);
            doc.setFontSize(14);
            doc.text('UNIFECAF', 280, 18, { align: 'right' });

            doc.setDrawColor(226, 232, 240);
            doc.line(15, 25, 280, 25);

            const fotos = amb.fotos || [];
            
            if (fotos.length === 1) {
                try { doc.addImage(fotos[0], 'JPEG', 15, 30, 140, 150); }
                catch (e) { try { doc.addImage(fotos[0], 'PNG', 15, 30, 140, 150); } catch (err) {} }
            } else if (fotos.length === 2) {
                try { doc.addImage(fotos[0], 'JPEG', 15, 30, 140, 72); } catch (e) {}
                try { doc.addImage(fotos[1], 'JPEG', 15, 105, 140, 75); } catch (e) {}
            } else if (fotos.length >= 3) {
                try { doc.addImage(fotos[0], 'JPEG', 15, 30, 68, 72); } catch (e) {}
                try { doc.addImage(fotos[1], 'JPEG', 87, 30, 68, 72); } catch (e) {}
                if (fotos[2]) try { doc.addImage(fotos[2], 'JPEG', 15, 105, 68, 75); } catch (e) {}
                if (fotos[3]) try { doc.addImage(fotos[3], 'JPEG', 87, 105, 68, 75); } catch (e) {}
            } else {
                doc.setDrawColor(203, 213, 225);
                doc.rect(15, 30, 140, 150, 'D');
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(11);
                doc.text('Nenhuma foto enviada', 85, 105, { align: 'center' });
            }

            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(241, 245, 249);
            doc.rect(160, 30, 120, 150, 'FD');

            doc.setFillColor(16, 185, 129);
            doc.rect(160, 30, 3, 150, 'F');

            doc.setTextColor(0, 102, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text('ESPECIFICAÇÕES & EQUIPAMENTOS', 168, 40);

            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            const textoDescricao = amb.descricao || 'Sem especificações informadas.';
            const linhasTexto = doc.splitTextToSize(textoDescricao, 105);
            doc.text(linhasTexto, 168, 50);

            doc.setDrawColor(226, 232, 240);
            doc.line(15, 190, 280, 190);

            doc.setTextColor(148, 163, 184);
            doc.setFontSize(8);
            doc.text(String(item.polo || ''), 15, 196);
            doc.text('UniFECAF', 280, 196, { align: 'right' });
        }
    }

    doc.save(`Memorial_${String(item.polo || 'Polo').replace(/[^a-z0-9]/gi, '_')}.pdf`);

    Swal.fire({
        icon: 'success',
        title: 'PDF Gerado!',
        text: 'Arquivo baixado e notificação enviada ao polo com sucesso!',
        confirmButtonColor: '#10B981'
    }).then(() => carregarMemoriais());
}

// =========================================================================
// AÇÕES DE STATUS E AUTENTICAÇÃO
// =========================================================================

function alterarStatus(id, novoStatus) {
    let lista = JSON.parse(localStorage.getItem('memoriaisEnviados')) || [];
    lista = lista.map(item => {
        if (String(item.id) === String(id)) {
            item.status = novoStatus;
        }
        return item;
    });
    localStorage.setItem('memoriaisEnviados', JSON.stringify(lista));
    carregarMemoriais();
}

function excluirMemorial(id) {
    let lista = JSON.parse(localStorage.getItem('memoriaisEnviados')) || [];
    lista = lista.filter(item => String(item.id) !== String(id));
    localStorage.setItem('memoriaisEnviados', JSON.stringify(lista));
    
    Swal.fire({
        icon: 'success',
        title: 'Memorial Rejeitado!',
        text: 'Notificação enviada e o registro do polo foi excluído do sistema.',
        confirmButtonColor: '#10B981'
    }).then(() => {
        carregarMemoriais();
    });
}

function logout() {
    localStorage.removeItem('userProfile');
    sessionStorage.clear();
    window.location.href = 'login.html';
}