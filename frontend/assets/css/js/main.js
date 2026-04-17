let currentUser = null;
let currentSectionId = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadSections() {
    const sections = await API.sections.getAll();
    const grid = document.getElementById('sectionsGrid');
    const select = document.getElementById('reportSection');

    if (grid) {
        if (sections.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted);">لا توجد أقسام حالياً.</p>';
            return;
        }

        grid.innerHTML = sections.map(s => `
            <a href="#" class="section-box" data-id="${s.id}">${escapeHtml(s.name)}</a>
        `).join('');

        document.querySelectorAll('.section-box').forEach(box => {
            box.addEventListener('click', (e) => {
                e.preventDefault();
                showProblems(box.dataset.id, box.textContent);
            });
        });
    }

    if (select) {
        select.innerHTML = '<option value="">اختر القسم</option>' +
            sections.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
    }
}

async function showProblems(sectionId, sectionName) {
    currentSectionId = sectionId;
    document.getElementById('sectionsView').style.display = 'none';
    document.getElementById('problemsView').style.display = 'block';
    document.getElementById('sectionTitle').textContent = sectionName;

    const problems = await API.problems.getAll(sectionId);
    const list = document.getElementById('problemsList');

    if (problems.length === 0) {
        list.innerHTML = '<div class="card"><p style="color: var(--text-muted);">لا توجد مشاكل مسجلة في هذا القسم حالياً.</p></div>';
    } else {
        list.innerHTML = problems.map(p => `
            <div class="card">
                <div class="problem-title">${escapeHtml(p.title)}</div>
                <div class="problem-text">${escapeHtml(p.problem_text).split('\n').join('<br>')}</div>
                <div class="solution-text">${escapeHtml(p.solution_text).split('\n').join('<br>')}</div>
            </div>
        `).join('');
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

    const res = await API.reports.create(report);

    if (res.success) {
        alert('تم إرسال البلاغ بنجاح');
        document.getElementById('reportForm').reset();
    } else {
        alert(res.message || 'حدث خطأ في إرسال البلاغ');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = getCurrentUser();
    if (!currentUser) return;

    loadSections();

    document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit);
    document.getElementById('backBtn')?.addEventListener('click', () => {
        document.getElementById('sectionsView').style.display = 'block';
        document.getElementById('problemsView').style.display = 'none';
    });
});
