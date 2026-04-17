let currentSectionId = null;
let currentUser = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function splitLines(value) {
    return escapeHtml(value).split('\n').join('<br>');
}

function buildSelectOptions(items, selectedId = '') {
    return '<option value="">اختر القسم</option>' +
        items.map(item => `<option value="${item.id}" ${String(item.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
}

function promptOptional(message, currentValue) {
    const result = window.prompt(message, currentValue ?? '');
    if (result === null) return null;
    return result.trim();
}

function statusText(status) {
    if (status === 'in_progress') return 'قيد التنفيذ';
    if (status === 'resolved') return 'تم الحل';
    return 'جديد';
}

function statusClass(status) {
    if (status === 'in_progress') return 'badge-progress';
    if (status === 'resolved') return 'badge-resolved';
    return 'badge-new';
}

function formatDate(value) {
    if (!value) return '-';
    return String(value).replace('T', ' ').slice(0, 16);
}

async function loadSections() {
    try {
        const sections = await API.sections.getAll();
        const grid = document.getElementById('sectionsGrid');
        const select = document.getElementById('reportSection');

        if (grid) {
            if (sections.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-muted);">لا توجد اقسام حاليا.</p>';
                return;
            }

            grid.innerHTML = sections.map(s => `
                <a href="#" class="section-box" data-id="${s.id}">${escapeHtml(s.name)}</a>
            `).join('');

            document.querySelectorAll('.section-box').forEach(box => {
                box.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = box.dataset.id;
                    showProblems(sectionId, box.textContent);
                });
            });
        }

        if (select) {
            select.innerHTML = buildSelectOptions(sections);
        }
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

async function showProblems(sectionId, sectionName) {
    currentSectionId = sectionId;
    document.getElementById('sectionsView').style.display = 'none';
    document.getElementById('problemsView').style.display = 'block';
    document.getElementById('sectionTitle').textContent = sectionName;

    try {
        const problems = await API.problems.getAll(sectionId);
        const list = document.getElementById('problemsList');

        if (problems.length === 0) {
            list.innerHTML = '<div class="card"><p style="color: var(--text-muted);">لا توجد مشاكل مسجلة في هذا القسم حاليا.</p></div>';
            return;
        }

        list.innerHTML = problems.map(p => `
            <div class="card">
                <div class="problem-title">${escapeHtml(p.title)}</div>
                <div class="problem-text">${splitLines(p.problem_text)}</div>
                <div class="solution-text">${splitLines(p.solution_text)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading problems:', error);
    }
}

async function handleReportSubmit(e) {
    e.preventDefault();

    const sectionId = parseInt(document.getElementById('reportSection').value, 10);
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDesc').value.trim();

    if (!sectionId) {
        alert('الرجاء اختيار القسم');
        return;
    }

    const report = {
        section_id: sectionId,
        title,
        description
    };

    try {
        const res = await API.reports.create(report);
        if (res.success) {
            alert('تم ارسال البلاغ بنجاح');
            document.getElementById('reportForm').reset();
        } else {
            alert(res.message || 'حدث خطأ في ارسال البلاغ');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('حدث خطأ في ارسال البلاغ');
    }
}

function loadProfilePage() {
    const info = document.getElementById('profileInfo');
    info.innerHTML = `
        <p style="margin-bottom: 10px;"><strong>اسم المستخدم:</strong> ${escapeHtml(currentUser.username)}</p>
        <p style="margin-bottom: 10px;"><strong>الدور:</strong> ${escapeHtml(roleText(currentUser.role))}</p>
        <p style="margin-bottom: 10px;"><strong>رقم الجوال:</strong> ${escapeHtml(currentUser.phone || 'غير محدد')}</p>
    `;

    document.getElementById('phone').value = currentUser.phone || '';

    document.getElementById('phoneForm').onsubmit = async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value.trim();

        const res = await API.users.update(currentUser.id, {
            username: currentUser.username,
            phone,
            role: currentUser.role
        });

        if (res.success) {
            alert('تم تحديث رقم الجوال');
            currentUser.phone = phone;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadProfilePage();
        } else {
            alert(res.message || 'حدث خطأ في تحديث رقم الجوال');
        }
    };

    document.getElementById('passwordForm').onsubmit = async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (newPass !== confirm) {
            alert('كلمتا المرور غير متطابقتين');
            return;
        }

        const res = await API.users.update(currentUser.id, {
            username: currentUser.username,
            phone: currentUser.phone,
            password: newPass,
            role: currentUser.role
        });

        if (res.success) {
            alert('تم تغيير كلمة المرور بنجاح');
            e.target.reset();
        } else {
            alert(res.message || 'حدث خطأ في تغيير كلمة المرور');
        }
    };
}

