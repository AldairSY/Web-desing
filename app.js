let currentUser = null;
let currentCategory = null;
let currentProject = null;
let selectedFile = null;
let allProjects = [];

// INICIALIZAR AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicación...');
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        document.getElementById('userName').textContent = session.user.email;
        showPage('dashboardPage');
    }
    
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
        }
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            showPage('loginPage');
        }
    });

    const fileInput = document.getElementById('projectFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
});
// MANEJO DE ARCHIVO - ACEPTA WORD Y PDF
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/msword', // .doc
            'application/pdf' // .pdf
        ];
        
        const validExtensions = ['.docx', '.doc', '.pdf'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            alert('Por favor selecciona un archivo Word (.docx, .doc) o PDF (.pdf)');
            event.target.value = '';
            return;
        }
        
        // Validar tamaño (máximo 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB en bytes
        if (file.size > maxSize) {
            alert('El archivo es demasiado grande. Tamaño máximo: 50MB');
            event.target.value = '';
            return;
        }
        
        selectedFile = file;
        console.log('Archivo seleccionado:', file.name, 'Tipo:', file.type, 'Tamaño:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    }
}


// NAVEGACIÓN ENTRE PÁGINAS
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        if (currentUser) {
            const userNameElements = ['userName', 'userName2', 'userName3', 'userName4'];
            userNameElements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = currentUser.email;
                }
            });
        }
    }
}

// LOGIN
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.textContent = '';
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        document.getElementById('userName').textContent = email;
        showPage('dashboardPage');
        
    } catch (error) {
        console.error('Error de login:', error);
        errorDiv.textContent = 'Error: ' + error.message;
    }
});

// LOGOUT
['logoutBtn', 'logoutBtn2', 'logoutBtn3', 'logoutBtn4'].forEach(btnId => {
    document.getElementById(btnId)?.addEventListener('click', async () => {
        try {
            await supabase.auth.signOut();
            currentUser = null;
            currentCategory = null;
            currentProject = null;
            showPage('loginPage');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
        }
    });
});

// SELECCIONAR CATEGORÍA
async function selectCategory(category) {
    currentCategory = category;
    
    const categoryNames = {
        'tecnologica': 'Innovación Tecnológica',
        'aplicada': 'Innovación Aplicada',
        'pedagogica': 'Innovación Pedagógica'
    };
    
    document.getElementById('categoryTitle').textContent = categoryNames[category];
    showPage('projectsListPage');
    await loadProjects(category);
}

// CARGAR PROYECTOS
async function loadProjects(category) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allProjects = data || [];
        displayProjects(allProjects);
        
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        document.getElementById('projectsList').innerHTML = 
            '<p class="error-message">Error al cargar proyectos</p>';
    }
}

// MOSTRAR PROYECTOS
function displayProjects(projects) {
    const container = document.getElementById('projectsList');
    const noProjectsDiv = document.getElementById('noProjects');
    
    if (!projects || projects.length === 0) {
        container.style.display = 'none';
        noProjectsDiv.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    noProjectsDiv.style.display = 'none';
    
    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <h3>${project.name}</h3>
                <span class="project-status ${getStatusClass(project.score)}">
                    ${getStatusText(project.score)}
                </span>
            </div>
            <div class="project-info">
                <p><strong>Tipo:</strong> ${project.type || 'No especificado'}</p>
                <p><strong>Integrantes:</strong> ${project.members || 'No especificado'}</p>
                <p><strong>Línea de Investigación:</strong> ${project.research_line || 'No especificado'}</p>
                ${project.score !== null && project.score !== undefined ? 
                    `<p><strong>Puntaje:</strong> ${project.score}/40</p>` : 
                    '<p><em>Sin evaluar</em></p>'}
            </div>
            <div class="project-actions">
                <button class="btn btn-primary btn-small" onclick="evaluateProject(${project.id})">
                    ${project.score ? '✏️ Ver/Editar' : '📝 Evaluar'}
                </button>
                <button class="btn btn-secondary btn-small" onclick="viewProjectDetails(${project.id})">
                    👁️ Detalles
                </button>
                ${project.document_url ? 
                    `<button class="btn btn-success btn-small" onclick='downloadDocument("${project.document_url}", "${project.name}")'>
                        📥 Descargar
                    </button>` : ''}
                <button class="btn btn-danger btn-small" onclick='deleteProject(${project.id}, "${project.name.replace(/'/g, "\\'")}") '>
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusClass(score) {
    if (!score) return 'status-pending';
    if (score >= 32) return 'status-excellent';
    if (score >= 24) return 'status-good';
    if (score >= 16) return 'status-acceptable';
    return 'status-needs-improvement';
}

