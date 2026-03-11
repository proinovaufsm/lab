document.addEventListener('DOMContentLoaded', () => {
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.step');
    const form = document.getElementById('lab-form');
    let currentStep = 0;

    // Next Button behavior
    nextBtn.addEventListener('click', () => {
        // Simple validation check before proceeding
        if (validateStep(currentStep)) {
            currentStep++;
            updateFormSteps();
        } else {
            // Focus on first invalid element
            const firstInvalid = formSteps[currentStep].querySelector('[required]:invalid');
            if (firstInvalid) {
                firstInvalid.reportValidity();
            }
        }
    });

    // Previous Button behavior
    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateFormSteps();
    });

    // Submit form behavior
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;

            try {
                // Collect form data
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                // Process files (convert to Base64)
                const fileInputs = form.querySelectorAll('input[type="file"]');
                for (let fileInput of fileInputs) {
                    if (fileInput.files.length > 0) {
                        const file = fileInput.files[0];
                        data[fileInput.name] = await fileToBase64(file);
                    } else {
                        delete data[fileInput.name];
                    }
                }

                // Combine agendamento into horario
                if (data.agendamento) {
                    data.horario = (data.horario || "") + "\n\nAgendamento:\n" + data.agendamento;
                    delete data.agendamento;
                }

                // ==========================================
                // IMPORTANTE: COLE AQUI A URL DO SEU WEB APP
                // ==========================================
                const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZiGlodyr2DSf6FbGGaMhSN_8dnA_X29d-asMcOu-eNSZuIYj9tyyoN_OZlUz4OdoW/exec';

                if (!SCRIPT_URL || SCRIPT_URL === '') {
                    console.log("Modo de simulação: Configure o SCRIPT_URL no script.js para integrar com o Google Sheets");
                    console.log("Dados que seriam enviados:", data);
                    setTimeout(() => { showSuccess(); }, 1500);
                    return;
                }

                // Bypass Fetch restrictions locally using a hidden iframe form submission
                let hiddenIframe = document.getElementById('hidden_iframe');
                if (!hiddenIframe) {
                    hiddenIframe = document.createElement('iframe');
                    hiddenIframe.id = 'hidden_iframe';
                    hiddenIframe.name = 'hidden_iframe';
                    hiddenIframe.style.display = 'none';
                    document.body.appendChild(hiddenIframe);
                }

                const submitForm = document.createElement('form');
                submitForm.action = SCRIPT_URL;
                submitForm.method = 'POST';
                submitForm.target = 'hidden_iframe';
                submitForm.style.display = 'none';

                const inputData = document.createElement('input');
                inputData.type = 'hidden';
                inputData.name = 'data';
                inputData.value = JSON.stringify(data);

                submitForm.appendChild(inputData);
                document.body.appendChild(submitForm);

                submitForm.submit();

                // Wait a bit to simulate processing and bypass iframe load errors
                setTimeout(() => {
                    document.body.removeChild(submitForm);
                    showSuccess();
                }, 2000);

            } catch (error) {
                console.error("Erro ao preparar o envio: ", error);
                alert("Houve um erro interno antes do envio: " + error.message);
                submitBtn.innerHTML = 'Enviar Cadastro';
                submitBtn.disabled = false;
            }
        }
    });

    function showSuccess() {
        form.style.display = 'none';
        document.querySelector('.progress-container').style.display = 'none';
        document.querySelector('.form-header').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    }

    // Helper: Convert File to Base64 Object
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result.split(',')[1] // remove initial data:image/png;base64, etc
        });
        reader.onerror = error => reject(error);
    });

    // Function to update visibility of steps and buttons
    function updateFormSteps() {
        // Toggle Steps visibility
        formSteps.forEach((step, index) => {
            step.classList.toggle('active', index === currentStep);
        });

        // Toggle Buttons visibility
        prevBtn.style.display = currentStep === 0 ? 'none' : 'flex';

        if (currentStep === formSteps.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }

        // Update Progress Bar & Step Indicators
        updateProgressBar();
    }

    // Function to update progress visual styling
    function updateProgressBar() {
        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Update titles
        const titles = document.querySelectorAll('.step-col span');
        titles.forEach((title, index) => {
            title.classList.toggle('active', index === currentStep);
        });

        // Update progress bar width line
        const progressBar = document.getElementById('progress-bar');
        const progressPercentage = ((currentStep) / (progressSteps.length - 1)) * 100;

        // We now directly update the width property in inline style
        // As the CSS .progress-bar width is 0% by default
        progressBar.style.width = `${progressPercentage}%`;

        // Scroll to top of form when step changes smoothly
        window.scrollTo({
            top: document.querySelector('.container').offsetTop - 30,
            behavior: 'smooth'
        });
    }

    // Basic HTML5 validation trigger
    function validateStep(stepIndex) {
        const currentFormStep = formSteps[stepIndex];
        const inputs = currentFormStep.querySelectorAll('input[required], textarea[required], select[required]');

        let isValid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                // Add an error class if desired: input.classList.add('error');
            }
        });

        return isValid;
    }

    // Handling file inputs layout update
    const fileInputs = document.querySelectorAll('.file-input');
    fileInputs.forEach(input => {
        const fileNameDisplayId = 'file-name-' + input.id.split('_')[1];
        const displayEl = document.getElementById(fileNameDisplayId);

        // Add dynamic clear button
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        clearBtn.className = 'btn-icon delete clear-file-btn';
        clearBtn.style.display = 'none';
        clearBtn.style.marginLeft = '0.5rem';
        clearBtn.style.verticalAlign = 'middle';
        clearBtn.title = 'Remover arquivo';

        if (displayEl && displayEl.parentNode) {
            displayEl.parentNode.insertBefore(clearBtn, displayEl.nextSibling);
        }

        clearBtn.addEventListener('click', () => {
            input.value = ''; // clear the file input
            input.dispatchEvent(new Event('change')); // trigger change event to update UI
        });

        input.addEventListener('change', function (e) {
            const hasFile = e.target.files && e.target.files.length > 0;
            const fileName = hasFile ? e.target.files[0].name : 'Nenhum arquivo selecionado';

            if (displayEl) {
                displayEl.textContent = fileName;
                displayEl.style.color = hasFile ? '#1e293b' : 'var(--text-muted)';
                displayEl.style.fontWeight = hasFile ? '500' : 'normal';
            }

            if (clearBtn) {
                clearBtn.style.display = hasFile ? 'inline-block' : 'none';
            }
        });
    });
});