function loadUsersPage() {
    loadUsersTable();

    document.getElementById('addUserForm').onsubmit = async (e) => {
        e.preventDefault();

        const user = {
            username: document.getElementById('newUsername').value.trim(),
            password: document.getElementById('newPassword').value,
            phone: document.getElementById('newPhone').value.trim(),
            role: document.getElementById('newRole').value
        };

        const res = await API.users.create(user);
        if (res.success) {
            alert('تم اضافة المستخدم بنجاح');
            loadUsersTable();
            e.target.reset();
        } else {
            alert(res.message || 'حدث خطأ في اضافة المستخدم');
        }
    };
}

async function loadUsersTable() {
    try {
        const users = await API.users.getAll();
        const tbody = document.getElementById('usersTable');

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا يوجد مستخدمين</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${escapeHtml(u.username)}</td>
                <td>${escapeHtml(roleText(u.role))}</td>
                <td>${escapeHtml(u.phone || '-')}</td>
                <td>${u.created_at ? escapeHtml(String(u.created_at).split('T')[0]) : '-'}</td>
                <td>
                    <div class="d-flex gap-2 flex-wrap">
                        <button class="btn btn-sm btn-warning" onclick="editUser(${u.id})">تعديل</button>
                    </div>
                </td>
                <td>
                    <div class="d-flex gap-2 flex-wrap">
                        ${u.id !== currentUser.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">حذف</button>` : '-'}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function editUser(id) {
    try {
        const users = await API.users.getAll();
        const user = users.find(item => String(item.id) === String(id));
        if (!user) {
            alert('المستخدم غير موجود');
            return;
        }

        const username = promptOptional('اسم المستخدم الجديد:', user.username);
        if (username === null) return;

        const phone = promptOptional('رقم الجوال الجديد:', user.phone || '');
        if (phone === null) return;

        const role = promptOptional('الدور الجديد: intern / employee / manager / ', user.role);
        if (role === null) return;

        const password = window.confirm('هل تريد تغيير كلمة المرور أيضاً؟') ? promptOptional('كلمة المرور الجديدة:', '') : '';
        if (password === null) return;

        const res = await API.users.update(id, {
            username,
            phone,
            role,
            password: password || undefined
        });

        if (res.success) {
            alert('تم تحديث المستخدم بنجاح');
            loadUsersTable();
        } else {
            alert(res.message || 'حدث خطأ في تحديث المستخدم');
        }
    } catch (error) {
        console.error('Error editing user:', error);
    }
}

async function deleteUser(id) {
    if (!confirm('متاكد من حذف المستخدم؟')) return;

    const res = await API.users.delete(id);
    if (res.success) {
        loadUsersTable();
    } else {
        alert(res.message || 'حدث خطأ في حذف المستخدم');
    }
}

function loadProblemsPage() {
    loadSectionsForSelect();
    loadProblemsTable();

    document.getElementById('addProblemForm').onsubmit = async (e) => {
        e.preventDefault();

        const problem = {
            section_id: parseInt(document.getElementById('problemSection').value, 10),
            created_by: currentUser.id,
            title: document.getElementById('problemTitle').value.trim(),
            problem_text: document.getElementById('problemText').value.trim(),
            solution_text: document.getElementById('solutionText').value.trim()
        };

        if (!problem.section_id) {
            alert('الرجاء اختيار القسم');
            return;
        }

        const res = await API.problems.create(problem);
        if (res.success) {
            alert('تمت اضافة المشكلة بنجاح');
            loadProblemsTable();
            e.target.reset();
        } else {
            alert(res.message || 'حدث خطأ في اضافة المشكلة');
        }
    };
}

function loadSectionsForSelect() {
    API.sections.getAll().then(sections => {
        const select = document.getElementById('problemSection');
        select.innerHTML = buildSelectOptions(sections);
    }).catch(error => {
        console.error('Error loading sections:', error);
    });
}

async function loadProblemsTable() {
    try {
        const problems = await API.problems.getAll();
        const tbody = document.getElementById('problemsTable');

        if (problems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد مشاكل</td></tr>';
            return;
        }

        tbody.innerHTML = problems.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${escapeHtml(p.section_name || '-')}</td>
                <td>${escapeHtml(p.title)}</td>
                <td><div class="d-flex gap-2 flex-wrap"><button class="btn btn-sm btn-warning" onclick="editProblem(${p.id})">تعديل</button></div></td>
                <td><div class="d-flex gap-2 flex-wrap"><button class="btn btn-sm btn-danger" onclick="deleteProblem(${p.id})">حذف</button></div></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading problems:', error);
    }
}

async function editProblem(id) {
    try {
        const problems = await API.problems.getAll();
        const problem = problems.find(item => String(item.id) === String(id));
        if (!problem) {
            alert('المشكلة غير موجودة');
            return;
        }

        const sections = await API.sections.getAll();
        const sectionId = promptOptional('رقم القسم الجديد:', String(problem.section_id));
        if (sectionId === null) return;
        if (!sections.some(s => String(s.id) === String(sectionId))) {
            alert('رقم القسم غير صحيح');
            return;
        }

        const title = promptOptional('عنوان المشكلة الجديد:', problem.title);
        if (title === null) return;

        const problemText = promptOptional('وصف المشكلة الجديد:', problem.problem_text);
        if (problemText === null) return;

        const solutionText = promptOptional('الحل الجديد:', problem.solution_text);
        if (solutionText === null) return;

        const res = await API.problems.update(id, {
            section_id: Number(sectionId),
            title,
            problem_text: problemText,
            solution_text: solutionText
        });

        if (res.success) {
            alert('تم تحديث المشكلة بنجاح');
            loadProblemsTable();
        } else {
            alert(res.message || 'حدث خطأ في تحديث المشكلة');
        }
    } catch (error) {
        console.error('Error editing problem:', error);
    }
}

async function deleteProblem(id) {
    if (!confirm('متاكد من حذف المشكلة؟')) return;

    const res = await API.problems.delete(id);
    if (res.success) {
        loadProblemsTable();
    } else {
        alert(res.message || 'حدث خطأ في حذف المشكلة');
    }
}

function loadReportsPage() {
    loadReportsTable();
}

function loadMyReportsPage() {
    loadMyReportsTable();
}

async function loadMyReportsTable() {
    try {
        const reports = await API.reports.getMine();
        const tbody = document.getElementById('myReportsTable');

        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد بلاغات حتى الآن</td></tr>';
            return;
        }

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.section_name || '-')}</td>
                <td>${escapeHtml(r.title)}</td>
                <td>${escapeHtml(r.description)}</td>
                <td><span class="badge ${statusClass(r.status)}">${statusText(r.status)}</span></td>
                <td>${formatDate(r.created_at)}</td>
                <td>${formatDate(r.updated_at || r.created_at)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading my reports:', error);
    }
}

