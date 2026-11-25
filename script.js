// ============ DATA ============
let students = JSON.parse(localStorage.getItem('students')) || [];
let routine = JSON.parse(localStorage.getItem('routine')) || {};
let currentClass = { day: '', period: '', subject: '', attendance: {} };
let editingStudentId = null;

// ============ TAB SWITCHING ============
function showTab(tabId, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');

    if (tabId === 'tab-students') renderStudents();
    if (tabId === 'tab-history') loadHistory();
}

// ============ LOAD CLASS ============
function loadClass() {
    const day = document.getElementById('daySelect').value;
    const period = document.getElementById('periodSelect').value;

    if (!routine[day] || !routine[day][period]) {
        alert(`❌ No subject for ${day} Period ${period}!\n\nAdd it in Routine tab first.`);
        return;
    }

    if (students.length === 0) {
        alert('❌ No students!\n\nAdd students in Students tab first.');
        return;
    }

    currentClass = {
        day: day,
        period: period,
        subject: routine[day][period],
        attendance: {}
    };

    document.getElementById('subjectName').textContent = routine[day][period];
    document.getElementById('timeInfo').textContent = `${day} | Period ${period}`;
    document.getElementById('classInfo').classList.remove('hidden');
    document.getElementById('attendanceBox').classList.remove('hidden');

    const list = document.getElementById('studentList');
    list.innerHTML = '';

    students.forEach(stu => {
        const li = document.createElement('li');
        li.classList.add('present');
        li.dataset.id = stu.id;
        currentClass.attendance[stu.id] = true;

        li.innerHTML = `
            <div class="stu-info">
                <span class="stu-name">${stu.name}</span>
                <span class="stu-roll">Roll: ${stu.roll}</span>
            </div>
        `;

        li.onclick = () => {
            if (li.classList.contains('present')) {
                li.classList.remove('present');
                li.classList.add('absent');
                currentClass.attendance[stu.id] = false;
            } else {
                li.classList.remove('absent');
                li.classList.add('present');
                currentClass.attendance[stu.id] = true;
            }
        };

        list.appendChild(li);
    });
}

// ============ MARK ALL ============
function markAll(present) {
    const items = document.querySelectorAll('#studentList li');
    if (items.length === 0) {
        alert('Load a class first!');
        return;
    }
    items.forEach(li => {
        const id = li.dataset.id;
        if (present) {
            li.classList.remove('absent');
            li.classList.add('present');
            currentClass.attendance[id] = true;
        } else {
            li.classList.remove('present');
            li.classList.add('absent');
            currentClass.attendance[id] = false;
        }
    });
}

// ============ SAVE ATTENDANCE ============
function saveAttendance() {
    if (!currentClass.subject) {
        alert('⚠️ Please load a class first!');
        return;
    }

    const date = new Date().toLocaleDateString();
    const key = `attendance_${date}_${currentClass.day}_P${currentClass.period}`;

    const data = {
        id: key,
        date: date,
        day: currentClass.day,
        period: currentClass.period,
        subject: currentClass.subject,
        attendance: currentClass.attendance
    };

    localStorage.setItem(key, JSON.stringify(data));

    let present = 0, absent = 0;
    for (const id in currentClass.attendance) {
        if (currentClass.attendance[id]) present++;
        else absent++;
    }

    alert(`✅ SAVED!\n\nSubject: ${currentClass.subject}\nDate: ${date}\nPresent: ${present}\nAbsent: ${absent}`);
}

// ============ ADD ROUTINE ============
function addRoutine() {
    const day = document.getElementById('rDay').value;
    const period = document.getElementById('rPeriod').value;
    const subject = document.getElementById('rSubject').value.trim();

    if (!subject) {
        alert('⚠️ Please enter subject name!');
        return;
    }

    if (!routine[day]) routine[day] = {};
    routine[day][period] = subject;

    localStorage.setItem('routine', JSON.stringify(routine));
    document.getElementById('rSubject').value = '';

    renderRoutine();
    alert('✅ Routine saved!');
}

// ============ RENDER ROUTINE ============
function renderRoutine() {
    const box = document.getElementById('routineList');
    box.innerHTML = '';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let hasData = false;

    days.forEach(day => {
        if (routine[day] && Object.keys(routine[day]).length > 0) {
            hasData = true;
            const title = document.createElement('div');
            title.className = 'routine-day-title';
            title.textContent = day;
            box.appendChild(title);

            const periods = Object.keys(routine[day]).sort((a, b) => a - b);
            periods.forEach(p => {
                const item = document.createElement('div');
                item.className = 'routine-item';
                item.innerHTML = `<span><strong>Period ${p}:</strong> ${routine[day][p]}</span>`;
                box.appendChild(item);
            });
        }
    });

    if (!hasData) {
        box.innerHTML = '<p style="text-align:center;color:#999;padding:10px;">No routine yet.</p>';
    }
}