// Global Function to toggle conditional fields Based on Radio Button
window.toggleConditionalField = function (fieldId, show) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.display = show ? 'block' : 'none';

        // Toggle required attributes for inner inputs to avoid form blocked issues if hidden
        // Skip elements manually marked with class 'optional-field'
        const inputs = field.querySelectorAll('input:not(.optional-field), textarea:not(.optional-field), select:not(.optional-field)');
        inputs.forEach(input => {
            if (show) {
                input.setAttribute('required', 'required');
            } else {
                input.removeAttribute('required');
                // Optional: clear values if hiding
                // input.value = '';
            }
        });
    }
}

// Equipment List Logic
let equipments = [];

window.openEquipmentModal = function (index = -1) {
    const modal = document.getElementById('equipment-modal');
    modal.classList.add('active');

    if (index >= 0) {
        // Edit mode
        document.getElementById('modal-title').innerText = 'Editar Equipamento';
        document.getElementById('eq_index').value = index;
        document.getElementById('eq_nome').value = equipments[index].nome;
        document.getElementById('eq_specs').value = equipments[index].specs;
        document.getElementById('eq_patrimonio').value = equipments[index].patrimonio;
        document.getElementById('btn-save-eq').innerText = 'Salvar';
    } else {
        // Add mode
        document.getElementById('modal-title').innerText = 'Novo Equipamento';
        document.getElementById('eq_index').value = '';
        document.getElementById('eq_nome').value = '';
        document.getElementById('eq_specs').value = '';
        document.getElementById('eq_patrimonio').value = '';
        document.getElementById('btn-save-eq').innerText = 'Adicionar';
    }
}

window.closeEquipmentModal = function () {
    document.getElementById('equipment-modal').classList.remove('active');
}

window.saveEquipment = function () {
    const nome = document.getElementById('eq_nome').value.trim();
    const specs = document.getElementById('eq_specs').value.trim();
    const patrimonio = document.getElementById('eq_patrimonio').value.trim();
    const index = document.getElementById('eq_index').value;

    if (!nome || !specs || !patrimonio) {
        alert("Por favor, preencha todos os campos do equipamento.");
        return;
    }

    const eq = { nome, specs, patrimonio };

    if (index === '') {
        equipments.push(eq);
    } else {
        equipments[parseInt(index)] = eq;
    }

    closeEquipmentModal();
    renderEquipments();
}

window.deleteEquipment = function (index) {
    if (confirm("Deseja realmente remover este equipamento?")) {
        equipments.splice(index, 1);
        renderEquipments();
    }
}

function renderEquipments() {
    const listEl = document.getElementById('equipment-list');
    const hiddenInput = document.getElementById('infraestrutura_hidden');
    listEl.innerHTML = '';

    if (equipments.length === 0) {
        hiddenInput.value = '';
        return;
    }

    // Gerar visual
    equipments.forEach((eq, index) => {
        const item = document.createElement('div');
        item.className = 'equipment-item';
        item.innerHTML = `
            <div class="eq-info">
                <h4>${eq.nome.replace(/</g, "&lt;")}</h4>
                <p>${eq.specs.replace(/</g, "&lt;").replace(/\n/g, '<br>')}</p>
                <div class="eq-pat">Patrimônio: ${eq.patrimonio.replace(/</g, "&lt;")}</div>
            </div>
            <div class="eq-actions">
                <button type="button" class="btn-icon edit" onclick="openEquipmentModal(${index})"><i class="fa-solid fa-pen"></i></button>
                <button type="button" class="btn-icon delete" onclick="deleteEquipment(${index})"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `;
        listEl.appendChild(item);
    });

    // Atualizar valor invisível do form formatado para a planilha
    const formatado = equipments.map((eq, i) => `Equipamento ${i + 1}:\nNome: ${eq.nome}\nSpecs: ${eq.specs}\nPatrimônio: ${eq.patrimonio}`).join('\n\n');
    hiddenInput.value = formatado;
}