async function loadReportsTable() {
    try {
        const reports = await API.reports.getAll();
        const tbody = document.getElementById('reportsTable');

        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">لا يوجد بلاغات</td></tr>';
            return;
        }

        tbody.innerHTML = reports.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.username || '-')}</td>
                <td>${escapeHtml(r.section_name || '-')}</td>
                <td>${escapeHtml(r.title)}</td>
                <td>${escapeHtml(r.description)}</td>
                <td><span class="badge ${statusClass(r.status)}">${statusText(r.status)}</span></td>
                <td>
                    <div class="d-flex gap-2 flex-wrap align-items-center">
                        <select class="form-select form-select-sm" onchange="updateReportStatus(${r.id}, this.value)">
                            <option value="new" ${r.status === 'new' ? 'selected' : ''}>جديد</option>
                            <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>قيد التنفيذ</option>
                            <option value="resolved" ${r.status === 'resolved' ? 'selected' : ''}>تم الحل</option>
                        </select>
                    </div>
                </td>
                <td>${r.created_at ? escapeHtml(String(r.created_at).split('T')[0]) : '-'}</td>
                <td>${formatDate(r.updated_at || r.created_at)}</td>
                <td><div class="d-flex gap-2 flex-wrap"><button class="btn btn-sm btn-danger" onclick="deleteReport(${r.id})">حذف</button></div></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

async function updateReportStatus(id, status) {
    const res = await API.reports.updateStatus(id, status);
    if (res.success) {
        loadReportsTable();
    } else {
        alert(res.message || 'حدث خطأ في تغيير الحالة');
    }
}

async function deleteReport(id) {
    if (!confirm('متاكد من حذف البلاغ؟')) return;

    const res = await API.reports.delete(id);
    if (res.success) {
        loadReportsTable();
    } else {
        alert(res.message || 'حدث خطأ في حذف البلاغ');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) return;

    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        loadIndexPage();
    } else if (path.includes('profile.html')) {
        loadProfilePage();
    } else if (path.includes('my_reports.html')) {
        if (!hasRole(['intern', 'employee'])) {
            window.location.href = '/main.html';
            return;
        }
        loadMyReportsPage();
    } else if (path.includes('admin/users.html')) {
        if (!hasRole(['manager', 'admin'])) {
            window.location.href = '/main.html';
            return;
        }
        loadUsersPage();
    } else if (path.includes('admin/problems.html')) {
        if (!hasRole(['employee', 'manager', 'admin'])) {
            window.location.href = '/main.html';
            return;
        }
        loadProblemsPage();
    } else if (path.includes('admin/reports.html')) {
        if (!hasRole(['employee', 'manager', 'admin'])) {
            window.location.href = '/main.html';
            return;
        }
        loadReportsPage();
    }
});

function loadIndexPage() {
    loadSections();
    document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit);
    document.getElementById('backBtn')?.addEventListener('click', () => {
        document.getElementById('sectionsView').style.display = 'block';
        document.getElementById('problemsView').style.display = 'none';
    });
}
