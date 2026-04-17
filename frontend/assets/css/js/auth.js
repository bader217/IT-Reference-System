function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    try {
        return user ? JSON.parse(user) : null;
    } catch (error) {
        return null;
    }
}

function hasRole(roles) {
    const user = getCurrentUser();
    return Boolean(user && roles.includes(user.role));
}

function isAdminRole(role) {
    return role === 'manager' || role === 'admin';
}

function roleText(role) {
    if (role === 'manager' || role === 'admin') return 'مدير النظام';
    if (role === 'employee') return 'موظف';
    return 'متدرب';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
}

function checkAuth() {
    const user = getCurrentUser();
    const path = window.location.pathname;

    if (!user && !path.includes('login.html')) {
        window.location.href = '/login.html';
        return false;
    }

    if (user && path.includes('login.html')) {
        window.location.href = '/main.html';
        return false;
    }

    return true;
}

function updateNavigation() {
    const user = getCurrentUser();
    if (!user) return;

    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    const items = [{ href: '/main.html', text: 'الرئيسية' }];

    if (hasRole(['intern', 'employee'])) {
        items.push({ href: '/frontend/my_reports.html', text: 'بلاغاتي' });
    }

    if (hasRole(['employee', 'manager', 'admin'])) {
        items.push({ href: '/frontend/admin/reports.html', text: 'البلاغات' });
        items.push({ href: '/frontend/admin/problems.html', text: 'إدارة الحلول' });
    }

    if (hasRole(['manager', 'admin'])) {
        items.push({ href: '/frontend/admin/users.html', text: 'المستخدمين' });
    }

    items.push({ href: '/profile.html', text: 'حسابي' });
    items.push({ href: '#', text: 'تسجيل خروج', id: 'logoutLink' });

    const isList = navMenu.tagName === 'UL';
    const navHtml = isList
        ? items.map(i => i.id
            ? `<li class="nav-item"><a class="nav-link" href="${i.href}" id="${i.id}">${i.text}</a></li>`
            : `<li class="nav-item"><a class="nav-link" href="${i.href}">${i.text}</a></li>`
          ).join('')
        : items.map(i => i.id
            ? `<a href="${i.href}" id="${i.id}">${i.text}</a>`
            : `<a href="${i.href}">${i.text}</a>`
          ).join('');

    navMenu.innerHTML = navHtml;

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        updateNavigation();
    }
});