function getStatusText(score) {
    if (!score) return 'Pendiente';
    if (score >= 32) return 'Excelente';
    if (score >= 24) return 'Bueno';
    if (score >= 16) return 'Aceptable';
    return 'Necesita Mejoras';
}

// BUSCAR PROYECTOS
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayProjects(allProjects);
        return;
    }
    
    const filteredProjects = allProjects.filter(project => {
        const name = (project.name || '').toLowerCase();
        const type = (project.type || '').toLowerCase();
        const researchLine = (project.research_line || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               type.includes(searchTerm) || 
               researchLine.includes(searchTerm);
    });
    
    displayProjects(filteredProjects);
});

// ELIMINAR PROYECTO
async function deleteProject(projectId, projectName) {
    const confirmDelete = confirm(
        `¿Estás seguro que deseas eliminar el proyecto "${projectName}"?\n\n` +
        `Esta acción no se puede deshacer.`
    );
    
    if (!confirmDelete) return;
    
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (error) throw error;
        
        alert('✅ Proyecto eliminado exitosamente');
        await loadProjects(currentCategory);
        
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        alert('Error al eliminar el proyecto: ' + error.message);
    }
}

// DESCARGAR DOCUMENTO
function downloadDocument(documentUrl, projectName) {
    if (!documentUrl) {
        alert('Este proyecto no tiene documento adjunto');
        return;
    }
    
    const a = document.createElement('a');
    a.href = documentUrl;
    a.download = `${projectName.replace(/\s+/g, '_')}.docx`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert('📥 Descargando documento...');
}

// NUEVO PROYECTO
document.getElementById('newProjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Debes iniciar sesión');
        return;
    }
    
    const fileInput = document.getElementById('projectFile');
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Debes adjuntar el documento del proyecto (.docx)');
        return;
    }
    
    const formData = {
        name: document.getElementById('projectName').value,
        category: currentCategory,
        type: document.getElementById('projectType').value,
        research_line: document.getElementById('lineaInvestigacion').value,
        members: document.getElementById('integrantesIntegrantes').value,
        objective: document.getElementById('objetivoProyecto').value,
        beneficiaries: document.getElementById('beneficiarios').value,
        location: document.getElementById('localizacion').value,
        start_date: document.getElementById('fechaInicio').value,
        end_date: document.getElementById('fechaFin').value,
        user_id: currentUser.id
    };
    
    try {
        let documentUrl = null;
        const file = fileInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `projects/${currentUser.id}/${fileName}`;
        
        console.log('Subiendo archivo a Documentos...');
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('Documentos')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        console.log('Archivo subido exitosamente');
        const { data: urlData } = supabase.storage
            .from('Documentos')
            .getPublicUrl(filePath);
        
        documentUrl = urlData.publicUrl;
        formData.document_url = documentUrl;
        
        console.log('Insertando proyecto en base de datos...');
        const { data, error } = await supabase
            .from('projects')
            .insert([formData])
            .select();
        
        if (error) throw error;
        
        console.log('Proyecto creado exitosamente');
        alert('✅ Proyecto creado exitosamente');
        document.getElementById('newProjectForm').reset();
        
        await loadProjects(currentCategory);
        showPage('projectsListPage');
        
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        alert('Error al crear el proyecto: ' + error.message);
    }
});

