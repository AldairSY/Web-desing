let currentUser = null;
let currentCategory = null;
let currentProject = null;
let selectedFile = null;
let allProjects = [];

// INICIALIZAR AL CARGAR LA PÁGINA
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicación...');
    
    // Verificar sesión existente
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.getElementById('userName').textContent = session.user.email;
        showPage('dashboardPage');
    }
    
    // Escuchar cambios de autenticación
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
    
    // Configurar eventos de evaluación
    const evalInputIds = [
        'eval1_1', 'eval1_2', 'eval1_3', 'eval1_4', 'eval1_5',
        'eval2_1', 'eval2_2', 'eval2_3',
        'eval3_1', 'eval3_2', 'eval3_3', 'eval3_4',
        'eval4_1', 'eval4_2', 'eval4_3', 'eval4_4',
        'eval5_1', 'eval5_2', 'eval5_3', 'eval5_4',
        'eval6_1', 'eval6_2'
    ];
    
    evalInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateAllTotals);
        }
    });

    // Configurar upload de archivos
    const fileInput = document.getElementById('projectFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        
        const uploadArea = document.querySelector('.file-upload-area');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type === 'application/pdf') {
                    fileInput.files = files;
                    handleFileSelect({ target: fileInput });
                }
            });
        }
    }
});

// CÁLCULOS DE EVALUACIÓN
function calculateAllTotals() {
    const subtotal1 = getSubtotal(['eval1_1', 'eval1_2', 'eval1_3', 'eval1_4', 'eval1_5']);
    const subtotal2 = getSubtotal(['eval2_1', 'eval2_2', 'eval2_3']);
    const subtotal3 = getSubtotal(['eval3_1', 'eval3_2', 'eval3_3', 'eval3_4']);
    const subtotal4 = getSubtotal(['eval4_1', 'eval4_2', 'eval4_3', 'eval4_4']);
    const subtotal5 = getSubtotal(['eval5_1', 'eval5_2', 'eval5_3', 'eval5_4']);
    const subtotal6 = getSubtotal(['eval6_1', 'eval6_2']);
    
    updateElement('subtotal1', subtotal1.toFixed(1));
    updateElement('subtotal2', subtotal2.toFixed(1));
    updateElement('subtotal3', subtotal3.toFixed(1));
    updateElement('subtotal4', subtotal4.toFixed(1));
    updateElement('subtotal5', subtotal5.toFixed(1));
    updateElement('subtotal6', subtotal6.toFixed(1));
    
    updateElement('final1', subtotal1.toFixed(1));
    updateElement('final2', subtotal2.toFixed(1));
    updateElement('final3', subtotal3.toFixed(1));
    updateElement('final4', subtotal4.toFixed(1));
    updateElement('final5', subtotal5.toFixed(1));
    updateElement('final6', subtotal6.toFixed(1));
    
    const totalScore = subtotal1 + subtotal2 + subtotal3 + subtotal4 + subtotal5 + subtotal6;
    updateElement('totalScoreDisplay', Math.round(totalScore));
    updateElement('finalTotal', `${totalScore.toFixed(1)} / 100`);
    
    updateEvaluationStatus(totalScore);
}

function getSubtotal(inputIds) {
    return inputIds.reduce((sum, id) => {
        const value = parseFloat(document.getElementById(id)?.value) || 0;
        return sum + value;
    }, 0);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function updateEvaluationStatus(score) {
    const statusElement = document.getElementById('evaluationStatus');
    if (!statusElement) return;
    
    statusElement.className = 'evaluation-status';
    
    if (score >= 90) {
        statusElement.classList.add('excellent');
        statusElement.textContent = '🏆 EXCELENTE - Proyecto aprobado con distinción';
    } else if (score >= 75) {
        statusElement.classList.add('good');
        statusElement.textContent = '✅ BUENO - Proyecto aprobado satisfactoriamente';
    } else if (score >= 60) {
        statusElement.classList.add('regular');
        statusElement.textContent = '⚠️ REGULAR - Proyecto aprobado con observaciones';
    } else {
        statusElement.classList.add('poor');
        statusElement.textContent = '❌ INSUFICIENTE - Proyecto requiere mejoras significativas';
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type !== 'application/pdf') {
            alert('Por favor selecciona solo archivos PDF');
            event.target.value = '';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            alert('El archivo es muy grande. Máximo 10MB');
            event.target.value = '';
            return;
        }
        
        selectedFile = file;
        document.getElementById('fileName').textContent = file.name;
        document.querySelector('.file-upload-area').classList.add('file-selected');
    }
}