// ============ SAVE STUDENT (Add or Update) ============
function saveStudent() {
    const name = document.getElementById('sName').value.trim();
    const roll = document.getElementById('sRoll').value.trim();
    const email = document.getElementById('sEmail').value.trim();
    const phone = document.getElementById('sPhone').value.trim();
    const address = document.getElementById('sAddress').value.trim();

    if (!name || !roll) {
        alert('⚠️ Name and Roll Number are required!');
        return;
    }

    // Check duplicate roll (excluding self when editing)
    if (students.find(s => s.roll === roll && s.id !== editingStudentId)) {
        alert('⚠️ Roll number already exists!');
        return;
    }

    if (editingStudentId) {
        // Update existing
        const stu = students.find(s => s.id === editingStudentId);
        stu.name = name;
        stu.roll = roll;
        stu.email = email;
        stu.phone = phone;
        stu.address = address;
        editingStudentId = null;
        alert('✅ Student updated!');
    } else {
        // Add new
        students.push({
            id: 'stu_' + Date.now() + Math.random().toString(36).substr(2, 5),
            name: name,
            roll: roll,
            email: email,
            phone: phone,
            address: address
        });
        alert('✅ Student added!');
    }

    localStorage.setItem('students', JSON.stringify(students));
    clearStudentForm();
    renderStudents();
}

// ============ CLEAR STUDENT FORM ============
function clearStudentForm() {
    document.getElementById('sName').value = '';
    document.getElementById('sRoll').value = '';
    document.getElementById('sEmail').value = '';
    document.getElementById('sPhone').value = '';
    document.getElementById('sAddress').value = '';
}

// ============ EDIT STUDENT ============
function editStudent(id) {
    const stu = students.find(s => s.id === id);
    if (!stu) return;

    document.getElementById('sName').value = stu.name;
    document.getElementById('sRoll').value = stu.roll;
    document.getElementById('sEmail').value = stu.email || '';
    document.getElementById('sPhone').value = stu.phone || '';
    document.getElementById('sAddress').value = stu.address || '';

    editingStudentId = id;
    document.getElementById('formTitle').textContent = '✏️ Edit Student';
    document.getElementById('saveStudentBtn').textContent = 'Update Student';
    document.getElementById('cancelEditBtn').classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ CANCEL EDIT ============
function cancelEdit() {
    editingStudentId = null;
    clearStudentForm();
    document.getElementById('formTitle').textContent = '➕ Add New Student';
    document.getElementById('saveStudentBtn').textContent = 'Add Student';
    document.getElementById('cancelEditBtn').classList.add('hidden');
}

// ============ DELETE STUDENT ============
function deleteStudent(id) {
    const stu = students.find(s => s.id === id);
    if (!stu) return;

    if (confirm(`Delete ${stu.name} (Roll: ${stu.roll})?`)) {
        students = students.filter(s => s.id !== id);
        localStorage.setItem('students', JSON.stringify(students));
        renderStudents();
        alert('✅ Student deleted!');
    }
}

// ============ RENDER STUDENTS ============
function renderStudents() {
    const list = document.getElementById('masterList');
    const count = document.getElementById('studentCount');
    list.innerHTML = '';

    if (count) count.textContent = students.length;

    if (students.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#999;padding:10px;">No students yet.</p>';
        return;
    }

    students.slice().sort((a, b) => a.roll.localeCompare(b.roll)).forEach(stu => {
        const div = document.createElement('div');
        div.className = 'student-card';
        div.innerHTML = `
            <div class="info">
                <strong>${stu.name}</strong>
                <div class="detail">Roll: ${stu.roll}</div>
                ${stu.email ? `<div class="detail">📧 ${stu.email}</div>` : ''}
                ${stu.phone ? `<div class="detail">📱 ${stu.phone}</div>` : ''}
                ${stu.address ? `<div class="detail">🏠 ${stu.address}</div>` : ''}
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="editStudent('${stu.id}')">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteStudent('${stu.id}')">🗑️ Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// ============ LOAD HISTORY ============
function loadHistory() {
    const box = document.getElementById('historyBox');
    box.innerHTML = '';

    let keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('attendance_')) keys.push(k);
    }

    if (keys.length === 0) {
        box.innerHTML = '<p style="text-align:center;color:#999;padding:10px;">No records yet.</p>';
        return;
    }

    keys.forEach(k => {
        const d = JSON.parse(localStorage.getItem(k));
        let p = 0, a = 0;
        for (const id in d.attendance) {
            if (d.attendance[id]) p++;
            else a++;
        }

        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <strong>${d.subject}</strong>
            <small>${d.day} | Period ${d.period} | ${d.date}</small>
            <div class="stats">
                <span class="present-count">✅ ${p} Present</span>
                <span class="absent-count">❌ ${a} Absent</span>
            </div>
            <button class="delete-history" onclick="deleteHistory('${d.id}')">Delete</button>
        `;
        box.appendChild(div);
    });
}

// ============ DELETE HISTORY ============
function deleteHistory(key) {
    if (confirm('Delete this record?')) {
        localStorage.removeItem(key);
        loadHistory();
        alert('✅ Record deleted!');
    }
}

// ============ CLEAR ALL HISTORY ============
function clearAllHistory() {
    if (!confirm('⚠️ Delete ALL attendance records? This cannot be undone!')) return;

    let keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('attendance_')) keys.push(k);
    }

    if (keys.length === 0) {
        alert('No records to clear.');
        return;
    }

    keys.forEach(k => localStorage.removeItem(k));
    loadHistory();
    alert('✅ All history cleared!');
}

// ============ INIT ============
window.onload = function() {
    renderStudents();
    renderRoutine();
    loadHistory();
};