// OBTENER CRITERIOS SEGÚN CATEGORÍA
function getCriteriosByCategory(category) {
    if (category === 'aplicada') {
        return [
            { name: 'I. DATOS GENERALES', max: 5 },
            { name: 'II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', max: 8 },
            { name: 'III. MARCO TEÓRICO', max: 7 },
            { name: 'IV. FORMULACIÓN DE HIPÓTESIS', max: 5 },
            { name: 'V. METODOLOGÍA', max: 8 },
            { name: 'VI. CRONOGRAMA DE ACTIVIDADES', max: 3 },
            { name: 'VII. PRESUPUESTO', max: 2 },
            { name: 'VIII. REFERENCIAS BIBLIOGRÁFICAS - APA', max: 2 }
        ];
    } else if (category === 'tecnologica') {
        return [
            { name: 'I. DATOS GENERALES', max: 5 },
            { name: 'II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', max: 8 },
            { name: 'III. MARCO REFERENCIAL', max: 7 },
            { name: 'IV. METODOLOGÍA DEL PROYECTO', max: 8 },
            { name: 'V. IDENTIFICACIÓN DEL MERCADO OBJETIVO', max: 5 },
            { name: 'VI. ADMINISTRACIÓN DEL PROYECTO', max: 5 },
            { name: 'VII. REFERENCIAS BIBLIOGRÁFICAS Y WEBGRAFÍA', max: 2 }
        ];
    } else if (category === 'pedagogica') {
        return [
            { name: 'I. DATOS GENERALES', max: 5 },
            { name: 'II. IDENTIFICACIÓN DE LA PROBLEMÁTICA', max: 8 },
            { name: 'III. DEFINICIÓN DE OBJETIVOS Y RESULTADOS', max: 5 },
            { name: 'IV. FUNDAMENTACIÓN TEÓRICA DEL PROYECTO', max: 7 },
            { name: 'V. METODOLOGÍA', max: 8 },
            { name: 'VI. PRESUPUESTO', max: 2 },
            { name: 'VII. ACTIVIDADES, METAS, CRONOGRAMA Y RESPONSABLES', max: 3 },
            { name: 'VIII. REFERENCIAS BIBLIOGRÁFICAS - APA', max: 2 }
        ];
    }
    return [];
}
// RENDERIZAR FORMULARIO DE EVALUACIÓN DINÁMICO
function renderEvaluationForm(criterios) {
    const container = document.getElementById('dynamicEvaluationContainer');
    let html = '<form id="evaluationForm" class="evaluation-form">';
    
    criterios.forEach((crit, idx) => {
        html += `
            <div class="evaluation-section">
                <h3 class="section-title">${crit.name}</h3>
                <div class="criterion-item">
                    <label class="criterion-label">
                        Calificación <span class="points-max">(máx. ${crit.max} puntos)</span>
                    </label>
                    <input type="number" id="eval_${idx}" class="criterion-input" 
                           min="0" max="${crit.max}" step="0.5" required placeholder="0-${crit.max}">
                </div>
                <div class="form-group">
                    <label>Observaciones</label>
                    <textarea id="obs_${idx}" rows="2" 
                              placeholder="Comentarios sobre este criterio..."></textarea>
                </div>
            </div>
        `;
    });
    
    const totalMax = criterios.reduce((sum, c) => sum + c.max, 0);
    
    html += `
        <div class="evaluation-summary">
            <h3>📊 Resumen de Evaluación</h3>
            <div class="final-score">
                <h4>Puntaje Total</h4>
                <div class="score-display">
                    <span id="finalScore" class="score-number">0</span>
                    <span class="score-max">/ ${totalMax}</span>
                </div>
                <div id="scoreStatus" class="score-status"></div>
            </div>
            <div class="form-group">
                <label>Observaciones Generales</label>
                <textarea id="generalObservations" rows="4" 
                          placeholder="Comentarios generales sobre el proyecto..."></textarea>
            </div>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="showPage('projectsListPage')">Cancelar</button>
            <button type="submit" class="btn btn-primary">💾 Guardar Evaluación</button>
            <button type="button" class="btn btn-success" onclick="exportEvaluation()" id="exportBtn" style="display:none;">
                📥 Exportar Resultados
            </button>
        </div>
    </form>`;
    
    container.innerHTML = html;
    
    criterios.forEach((crit, idx) => {
        document.getElementById(`eval_${idx}`).addEventListener('input', calculateDynamicTotal);
    });
    
    document.getElementById('evaluationForm').addEventListener('submit', saveDynamicEvaluation);
}