// LOGIN
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
        document.getElementById('loginError').textContent = 'Error: ' + error.message;
    }
});

// LOGOUT
async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    showPage('loginPage');
}

// NAVEGACIÓN
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showDashboard() {
    showPage('dashboardPage');
}

function backToCategory() {
    if (currentCategory) {
        openCategory(currentCategory);
    } else {
        showDashboard();
    }
}

// ABRIR CATEGORÍA
async function openCategory(category) {
    currentCategory = category;
    
    const titles = {
        'tecnologica': 'Innovación Tecnológica',
        'aplicada': 'Innovación Aplicada',
        'pedagogica': 'Innovación Pedagógica'
    };
    
    document.getElementById('categoryTitle').textContent = titles[category];
    await loadProjects(category);
    showPage('categoryPage');
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
        console.error('Error loading projects:', error);
        alert('Error al cargar proyectos: ' + error.message);
    }
}

// MOSTRAR PROYECTOS CON BOTÓN DE ELIMINAR
function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<p style="color: white; text-align: center; padding: 40px;">No hay proyectos registrados.</p>';
        const filterCount = document.getElementById('filterCount');
        if (filterCount) {
            filterCount.textContent = '0 proyectos encontrados';
        }
        return;
    }
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-card-header">
                <h3 onclick="openProject('${project.id}')" style="cursor: pointer;">${project.name}</h3>
                <button onclick="deleteProject('${project.id}', event)" class="btn-delete" title="Eliminar proyecto">
                    🗑️
                </button>
            </div>
            <div onclick="openProject('${project.id}')" style="cursor: pointer;">
                <p><strong>Tipo:</strong> ${project.type}</p>
                <p><strong>Investigadores:</strong> ${project.researchers}</p>
                <p><strong>Programa:</strong> ${project.study_program}</p>
                ${project.file_url ? '<p style="color: #667eea;">📎 Documento adjunto</p>' : ''}
                <div class="project-meta">
                    <span>📧 ${project.contact_email}</span>
                    <span>📅 ${new Date(project.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    const filterCount = document.getElementById('filterCount');
    if (filterCount) {
        filterCount.textContent = `${projects.length} proyecto${projects.length !== 1 ? 's' : ''} encontrado${projects.length !== 1 ? 's' : ''}`;
    }
}

// FILTROS
function applyFilters() {
    const filterName = document.getElementById('filterName').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const filterResearcher = document.getElementById('filterResearcher').value.toLowerCase();
    const filterProgram = document.getElementById('filterProgram').value.toLowerCase();
    
    const filtered = allProjects.filter(project => {
        const matchName = project.name.toLowerCase().includes(filterName);
        const matchType = !filterType || project.type === filterType;
        const matchResearcher = project.researchers.toLowerCase().includes(filterResearcher);
        const matchProgram = project.study_program.toLowerCase().includes(filterProgram);
        
        return matchName && matchType && matchResearcher && matchProgram;
    });
    
    displayProjects(filtered);
}

function clearFilters() {
    document.getElementById('filterName').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterResearcher').value = '';
    document.getElementById('filterProgram').value = '';
    displayProjects(allProjects);
}

// ELIMINAR PROYECTO - VERSIÓN CORREGIDA
async function deleteProject(projectId, event) {
    event.stopPropagation();
    
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este proyecto?\n\nEsta acción no se puede deshacer.');
    
    if (!confirmDelete) return;
    
    try {
        console.log('=== INICIANDO ELIMINACIÓN ===');
        console.log('Project ID:', projectId);
        
        // Primero eliminar el archivo del storage si existe
        const projectToDelete = allProjects.find(p => p.id === projectId);
        if (projectToDelete && projectToDelete.file_path) {
            console.log('Eliminando archivo del storage...');
            const { error: storageError } = await supabase.storage
                .from('Documentos')
                .remove([projectToDelete.file_path]);
            
            if (storageError) {
                console.log('Error eliminando archivo (puede no existir):', storageError);
            }
        }
        
        // Eliminar evaluaciones asociadas
        console.log('Eliminando evaluaciones...');
        const { error: evalError } = await supabase
            .from('evaluations')
            .delete()
            .eq('project_id', projectId);
        
        if (evalError && evalError.code !== 'PGRST116') {
            console.error('Error eliminando evaluaciones:', evalError);
            throw evalError;
        }
        
        // Eliminar el proyecto
        console.log('Eliminando proyecto...');
        const { error: projectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);
        
        if (projectError) {
            console.error('Error eliminando proyecto:', projectError);
            throw projectError;
        }
        
        console.log('✓ Proyecto eliminado de la base de datos');
        
        // Actualizar la lista local
        allProjects = allProjects.filter(p => p.id !== projectId);
        console.log('✓ Lista local actualizada');
        
        // Aplicar filtros actuales si hay alguno activo
        const hasActiveFilters = 
            document.getElementById('filterName').value ||
            document.getElementById('filterType').value ||
            document.getElementById('filterResearcher').value ||
            document.getElementById('filterProgram').value;
        
        if (hasActiveFilters) {
            console.log('Aplicando filtros...');
            applyFilters();
        } else {
            console.log('Mostrando todos los proyectos...');
            displayProjects(allProjects);
        }
        
        console.log('✓✓✓ ELIMINACIÓN COMPLETA ✓✓✓');
        alert('✓ Proyecto eliminado exitosamente');
        
    } catch (error) {
        console.error('❌ ERROR ELIMINANDO:', error);
        alert('Error al eliminar proyecto: ' + error.message);
    }
}


function showNewProjectForm() {
    document.getElementById('newProjectForm').reset();
    selectedFile = null;
    document.getElementById('fileName').textContent = 'Selecciona un archivo PDF o arrastra aquí';
    document.querySelector('.file-upload-area').classList.remove('file-selected');
    showPage('newProjectPage');
}

async function uploadFile(file, projectId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${projectId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { data, error } = await supabase.storage
        .from('Documentos')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
        .from('Documentos')
        .getPublicUrl(filePath);
    
    return {
        path: filePath,
        url: urlData.publicUrl
    };
}

// GUARDAR NUEVO PROYECTO
document.getElementById('newProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Tu sesión expiró. Por favor inicia sesión nuevamente.');
            showPage('loginPage');
            return;
        }
        
        const projectData = {
            category: currentCategory,
            name: document.getElementById('projectName').value,
            type: document.getElementById('projectType').value,
            researchers: document.getElementById('researchers').value,
            study_program: document.getElementById('studyProgram').value,
            research_line: document.getElementById('researchLine').value,
            contact_email: document.getElementById('contactEmail').value,
            general_info: document.getElementById('generalInfo').value,
            problem_description: document.getElementById('problemDescription').value,
            theoretical_framework: document.getElementById('theoreticalFramework').value,
            project_summary: document.getElementById('projectSummary').value,
            user_id: session.user.id
        };
        
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .insert([projectData])
            .select()
            .single();
        
        if (projectError) throw projectError;
        
        if (selectedFile) {
            document.getElementById('uploadProgress').style.display = 'block';
            const fileData = await uploadFile(selectedFile, project.id);
            
            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    file_path: fileData.path,
                    file_url: fileData.url
                })
                .eq('id', project.id);
            
            if (updateError) throw updateError;
        }
        
        alert('¡Proyecto guardado exitosamente!');
        openCategory(currentCategory);
        
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Error al guardar proyecto: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Proyecto';
        document.getElementById('uploadProgress').style.display = 'none';
    }
});