// CALCULAR TOTAL DINÁMICO
function calculateDynamicTotal() {
    let total = 0;
    document.querySelectorAll('.criterion-input').forEach(input => {
        total += parseFloat(input.value || 0);
    });
    
    document.getElementById('finalScore').textContent = total.toFixed(1);
    
    const statusDiv = document.getElementById('scoreStatus');
    if (total >= 32) {
        statusDiv.textContent = '🌟 Excelente';
        statusDiv.className = 'score-status status-excellent';
    } else if (total >= 24) {
        statusDiv.textContent = '✅ Bueno';
        statusDiv.className = 'score-status status-good';
    } else if (total >= 16) {
        statusDiv.textContent = '⚠️ Aceptable';
        statusDiv.className = 'score-status status-acceptable';
    } else {
        statusDiv.textContent = '❌ Necesita Mejoras';
        statusDiv.className = 'score-status status-needs-improvement';
    }
}

// GUARDAR EVALUACIÓN DINÁMICA
async function saveDynamicEvaluation(e) {
    e.preventDefault();
    
    if (!currentProject) {
        alert('Error: No hay proyecto seleccionado');
        return;
    }
    
    const evaluationData = {
        scores: {},
        observations: {}
    };
    
    document.querySelectorAll('.criterion-input').forEach((input, idx) => {
        evaluationData.scores[`eval_${idx}`] = parseFloat(input.value);
        evaluationData.observations[`obs_${idx}`] = document.getElementById(`obs_${idx}`).value;
    });
    
    evaluationData.generalObservations = document.getElementById('generalObservations').value;
    const totalScore = parseFloat(document.getElementById('finalScore').textContent);
    
    try {
        const { error } = await supabase
            .from('projects')
            .update({
                evaluation_data: evaluationData,
                score: totalScore,
                evaluated_at: new Date().toISOString()
            })
            .eq('id', currentProject.id);
        
        if (error) throw error;
        
        alert('✅ Evaluación guardada exitosamente');
        document.getElementById('exportBtn').style.display = 'inline-block';
        await loadProjects(currentCategory);
        
    } catch (error) {
        console.error('Error al guardar evaluación:', error);
        alert('Error al guardar la evaluación: ' + error.message);
    }
}

// EVALUAR PROYECTO
async function evaluateProject(projectId) {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) throw error;
        
        currentProject = project;
        document.getElementById('evalProjectTitle').textContent = 
            `Evaluación: ${project.name}`;
        
        document.getElementById('projectInfoDisplay').innerHTML = `
            <p><strong>Tipo:</strong> ${project.type || 'No especificado'}</p>
            <p><strong>Integrantes:</strong> ${project.members}</p>
            <p><strong>Línea de Investigación:</strong> ${project.research_line}</p>
            <p><strong>Objetivo:</strong> ${project.objective}</p>
            <p><strong>Beneficiarios:</strong> ${project.beneficiaries}</p>
            <p><strong>Localización:</strong> ${project.location}</p>
            <p><strong>Período:</strong> ${project.start_date} al ${project.end_date}</p>
            ${project.document_url ? 
                `<p><strong>Documento:</strong> <a href="${project.document_url}" target="_blank">Ver Documento</a></p>` : 
                '<p><em>Sin documento adjunto</em></p>'}
        `;
        
        const criterios = getCriteriosByCategory(project.category);
        renderEvaluationForm(criterios);
        
        if (project.evaluation_data) {
            const data = typeof project.evaluation_data === 'string' ? 
                JSON.parse(project.evaluation_data) : project.evaluation_data;
            
            Object.keys(data.scores || {}).forEach(key => {
                const input = document.getElementById(key);
                if (input) input.value = data.scores[key];
            });
            
            Object.keys(data.observations || {}).forEach(key => {
                const textarea = document.getElementById(key);
                if (textarea) textarea.value = data.observations[key];
            });
            
            if (data.generalObservations) {
                document.getElementById('generalObservations').value = data.generalObservations;
            }
            
            calculateDynamicTotal();
            document.getElementById('exportBtn').style.display = 'inline-block';
        }
        
        showPage('evaluationPage');
        
    } catch (error) {
        console.error('Error al cargar proyecto:', error);
        alert('Error al cargar el proyecto');
    }
}