// ABRIR PROYECTO PARA EVALUACIÓN
async function openProject(projectId) {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) throw error;
        
        currentProject = data;
        
        document.getElementById('evalProjectTitle').textContent = data.name;
        
        let fileSection = '';
        if (data.file_url) {
            fileSection = `
                <div class="file-attachment">
                    <span class="file-attachment-icon">📄</span>
                    <div class="file-attachment-info">
                        <div class="file-attachment-name">Documento del Proyecto</div>
                        <small style="color: #666;">PDF adjunto</small>
                    </div>
                    <div class="file-attachment-actions">
                        <button onclick="downloadProjectFile('${data.file_url}')" class="btn-download">
                            ⬇️ Descargar
                        </button>
                        <button onclick="viewProjectFile('${data.file_url}')" class="btn-download" style="background: #3498db;">
                            👁️ Ver
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('projectInfoDisplay').innerHTML = `
            <p><strong>Tipo de Proyecto:</strong> ${data.type}</p>
            <p><strong>Investigadores:</strong> ${data.researchers}</p>
            <p><strong>Programa de Estudio:</strong> ${data.study_program}</p>
            <p><strong>Línea de Investigación:</strong> ${data.research_line}</p>
            <p><strong>Correo de Contacto:</strong> ${data.contact_email}</p>
            <p><strong>Información General:</strong> ${data.general_info}</p>
            <p><strong>Problemática:</strong> ${data.problem_description}</p>
            <p><strong>Marco Teórico:</strong> ${data.theoretical_framework}</p>
            <p><strong>Resumen:</strong> ${data.project_summary}</p>
            ${fileSection}
        `;
        
        const { data: evalData } = await supabase
            .from('evaluations')
            .select('*')
            .eq('project_id', projectId)
            .single();
        
        if (evalData) {
            document.getElementById('eval1_1').value = evalData.eval1_1 || '';
            document.getElementById('eval1_2').value = evalData.eval1_2 || '';
            document.getElementById('eval1_3').value = evalData.eval1_3 || '';
            document.getElementById('eval1_4').value = evalData.eval1_4 || '';
            document.getElementById('eval1_5').value = evalData.eval1_5 || '';
            
            document.getElementById('eval2_1').value = evalData.eval2_1 || '';
            document.getElementById('eval2_2').value = evalData.eval2_2 || '';
            document.getElementById('eval2_3').value = evalData.eval2_3 || '';
            
            document.getElementById('eval3_1').value = evalData.eval3_1 || '';
            document.getElementById('eval3_2').value = evalData.eval3_2 || '';
            document.getElementById('eval3_3').value = evalData.eval3_3 || '';
            document.getElementById('eval3_4').value = evalData.eval3_4 || '';
            
            document.getElementById('eval4_1').value = evalData.eval4_1 || '';
            document.getElementById('eval4_2').value = evalData.eval4_2 || '';
            document.getElementById('eval4_3').value = evalData.eval4_3 || '';
            document.getElementById('eval4_4').value = evalData.eval4_4 || '';
            
            document.getElementById('eval5_1').value = evalData.eval5_1 || '';
            document.getElementById('eval5_2').value = evalData.eval5_2 || '';
            document.getElementById('eval5_3').value = evalData.eval5_3 || '';
            document.getElementById('eval5_4').value = evalData.eval5_4 || '';
            
            document.getElementById('eval6_1').value = evalData.eval6_1 || '';
            document.getElementById('eval6_2').value = evalData.eval6_2 || '';
            
            document.getElementById('obs1').value = evalData.obs1 || '';
            document.getElementById('obs2').value = evalData.obs2 || '';
            document.getElementById('obs3').value = evalData.obs3 || '';
            document.getElementById('obs4').value = evalData.obs4 || '';
            document.getElementById('obs5').value = evalData.obs5 || '';
            document.getElementById('obs6').value = evalData.obs6 || '';
            document.getElementById('finalRecommendations').value = evalData.final_recommendations || '';
            
            calculateAllTotals();
        } else {
            document.getElementById('evaluationForm').reset();
        }
        
        showPage('evaluationPage');
    } catch (error) {
        console.error('Error loading project:', error);
        alert('Error al cargar proyecto: ' + error.message);
    }
}

function downloadProjectFile(url) {
    window.open(url, '_blank');
}

function viewProjectFile(url) {
    window.open(url, '_blank');
}

// GUARDAR EVALUACIÓN
document.getElementById('evaluationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('=== GUARDANDO EVALUACIÓN ===');
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            alert('Tu sesión expiró. Inicia sesión nuevamente.');
            showPage('loginPage');
            return;
        }
        
        if (!currentProject) {
            alert('Error: No hay proyecto seleccionado');
            return;
        }
        
        console.log('Sesión OK, Proyecto:', currentProject.id);
        
        const evaluationData = {
            project_id: currentProject.id,
            
            eval1_1: parseFloat(document.getElementById('eval1_1').value) || 0,
            eval1_2: parseFloat(document.getElementById('eval1_2').value) || 0,
            eval1_3: parseFloat(document.getElementById('eval1_3').value) || 0,
            eval1_4: parseFloat(document.getElementById('eval1_4').value) || 0,
            eval1_5: parseFloat(document.getElementById('eval1_5').value) || 0,
            
            eval2_1: parseFloat(document.getElementById('eval2_1').value) || 0,
            eval2_2: parseFloat(document.getElementById('eval2_2').value) || 0,
            eval2_3: parseFloat(document.getElementById('eval2_3').value) || 0,
            
            eval3_1: parseFloat(document.getElementById('eval3_1').value) || 0,
            eval3_2: parseFloat(document.getElementById('eval3_2').value) || 0,
            eval3_3: parseFloat(document.getElementById('eval3_3').value) || 0,
            eval3_4: parseFloat(document.getElementById('eval3_4').value) || 0,
            
            eval4_1: parseFloat(document.getElementById('eval4_1').value) || 0,
            eval4_2: parseFloat(document.getElementById('eval4_2').value) || 0,
            eval4_3: parseFloat(document.getElementById('eval4_3').value) || 0,
            eval4_4: parseFloat(document.getElementById('eval4_4').value) || 0,
            
            eval5_1: parseFloat(document.getElementById('eval5_1').value) || 0,
            eval5_2: parseFloat(document.getElementById('eval5_2').value) || 0,
            eval5_3: parseFloat(document.getElementById('eval5_3').value) || 0,
            eval5_4: parseFloat(document.getElementById('eval5_4').value) || 0,
            
            eval6_1: parseFloat(document.getElementById('eval6_1').value) || 0,
            eval6_2: parseFloat(document.getElementById('eval6_2').value) || 0,
            
            obs1: document.getElementById('obs1').value || '',
            obs2: document.getElementById('obs2').value || '',
            obs3: document.getElementById('obs3').value || '',
            obs4: document.getElementById('obs4').value || '',
            obs5: document.getElementById('obs5').value || '',
            obs6: document.getElementById('obs6').value || '',
            
            final_recommendations: document.getElementById('finalRecommendations').value || '',
            total_score: parseFloat(document.getElementById('finalTotal').textContent.split('/')[0].trim()) || 0,
            evaluator_id: session.user.id
        };
        
        console.log('Datos:', evaluationData);
        
        const { data, error } = await supabase
            .from('evaluations')
            .upsert([evaluationData], { 
                onConflict: 'project_id'
            })
            .select();
        
        if (error) {
            console.error('Error Supabase:', error);
            throw error;
        }
        
        console.log('✓ GUARDADO EXITOSO');
        alert('¡Evaluación guardada exitosamente!\n\nPuntuación: ' + evaluationData.total_score + '/100');
        
    } catch (error) {
        console.error('ERROR:', error);
        alert('Error al guardar: ' + error.message);
    }
});

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('EVALUACION DE PROYECTO DE INNOVACION', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Proyecto: ${currentProject.name}`, 20, 30);
    doc.setFontSize(10);
    doc.text(`Investigadores: ${currentProject.researchers}`, 20, 38);
    doc.text(`Programa: ${currentProject.study_program}`, 20, 45);
    
    let y = 60;
    
    doc.setFontSize(11);
    doc.text('1. Datos Generales: ' + document.getElementById('subtotal1').textContent + ' / 15', 20, y);
    y += 10;
    doc.text('2. Resumen Ejecutivo: ' + document.getElementById('subtotal2').textContent + ' / 15', 20, y);
    y += 10;
    doc.text('3. Problematica: ' + document.getElementById('subtotal3').textContent + ' / 20', 20, y);
    y += 10;
    doc.text('4. Marco Teorico: ' + document.getElementById('subtotal4').textContent + ' / 20', 20, y);
    y += 10;
    doc.text('5. Metodologia: ' + document.getElementById('subtotal5').textContent + ' / 20', 20, y);
    y += 10;
    doc.text('6. Innovacion: ' + document.getElementById('subtotal6').textContent + ' / 10', 20, y);
    y += 20;
    
    doc.setFontSize(14);
    doc.text('TOTAL: ' + document.getElementById('finalTotal').textContent, 20, y);
    y += 10;
    
    doc.setFontSize(11);
    doc.text(document.getElementById('evaluationStatus').textContent, 20, y);
    
    doc.save(`Evaluacion_${currentProject.name}.pdf`);
}

function downloadLocal() {
    const data = {
        proyecto: currentProject.name,
        investigadores: currentProject.researchers,
        evaluacion: {
            seccion1: document.getElementById('subtotal1').textContent,
            seccion2: document.getElementById('subtotal2').textContent,
            seccion3: document.getElementById('subtotal3').textContent,
            seccion4: document.getElementById('subtotal4').textContent,
            seccion5: document.getElementById('subtotal5').textContent,
            seccion6: document.getElementById('subtotal6').textContent,
            total: document.getElementById('finalTotal').textContent
        },
        estado: document.getElementById('evaluationStatus').textContent
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Evaluacion_${currentProject.name}.json`;
    link.click();
}