// EXPORTAR EVALUACIÓN
function exportEvaluation() {
    if (!currentProject) {
        alert('No hay proyecto para exportar');
        return;
    }
    
    const totalScore = parseFloat(document.getElementById('finalScore').textContent);
    const criterios = getCriteriosByCategory(currentProject.category);
    
    let content = `EVALUACIÓN DE PROYECTO DE INNOVACIÓN\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `PROYECTO: ${currentProject.name}\n`;
    content += `CATEGORÍA: ${currentProject.category.toUpperCase()}\n`;
    content += `INTEGRANTES: ${currentProject.members}\n`;
    content += `LÍNEA DE INVESTIGACIÓN: ${currentProject.research_line}\n`;
    content += `FECHA DE EVALUACIÓN: ${new Date().toLocaleDateString('es-PE')}\n\n`;
    content += `${'='.repeat(60)}\n\n`;
    
    content += `CRITERIOS DE EVALUACIÓN:\n\n`;
    
    criterios.forEach((crit, idx) => {
        const score = document.getElementById(`eval_${idx}`)?.value || '0';
        const obs = document.getElementById(`obs_${idx}`)?.value || 'Ninguna';
        content += `${crit.name} (${score}/${crit.max} puntos)\n`;
        content += `   Observaciones: ${obs}\n\n`;
    });
    
    content += `${'='.repeat(60)}\n`;
    content += `PUNTAJE FINAL: ${totalScore.toFixed(1)} / 40 puntos\n`;
    content += `ESTADO: ${document.getElementById('scoreStatus').textContent}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `OBSERVACIONES GENERALES:\n${document.getElementById('generalObservations').value || 'Ninguna'}\n`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion_${currentProject.name.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('✅ Evaluación exportada exitosamente');
}

// VER DETALLES DEL PROYECTO
async function viewProjectDetails(projectId) {
    try {
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) throw error;
        
        let detailsHTML = `
            <div style="padding: 20px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h2>${project.name}</h2>
                <hr>
                <h3>Información General</h3>
                <p><strong>Tipo:</strong> ${project.type}</p>
                <p><strong>Integrantes:</strong> ${project.members}</p>
                <p><strong>Línea de Investigación:</strong> ${project.research_line}</p>
                <p><strong>Objetivo:</strong> ${project.objective}</p>
                <p><strong>Beneficiarios:</strong> ${project.beneficiaries}</p>
                <p><strong>Localización:</strong> ${project.location}</p>
                <p><strong>Período:</strong> ${project.start_date} al ${project.end_date}</p>
                
                ${project.document_url ? 
                    `<p><strong>Documento:</strong> <a href="${project.document_url}" target="_blank">Ver Documento</a></p>` : 
                    '<p><em>Sin documento adjunto</em></p>'}
                
                ${project.score ? 
                    `<h3>Evaluación</h3><p><strong>Puntaje:</strong> ${project.score}/40</p>` : 
                    '<p><em>Sin evaluar</em></p>'}
            </div>
        `;
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(detailsHTML);
        newWindow.document.close();
        
    } catch (error) {
        console.error('Error al ver detalles:', error);
        alert('Error al cargar los detalles del proyecto');
    }
}
// ===== SISTEMA DE BÚSQUEDA Y FILTROS AVANZADO =====

// Aplicar filtros combinados
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const filterType = document.getElementById('filterType')?.value || '';
    const filterProgram = document.getElementById('filterProgram')?.value.toLowerCase().trim() || '';
    
    const filteredProjects = allProjects.filter(project => {
        const matchesSearch = searchTerm === '' || 
            (project.name || '').toLowerCase().includes(searchTerm);
        
        const matchesType = filterType === '' || 
            project.type === filterType;
        
        const matchesProgram = filterProgram === '' || 
            (project.research_line || '').toLowerCase().includes(filterProgram);
        
        return matchesSearch && matchesType && matchesProgram;
    });
    
    displayProjects(filteredProjects);
    updateResultsCount(filteredProjects.length);
}

// Actualizar contador de resultados
function updateResultsCount(count) {
    const counterElement = document.getElementById('resultsCount');
    if (counterElement) {
        counterElement.textContent = count;
    }
}

// Limpiar todos los filtros
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterProgram').value = '';
    displayProjects(allProjects);
    updateResultsCount(allProjects.length);
}

// Event listeners para filtros en tiempo real
document.getElementById('searchInput')?.addEventListener('input', applyFilters);
document.getElementById('filterType')?.addEventListener('change', applyFilters);
document.getElementById('filterProgram')?.addEventListener('input', applyFilters);

// Actualizar contador al cargar proyectos
const originalLoadProjects = loadProjects;
loadProjects = async function(category) {
    await originalLoadProjects(category);
    updateResultsCount(allProjects.length);
};
